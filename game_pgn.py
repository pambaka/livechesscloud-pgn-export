from typing import Any

from tournament import Pairing

RESULT_MAP = {
    "WHITEWIN": "1-0",
    "BLACKWIN": "0-1",
    "DRAW": "1/2-1/2"
}

UNKNOWN_RESULT = "*"


class GamePGN:
    def __init__(self, tournament: dict[str, Any]) -> None:
        self.tournament_name = tournament.get("name", "")

    def to_pgn(self, game: dict[str, Any], pairing: Pairing, round_num: int, board: int) -> str:
        game_result = RESULT_MAP.get(game.get("result"), UNKNOWN_RESULT)
        headers =  self._build_headers(pairing, round_num, board, game_result)
        moves = self._build_moves(game)
        moves_text = f"{moves} {game_result}".strip()
        return f"{headers}\n\n{moves_text}\n"

    def _build_headers(self, pairing: Pairing, round_num: int, board: int, result: str) -> str:
        headers = {
            "Event": self.tournament_name,
            "Site": "?",
            "Date": "????.??.??",
            "Round": round_num,
            "White": pairing["white"],
            "Black": pairing["black"],
            "Result": result,
            "Board": board,
        }
        header_str = "\n".join(f'[{key} "{value}"]' for key, value in headers.items())
        return header_str
        

    def _build_moves(self, game: dict[str, Any]) -> str:
        raw_moves: list[str] = game.get("moves", [])
        moves = [move.split()[0] for move in raw_moves]
        pgn_moves: list[str] = []
        for i, move in enumerate(moves):
            if i % 2 == 0:
                pgn_moves.append(f"{i//2 + 1}. {move}")
            else:
                pgn_moves.append(move)
        return " ".join(pgn_moves)

