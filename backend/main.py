import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from cache import init_cache, close_cache
import services.sofascore as sofa
import services.transfermarkt as tm

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_cache()
    logger.info(f"Backend ready. TM API at {settings.tm_api_url}")
    yield
    # Shutdown
    await sofa.close()
    await tm.close_client()
    await close_cache()
    logger.info("Backend shutdown complete")

app = FastAPI(
    title="Soccer Finance & Strategy Dashboard API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers.players import router as players_router
app.include_router(players_router)

@app.get("/api/health")
async def health():
    sofa_avail = await sofa.is_available()
    return {
        "status": "ok",
        "sources": {
            "transfermarkt": {"url": settings.tm_api_url, "status": "configured"},
            "sofascore": {"status": "available" if sofa_avail else "unavailable"},
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
