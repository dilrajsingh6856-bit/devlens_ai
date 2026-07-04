import json
import logging
from typing import Dict, Any, List, Optional
from app.config import settings
from app import schemas

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logger.warning("google-generativeai package not available.")

class AiMentor:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self.model = None
        self.init_error = None
        
        if not self.api_key or self.api_key.strip() == "" or "your_gemini_api_key" in self.api_key:
            self.init_error = "GEMINI_API_KEY is not configured in backend/.env. Real AI analysis requires a Gemini API Key."
            return
            
        if not GENAI_AVAILABLE:
            self.init_error = "google-generativeai library is not available. Please ensure backend dependencies are installed."
            return
            
        try:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(self.model_name)
            logger.info(f"AI Mentor initialized with Gemini model: {self.model_name}")
        except Exception as e:
            logger.error(f"Error configuring Gemini: {e}")
            self.init_error = f"Failed to initialize Gemini client: {str(e)}"

    async def analyze_profile(self, username: str, profile: Dict[str, Any], repos: List[Dict[str, Any]]) -> schemas.ProfileAnalysisResponse:
        """Analyzes a user's entire GitHub profile and generates skills insights based on real fetched repository data."""
        if self.init_error:
            raise ValueError(self.init_error)
        # Calculate real language distribution
        languages = {}
        for r in repos:
            lang = r.get("language")
            if lang:
                languages[lang] = languages.get(lang, 0) + 1
        
        total_stars = sum(r.get("stargazers_count", 0) for r in repos)
        total_forks = sum(r.get("forks_count", 0) for r in repos)
        
        # Build enriched repository logs containing their actual README files (first 1200 chars)
        repo_logs = []
        for r in repos[:8]:  # Top 8 repositories
            name = r.get("name")
            desc = r.get("description") or "No description provided."
            lang = r.get("language") or "Unknown"
            stars = r.get("stargazers_count", 0)
            forks = r.get("forks_count", 0)
            readme_text = r.get("readme_content", "")
            
            readme_summary = f"\n  README Content Preview:\n  {readme_text[:1200]}" if readme_text else ""
            repo_logs.append(
                f"- **Repository**: {name}\n"
                f"  Primary Language: {lang}\n"
                f"  Stars: {stars} | Forks: {forks}\n"
                f"  Description: {desc}{readme_summary}"
            )
        
        repo_summary_str = "\n\n".join(repo_logs)
        
        prompt = f"""
        Analyze the GitHub developer profile of user '{username}' using their real repository and metadata.
        
        Developer Metadata:
        Name: {profile.get('name', username)}
        Bio: {profile.get('bio', 'None')}
        Followers: {profile.get('followers', 0)}
        Location: {profile.get('location', 'Unknown')}
        Public Repos Count: {profile.get('public_repos', 0)}
        Aggregated Languages Distribution: {json.dumps(languages)}
        Total Star Count: {total_stars}
        Total Fork Count: {total_forks}
        
        Enriched Repository Information & README Content:
        {repo_summary_str}
        
        You must perform a detailed audit of their technical portfolio and generate a JSON mentoring report.
        Identify the actual technologies used in their repos, evaluate code structures outlined in the README files, 
        and provide concrete, non-generic strengths and recommendations.
        
        The JSON object must match this exact structure:
        {{
            "github_username": "{username}",
            "strengths": ["Identify 3-5 specific strengths based on their actual repositories"],
            "weaknesses": ["Identify 3-5 concrete weaknesses or missing code practices (e.g. lack of testing, configuration files, etc.)"],
            "coding_habits": ["List 2-3 technical coding habits noticed from their projects"],
            "missing_skills": ["List 3-4 concrete technical skills or architectures missing in their codebases"],
            "recommended_technologies": ["List 3-5 technologies they should learn next based on their current stack"],
            "learning_roadmap": [
                {{
                    "phase": "Month 1 (or Phase 1)",
                    "focus": "Topic focus",
                    "topics": ["specific subtopic 1", "specific subtopic 2"],
                    "action_items": ["action item 1", "action item 2"]
                }}
            ],
            "resume_feedback": "Resume bullets: describe how they should showcase their actual repositories on their resume using active verbs and metrics.",
            "portfolio_quality_score": 0, // Integer score between 1-100 evaluating repository complexity, stars, and code structure
            "internship_readiness_score": 0, // Integer score between 1-100 indicating readiness for a corporate software engineering internship
            "internship_readiness_explanation": "Provide a detailed justification for their score based on their portfolio quality.",
            "suggested_projects": [
                {{
                    "title": "Project Title",
                    "description": "Specify a next project that directly fills a missing skill in their portfolio.",
                    "difficulty": "Beginner, Intermediate, or Advanced",
                    "tech_stack": ["React", "FastAPI"],
                    "learning_outcomes": ["outcome 1", "outcome 2"]
                }}
            ]
        }}
        
        Do not wrap the JSON object in markdown blocks (e.g. ```json). Return only raw, valid JSON.
        """
        
        try:
            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            data = json.loads(response.text)
            
            # Carry repositories back
            data["repositories"] = repos
            return schemas.ProfileAnalysisResponse(**data)
        except Exception as e:
            logger.error(f"Error calling Gemini for profile analysis: {e}")
            raise e

    async def analyze_repository(self, username: str, repo_name: str, repo_metadata: Dict[str, Any], file_contents: Dict[str, str]) -> schemas.RepositoryAnalysisResponse:
        """Analyzes a specific repository for smells, complexity, and refactoring using real source code."""
        if self.init_error:
            raise ValueError(self.init_error)
        files_summary = "\n\n".join([f"=== File: {path} ===\n{content[:3000]}" for path, content in file_contents.items() if content])
        
        prompt = f"""
        Analyze the repository '{repo_name}' belonging to user '{username}'.
        Description: {repo_metadata.get('description', 'No description')}
        Primary Language: {repo_metadata.get('language', 'Unknown')}
        Stars: {repo_metadata.get('stargazers_count', 0)}
        
        Here is the actual source code/documentation files from the repository:
        {files_summary}
        
        Perform static analysis on this code. You must identify specific code smells, complexity, and refactoring opportunities.
        Your recommendations must be directly based on the provided source code, referring to actual lines or functions.
        
        Return a JSON object with this exact structure:
        {{
            "github_username": "{username}",
            "repo_name": "{repo_name}",
            "summary": "AI overview of the project's purpose and code architecture based on the files",
            "code_smells": [
                {{
                    "file": "path/to/file",
                    "line": "e.g. line 24 or function name",
                    "type": "e.g. Long Method, Hardcoded Secrets, God Class",
                    "description": "Why this is a code smell in this file",
                    "severity": "Low, Medium, or High"
                }}
            ],
            "refactoring_opportunities": [
                {{
                    "file": "path/to/file",
                    "description": "Specify what to refactor",
                    "before_code": "exact code block to change",
                    "after_code": "proposed clean code block",
                    "benefits": "how it improves the codebase"
                }}
            ],
            "code_complexity": "Time/space complexity estimation and architectural quality rating",
            "documentation": "Markdown documentation suggestions or a suggested README for this project",
            "recommendations": ["List 3-5 specific recommendations to improve clean code practices, testing, or design in this codebase"],
            "unused_or_duplicate_code": "Pinpoint any unused imports, duplicated loops, or copy-pasted blocks in the code"
        }}
        
        Do not wrap the JSON object in markdown blocks (e.g. ```json). Return only raw, valid JSON.
        """
        
        try:
            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            data = json.loads(response.text)
            return schemas.RepositoryAnalysisResponse(**data)
        except Exception as e:
            logger.error(f"Error calling Gemini for repo analysis: {e}")
            raise e

    async def get_open_source_recommendations(self, languages: List[str], skill_score: int) -> List[schemas.OpenSourceRepoResponse]:
        """Suggests matching open source repositories based on user profile languages and skills."""
        primary_lang = languages[0] if languages else "Python"
        
        curated_repos = {
            "Python": [
                {
                    "name": "flask",
                    "owner": "pallets",
                    "html_url": "https://github.com/pallets/flask",
                    "description": "The Python micro framework for building web applications.",
                    "stars": 66000,
                    "languages": ["Python", "HTML"],
                    "match_reason": "Flask has a small, readable core codebase. Perfect for understanding routing and WSGI middleware.",
                    "project_structure": "src/flask/ contains the core framework: app.py (application configuration), blueprints.py (modular routing), and sessions.py (session management).",
                    "first_issue_title": "Improve documentation examples for Blueprints or add type hints.",
                    "first_issue_url": "https://github.com/pallets/flask/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22",
                    "first_issue_explanation": "Look in src/flask/blueprints.py and find functions without type annotations, or check the documentation folder for outdated code snippets."
                },
                {
                    "name": "requests",
                    "owner": "psf",
                    "html_url": "https://github.com/psf/requests",
                    "description": "A simple, yet elegant HTTP library for Python.",
                    "stars": 50000,
                    "languages": ["Python"],
                    "match_reason": "Requests is a classic example of API wrapper design in Python. Excellent for learning HTTP client logic.",
                    "project_structure": "src/requests/ contains: api.py (main HTTP method functions), models.py (Request and Response classes), and sessions.py (connection pooling).",
                    "first_issue_title": "Fix cookie handling in edge case requests or clarify session documentation.",
                    "first_issue_url": "https://github.com/psf/requests/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22",
                    "first_issue_explanation": "Review models.py response handler to check how cookies are parsed, and add tests in tests/test_requests.py."
                }
            ],
            "TypeScript": [
                {
                    "name": "trpc",
                    "owner": "trpc",
                    "html_url": "https://github.com/trpc/trpc",
                    "description": "Move Fast and Break Nothing. End-to-end typesafe APIs.",
                    "stars": 32000,
                    "languages": ["TypeScript"],
                    "match_reason": "TypeScript-heavy framework showing advanced generic typing. Ideal for mastering full-stack TypeScript safety.",
                    "project_structure": "packages/server/ contains router declarations. packages/client/ contains React/vanilla hooks and query handlers.",
                    "first_issue_title": "Add helpful warning logs for circular routing dependencies or update typings.",
                    "first_issue_url": "https://github.com/trpc/trpc/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22",
                    "first_issue_explanation": "Examine packages/server/src/core/router.ts where router properties are merged, and raise a clean validation error if duplicates occur."
                }
            ],
            "JavaScript": [
                {
                    "name": "axios",
                    "owner": "axios",
                    "html_url": "https://github.com/axios/axios",
                    "description": "Promise based HTTP client for the browser and node.js.",
                    "stars": 104000,
                    "languages": ["JavaScript"],
                    "match_reason": "Shows how to build a unified client supporting both Browser (XMLHttpRequests) and Node.js (http module) environments.",
                    "project_structure": "lib/ contains adapters/ (http.js for node, xhr.js for browser), core/ (InterceptorManager, dispatchRequest), and defaults/.",
                    "first_issue_title": "Improve error details returned on timeout exceptions or expand client tests.",
                    "first_issue_url": "https://github.com/axios/axios/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22",
                    "first_issue_explanation": "Modify lib/core/settle.js to include response configs in timeout error payloads, and check lib/adapters/xhr.js for timeout callback trigger."
                }
            ]
        }
        
        fallback_list = curated_repos.get("Python")
        recs = curated_repos.get(primary_lang, fallback_list)
        
        additional_repo = {
            "name": "freeCodeCamp",
            "owner": "freeCodeCamp",
            "html_url": "https://github.com/freeCodeCamp/freeCodeCamp",
            "description": "freeCodeCamp.org's open-source codebase and curriculum.",
            "stars": 380000,
            "languages": ["JavaScript", "TypeScript"],
            "match_reason": "Massive community-driven codebase with highly active mentorship and simple localized documentation issues.",
            "project_structure": "client/ holds the Gatsby/React platform, api/ contains the loopback backend, and curriculum/ houses all educational challenges.",
            "first_issue_title": "Fix typo in responsive design learning challenges or upgrade translations.",
            "first_issue_url": "https://github.com/freeCodeCamp/freeCodeCamp/issues?q=is%3Aissue+is%3Aopen+label%3A%22first-timers-only%22",
            "first_issue_explanation": "Look inside curriculum/challenges/english/01-responsive-web-design/ for file markdown issues, edit and run local tests using npm run test:curriculum."
        }
        
        result_recs = [schemas.OpenSourceRepoResponse(**r) for r in recs]
        result_recs.append(schemas.OpenSourceRepoResponse(**additional_repo))
        
        return result_recs[:3]
