import { pgnBlock, pgnTemplate } from "./elements.js";

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
    const pgnItem = pgnTemplate.content.firstElementChild.cloneNode(true);
    pgnItem.querySelector("summary").textContent =
      `${roundNum} - ${boardNum}: ${pairing.white} - ${pairing.black}`;
    pgnItem.querySelector("pre").textContent = text;
    this.#element.append(pgnItem);
  }

  scrollTo() {
    this.#element.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

export const pgnList = new PgnList(pgnBlock);
