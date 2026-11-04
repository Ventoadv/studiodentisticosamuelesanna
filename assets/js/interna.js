/* Studio Dentistico Dott. Samuele Sanna — pagine interne
   Si carica dopo main.js (header, menu, widget, CTA e zig-zag sono gestiti lì).
   Qui: indice della pagina, linea del percorso, schema dell'impianto e ingresso dell'hero. */

(function () {
  "use strict";

  const root = document.documentElement;

  /* ---------- Indice: evidenzia la sezione in vista ---------- */
  const tocLinks = Array.from(document.querySelectorAll(".page-toc a"));
  const sections = tocLinks.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if (sections.length) {
    const setActive = id => tocLinks.forEach(a => {
      const on = a.getAttribute("href") === "#" + id;
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(s => io.observe(s));
  }

  /* ---------- Percorso: la linea si riempie e i punti si accendono ---------- */
  const timeline = document.querySelector(".timeline");
  const steps = timeline ? Array.from(timeline.querySelectorAll(".step")) : [];
  function updateTimeline() {
    if (!timeline) return;
    const r = timeline.getBoundingClientRect();
    const mid = window.innerHeight * .6;
    const p = Math.max(0, Math.min(1, (mid - r.top) / r.height));
    timeline.style.setProperty("--line", p.toFixed(3));
    steps.forEach(s => s.classList.toggle("is-reached", s.getBoundingClientRect().top + 8 < mid));
  }
  window.addEventListener("scroll", updateTimeline, { passive: true });
  window.addEventListener("resize", updateTimeline);
  updateTimeline();

  /* ---------- Animazioni GSAP (rispettano "Ferma le animazioni" e prefers-reduced-motion) ---------- */
  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);
  let mm = null;
  let introPlayed = false;

  function setup() {
    if (mm) mm.revert();
    mm = null;
    if (root.classList.contains("a11y-motion")) return;
    mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Ingresso dell'hero, solo al primo caricamento
      if (!introPlayed) {
        introPlayed = true;
        gsap.timeline({ defaults: { ease: "power3.out" } })
          .from(".page-hero-mark", { opacity: 0, rotate: -8, scale: .92, duration: 2 }, 0)
          .from(".breadcrumb, .page-hero .eyebrow", { opacity: 0, y: 16, duration: .7, stagger: .08 }, .15)
          .from(".page-title", { opacity: 0, y: 40, duration: 1 }, .3)
          .from(".page-lead", { opacity: 0, y: 20, duration: .8 }, .55)
          .from(".page-hero .hero-ctas .btn", { opacity: 0, y: 14, duration: .7, stagger: .08 }, .7)
          .from(".page-hero-media", { opacity: 0, y: 50, scale: .97, duration: 1.3 }, .35)
          .from(".page-hero .info-item", { opacity: 0, duration: .8, stagger: .08 }, .9);
      }

      // Parallax leggero del simbolo e della foto nell'hero
      const heroScrub = { trigger: ".page-hero", start: "top top", end: "bottom top", scrub: true };
      gsap.to(".page-hero-mark", { rotate: 18, y: () => window.innerHeight * .3, ease: "none", scrollTrigger: heroScrub });
      gsap.to(".page-hero-media", { yPercent: 10, ease: "none", scrollTrigger: heroScrub });

      // Schema dell'impianto: i pezzi si montano dal basso verso l'alto
      const d = ".implant-diagram";
      gsap.timeline({ scrollTrigger: { trigger: d, start: "top 75%", once: true }, defaults: { ease: "power3.out" } })
        .from(d + " .d-bone, " + d + " .d-gum", { opacity: 0, y: 20, duration: .7, stagger: .1 })
        .from(d + " .d-implant", { y: -90, opacity: 0, duration: .9 }, "-=.2")
        .from(d + " .d-abutment", { y: -50, opacity: 0, duration: .6 }, "-=.3")
        .from(d + " .d-crown", { y: -60, opacity: 0, duration: .8 }, "-=.2")
        .from(d + " .d-labels > *", { opacity: 0, duration: .4, stagger: .05 }, "-=.3")
        .from(".diagram-legend li", { opacity: 0, x: 16, duration: .5, stagger: .12 }, "<");

      // Card e blocchi: entrano in sequenza quando arrivano in vista
      [".solution-card", ".surgery-list li", ".tech-card", ".case-card", ".faq-item"].forEach(sel => {
        ScrollTrigger.batch(sel, {
          start: "top 88%", once: true,
          onEnter: els => gsap.from(els, { opacity: 0, y: 36, duration: .8, stagger: .1, ease: "power3.out" })
        });
      });
      gsap.utils.toArray(".step").forEach(step => {
        const even = steps.indexOf(step) % 2 === 1;
        gsap.from(step, {
          opacity: 0, x: window.innerWidth > 760 ? (even ? 40 : -40) : 0, y: 20, duration: .8, ease: "power3.out",
          scrollTrigger: { trigger: step, start: "top 85%", once: true }
        });
      });

      gsap.fromTo(".tech-mark", { rotate: -12, y: 80 }, { rotate: 8, y: -80, ease: "none", scrollTrigger: { trigger: ".tech", start: "top bottom", end: "bottom top", scrub: true } });
    });
  }
  setup();

  // Il widget di accessibilità cambia le classi su <html>: rifacciamo le animazioni quando cambia "Ferma le animazioni"
  let motionOff = root.classList.contains("a11y-motion");
  new MutationObserver(() => {
    const now = root.classList.contains("a11y-motion");
    if (now !== motionOff) { motionOff = now; setup(); }
  }).observe(root, { attributes: true, attributeFilter: ["class"] });
})();
