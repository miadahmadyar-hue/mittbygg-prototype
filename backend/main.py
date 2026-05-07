import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from api.address import router as address_router
from api.property import router as property_router
from api.evaluate import router as evaluate_router
from api.soknad import router as soknad_router

load_dotenv()

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,https://mittbygg-test.netlify.app",
).split(",")

app = FastAPI(title="MittBygg API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(address_router, prefix="/api")
app.include_router(property_router, prefix="/api")
app.include_router(evaluate_router, prefix="/api")
app.include_router(soknad_router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
