from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

from app.config.logger import logger
from app.config.database import test_connection, engine, Base
from app.routers import orders

# -- Create Database tables ---------------------------
# This creates any tables defined in our models that don't exist already
# Safe to run even if tables already exist (won't overwrite data)
Base.metadata.create_all(bind=engine)

# -- Create the FastAPI App ---------------------------
app = FastAPI(
    title="Order Service",
    description="Handles order creation and management for the the e-commerce platform",
    version="1.0.0",
)

# --- CORS --------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173'], # React frontend
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

# -- Request Logging Middleware -----------------------
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)

    duration_ms = round((time.time() - start_time) * 1000)
    log_message = f"{request.method} {request.url.path} {response.status_code} - {duration_ms}ms"

    if response.status_code >= 500:
        logger.error(log_message)
    elif response.status_code >= 400:
        logger.warning(log_message)
    else:
        logger.info(log_message)
    
    return response

# -- Startup Event ------------------------------
@app.on_event("startup")
async def startup_event():
    logger.info("Order service starting up...")
    test_connection()

# -- Health Check -------------------------------
@app.get("/health")
async def health_check():
    logger.info("Health check pinged")
    return {"status": "Order service is running!"}

# -- Routes -------------------------------------
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])

# -- Global Error Handlers ----------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error"}
    )