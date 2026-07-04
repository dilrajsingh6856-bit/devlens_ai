import os
from dotenv import load_dotenv

# Load environment variables from the .env file in the backend folder
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path=env_path)

class Settings:
    # Server configuration
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    
    # Database configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./devlens.db")
    
    # Authentication & Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "devlens-ai-super-secret-key-12345-67890")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))
    
    # GitHub OAuth & PAT Settings
    GITHUB_CLIENT_ID: str = os.getenv("GITHUB_CLIENT_ID", "")
    GITHUB_CLIENT_SECRET: str = os.getenv("GITHUB_CLIENT_SECRET", "")
    GITHUB_REDIRECT_URI: str = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:3000/oauth-callback")
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
    
    # Gemini AI configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    
    @property
    def is_mock_mode(self) -> bool:
        """Returns True if there is no Gemini API key configured, prompting a fallback to simulated data."""
        return not self.GEMINI_API_KEY or self.GEMINI_API_KEY.strip() == "" or "your_gemini_api_key" in self.GEMINI_API_KEY

settings = Settings()
