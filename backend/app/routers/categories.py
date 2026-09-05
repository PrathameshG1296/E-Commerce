from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from app.auth import get_current_admin, CurrentUser
from supabase import create_client, Client
from app.config import settings

router = APIRouter(prefix="/api/categories", tags=["Categories"])

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

class CategoryCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None

class CategoryResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    created_at: Optional[str] = None

@router.get("", response_model=List[CategoryResponse])
async def list_categories():
    """
    Public endpoint to list all product categories.
    """
    try:
        response = supabase.table("categories").select("*").order("name").execute()
        return response.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch categories: {str(e)}"
        )

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category: CategoryCreate,
    _current_admin: CurrentUser = Depends(get_current_admin)
):
    """
    Admin-only endpoint to create a new product category.
    """
    try:
        response = supabase.table("categories").insert(category.model_dump()).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category creation failed"
            )
        return response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database insertion failed: {str(e)}"
        )
