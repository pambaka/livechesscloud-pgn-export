import textwrap
from datetime import UTC, datetime
from typing import Any

from tournament import Pairing

RESULT_MAP = {
    "WHITEWIN": "1-0",
    "BLACKWIN": "0-1",
    "DRAW": "1/2-1/2"
}

UNKNOWN_DATE = "????.??.??"
UNKNOWN_RESULT = "*"
UNKNOWN_TAG_VALUE = "?"


class PGNBuilder:
    def __init__(self, tournament: dict[str, Any]) -> None:
        self.tournament_name = tournament.get("name") or UNKNOWN_TAG_VALUE
        self.site = self._get_site(tournament)

    def to_pgn(
            self,
            game: dict[str, Any],
            pairing: Pairing,
            round_num: int,
            board: int
    ) -> str:
        game_result = RESULT_MAP.get(game.get("result", ""), UNKNOWN_RESULT)
        tags = {
            "Event": self.tournament_name,
            "Site": self.site,
            "Date": self._get_date(game),
            "Round": round_num,
            "White": pairing["white"],
            "Black": pairing["black"],
            "Result": game_result,
            "Board": board,
        }
        formatted_tags = self._format_tags(tags)
        moves = self._build_moves(game)
        moves_text = f"{moves} {game_result}".strip()
        wrapped_moves_text = textwrap.fill(moves_text, width=80)
        return f"{formatted_tags}\n\n{wrapped_moves_text}\n"

    @classmethod
    def _format_tags(cls, tags: dict[str, Any]) -> str:
        return "\n".join(
            f'[{key} "{cls._escape_tag_value(str(value))}"]'
            for key, value in tags.items()
        )

    @staticmethod
    def _escape_tag_value(value: str) -> str:
        return value.replace("\\", "\\\\").replace('"', '\\"')

    @staticmethod
    def _get_site(tournament: dict[str, Any]) -> str:
        location = tournament.get("location")
        country = tournament.get("country")
        site_parts = [part for part in (location, country) if part]
        return " ".join(site_parts) or UNKNOWN_TAG_VALUE

    @staticmethod
    def _get_date(game: dict[str, Any]) -> str:
        try:
            timestamp = float(game["firstMove"]) / 1000
            if timestamp <= 0:
                return UNKNOWN_DATE
            date = datetime.fromtimestamp(timestamp, UTC)
            return date.strftime("%Y.%m.%d")
        except (KeyError, TypeError, ValueError, OverflowError, OSError):
            return UNKNOWN_DATE

    @staticmethod
    def _build_moves(game: dict[str, Any]) -> str:
        raw_moves: list[str] = game.get("moves") or []
        moves = [move.split()[0] for move in raw_moves]
        pgn_moves: list[str] = []
        for i, move in enumerate(moves):
            if i % 2 == 0:
                pgn_moves.append(f"{i//2 + 1}. {move}")
            else:
                pgn_moves.append(move)
        return " ".join(pgn_moves)
