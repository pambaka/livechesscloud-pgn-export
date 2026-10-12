import os
from typing import Any
from uuid import UUID

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from client import LiveChessCloudClient, LiveChessCloudException


RATE_LIMIT = os.environ.get("RATE_LIMIT", "30/minute")
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS", "http://127.0.0.1:5500"
).split()

limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,  # type: ignore[arg-type]
)
app.add_middleware(
    CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_methods=["GET"]
)


@app.get("/api/tournaments/{tournament_id}")
@limiter.limit(RATE_LIMIT)
def get_tournament(
    request: Request,  # required by slowapi
    tournament_id: UUID,
) -> dict[str, Any]:
    try:
        with LiveChessCloudClient(tournament_id) as client:
            return client.get_tournament()
    except LiveChessCloudException as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
