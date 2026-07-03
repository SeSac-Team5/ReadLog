from fastapi import APIRouter

from app.modules.reading_plan.routers.books import router as books_router
from app.modules.reading_plan.routers.goals import router as goals_router
from app.modules.reading_plan.routers.library import router as library_router
from app.modules.reading_plan.routers.progress import router as progress_router
from app.modules.reading_plan.routers.reviews import router as reviews_router
from app.modules.reading_plan.routers.sns import router as sns_router

router = APIRouter()
router.include_router(books_router)
router.include_router(goals_router)
router.include_router(library_router)
router.include_router(progress_router)
router.include_router(reviews_router)
router.include_router(sns_router)
