from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from supabase import create_client, Client
from app.config import settings
from app.product_queries import run_product_query

router = APIRouter(prefix="/api/brands", tags=["Brands"])

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


class BrandResponse(BaseModel):
    id: str
    name: str
    slug: str
    logo_url: Optional[str] = None
    description: Optional[str] = None
    created_at: Optional[str] = None


@router.get("", response_model=List[BrandResponse])
async def list_brands():
    try:
        response = supabase.table("brands").select("*").order("name").execute()
        return response.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch brands: {str(e)}",
        )


@router.get("/{slug}", response_model=BrandResponse)
async def get_brand(slug: str):
    try:
        response = supabase.table("brands").select("*").eq("slug", slug).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch brand: {str(e)}",
        )


@router.get("/{slug}/products")
async def get_brand_products(slug: str, limit: int = 50):
    try:
        brand_res = supabase.table("brands").select("id").eq("slug", slug).execute()
        if not brand_res.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")

        brand_id = brand_res.data[0]["id"]

        def build_query(select: str):
            return (
                supabase.table("products")
                .select(select)
                .eq("brand_id", brand_id)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )

        response = run_product_query(supabase, build_query)
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch brand products: {str(e)}",
        )
