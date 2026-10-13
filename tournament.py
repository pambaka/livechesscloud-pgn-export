from typing import Any

UNKNOWN_NAME = "?"


class Tournament:
    def __init__(self, rounds: list[dict[str, Any] | None]) -> None:
        self.rounds = rounds

    def get_pairings_by_round(self) -> dict[int, dict]:
        pairings_by_round: dict[int, dict] = {}
        for i, round_data in enumerate(self.rounds, 1):
            pairings_by_round[i] = {}
            if round_data is None:
                continue
            pairings = round_data["pairings"]
            for j, pairing in enumerate(pairings, 1):
                pairings_by_round[i][j] = {
                    "white": self._get_full_name(pairing["white"]),
                    "black": self._get_full_name(pairing["black"]),
                }
        return pairings_by_round

    @staticmethod
    def _get_full_name(player: dict[str, Any] | None) -> str:
        if player is None:
            return UNKNOWN_NAME
        name_parts: tuple[str | None, str | None, str | None] = (
            player.get("fname"), player.get("mname"), player.get("lname")
        )
        name = " ".join(p.strip() for p in name_parts if p and p.strip())
        return name or UNKNOWN_NAME
