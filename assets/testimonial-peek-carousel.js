import { Component } from '@theme/component';

/**
 * A "peek" testimonial carousel: fixed-width cards scroll natively (touch
 * swipe on mobile, wheel/trackpad, or the prev/next arrows on desktop),
 * with the next card always partially visible at the edge. Native scrolling
 * keeps it accessible and avoids duplicating browser scroll/snap behavior.
 *
 * @typedef {object} Refs
 * @property {HTMLElement} track - The scrollable row of testimonial cards.
 * @property {HTMLButtonElement} [prevButton] - The "previous" arrow button.
 * @property {HTMLButtonElement} [nextButton] - The "next" arrow button.
 *
 * @extends {Component<Refs>}
 */
class TestimonialPeekCarouselComponent extends Component {
  requiredRefs = ['track'];

  /** @type {IntersectionObserver | undefined} */
  #intersectionObserver;

  /** @type {number | undefined} */
  #autoplayTimer;

  /** @type {boolean} */
  #inView = false;

  connectedCallback() {
    super.connectedCallback();

    this.refs.track.addEventListener('scroll', this.#handleScroll, { passive: true });
    this.#updateNavState();

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
    this.refs.track.removeEventListener('scroll', this.#handleScroll);
    this.#intersectionObserver?.disconnect();
    this.#stopAutoplay();
  }

  /**
   * Declaratively bound to the "next" arrow via on:click="/next".
   */
  next() {
    this.#stopAutoplay();
    this.#scrollByCard(1);
  }

  /**
   * Declaratively bound to the "previous" arrow via on:click="/prev".
   */
  prev() {
    this.#stopAutoplay();
    this.#scrollByCard(-1);
  }

  /**
   * @param {1 | -1} direction
   */
  #scrollByCard(direction) {
    const { track } = this.refs;
    const card = track.firstElementChild;
    if (!(card instanceof HTMLElement)) return;

    const gap = parseFloat(getComputedStyle(track).columnGap || '0');
    track.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: 'smooth' });
  }

  #handleScroll = () => {
    this.#updateNavState();
  };

  #updateNavState() {
    const { track, prevButton, nextButton } = this.refs;
    const atStart = track.scrollLeft <= 4;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;

    if (prevButton) prevButton.disabled = atStart;
    if (nextButton) nextButton.disabled = atEnd;
  }

  #startAutoplay = () => {
    if (this.#autoplayTimer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const speed = Number(this.dataset.autoplaySpeed) || 5;

    this.#autoplayTimer = window.setInterval(() => {
      const { track } = this.refs;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;

      if (atEnd) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        this.#scrollByCard(1);
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

if (!customElements.get('testimonial-peek-carousel-component')) {
  customElements.define('testimonial-peek-carousel-component', TestimonialPeekCarouselComponent);
}
