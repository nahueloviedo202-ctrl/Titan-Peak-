import { Component } from '@theme/component';

/**
 * Product info tabs: clicking a tab swaps which panel (doctor quote,
 * comparison table, ingredients, FAQ) is visible. Plain, accessible tab
 * switcher - no autoplay or slider behavior. Mirrors the same declarative
 * `on:click` pattern used by `product-features-tabs-component`.
 *
 * @extends {Component}
 */
class ProductInfoTabsComponent extends Component {
  connectedCallback() {
    super.connectedCallback();
    this.#ensureActiveTab();
  }

  #ensureActiveTab() {
    if (this.querySelector('.product-info-tabs__tab.is-active')) return;

    const firstTab = this.querySelector('.product-info-tabs__tab');
    const panelId = firstTab?.getAttribute('aria-controls');

    if (panelId) this.activateTab(panelId);
  }

  /**
   * Declaratively bound to each tab button via on:click="/activateTab/{{ panel_id }}".
   *
   * @param {string} panelId
   */
  activateTab(panelId) {
    const target = this.querySelector('#' + CSS.escape(panelId));
    if (!target) return;

    for (const button of this.querySelectorAll('.product-info-tabs__tab')) {
      const isActive = button.getAttribute('aria-controls') === panelId;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', String(isActive));
    }

    for (const panel of this.querySelectorAll('.product-info-tabs__panel')) {
      panel.classList.toggle('is-active', panel === target);
    }
  }
}

if (!customElements.get('product-info-tabs-component')) {
  customElements.define('product-info-tabs-component', ProductInfoTabsComponent);
}
