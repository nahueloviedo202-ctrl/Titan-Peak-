import { Component } from '@theme/component';

/**
 * A multi-column carousel of before/after image pairs with optional category
 * filtering, arrow navigation, click-to-jump pagination dots and autoplay.
 *
 * Visible card count is derived from the rendered slide width (set via CSS
 * custom properties in the section schema), so it stays correct at any
 * breakpoint without hardcoded widths in JS.
 *
 * @typedef {object} Refs
 * @property {HTMLElement} track - The sliding track containing the slides.
 * @property {HTMLElement} wrapper - The overflow-hidden viewport around the track.
 * @property {HTMLElement[]} [slide] - Every before/after slide in the track.
 * @property {HTMLElement} [pagination] - Container the pagination dots are rendered into.
 * @property {HTMLButtonElement} [prevButton] - The "previous" arrow button.
 * @property {HTMLButtonElement} [nextButton] - The "next" arrow button.
 * @property {HTMLButtonElement[]} [filterButton] - Every category filter button.
 *
 * @extends {Component<Refs>}
 */
class BeforeAfterSliderComponent extends Component {
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

    this.#renderDots();
    this.#update();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#resizeObserver?.disconnect();
    this.#intersectionObserver?.disconnect();
    this.#stopAutoplay();
  }

  /**
   * Declaratively bound to the "next" arrow via on:click="/next".
   */
  next() {
    this.#stopAutoplay();
    this.#goTo(this.currentIndex + 1);
  }

  /**
   * Declaratively bound to the "previous" arrow via on:click="/prev".
   */
  prev() {
    this.#stopAutoplay();
    this.#goTo(this.currentIndex - 1);
  }

  /**
   * Declaratively bound to each filter button via on:click="/filter/{category}".
   *
   * @param {string} category - The category handle to show, or "all".
   */
  filter(category) {
    this.#stopAutoplay();

    for (const button of this.refs.filterButton ?? []) {
      const isActive = button.dataset.category === category;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    }

    for (const slide of this.#slides) {
      slide.hidden = category !== 'all' && slide.dataset.category !== category;
    }

    this.currentIndex = 0;
    this.#renderDots();
    this.#update();
    this.#resumeAutoplay();
  }

  get #slides() {
    return this.refs.slide ?? [];
  }

  get #visibleSlides() {
    return this.#slides.filter((slide) => !slide.hidden);
  }

  get #gap() {
    return parseFloat(getComputedStyle(this.refs.track).columnGap || '0');
  }

  get #maxIndex() {
    const [firstSlide] = this.#visibleSlides;
    if (!firstSlide) return 0;

    const slideWidth = firstSlide.getBoundingClientRect().width + this.#gap;
    if (slideWidth <= 0) return 0;

    const visibleCount = Math.max(1, Math.round(this.refs.wrapper.clientWidth / slideWidth));

    return Math.max(0, this.#visibleSlides.length - visibleCount);
  }

  /**
   * @param {number} index
   */
  #goTo(index) {
    this.currentIndex = Math.min(Math.max(index, 0), this.#maxIndex);
    this.#update();
  }

  #update() {
    const { track, prevButton, nextButton, dot } = this.refs;
    const slides = this.#visibleSlides;
    const [firstSlide] = slides;
    const maxIndex = this.#maxIndex;

    this.currentIndex = Math.min(this.currentIndex, maxIndex);

    track.style.transform = firstSlide
      ? `translateX(-${this.currentIndex * (firstSlide.getBoundingClientRect().width + this.#gap)}px)`
      : 'translateX(0)';

    if (prevButton) prevButton.disabled = this.currentIndex <= 0;
    if (nextButton) nextButton.disabled = this.currentIndex >= maxIndex;

    (dot ?? []).forEach((button, index) => {
      button.classList.toggle('is-active', index === this.currentIndex);
      button.setAttribute('aria-selected', String(index === this.currentIndex));
    });
  }

  #renderDots() {
    const { pagination } = this.refs;
    if (!pagination) return;

    pagination.replaceChildren();

    this.#visibleSlides.forEach((_slide, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'before-after__dot';
      button.setAttribute('ref', 'dot[]');
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-label', `${index + 1}`);
      button.addEventListener('click', () => {
        this.#stopAutoplay();
        this.#goTo(index);
      });
      pagination.append(button);
    });

    // Dots are injected after the initial ref scan, so force a re-scan now
    // instead of waiting for the deferred MutationObserver to pick them up.
    this.updatedCallback();
  }

  #startAutoplay = () => {
    if (this.#autoplayTimer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (this.#visibleSlides.length <= 1) return;

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

if (!customElements.get('before-after-slider-component')) {
  customElements.define('before-after-slider-component', BeforeAfterSliderComponent);
}
