import { Component } from '@theme/component';

/**
 * A multi-column product carousel that slides a fixed number of cards at a
 * time. Visible card count is derived from the rendered card width (set via
 * CSS custom properties in the section schema), so it stays correct at any
 * breakpoint without hardcoded widths in JS.
 *
 * The section renders two identical sets of prev/next buttons (one shown on
 * desktop above the track, one shown on mobile below it); both sets use
 * `ref="prevButton[]"` / `ref="nextButton[]"` so they are collected into
 * arrays and kept in sync together.
 *
 * @typedef {object} Refs
 * @property {HTMLElement} track - The sliding track containing the cards.
 * @property {HTMLElement} wrapper - The overflow-hidden viewport around the track.
 * @property {HTMLButtonElement[]} [prevButton] - The "previous" arrow buttons.
 * @property {HTMLButtonElement[]} [nextButton] - The "next" arrow buttons.
 *
 * @extends {Component<Refs>}
 */
class ProductsCarouselComponent extends Component {
  requiredRefs = ['track', 'wrapper'];

  /** @type {ResizeObserver | undefined} */
  #resizeObserver;

  /** @type {IntersectionObserver | undefined} */
  #intersectionObserver;

  /** @type {number | undefined} */
  #autoplayTimer;

  /** @type {boolean} */
  #inView = false;

  /** @type {number} */
  currentIndex = 0;

  connectedCallback() {
    super.connectedCallback();

    this.#resizeObserver = new ResizeObserver(() => this.#update());
    this.#resizeObserver.observe(this.refs.wrapper);

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

    this.#update();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#resizeObserver?.disconnect();
    this.#intersectionObserver?.disconnect();
    this.#stopAutoplay();
  }

  /**
   * Declaratively bound to every "next" arrow via on:click="/next".
   */
  next() {
    this.#stopAutoplay();
    this.#goTo(this.currentIndex + 1);
  }

  /**
   * Declaratively bound to every "previous" arrow via on:click="/prev".
   */
  prev() {
    this.#stopAutoplay();
    this.#goTo(this.currentIndex - 1);
  }

  get #slides() {
    return Array.from(this.refs.track.children);
  }

  get #gap() {
    return parseFloat(getComputedStyle(this.refs.track).columnGap || '0');
  }

  get #maxIndex() {
    const [firstSlide] = this.#slides;
    if (!firstSlide) return 0;

    const slideWidth = firstSlide.getBoundingClientRect().width + this.#gap;
    if (slideWidth <= 0) return 0;

    const visibleCount = Math.max(1, Math.round(this.refs.wrapper.clientWidth / slideWidth));

    return Math.max(0, this.#slides.length - visibleCount);
  }

  /**
   * @param {number} index
   */
  #goTo(index) {
    this.currentIndex = Math.min(Math.max(index, 0), this.#maxIndex);
    this.#update();
  }

  #update() {
    const { track, prevButton, nextButton } = this.refs;
    const [firstSlide] = this.#slides;
    const maxIndex = this.#maxIndex;

    this.currentIndex = Math.min(this.currentIndex, maxIndex);

    if (firstSlide) {
      const offset = this.currentIndex * (firstSlide.getBoundingClientRect().width + this.#gap);
      track.style.transform = `translateX(-${offset}px)`;
    }

    (prevButton || []).forEach((button) => {
      button.disabled = this.currentIndex <= 0;
    });
    (nextButton || []).forEach((button) => {
      button.disabled = this.currentIndex >= maxIndex;
    });
  }

  #startAutoplay = () => {
    if (this.#autoplayTimer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const speed = Number(this.dataset.autoplaySpeed) || 5;

    this.#autoplayTimer = window.setInterval(() => {
      this.#goTo(this.currentIndex >= this.#maxIndex ? 0 : this.currentIndex + 1);
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

if (!customElements.get('products-carousel-component')) {
  customElements.define('products-carousel-component', ProductsCarouselComponent);
}
