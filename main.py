import os
from typing import Any
from uuid import UUID

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from client import LiveChessCloudClient, LiveChessCloudException

ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS", "http://127.0.0.1:5500"
).split()

app = FastAPI()
app.add_middleware(
    CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_methods=["GET"]
)


@app.get("/api/tournaments/{tournament_id}")
def get_tournament(tournament_id: UUID) -> dict[str, Any]:
    try:
        with LiveChessCloudClient(tournament_id) as client:
            return client.get_tournament()
    except LiveChessCloudException as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
