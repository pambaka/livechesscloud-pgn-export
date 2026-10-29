import { pgnStatusBlock, tournamentStatusBlock } from "./elements.js";

const ERROR_CLASS = "error";

class Status {
  #element;

  /**@param {HTMLElement} element */
  constructor(element) {
    this.#element = element;
  }

  clear() {
    this.#show("");
  }

  showError(message) {
    this.#show(message, true);
  }

  showInfo(message) {
    this.#show(message);
  }

  #show(message, isError = false) {
    this.#element.textContent = message;
    this.#element.classList.toggle(ERROR_CLASS, isError);
  }
}

export const tournamentStatus = new Status(tournamentStatusBlock);
export const pgnStatus = new Status(pgnStatusBlock);
