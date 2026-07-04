import uvicorn
import os
import sys

# Ensure backend folder is in Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import settings

if __name__ == "__main__":
    print(f"Starting DevLens AI Backend on http://{settings.HOST}:{settings.PORT}")
    print(f"Mock Mode: {settings.is_mock_mode}")
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
