import { Component } from '@theme/component';

/**
 * A single-slide-at-a-time expert testimonial carousel. Exactly one
 * `.expert-carousel-item` is visible (the rest carry the native `hidden`
 * attribute); prev/next buttons step through them one at a time and disable
 * at the start/end (no looping), unless autoplay is enabled, in which case
 * it wraps back to the first slide.
 *
 * @typedef {object} Refs
 * @property {HTMLElement[]} items - Every expert slide (photo + quote).
 * @property {HTMLButtonElement} [prevButton] - The "previous" arrow button.
 * @property {HTMLButtonElement} [nextButton] - The "next" arrow button.
 *
 * @extends {Component<Refs>}
 */
class ExpertCarouselComponent extends Component {
  requiredRefs = ['items'];

  /** @type {number | undefined} */
  #autoplayTimer;

  /** @type {IntersectionObserver | undefined} */
  #intersectionObserver;

  /** @type {boolean} */
  #inView = false;

  /** @type {number} */
  currentIndex = 0;

  connectedCallback() {
    super.connectedCallback();

    this.#updateButtons();

    if (this.dataset.autoplay === 'true') {
      this.#intersectionObserver = new IntersectionObserver(([entry]) => {
        this.#inView = !!entry?.isIntersecting;
        if (this.#inView) {
          this.#startAutoplay();
        } else {
          this.#stopAutoplay();
        }
      });
      this.#intersectionObserver.observe(this);

      this.addEventListener('pointerenter', this.#stopAutoplay);
      this.addEventListener('pointerleave', this.#resumeAutoplay);
      this.addEventListener('focusin', this.#stopAutoplay);
      this.addEventListener('focusout', this.#resumeAutoplay);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#intersectionObserver?.disconnect();
    this.#stopAutoplay();
  }

  /**
   * Declaratively bound to the "next" arrow via on:click="/next".
   */
  next() {
    this.#stopAutoplay();
    if (this.currentIndex < this.refs.items.length - 1) {
      this.#goTo(this.currentIndex + 1);
    }
  }

  /**
   * Declaratively bound to the "previous" arrow via on:click="/prev".
   */
  prev() {
    this.#stopAutoplay();
    if (this.currentIndex > 0) {
      this.#goTo(this.currentIndex - 1);
    }
  }

  /**
   * @param {number} index
   */
  #goTo(index) {
    const { items } = this.refs;
    items[this.currentIndex]?.setAttribute('hidden', '');
    this.currentIndex = index;
    items[this.currentIndex]?.removeAttribute('hidden');
    this.#updateButtons();
  }

  #updateButtons() {
    const { items, prevButton, nextButton } = this.refs;
    const isFirst = this.currentIndex === 0;
    const isLast = this.currentIndex === items.length - 1;

    if (prevButton) {
      prevButton.classList.toggle('expert-carousel__btn--disabled', isFirst);
      prevButton.setAttribute('aria-disabled', String(isFirst));
    }

    if (nextButton) {
      nextButton.classList.toggle('expert-carousel__btn--disabled', isLast);
      nextButton.setAttribute('aria-disabled', String(isLast));
    }
  }

  #startAutoplay = () => {
    if (this.#autoplayTimer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (this.refs.items.length <= 1) return;

    const speed = Number(this.dataset.autoplaySpeed) || 5;

    this.#autoplayTimer = window.setInterval(() => {
      const nextIndex = this.currentIndex >= this.refs.items.length - 1 ? 0 : this.currentIndex + 1;
      this.#goTo(nextIndex);
    }, speed * 1000);
  };

  #stopAutoplay = () => {
    if (this.#autoplayTimer) {
      window.clearInterval(this.#autoplayTimer);
      this.#autoplayTimer = undefined;
    }
  };

  #resumeAutoplay = () => {
    if (this.#inView) this.#startAutoplay();
  };
}

if (!customElements.get('expert-carousel-component')) {
  customElements.define('expert-carousel-component', ExpertCarouselComponent);
}
