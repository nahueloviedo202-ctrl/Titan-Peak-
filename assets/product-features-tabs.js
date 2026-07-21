import { Component } from '@theme/component';

/**
 * Product features tabs: clicking a tab swaps which panel (product image +
 * feature cards + CTA) is visible. No autoplay or slider behavior - this is
 * a plain, accessible tab switcher matching the four-formula layout.
 *
 * @extends {Component}
 */
class ProductFeaturesTabsComponent extends Component {
  /**
   * Declaratively bound to each tab button via on:click="/activateTab/{{ panel_id }}".
   *
   * @param {string} panelId
   */
  activateTab(panelId) {
    const target = this.querySelector('#' + CSS.escape(panelId));
    if (!target) return;

    for (const button of this.querySelectorAll('.product-features-tabs__tab-btn')) {
      const isActive = button.getAttribute('data-tab-target') === panelId;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', String(isActive));
    }

    for (const panel of this.querySelectorAll('.product-features-tabs__panel')) {
      panel.classList.toggle('is-active', panel === target);
    }
  }
}

if (!customElements.get('product-features-tabs-component')) {
  customElements.define('product-features-tabs-component', ProductFeaturesTabsComponent);
}
