from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import predict

app = FastAPI(
    title="SkinFuseNet API",
    version="0.2.0",
    description="Multimodal skin lesion classification — Week 2 mock",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router)
