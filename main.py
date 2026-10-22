import os
from http import HTTPStatus
from typing import Any
from uuid import UUID

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from client import (
    LiveChessCloudClient,
    LiveChessCloudException,
    LiveChessCloudNotFound,
)
from game_pgn import GamePGN
from tournament import Tournament

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
) -> dict[Any, Any]:
    try:
        with LiveChessCloudClient(tournament_id) as client:
            rounds = client.get_rounds()
            return Tournament(rounds).get_pairings_by_round()
    except LiveChessCloudException as e:
        raise HTTPException(status_code=HTTPStatus.BAD_GATEWAY, detail=str(e)) from e

@app.get("/api/tournaments/{tournament_id}/pgn", response_class=PlainTextResponse)
@limiter.limit(RATE_LIMIT)
def get_pgn(
    request: Request,  # required by slowapi 
    tournament_id: UUID,
    round_num: int = Query(alias="round", ge=1),
    board: int = Query(ge=1)
) -> str:
    try:
        with LiveChessCloudClient(tournament_id) as client:
            tournament = client.get_tournament()
            round_data = client.get_round(round_num)
            pairing = Tournament.get_pairing(round_data, board)
            game = client.get_game(round_num, board)
            pgn = GamePGN(tournament).to_pgn(game, pairing, round_num, board)
            return pgn
    except (LiveChessCloudNotFound, IndexError) as e:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Game not found") from e
    except LiveChessCloudException as e:
        raise HTTPException(status_code=HTTPStatus.BAD_GATEWAY, detail=str(e)) from e
