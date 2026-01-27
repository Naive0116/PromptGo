from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from .database.db import init_db
from .routers import conversations_router, prompts_router
from .routers.documents import router as documents_router
from .routers.rag import router as rag_router
from .config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="PromptGo API",
    description="普提狗 - AI 时代的精神助产术",
    version="1.1.0",
    lifespan=lifespan
)


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"{exc.__class__.__name__}: {exc}"}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(conversations_router)
app.include_router(prompts_router)
app.include_router(documents_router)
app.include_router(rag_router)


@app.get("/")
async def root():
    return {"message": "Welcome to PromptForge API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )
