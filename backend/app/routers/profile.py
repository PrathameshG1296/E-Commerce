from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.auth import CurrentUser, get_current_user
from app.db import get_supabase_admin

router = APIRouter(prefix="/api/profile", tags=["Profile"])
supabase = get_supabase_admin()


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, min_length=7, max_length=20)
    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field("India", max_length=100)


class ProfileResponse(BaseModel):
    id: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = "India"
    is_admin: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(current_user: CurrentUser = Depends(get_current_user)):
    """
    Returns the full profile and saved shipping address for the authenticated user.
    """
    try:
        res = supabase.table("profiles").select("*").eq("id", current_user.id).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]

        # If profile doesn't exist yet, insert a basic record
        fallback_payload = {
            "id": current_user.id,
            "full_name": current_user.email.split("@")[0] if current_user.email else "User",
            "country": "India",
            "is_admin": False,
        }
        insert_res = supabase.table("profiles").insert(fallback_payload).execute()
        if insert_res.data:
            return insert_res.data[0]

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch profile: {str(e)}",
        )


@router.put("/me", response_model=ProfileResponse)
async def update_my_profile(
    body: ProfileUpdate,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Updates the authenticated user's profile information and shipping address.
    """
    try:
        # Only include fields that are explicitly provided (not None)
        update_data = {k: v for k, v in body.model_dump().items() if v is not None}
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No profile fields provided to update",
            )

        res = supabase.table("profiles").update(update_data).eq("id", current_user.id).execute()
        
        if not res.data:
            # If update didn't match any row, try upserting
            update_data["id"] = current_user.id
            upsert_res = supabase.table("profiles").upsert(update_data).execute()
            if upsert_res.data:
                return upsert_res.data[0]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update profile",
            )

        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}",
        )
