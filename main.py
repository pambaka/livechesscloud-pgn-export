from typing import Any

from fastapi import FastAPI, HTTPException

from client import LiveChessCloudClient, LiveChessCloudException

app = FastAPI()


@app.get("/api/tournaments/{tournament_id}")
def get_tournament(tournament_id: str) -> dict[str, Any]:
    try:
        with LiveChessCloudClient(tournament_id) as client:
            return client.get_tournament()
    except LiveChessCloudException as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
