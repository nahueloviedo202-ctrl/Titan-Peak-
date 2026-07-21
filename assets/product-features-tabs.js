import { Component } from '@theme/component';

/**
 * Product features tabs: clicking a tab swaps which panel (product image +
 * feature cards + CTA) is visible. No autoplay or slider behavior - this is
 * a plain, accessible tab switcher matching the four-formula layout.
 *
 * On desktop, feature cards sit in a CSS grid with the product image
 * spanning every row in the center column. Each card only knows its own
 * left/right column (set via a modifier class from the block's setting);
 * the row within that column can't be deduced from CSS alone, since Grid's
 * auto-placement cursor is shared across both columns and doesn't reliably
 * stack same-column siblings when they're interleaved with the image's
 * multi-row span. So the row is computed here, once per panel, and applied
 * as an inline custom property that the stylesheet reads for `grid-row`.
 *
 * @extends {Component}
 */
class ProductFeaturesTabsComponent extends Component {
  connectedCallback() {
    super.connectedCallback();
    this.#assignFeatureRows();
  }

  #assignFeatureRows() {
    for (const content of this.querySelectorAll('.product-features-tabs__content')) {
      const rowByColumn = { left: 0, right: 0 };

      for (const card of content.querySelectorAll('.product-features-tabs__feature-card')) {
        const column = card.classList.contains('product-features-tabs__feature-card--right') ? 'right' : 'left';
        rowByColumn[column] += 1;
        card.style.setProperty('--pft-feature-row', String(rowByColumn[column]));
      }
    }
  }

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
