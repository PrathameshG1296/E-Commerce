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

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
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

@router.get("/{slug}", response_model=CategoryResponse)
async def get_category(slug: str):
    """
    Public endpoint to get a single category by its slug.
    """
    try:
        response = supabase.table("categories").select("*").eq("slug", slug).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch category: {str(e)}"
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


@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    category: CategoryUpdate,
    _current_admin: CurrentUser = Depends(get_current_admin)
):
    """
    Admin-only endpoint to update an existing category.
    """
    try:
        update_data = {k: v for k, v in category.model_dump().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields provided to update")
            
        response = supabase.table("categories").update(update_data).eq("id", category_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Category not found")
            
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update category: {str(e)}"
        )


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    _current_admin: CurrentUser = Depends(get_current_admin)
):
    """
    Admin-only endpoint to delete a category.
    """
    try:
        response = supabase.table("categories").delete().eq("id", category_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Category not found or already deleted")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete category: {str(e)}"
        )
