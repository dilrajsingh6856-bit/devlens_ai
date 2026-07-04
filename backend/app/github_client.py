import httpx
import logging
from typing import Dict, Any, List, Optional
import base64

logger = logging.getLogger(__name__)

class GithubClient:
    def __init__(self, token: Optional[str] = None):
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "DevLens-AI"
        }
        
        # Load token from environment setting if no active OAuth token is provided
        from app.config import settings
        active_token = token or settings.GITHUB_TOKEN
        if active_token:
            self.headers["Authorization"] = f"Bearer {active_token}"
            
        self.base_url = "https://api.github.com"
        
    async def _get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Any:
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=self.headers, params=params, timeout=15.0)
                if response.status_code == 404:
                    raise httpx.HTTPStatusError("GitHub resource not found", request=response.request, response=response)
                elif response.status_code == 403 and "rate limit" in response.text.lower():
                    logger.warning("GitHub API Rate limit exceeded.")
                    raise httpx.HTTPStatusError("GitHub Rate Limit Exceeded", request=response.request, response=response)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"GitHub API Error for endpoint {endpoint}: {e}")
                raise e

    async def get_user_profile(self, username: str) -> Dict[str, Any]:
        """Fetches public GitHub profile info. Raises error on failure (e.g. 404 User Not Found)."""
        return await self._get(f"users/{username}")

    async def get_user_repos(self, username: str) -> List[Dict[str, Any]]:
        """Fetches up to 100 repositories of a user. Raises error on failure."""
        return await self._get(f"users/{username}/repos", params={"per_page": 100, "sort": "updated"})

    async def get_repo_languages(self, owner: str, repo: str) -> Dict[str, int]:
        """Fetches language breakdown for a repository. Returns empty dict on failure."""
        try:
            return await self._get(f"repos/{owner}/{repo}/languages")
        except Exception:
            return {}

    async def get_repo_commits(self, owner: str, repo: str) -> List[Dict[str, Any]]:
        """Fetches commits for a repository. Returns empty list on failure."""
        try:
            return await self._get(f"repos/{owner}/{repo}/commits", params={"per_page": 30})
        except Exception:
            return []

    async def get_repo_pulls(self, owner: str, repo: str) -> List[Dict[str, Any]]:
        """Fetches pull requests for a repository. Returns empty list on failure."""
        try:
            return await self._get(f"repos/{owner}/{repo}/pulls", params={"state": "all", "per_page": 20})
        except Exception:
            return []

    async def get_user_events(self, username: str) -> List[Dict[str, Any]]:
        """Fetches public contribution activities/events of the user. Returns empty list on failure."""
        try:
            return await self._get(f"users/{username}/events", params={"per_page": 50})
        except Exception:
            return []

    async def get_repo_files(self, owner: str, repo: str, branch: str = "main") -> List[Dict[str, Any]]:
        """Fetches repository file tree to find source files. Returns empty list on failure."""
        try:
            try:
                tree_data = await self._get(f"repos/{owner}/{repo}/git/trees/{branch}", params={"recursive": 1})
                return tree_data.get("tree", [])
            except Exception:
                tree_data = await self._get(f"repos/{owner}/{repo}/git/trees/master", params={"recursive": 1})
                return tree_data.get("tree", [])
        except Exception:
            return []

    async def get_file_content(self, owner: str, repo: str, path: str) -> str:
        """Fetches the raw contents of a file."""
        url = f"{self.base_url}/repos/{owner}/{repo}/contents/{path}"
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=self.headers, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                if data.get("encoding") == "base64":
                    return base64.b64decode(data.get("content", "")).decode("utf-8", errors="ignore")
                return data.get("content", "")
            except Exception as e:
                logger.error(f"Error fetching file content for {path}: {e}")
                return ""

    async def get_readme_file(self, owner: str, repo: str) -> str:
        """Fetches the repository README content directly. Returns empty string on failure."""
        try:
            readme_data = await self._get(f"repos/{owner}/{repo}/readme")
            download_url = readme_data.get("download_url")
            if download_url:
                async with httpx.AsyncClient() as client:
                    resp = await client.get(download_url, timeout=10.0)
                    resp.raise_for_status()
                    return resp.text
            content_b64 = readme_data.get("content", "")
            return base64.b64decode(content_b64).decode("utf-8", errors="ignore")
        except Exception:
            return ""
