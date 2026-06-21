// Progressive-enhancement layer powered by Motion (https://motion.dev — the
// vanilla-JS successor to Framer Motion, built by the same author).
// Everything here is purely additive: if the CDN import fails, every element
// this script touches is already fully visible and functional from plain
// HTML/CSS alone (see index.html / style.css / main.js), so the page never
// depends on this script to look or work correctly.

function ready(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

(async () => {
  let Motion;
  try {
    Motion = await import('https://cdn.jsdelivr.net/npm/motion@11/+esm');
  } catch (err) {
    return; // offline or CDN unreachable — page already works without it
  }
  const { animate, stagger, scroll } = Motion;

  ready(() => {
    initHeroIntro(animate, stagger);
    initFaqAccordion(animate);
    initParallax(scroll);
    initPressFX(animate);
  });
})();

// Stagger the hero copy in on first paint, then scale/fade the orb in behind it.
function initHeroIntro(animate, stagger) {
  const items = document.querySelectorAll('.hero-inner > *');
  if (!items.length) return;
  animate(
    items,
    { opacity: [0, 1], y: [22, 0] },
    { duration: 0.7, delay: stagger(0.12), easing: [0.22, 1, 0.36, 1] }
  );
  const orb = document.getElementById('orb-stage');
  if (orb) {
    animate(
      orb,
      { opacity: [0, 1], scale: [0.88, 1] },
      { duration: 0.9, delay: 0.45, easing: [0.16, 1, 0.3, 1] }
    );
  }
}

// Smooth, spring-eased expand/collapse for the FAQ <details> accordion.
// Falls back to the browser's native instant toggle if this never runs.
function initFaqAccordion(animate) {
  document.querySelectorAll('.faq-item').forEach((item) => {
    const summary = item.querySelector('summary');
    const panel = item.querySelector('.faq-panel');
    if (!summary || !panel) return;
    let animating = false;

    summary.addEventListener('click', (e) => {
      e.preventDefault();
      if (animating) return;
      animating = true;

      if (item.hasAttribute('open')) {
        const h = panel.offsetHeight;
        animate(panel, { height: [h, 0], opacity: [1, 0] }, { duration: 0.28, easing: [0.4, 0, 0.2, 1] })
          .finished.then(() => {
            item.removeAttribute('open');
            panel.style.height = '';
            animating = false;
          });
      } else {
        item.setAttribute('open', '');
        const h = panel.scrollHeight;
        animate(panel, { height: [0, h], opacity: [0, 1] }, { duration: 0.34, easing: [0.16, 1, 0.3, 1] })
          .finished.then(() => {
            panel.style.height = '';
            animating = false;
          });
      }
    });
  });
}

// Subtle scroll-linked drift on the hero grain texture and gallery slides.
function initParallax(scroll) {
  const grain = document.querySelector('.hero-grain');
  if (grain) {
    scroll((progress) => {
      grain.style.transform = `translateY(${progress * 120}px)`;
    }, { target: document.querySelector('.hero') });
  }

  document.querySelectorAll('.gallery-slide img').forEach((img) => {
    scroll((progress) => {
      img.style.transform = `translateY(${(progress - 0.5) * 24}px) scale(1.08)`;
    }, { target: img.closest('.gallery-slide'), offset: ['start end', 'end start'] });
  });
}

// Tactile press feedback for controls that don't already have a CSS
// transform-based hover (avoids fighting the existing .btn/.tile hover lift).
function initPressFX(animate) {
  const pressables = document.querySelectorAll('.gallery-nav button, .form-submit, .mstat, .faq-item summary');
  pressables.forEach((el) => {
    el.addEventListener('pointerdown', () => animate(el, { scale: 0.95 }, { duration: 0.15 }));
    const release = () => animate(el, { scale: 1 }, { duration: 0.3, easing: [0.34, 1.56, 0.64, 1] });
    el.addEventListener('pointerup', release);
    el.addEventListener('pointerleave', release);
  });
}
