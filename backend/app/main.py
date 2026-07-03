from fastapi import FastAPI

from app.modules.reading_plan.routers import router as reading_plan_router

app = FastAPI(title="ReadLog API")

app.include_router(reading_plan_router, prefix="/api")


@app.get("/health")
def health_check():
    return {"status": "ok"}
