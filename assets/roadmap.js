import { Component } from '@theme/component';

/**
 * A vertical roadmap timeline: an accent line runs behind every step, and a
 * second "fill" line animates its height in sync with scroll position to
 * visually track progress through the milestones. Each step also fades in
 * as it enters the viewport and fades out as it leaves.
 *
 * Both effects are purely cosmetic and are skipped entirely when the
 * merchant disables them (`data-animate="false"`) or the visitor prefers
 * reduced motion.
 *
 * @typedef {object} Refs
 * @property {HTMLElement} [fill] - The line that grows to reflect scroll progress.
 * @property {HTMLElement[]} [step] - Every roadmap step in the timeline.
 *
 * @extends {Component<Refs>}
 */
class RoadmapComponent extends Component {
  /** @type {IntersectionObserver | undefined} */
  #intersectionObserver;

  /** @type {boolean} */
  #ticking = false;

  connectedCallback() {
    super.connectedCallback();

    if (this.dataset.animate === 'false' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    this.#intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.toggleAttribute('data-animate', !entry.isIntersecting);
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -100px 0px' }
    );

    for (const step of this.refs.step ?? []) {
      this.#intersectionObserver.observe(step);
    }

    window.addEventListener('scroll', this.#handleScroll, { passive: true });
    window.addEventListener('resize', this.#handleScroll, { passive: true });

    this.#updateFill();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#intersectionObserver?.disconnect();
    window.removeEventListener('scroll', this.#handleScroll);
    window.removeEventListener('resize', this.#handleScroll);
  }

  #handleScroll = () => {
    if (this.#ticking) return;
    this.#ticking = true;
    window.requestAnimationFrame(() => {
      this.#updateFill();
      this.#ticking = false;
    });
  };

  #updateFill() {
    const { fill } = this.refs;
    const steps = this.refs.step ?? [];
    const [lastStep] = steps.slice(-1);
    if (!fill || !lastStep) return;

    const sectionRect = this.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    if (sectionRect.bottom < 0 || sectionRect.top > viewportHeight) {
      fill.style.height = '0%';
      return;
    }

    const lastStepBottom = lastStep.getBoundingClientRect().bottom;
    const visibleTop = Math.max(0, -sectionRect.top);
    const itemsHeight = lastStepBottom - sectionRect.top;
    const progress = itemsHeight > 0 ? Math.min(1, visibleTop / (itemsHeight * 0.8)) : 0;

    fill.style.height = `${Math.max(0, Math.min(1, progress)) * 100}%`;
  }
}

if (!customElements.get('roadmap-component')) {
  customElements.define('roadmap-component', RoadmapComponent);
}
