from fastapi import Header, HTTPException, status, Depends
from jose import jwt, JWTError
from dotenv import load_dotenv
from app.config.logger import logger
import os

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256" # Must match the algorithm used by jsonwebtoken in Node.js

def get_current_user(authorization: str = Header(None)):
    """
    Dependency that verifies the JWT token from the Authorization header.
    
    Usage in a route:
        def my_route(user: dict = Depends(get_current_user)):
            # user contains the decoded token payload (id, email, role)
    
    Raises HTTPException (401) if the token is missing or invalid.
    """

    # Check the header exists and starts with "Bearer "
    if not authorization or not authorization.startswith("Bearer "):
        logger.warning("Unauthorized request - no token provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No token provided"
        )
    
    # Extract the token (everything after "Bearer ")
    token = authorization.split(" ")[1]

    try:
        # Decode and verify the token using the shared JWT_SECRET
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        logger.debug(f"Token verified for user ID: {payload.get('id')}")
        return payload
    except JWTError as e:
        logger.warning("Invalid or expired token - {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
def admin_only(user: dict = Depends(get_current_user)):
    """
    Dependency that ensure the current user has the 'admin' role.
    Must be used together with get_current_user
    
    Usage in a route:
        def my_route(user: dict = Depends(admin_only)):
            # Only reaches here if user.role == 'admin'
    """
    if user.get("role") != 'admin':
        logger.warning(f"Admin route accessed by non-admin user ID: {user.get('id')}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Admins Only'
        )
    return user