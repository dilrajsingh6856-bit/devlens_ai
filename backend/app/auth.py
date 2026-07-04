from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generates a secure JWT token for the user session."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT session token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[Dict[str, Any]]:
    """Retrieves session payload optionally if provided."""
    if not token:
        return None
    payload = verify_access_token(token)
    return payload

def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """Strictly enforces session verification, raising a 401 if invalid."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token is missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = verify_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token is invalid or expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload
