from sqlalchemy.orm import Session
from app import models, schemas
from datetime import datetime

# User Operations
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.github_username == username).first()

def create_user(db: Session, user: schemas.UserResponse):
    db_user = models.User(
        github_username=user.github_username,
        name=user.name,
        avatar_url=user.avatar_url,
        email=user.email,
        github_token=None
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_token(db: Session, user_id: int, token: str):
    db_user = get_user(db, user_id)
    if db_user:
        db_user.github_token = token
        db_user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_user)
    return db_user

# Profile Analysis Operations
def get_profile_analysis(db: Session, username: str):
    return db.query(models.ProfileAnalysis).filter(
        models.ProfileAnalysis.github_username == username
    ).order_by(models.ProfileAnalysis.created_at.desc()).first()

def create_profile_analysis(db: Session, analysis: schemas.ProfileAnalysisResponse, user_id: int = None):
    # Standardize field mapping for JSON content
    db_analysis = models.ProfileAnalysis(
        github_username=analysis.github_username,
        user_id=user_id,
        strengths=analysis.strengths,
        weaknesses=analysis.weaknesses,
        coding_habits=analysis.coding_habits,
        missing_skills=analysis.missing_skills,
        recommended_technologies=analysis.recommended_technologies,
        learning_roadmap=[step.dict() for step in analysis.learning_roadmap],
        resume_feedback=analysis.resume_feedback,
        portfolio_quality_score=analysis.portfolio_quality_score,
        internship_readiness_score=analysis.internship_readiness_score,
        internship_readiness_explanation=analysis.internship_readiness_explanation,
        suggested_projects=[proj.dict() for proj in analysis.suggested_projects],
        repositories=analysis.repositories
    )
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)
    return db_analysis

# Repository Analysis Operations
def get_repository_analysis(db: Session, username: str, repo_name: str):
    return db.query(models.RepositoryAnalysis).filter(
        models.RepositoryAnalysis.github_username == username,
        models.RepositoryAnalysis.repo_name == repo_name
    ).order_by(models.RepositoryAnalysis.created_at.desc()).first()

def create_repository_analysis(db: Session, analysis: schemas.RepositoryAnalysisResponse):
    db_repo_analysis = models.RepositoryAnalysis(
        github_username=analysis.github_username,
        repo_name=analysis.repo_name,
        summary=analysis.summary,
        code_smells=[smell.dict() for smell in analysis.code_smells],
        refactoring_opportunities=[opp.dict() for opp in analysis.refactoring_opportunities],
        code_complexity=analysis.code_complexity,
        documentation=analysis.documentation,
        recommendations=analysis.recommendations,
        unused_or_duplicate_code=analysis.unused_or_duplicate_code
    )
    db.add(db_repo_analysis)
    db.commit()
    db.refresh(db_repo_analysis)
    return db_repo_analysis
