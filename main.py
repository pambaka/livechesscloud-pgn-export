import os
from http import HTTPStatus
from typing import Any
from uuid import UUID

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from client import (
    LiveChessCloudClient,
    LiveChessCloudException,
    LiveChessCloudNotFound,
)
from pgn_builder import PGNBuilder
from tournament import Tournament

MAX_GAMES = 200
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
        raise HTTPException(
            status_code=HTTPStatus.BAD_GATEWAY, detail=str(e)
        ) from e


@app.get("/api/tournaments/{tournament_id}/pgn")
@limiter.limit(RATE_LIMIT)
def get_pgn(
    request: Request,  # required by slowapi
    tournament_id: UUID,
    games: str
) -> dict[str, Any]:
    found_games = []
    missing_games = []
    try:
        game_refs = list(dict.fromkeys(games.split(",")))
        # TODO: enforce the same limit on the frontend as well
        if len(game_refs) > MAX_GAMES:
            raise HTTPException(status_code=HTTPStatus.UNPROCESSABLE_ENTITY)
        with LiveChessCloudClient(tournament_id) as client:
            pgn_builder = PGNBuilder(client.get_tournament())
            for game_ref in game_refs:
                try:
                    round_num, board = map(int, game_ref.split("-"))
                    round_data = client.get_round(round_num)
                    pairing = Tournament.get_pairing(round_data, board)
                    game = client.get_game(round_num, board)
                    pgn = pgn_builder.to_pgn(game, pairing, round_num, board)
                    found_games.append({
                        "round": round_num,
                        "board": board,
                        "pairing": pairing,
                        "pgn": pgn
                        })
                except (LiveChessCloudNotFound, IndexError, ValueError):
                    missing_games.append(game_ref)
            if not found_games:
                raise HTTPException(status_code=HTTPStatus.NOT_FOUND)
            return {"games": found_games, "missing": missing_games}
    except LiveChessCloudNotFound as e:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="Tournament not found"
        ) from e
    except LiveChessCloudException as e:
        raise HTTPException(
            status_code=HTTPStatus.BAD_GATEWAY, detail=str(e)
        ) from e
