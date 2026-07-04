from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    github_username = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    email = Column(String, nullable=True)
    github_token = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ProfileAnalysis(Base):
    __tablename__ = "profile_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    github_username = Column(String, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # AI generated metrics and feedback (stored as JSON arrays or strings)
    strengths = Column(JSON, nullable=True)  # List of strengths
    weaknesses = Column(JSON, nullable=True)  # List of weaknesses
    coding_habits = Column(JSON, nullable=True)  # List of coding habits
    missing_skills = Column(JSON, nullable=True)  # List of missing skills
    recommended_technologies = Column(JSON, nullable=True)  # List of tech to learn
    learning_roadmap = Column(JSON, nullable=True)  # List of timeline roadmap steps
    resume_feedback = Column(Text, nullable=True)
    portfolio_quality_score = Column(Integer, default=0)
    internship_readiness_score = Column(Integer, default=0)
    internship_readiness_explanation = Column(Text, nullable=True)
    suggested_projects = Column(JSON, nullable=True)  # List of suggested next projects
    repositories = Column(JSON, nullable=True)  # List of real GitHub repositories
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="profile_analyses")

class RepositoryAnalysis(Base):
    __tablename__ = "repository_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    github_username = Column(String, index=True, nullable=False)
    repo_name = Column(String, index=True, nullable=False)
    
    # Analysis output
    summary = Column(Text, nullable=True)
    code_smells = Column(JSON, nullable=True)  # List of code smells
    refactoring_opportunities = Column(JSON, nullable=True)  # List of refactoring ideas
    code_complexity = Column(String, nullable=True)  # Complexity description (e.g. O(N) estimation)
    documentation = Column(Text, nullable=True)  # Generated docs or readme content
    recommendations = Column(JSON, nullable=True)  # Recommendations
    unused_or_duplicate_code = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
