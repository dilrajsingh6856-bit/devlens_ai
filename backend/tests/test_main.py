import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.auth import create_access_token
from app import schemas

client = TestClient(app)

def test_health_check():
    """Verify that the health check endpoint returns 200 and indicates status."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "mode" in data

def test_username_validation():
    """Verify that empty inputs in profile analysis return a 400 Bad Request error."""
    response = client.post("/api/v1/profile/analyze", json={"username": ""})
    assert response.status_code == 400  # API Bad Request validation error

def test_jwt_token_generation():
    """Verify token encoding and payload serialization."""
    token_data = {"sub": "testuser", "user_id": 123}
    token = create_access_token(data=token_data)
    assert token is not None
    assert isinstance(token, str)

def test_schemas_instantiation():
    """Validate that schemas handle RoadmapSteps correctly."""
    step = schemas.RoadmapStep(
        phase="Phase 1",
        focus="Backend basics",
        topics=["Databases", "APIs"],
        action_items=["Create SQLite DB"]
    )
    assert step.phase == "Phase 1"
    assert "Databases" in step.topics
