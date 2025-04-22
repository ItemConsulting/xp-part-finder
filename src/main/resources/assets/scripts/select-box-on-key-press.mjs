class SelectBoxOnKeyPress extends HTMLElement {
  connectedCallback() {
    this.addEventListener("keydown", (event) => {
      const el = this.querySelector(`[data-keyboard-focus-on="${event.key}"]`);

      if (el) {
        console.log("focusing on", el);

        event.preventDefault();
        el.focus();
      }
    });
  }
}

if (!window.customElements.get("select-box-on-key-press")) {
  window.customElements.define("select-box-on-key-press", SelectBoxOnKeyPress);
}
