from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import datetime
import httpx
import logging

from app.config import settings
from app.database import engine, Base, get_db
from app import models, schemas, crud
from app.auth import get_current_user, create_access_token, get_current_user_optional
from app.github_client import GithubClient
from app.ai_mentor import AiMentor

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables in SQLite or PostgreSQL
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DevLens AI API",
    description="Intelligent GitHub Mentor backend using Gemini",
    version="1.0.0"
)

# CORS configuration for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ai_mentor = AiMentor()

@app.get("/")
def read_root():
    return {"message": "Welcome to DevLens AI API. Live coding mentoring is active."}

# AUTH ENDPOINTS
@app.get("/api/v1/auth/github")
def github_login():
    """Returns the URL to redirect the user to GitHub for authorization."""
    if not settings.GITHUB_CLIENT_ID:
        # If OAuth credentials aren't set, return a mock redirect URL that goes to the callback directly for demo purposes
        logger.warning("OAuth client ID is missing. Providing demo redirection.")
        return {
            "url": f"{settings.GITHUB_REDIRECT_URI}?code=mock_oauth_code_demo"
        }
    
    github_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&redirect_uri={settings.GITHUB_REDIRECT_URI}"
        f"&scope=user,repo"
    )
    return {"url": github_url}

@app.post("/api/v1/auth/callback")
async def github_callback(payload: Dict[str, str], db: Session = Depends(get_db)):
    """Handles the OAuth authorization code exchange and returns session JWT."""
    code = payload.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code is missing")
    
    # Handle mock authorization code for demo/testing
    if code == "mock_oauth_code_demo":
        mock_username = "devlens-demo-user"
        db_user = crud.get_user_by_username(db, mock_username)
        if not db_user:
            user_schema = schemas.UserResponse(
                id=999,
                github_username=mock_username,
                name="Demo Engineer",
                avatar_url=f"https://api.dicebear.com/7.x/adventurer/svg?seed={mock_username}",
                email="demo@devlens.ai",
                created_at=datetime.utcnow()
            )
            db_user = crud.create_user(db, user_schema)
        
        token = create_access_token(data={"sub": db_user.github_username, "user_id": db_user.id})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": db_user.id,
                "github_username": db_user.github_username,
                "name": db_user.name,
                "avatar_url": db_user.avatar_url,
                "email": db_user.email
            }
        }

    # Standard production OAuth token exchange
    async with httpx.AsyncClient() as client:
        try:
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": settings.GITHUB_CLIENT_ID,
                    "client_secret": settings.GITHUB_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": settings.GITHUB_REDIRECT_URI
                },
                timeout=10.0
            )
            token_response.raise_for_status()
            res_data = token_response.json()
            access_token = res_data.get("access_token")
            
            if not access_token:
                logger.error(f"GitHub OAuth error: {res_data}")
                raise HTTPException(status_code=400, detail="Failed to obtain OAuth access token from GitHub")
                
            # Fetch user profile using the token
            gh_client = GithubClient(token=access_token)
            gh_profile = await gh_client.get_user_profile("")  # empty username uses token owner details
            username = gh_profile.get("login")
            
            if not username:
                raise HTTPException(status_code=400, detail="Failed to load user profile from GitHub")
                
            # Check/Create User in DB
            db_user = crud.get_user_by_username(db, username)
            if not db_user:
                user_schema = schemas.UserResponse(
                    id=0, # Auto-incremented by DB
                    github_username=username,
                    name=gh_profile.get("name"),
                    avatar_url=gh_profile.get("avatar_url"),
                    email=gh_profile.get("email"),
                    created_at=datetime.utcnow()
                )
                db_user = crud.create_user(db, user_schema)
                
            # Cache GitHub Token
            crud.update_user_token(db, db_user.id, access_token)
            
            # Generate JWT Session
            jwt_token = create_access_token(data={"sub": db_user.github_username, "user_id": db_user.id})
            
            return {
                "access_token": jwt_token,
                "token_type": "bearer",
                "user": {
                    "id": db_user.id,
                    "github_username": db_user.github_username,
                    "name": db_user.name,
                    "avatar_url": db_user.avatar_url,
                    "email": db_user.email
                }
            }
        except httpx.HTTPError as e:
            logger.error(f"HTTP error during GitHub OAuth callback: {e}")
            raise HTTPException(status_code=500, detail="Internal server error during authentication")

@app.get("/api/v1/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieves session profile of current logged in user."""
    db_user = crud.get_user(db, current_user.get("user_id"))
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

# PROFILE INSIGHTS ENDPOINT
@app.post("/api/v1/profile/analyze", response_model=schemas.ProfileAnalysisResponse)
async def analyze_profile(
    payload: schemas.UsernameRequest, 
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Fetches user profile data from GitHub and runs Gemini analysis (caching results)."""
    username = payload.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username is empty")
        
    # Clean username: extract from URL if provided (e.g. https://github.com/torvalds)
    if "/" in username:
        cleaned = username.rstrip("/")
        if "github.com/" in cleaned:
            parts = cleaned.split("github.com/")
            if len(parts) > 1:
                username = parts[1].split("/")[0]
        else:
            username = cleaned.split("/")[-1]
    username = username.strip()
    
    # Check cache first (cache for 1 hour to keep it responsive and budget Gemini API queries)
    cached = crud.get_profile_analysis(db, username)
    if cached:
        # Check if the cache is older than 6 hours
        from datetime import datetime, timedelta
        if datetime.utcnow() - cached.created_at < timedelta(hours=6):
            logger.info(f"Returning cached analysis for {username}")
            return cached

    # Get user's token if authenticated
    user_token = None
    if current_user:
        db_user = crud.get_user(db, current_user.get("user_id"))
        if db_user and db_user.github_token:
            user_token = db_user.github_token

    # Fetch GitHub Data
    gh_client = GithubClient(token=user_token)
    try:
        profile_data = await gh_client.get_user_profile(username)
        repos_data = await gh_client.get_user_repos(username)
        
        # Fetch READMEs for the top 5 repositories to give the AI rich codebase details
        for repo in repos_data[:5]:
            readme_content = await gh_client.get_readme_file(username, repo.get("name"))
            repo["readme_content"] = readme_content
            
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail="GitHub user not found")
        elif e.response.status_code == 403:
            raise HTTPException(
                status_code=403, 
                detail="GitHub API Rate limit exceeded. Connect your GitHub account to authenticate or configure GITHUB_TOKEN."
            )
        raise HTTPException(status_code=e.response.status_code, detail=f"GitHub API returned error: {e.response.text}")
    except Exception as e:
        logger.error(f"Error fetching GitHub profile for {username}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch profile from GitHub: {str(e)}")

    # Run AI Analysis
    try:
        analysis_res = await ai_mentor.analyze_profile(username, profile_data, repos_data)
        
        # Save to DB cache
        db_user = crud.get_user_by_username(db, username)
        user_id = db_user.id if db_user else None
        crud.create_profile_analysis(db, analysis_res, user_id=user_id)
        
        return analysis_res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error running profile analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to run AI profile analysis: {str(e)}")

# REPOSITORY ANALYSIS ENDPOINT
@app.post("/api/v1/repository/analyze", response_model=schemas.RepositoryAnalysisResponse)
async def analyze_repository(
    payload: schemas.RepoAnalysisRequest, 
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Fetches files from a repo, selects main source codes, and runs static analysis via Gemini."""
    username = payload.username.strip()
    repo_name = payload.repo_name.strip()
    
    # Clean username: extract from URL if provided (e.g. https://github.com/torvalds)
    if "/" in username:
        cleaned = username.rstrip("/")
        if "github.com/" in cleaned:
            parts = cleaned.split("github.com/")
            if len(parts) > 1:
                username = parts[1].split("/")[0]
        else:
            username = cleaned.split("/")[-1]
    username = username.strip()
    
    # Check cache
    cached = crud.get_repository_analysis(db, username, repo_name)
    if cached:
        return cached
        
    # Get user's token if authenticated
    user_token = None
    if current_user:
        db_user = crud.get_user(db, current_user.get("user_id"))
        if db_user and db_user.github_token:
            user_token = db_user.github_token

    # Fetch Repo Meta & Files
    gh_client = GithubClient(token=user_token)
    try:
        repos = await gh_client.get_user_repos(username)
        repo_meta = next((r for r in repos if r.get("name") == repo_name), None)
        if not repo_meta:
            raise HTTPException(status_code=404, detail="Repository not found under this user")
            
        # Fetch file list
        files = await gh_client.get_repo_files(username, repo_name, branch=repo_meta.get("default_branch", "main"))
        
        # Pick 3-5 source files (e.g. .py, .ts, .js, .java, .cpp files, skipping config/node_modules)
        source_contents = {}
        source_extensions = {".py", ".ts", ".js", ".java", ".cpp", ".cs", ".go"}
        
        # Inject the repository's README.md file as a core analysis target
        readme_content = await gh_client.get_readme_file(username, repo_name)
        if readme_content:
            source_contents["README.md"] = readme_content

        for f in files:
            path = f.get("path", "")
            if f.get("type") == "blob" and any(path.endswith(ext) for ext in source_extensions):
                # Skip vendor, dependencies, config files
                if any(k in path.lower() for k in ["node_modules", "vendor", "dist", "build", "config", "test"]):
                    continue
                # Fetch up to 5 files to avoid context size explosion
                if len(source_contents) >= 5:
                    break
                
                content = await gh_client.get_file_content(username, repo_name, path)
                if content:
                    source_contents[path] = content
                    
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail="GitHub repository or user not found")
        raise HTTPException(status_code=e.response.status_code, detail=f"GitHub API error: {e.response.text}")
    except Exception as e:
        logger.error(f"Error fetching files for {repo_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch repository files: {str(e)}")

    # Run AI analysis
    try:
        analysis_res = await ai_mentor.analyze_repository(username, repo_name, repo_meta, source_contents)
        
        # Cache results
        crud.create_repository_analysis(db, analysis_res)
        
        return analysis_res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error analyzing repository {repo_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to run AI repository analysis: {str(e)}")

# OPEN SOURCE MENTOR REPOS ENDPOINT
@app.get("/api/v1/opensource/recommend", response_model=List[schemas.OpenSourceRepoResponse])
async def recommend_opensource(
    languages: str = Query(..., description="Comma-separated list of languages"),
    skill_score: int = Query(70, description="Internship readiness score or programming level")
):
    """Suggests beginner-friendly repositories matching user's languages and level."""
    lang_list = [l.strip() for l in languages.split(",") if l.strip()]
    try:
        recommendations = await ai_mentor.get_open_source_recommendations(lang_list, skill_score)
        return recommendations
    except Exception as e:
        logger.error(f"Error recommending repos: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve open source recommendations")

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "mode": "mock" if settings.is_mock_mode else "live"}
