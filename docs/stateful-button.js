import { pgnButtonElement, submitButtonElement } from "./elements.js";

class StatefulButton {
  static #LOADING = Symbol("loading");

  #button;
  #defaultText;
  #loadingText = "Loading...";
  #disabledReasons = new Set();

  /** @param {HTMLButtonElement} button */
  constructor(button) {
    this.#button = button;
    this.#defaultText = button.textContent;
  }

  onClick(handler) {
    this.#button.addEventListener("click", handler);
  }

  setDisabledBy(reason, isDisabled) {
    if (isDisabled) this.#disabledReasons.add(reason);
    else this.#disabledReasons.delete(reason);
    this.#updateDisabled();
  }

  setLoading(isLoading) {
    this.setDisabledBy(StatefulButton.#LOADING, isLoading);
    this.#button.textContent = isLoading
      ? this.#loadingText
      : this.#defaultText;
  }

  #updateDisabled() {
    this.#button.disabled = this.#disabledReasons.size > 0;
  }
}

export const submitButton = new StatefulButton(submitButtonElement);
export const pgnButton = new StatefulButton(pgnButtonElement);
