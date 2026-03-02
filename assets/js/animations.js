/* ============================================================
   animations.js — Cinematic scroll reveal + smooth parallax
   ============================================================ */

/* ------------------------------------------------------------------
   1. SCROLL REVEAL — IntersectionObserver
   ------------------------------------------------------------------ */
(function initScrollReveal() {
    function tagRevealElements() {
        // Philosophy header
        const philHeader = document.querySelector('#philosophy .text-center');
        if (philHeader) philHeader.classList.add('reveal-up');

        // Value cards — staggered, generous gaps
        document.querySelectorAll('#philosophy .grid > div').forEach((el, i) => {
            el.classList.add('reveal-up');
            el.style.transitionDelay = `${i * 0.18}s`;
        });

        // Split panel — directional reveals
        const splitPanel = document.querySelector('#philosophy .flex-col.lg\\:flex-row');
        if (splitPanel) {
            const [left, right] = splitPanel.children;
            if (left) left.classList.add('reveal-left');
            if (right) right.classList.add('reveal-right');
        }

        // Membership section
        document.querySelectorAll('#membership .flex-col > div, #membership .flex-col > .flex').forEach((el, i) => {
            el.classList.add('reveal-up');
            el.style.transitionDelay = `${i * 0.2}s`;
        });

        // Footer columns
        document.querySelectorAll('footer .grid > div').forEach((el, i) => {
            el.classList.add('reveal-up');
            el.style.transitionDelay = `${i * 0.12}s`;
        });
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    function observeAll() {
        document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
            observer.observe(el);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { tagRevealElements(); observeAll(); });
    } else {
        tagRevealElements();
        observeAll();
    }
}());

/* ------------------------------------------------------------------
   2. SMOOTH PARALLAX — lerp-based glide so it never snaps
   ------------------------------------------------------------------ */
(function initParallax() {
    // Skip on mobile — iOS won't benefit and it can interfere with scroll
    if (window.matchMedia('(max-width: 768px)').matches) return;

    const heroContent = document.querySelector('#home .z-10');
    if (!heroContent) return;

    // GPU hint so the browser composites this layer independently
    heroContent.style.willChange = 'transform';

    let currentShift = 0;   // what's currently rendered
    let targetShift = 0;   // where we want to be
    let rafId = null;

    const LERP_FACTOR = 0.07;  // lower = slower / smoother glide
    const MAX_SHIFT = 55;    // px cap

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function tick() {
        targetShift = Math.min(window.scrollY * 0.22, MAX_SHIFT);
        currentShift = lerp(currentShift, targetShift, LERP_FACTOR);

        heroContent.style.transform = `translateY(-${currentShift.toFixed(2)}px)`;

        // Keep animating until we're close enough to stop
        if (Math.abs(targetShift - currentShift) > 0.05) {
            rafId = requestAnimationFrame(tick);
        } else {
            rafId = null;
        }
    }

    window.addEventListener('scroll', () => {
        if (!rafId) rafId = requestAnimationFrame(tick);
    }, { passive: true });
}());
