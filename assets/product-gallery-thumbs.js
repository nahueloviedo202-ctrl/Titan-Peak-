import { Component } from '@theme/component';
import { StandardEvents } from '@shopify/events';

/**
 * A product media viewer with a single primary slide, overlaid prev/next
 * navigation, and a thumbnail strip. Only the active slide is visible
 * (`display: none` on the rest), so offscreen media never loads until it
 * becomes active.
 *
 * Boolean attributes:
 * - `loop`  - wrap around instead of stopping at the first/last slide.
 * - `swipe` - enable pointer/touch swiping on the main viewer.
 *
 * @typedef {object} Refs
 * @property {HTMLElement} viewer
 * @property {HTMLElement[]} [slides]
 * @property {HTMLElement[]} [thumbs]
 * @property {HTMLElement} [thumbsList]
 * @property {HTMLButtonElement} [prevButton]
 * @property {HTMLButtonElement} [nextButton]
 *
 * @extends Component<Refs>
 */
class ProductGalleryThumbs extends Component {
  requiredRefs = ['viewer'];

  connectedCallback() {
    super.connectedCallback();

    const activeSlide = (this.refs.slides ?? []).find((slide) => slide.classList.contains('is-active'));
    this.currentIndex = activeSlide ? Number(activeSlide.dataset.index) : 0;

    const { signal } = this.#controller;
    const section = this.closest('.shopify-section, dialog');
    section?.addEventListener(StandardEvents.productSelect, this.#handleProductSelect, { signal });
  }

  #controller = new AbortController();

  disconnectedCallback() {
    this.#controller.abort();
  }

  /** @param {number} index */
  goToSlide(index) {
    const slides = this.refs.slides ?? [];
    const count = slides.length;
    if (count === 0) return;

    index = this.hasAttribute('loop') ? (index + count) % count : Math.max(0, Math.min(index, count - 1));

    if (index === this.currentIndex) return;

    this.currentIndex = index;
    this.#render();
  }

  prev() {
    this.goToSlide(this.currentIndex - 1);
  }

  next() {
    this.goToSlide(this.currentIndex + 1);
  }

  /** @param {KeyboardEvent} event */
  handleKeydown(event) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    }
  }

  /** @param {PointerEvent} event */
  handleSwipeStart(event) {
    if (!this.hasAttribute('swipe') || event.pointerType === 'mouse') return;
    if (event.target instanceof Element && event.target.closest('button')) return;

    const startX = event.clientX;

    /** @param {PointerEvent} upEvent */
    const onPointerUp = (upEvent) => {
      const distance = upEvent.clientX - startX;
      if (Math.abs(distance) < 50) return;
      distance < 0 ? this.next() : this.prev();
    };

    document.addEventListener('pointerup', onPointerUp, { signal: this.#controller.signal, once: true });
  }

  #render() {
    const { slides = [], thumbs = [], thumbsList, prevButton, nextButton } = this.refs;

    slides.forEach((slide, index) => {
      const active = index === this.currentIndex;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });

    thumbs.forEach((thumb, index) => {
      const active = index === this.currentIndex;
      thumb.classList.toggle('is-active', active);
      thumb.setAttribute('aria-current', String(active));
    });

    const activeThumb = thumbs[this.currentIndex];
    if (activeThumb && thumbsList) {
      thumbsList.scrollTo({
        left: activeThumb.offsetLeft - thumbsList.clientWidth / 2 + activeThumb.offsetWidth / 2,
        behavior: 'smooth',
      });
    }

    if (!this.hasAttribute('loop')) {
      if (prevButton) prevButton.disabled = this.currentIndex === 0;
      if (nextButton) nextButton.disabled = this.currentIndex === slides.length - 1;
    }
  }

  /** @param {Event & {promise?: Promise<{detail?: {html?: ParentNode}}>}} event */
  #handleProductSelect = (event) => {
    if (!(event.target instanceof Element) || event.target.closest('product-card')) return;

    event.promise
      ?.then((result) => {
        const html = result?.detail?.html;
        if (!html) return;

        const updated = html.querySelector('product-gallery-thumbs');
        if (updated) this.replaceWith(updated);
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') console.warn('[product-gallery-thumbs] Event promise rejected:', error);
      });
  };
}

if (!customElements.get('product-gallery-thumbs')) {
  customElements.define('product-gallery-thumbs', ProductGalleryThumbs);
}
