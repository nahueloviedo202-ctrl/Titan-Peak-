import { Component } from '@theme/component';

/**
 * A multi-column product carousel that slides a fixed number of cards at a
 * time on desktop (via a JS-driven translateX on the track) and becomes a
 * native touch-swipeable horizontal scroller on mobile (the track itself
 * scrolls, with CSS scroll-snap, like customer-reviews-tabs). Visible card
 * count is derived from the rendered card width (set via CSS custom
 * properties in the section schema), so it stays correct at any breakpoint
 * without hardcoded widths in JS.
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
    this.refs.track.addEventListener('scroll', this.#handleScroll);

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
    this.refs.track.removeEventListener('scroll', this.#handleScroll);
    this.#stopAutoplay();
  }

  /**
   * Declaratively bound to every "next" arrow via on:click="/next".
   */
  next() {
    this.#stopAutoplay();
    if (this.#isMobile) {
      this.#scrollByCard(1);
    } else {
      this.#goTo(this.currentIndex + 1);
    }
  }

  /**
   * Declaratively bound to every "previous" arrow via on:click="/prev".
   */
  prev() {
    this.#stopAutoplay();
    if (this.#isMobile) {
      this.#scrollByCard(-1);
    } else {
      this.#goTo(this.currentIndex - 1);
    }
  }

  /**
   * Below this breakpoint the track becomes a native horizontal scroller
   * (touch-swipeable, like customer-reviews-tabs) instead of a JS-driven
   * translateX slider.
   */
  get #isMobile() {
    return window.matchMedia('(max-width: 749px)').matches;
  }

  get #slides() {
    return Array.from(this.refs.track.children);
  }

  get #gap() {
    return parseFloat(getComputedStyle(this.refs.track).columnGap || '0');
  }

  get #slideStep() {
    const [firstSlide] = this.#slides;
    if (!firstSlide) return 0;
    return firstSlide.getBoundingClientRect().width + this.#gap;
  }

  get #maxIndex() {
    const slideWidth = this.#slideStep;
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

  /**
   * @param {1 | -1} direction
   */
  #scrollByCard(direction) {
    const step = this.#slideStep;
    if (step <= 0) return;
    this.refs.track.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  #update() {
    const { track, prevButton, nextButton } = this.refs;

    if (this.#isMobile) {
      track.style.transform = '';
      const maxScroll = track.scrollWidth - track.clientWidth;

      (prevButton || []).forEach((button) => {
        button.disabled = track.scrollLeft <= 4;
      });
      (nextButton || []).forEach((button) => {
        button.disabled = track.scrollLeft >= maxScroll - 4;
      });
      return;
    }

    const [firstSlide] = this.#slides;
    const maxIndex = this.#maxIndex;

    this.currentIndex = Math.min(this.currentIndex, maxIndex);

    if (firstSlide) {
      const offset = this.currentIndex * this.#slideStep;
      track.style.transform = `translateX(-${offset}px)`;
    }

    (prevButton || []).forEach((button) => {
      button.disabled = this.currentIndex <= 0;
    });
    (nextButton || []).forEach((button) => {
      button.disabled = this.currentIndex >= maxIndex;
    });
  }

  #handleScroll = () => {
    if (this.#isMobile) this.#update();
  };

  #startAutoplay = () => {
    if (this.#autoplayTimer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const speed = Number(this.dataset.autoplaySpeed) || 5;

    this.#autoplayTimer = window.setInterval(() => {
      if (this.#isMobile) {
        const { track } = this.refs;
        const maxScroll = track.scrollWidth - track.clientWidth;
        if (track.scrollLeft >= maxScroll - 4) {
          track.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          this.#scrollByCard(1);
        }
      } else {
        this.#goTo(this.currentIndex >= this.#maxIndex ? 0 : this.currentIndex + 1);
      }
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
