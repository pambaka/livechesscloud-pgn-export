import { pgnBlock, pgnTemplate } from "./elements.js";

const FORBIDDEN_CHARS = ' /\\:*?"<>|';

class PgnList {
  #element;

  /**@param {HTMLElement} element*/
  constructor(element) {
    this.#element = element;
  }

  clear() {
    this.#element.replaceChildren();
  }

  addPgn(roundNum, boardNum, pairing, text) {
    /**@type {HTMLElement} */
    const pgnItem = pgnTemplate.content.firstElementChild.cloneNode(true);
    pgnItem.querySelector(".pgn-title").textContent =
      `${roundNum} - ${boardNum}: ${pairing.white} - ${pairing.black}`;
    pgnItem.querySelector(".pgn-text").textContent = text;
    /**@type {HTMLButtonElement} */
    const downloadButton = pgnItem.querySelector(".download-button");
    downloadButton.addEventListener("click", () =>
      downloadPgn(text, getFileName(roundNum, boardNum, pairing)),
    );
    this.#element.append(pgnItem);
  }

  scrollTo() {
    this.#element.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function getFileName(roundNum, boardNum, pairing) {
  const fileName = `${roundNum}-${boardNum}_${pairing.white}-${pairing.black}.pgn`;
  return [...fileName]
    .map((c) => (FORBIDDEN_CHARS.includes(c) ? "_" : c))
    .join("");
}

function downloadPgn(text, filename) {
  const blob = new Blob([text], { type: "application/x-chess-pgn" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export const pgnList = new PgnList(pgnBlock);
