from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    github_username: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    email: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Analysis Request Schemas
class UsernameRequest(BaseModel):
    username: str

class RepoAnalysisRequest(BaseModel):
    username: str
    repo_name: str

# Profile Analysis Schemas
class ProjectSuggestion(BaseModel):
    title: str = Field(description="Title of the recommended project")
    description: str = Field(description="Description of what the project is and what it does")
    difficulty: str = Field(description="Difficulty level (Beginner, Intermediate, Advanced)")
    tech_stack: List[str] = Field(description="Technologies to use")
    learning_outcomes: List[str] = Field(description="Key learning outcomes")

class RoadmapStep(BaseModel):
    phase: str = Field(description="Phase of the roadmap (e.g. Month 1, Phase 1)")
    focus: str = Field(description="Core technology or topic focus")
    topics: List[str] = Field(description="List of specific subtopics to learn")
    action_items: List[str] = Field(description="Actionable tasks or projects to build")

class ProfileAnalysisResponse(BaseModel):
    id: Optional[int] = None
    github_username: str
    strengths: List[str]
    weaknesses: List[str]
    coding_habits: List[str]
    missing_skills: List[str]
    recommended_technologies: List[str]
    learning_roadmap: List[RoadmapStep]
    resume_feedback: str
    portfolio_quality_score: int
    internship_readiness_score: int
    internship_readiness_explanation: str
    suggested_projects: List[ProjectSuggestion]
    repositories: Optional[List[Dict[str, Any]]] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Repository Analysis Schemas
class CodeSmell(BaseModel):
    file: str = Field(description="File path where the smell is located")
    line: Optional[str] = Field(None, description="Line number range or location description")
    type: str = Field(description="Type of code smell (e.g., God Class, Long Method, Duplicated Code)")
    description: str = Field(description="Why it is a code smell")
    severity: str = Field(description="Severity: Low, Medium, High")

class RefactorOpportunity(BaseModel):
    file: str = Field(description="File path")
    description: str = Field(description="What to refactor")
    before_code: Optional[str] = Field(None, description="Code snippet before refactoring")
    after_code: Optional[str] = Field(None, description="Suggested refactored code snippet")
    benefits: str = Field(description="Benefits of this refactoring")

class RepositoryAnalysisResponse(BaseModel):
    id: Optional[int] = None
    github_username: str
    repo_name: str
    summary: str
    code_smells: List[CodeSmell]
    refactoring_opportunities: List[RefactorOpportunity]
    code_complexity: str
    documentation: str
    recommendations: List[str]
    unused_or_duplicate_code: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Open Source Recommendation Schemas
class OpenSourceRepoResponse(BaseModel):
    name: str = Field(description="Repository name")
    owner: str = Field(description="Repository owner")
    html_url: str = Field(description="GitHub URL")
    description: Optional[str] = Field(None, description="Repository description")
    stars: int = Field(description="Number of stars")
    languages: List[str] = Field(description="Key languages used")
    match_reason: str = Field(description="Why this repo matches the user's skill level")
    project_structure: str = Field(description="Explanation of the project folders and key files")
    first_issue_title: str = Field(description="Title of a recommended beginner issue or area to contribute")
    first_issue_url: Optional[str] = Field(None, description="URL to the issue or list of issues")
    first_issue_explanation: str = Field(description="Explanation of how to approach solving this issue")
