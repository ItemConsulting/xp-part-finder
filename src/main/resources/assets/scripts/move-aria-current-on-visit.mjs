class MoveAriaCurrentOnVisit extends HTMLElement {
  allLinkEls = [];

  connectedCallback() {
    this.allLinkEls = this.querySelectorAll("a[href]");
    // "turbo:click" marks the clicked link at once, before the response arrives. "turbo:visit" covers the rest, such
    // as going back and forward in the browser history.
    document.addEventListener("turbo:click", this.onVisit);
    document.addEventListener("turbo:visit", this.onVisit);
  }

  disconnectedCallback() {
    document.removeEventListener("turbo:click", this.onVisit);
    document.removeEventListener("turbo:visit", this.onVisit);
  }

  onVisit = (event) => {
    if (event.detail.url) {
      this.updateAriaSelected(event.detail.url);
    }
  };

  updateAriaSelected(newURL) {
    this.allLinkEls.forEach((el) => {
      if (el.href === newURL) {
        el.setAttribute("aria-current", "page");
      } else {
        el.removeAttribute("aria-current");
      }
    });
  }
}

if (!window.customElements.get("move-aria-current-on-visit")) {
  window.customElements.define("move-aria-current-on-visit", MoveAriaCurrentOnVisit);
}
