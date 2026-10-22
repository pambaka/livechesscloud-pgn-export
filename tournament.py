from typing import Any, TypedDict


class Pairing(TypedDict):
    white: str
    black: str

UNKNOWN_NAME = "?"


class Tournament:
    def __init__(self, rounds: list[dict[str, Any] | None]) -> None:
        self.rounds = rounds

    def get_pairings_by_round(self) -> dict[int, dict[int, Pairing]]:
        pairings_by_round: dict[int, dict[int, Pairing]] = {}
        for i, round_data in enumerate(self.rounds, 1):
            pairings_by_round[i] = {}
            if round_data is None:
                continue
            pairings = round_data["pairings"]
            for board in range(1, len(pairings) + 1):
                pairings_by_round[i][board] = self.get_pairing(round_data, board)
        return pairings_by_round

    @staticmethod
    def get_pairing(round_data: dict[str, Any], board: int) -> Pairing:
        pairing = round_data["pairings"][board - 1]
        return {
            "white": Tournament._get_full_name(pairing["white"]),
            "black": Tournament._get_full_name(pairing["black"]),
        }

    @staticmethod
    def _get_full_name(player: dict[str, Any] | None) -> str:
        if player is None:
            return UNKNOWN_NAME
        name_parts: tuple[str | None, str | None, str | None] = (
            player.get("fname"), player.get("mname"), player.get("lname")
        )
        name = " ".join(p.strip() for p in name_parts if p and p.strip())
        return name or UNKNOWN_NAME
