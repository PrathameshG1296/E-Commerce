from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.auth import get_current_user, CurrentUser
from app.routers import products, categories, brands, collections, analytics, cart, orders, profile, upload

app = FastAPI(
    title="E-Commerce API",
    description="Production-ready FastAPI backend for E-Commerce platform",
    version="1.0.0"
)

# CORS Configuration
# In production, this should be restricted to the deployed frontend domain.
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(brands.router)
app.include_router(collections.router)
app.include_router(analytics.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(profile.router)
app.include_router(upload.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the E-Commerce API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "e-commerce-api"}

@app.get("/api/auth/me")
async def get_my_info(current_user: CurrentUser = Depends(get_current_user)):
    """
    Returns the user data for the authenticated token.
    This route is protected and requires an Authorization Bearer token header.
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "status": "authenticated"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
