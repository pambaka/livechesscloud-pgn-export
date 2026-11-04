import { pgnBlock, pgnTemplate } from "./elements.js";

// const FORBIDDEN_CHARS = ' /\\:*?"<>|';

const timers = new WeakMap();

const COPY_STATUS = Object.freeze({
  success: "copy-success",
  failure: "copy-failure",
});

class PgnList {
  #element;

  /**@param {HTMLElement} element*/
  constructor(element) {
    this.#element = element;
    document
      .getElementById("download-button")
      .addEventListener("click", () => {});
  }

  clear() {
    this.#element.replaceChildren();
  }

  addPgn(roundNum, boardNum, pairing, text) {
    /**@type {HTMLElement} */
    const pgnItem = pgnTemplate.content.firstElementChild.cloneNode(true);
    pgnItem.querySelector(".round-board").textContent =
      `Round ${roundNum} Board ${boardNum}`;
    pgnItem.querySelector(".white").append(pairing.white);
    pgnItem.querySelector(".black").append(pairing.black);
    pgnItem.querySelector(".pgn-text").textContent = text;
    /**@type {HTMLButtonElement} */
    const copyButton = pgnItem.querySelector(".copy-button");
    copyButton.addEventListener("click", (event) => copyPgn(event, text));
    this.#element.append(pgnItem);
  }

  scrollTo() {
    this.#element.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

// function getFileName(roundNum, boardNum, pairing) {
//   const fileName = `${roundNum}-${boardNum}_${pairing.white}-${pairing.black}.pgn`;
//   return [...fileName]
//     .map((c) => (FORBIDDEN_CHARS.includes(c) ? "_" : c))
//     .join("");
// }

/** @param {PointerEvent} event */
async function copyPgn(event, text) {
  /** @type {HTMLButtonElement} */
  const button = event.currentTarget;
  navigator.vibrate?.(30);
  let statusClass;
  try {
    await navigator.clipboard.writeText(text);
    statusClass = COPY_STATUS.success;
  } catch (error) {
      console.error("Failed to copy:", error);
      statusClass = COPY_STATUS.failure;
  }
  clearTimeout(timers.get(button));
  button.classList.remove(...Object.values(COPY_STATUS));
  button.classList.add(statusClass)
  timers.set(
    button,
    setTimeout(() => {
      button.classList.remove(...Object.values(COPY_STATUS));
    }, 2000),
  );
}

// function downloadPgn(text, filename) {
//   const blob = new Blob([text], { type: "application/x-chess-pgn" });
//   const url = URL.createObjectURL(blob);
//   const link = document.createElement("a");
//   link.href = url;
//   link.download = filename;
//   link.click();
//   URL.revokeObjectURL(url);
// }

export const pgnList = new PgnList(pgnBlock);
