import { Component } from '@theme/component';

/**
 * Tabbed customer-reviews carousel: clicking a tab swaps which panel of
 * review cards is visible, and on mobile each panel's cards scroll
 * horizontally via prev/next buttons (desktop shows every card in a row,
 * no scrolling needed).
 *
 * @typedef {object} Refs
 * @property {HTMLElement[]} [cards] - Each tab panel's scrollable card row.
 * @property {HTMLButtonElement} [prevButton] - The "previous" arrow button.
 * @property {HTMLButtonElement} [nextButton] - The "next" arrow button.
 *
 * @extends {Component<Refs>}
 */
class CustomerReviewsTabsComponent extends Component {
  connectedCallback() {
    super.connectedCallback();

    for (const cards of this.refs.cards ?? []) {
      cards.addEventListener('scroll', this.#handleScroll);
    }

    this.#updateNavState();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    for (const cards of this.refs.cards ?? []) {
      cards.removeEventListener('scroll', this.#handleScroll);
    }
  }

  /**
   * Declaratively bound to each tab button via on:click="/activateTab/{{ block.id }}".
   *
   * @param {string} panelId
   */
  activateTab(panelId) {
    const target = this.querySelector('#' + CSS.escape(panelId));
    if (!target) return;

    for (const button of this.querySelectorAll('.customer-reviews-tabs__tab-btn')) {
      const isActive = button.getAttribute('data-tab-target') === panelId;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', String(isActive));
    }

    for (const panel of this.querySelectorAll('.customer-reviews-tabs__panel')) {
      panel.classList.toggle('is-active', panel === target);
    }

    const cards = target.querySelector('.customer-reviews-tabs__cards');
    if (cards instanceof HTMLElement) {
      cards.scrollTo({ left: 0, behavior: 'instant' });
      this.#updateNavState();
    }
  }

  /**
   * Declaratively bound to the "next" arrow via on:click="/next".
   */
  next() {
    this.#scrollByCard(1);
  }

  /**
   * Declaratively bound to the "previous" arrow via on:click="/prev".
   */
  prev() {
    this.#scrollByCard(-1);
  }

  get #activeCards() {
    return this.querySelector('.customer-reviews-tabs__panel.is-active .customer-reviews-tabs__cards');
  }

  /**
   * @param {1 | -1} direction
   */
  #scrollByCard(direction) {
    const cards = this.#activeCards;
    if (!(cards instanceof HTMLElement)) return;

    const card = cards.querySelector('.customer-reviews-tabs__card');
    if (!(card instanceof HTMLElement)) return;

    const gap = parseFloat(getComputedStyle(cards).columnGap || '0');
    cards.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: 'smooth' });
  }

  #handleScroll = () => {
    this.#updateNavState();
  };

  #updateNavState() {
    const { prevButton } = this.refs;
    const cards = this.#activeCards;
    if (!prevButton || !cards) return;

    prevButton.classList.toggle('is-enabled', cards.scrollLeft > 4);
  }
}

if (!customElements.get('customer-reviews-tabs-component')) {
  customElements.define('customer-reviews-tabs-component', CustomerReviewsTabsComponent);
}
