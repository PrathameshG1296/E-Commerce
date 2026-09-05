import jwt
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import create_client, Client
from app.config import settings
from pydantic import BaseModel

security = HTTPBearer()

# Initialize Supabase Admin/Service client
# In production, we'd use the service role key for administrative operations,
# but for basic validation we can use the anon client.
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

class CurrentUser(BaseModel):
    id: str
    email: str
    role: str

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> CurrentUser:
    """
    Decodes the client JWT and validates it against the Supabase JWT secret.
    If valid, returns the user credentials.
    """
    token = credentials.credentials
    try:
        # First, try to decode locally using HS256 (fastest)
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        
        user_id = payload.get("sub")
        email = payload.get("email")
        role = payload.get("role", "authenticated")
        
        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload is missing user ID or email",
            )
            
        return CurrentUser(id=user_id, email=email, role=role)
        
    except jwt.InvalidAlgorithmError:
        # Fallback for RS256 or other algorithms used by newer Supabase projects
        try:
            from fastapi.concurrency import run_in_threadpool
            user_resp = await run_in_threadpool(supabase.auth.get_user, token)
            user = user_resp.user
            if not user or not user.id:
                raise ValueError("Invalid user")
            return CurrentUser(id=user.id, email=user.email or "", role=user.role or "authenticated")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token verification failed via Supabase API: {str(e)}",
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token signature has expired",
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}",
        )

async def get_current_admin(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """
    Dependency to verify if the authenticated user has admin privileges.
    Checks the 'profiles' table in PostgreSQL.
    """
    try:
        response = supabase.table("profiles").select("is_admin").eq("id", current_user.id).execute()
        profile_data = response.data
        
        if not profile_data or not profile_data[0].get("is_admin", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Admin access required",
            )
        return current_user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database check failed: {str(e)}",
        )
