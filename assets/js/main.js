/* Studio Dentistico Dott. Samuele Sanna — homepage
   Dipendenze: GSAP 3 + ScrollTrigger (cdnjs). Il sito resta usabile anche se GSAP non si carica. */

(function () {
  "use strict";

  const root = document.documentElement;
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage non disponibile */ } }
  };

  /* ---------- Header: sfondo pieno dopo l'hero, menu mobile, sottomenu ---------- */
  const header = document.querySelector(".site-header");
  const hero = document.querySelector(".hero");
  const menuToggle = document.querySelector(".menu-toggle");
  const subItems = document.querySelectorAll(".has-sub");

  function updateHeader() {
    const limit = hero ? hero.offsetHeight - header.offsetHeight - 40 : 40;
    header.classList.toggle("is-solid", window.scrollY > Math.min(limit, 120));
  }
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  function setMenu(open) {
    header.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.querySelector(".visually-hidden").textContent = open ? "Chiudi il menu" : "Apri il menu";
    document.body.style.overflow = open ? "hidden" : "";
  }
  menuToggle.addEventListener("click", () => setMenu(menuToggle.getAttribute("aria-expanded") !== "true"));
  document.querySelectorAll(".main-nav a").forEach(a => a.addEventListener("click", () => setMenu(false)));

  subItems.forEach(item => {
    const btn = item.querySelector(".sub-toggle");
    const set = open => { item.classList.toggle("is-open", open); btn.setAttribute("aria-expanded", String(open)); };
    btn.addEventListener("click", () => set(btn.getAttribute("aria-expanded") !== "true"));
    const desktop = window.matchMedia("(min-width: 1400px)");
    item.addEventListener("mouseenter", () => desktop.matches && set(true));
    item.addEventListener("mouseleave", () => desktop.matches && set(false));
    item.addEventListener("focusout", e => { if (!item.contains(e.relatedTarget)) set(false); });
  });

  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    subItems.forEach(i => { i.classList.remove("is-open"); i.querySelector(".sub-toggle").setAttribute("aria-expanded", "false"); });
    if (header.classList.contains("menu-open")) { setMenu(false); menuToggle.focus(); }
    closePanel("a11y"); closePanel("chat");
  });

  /* ---------- Carosello servizi ---------- */
  const track = document.querySelector(".carousel-track");
  const prevNext = document.querySelectorAll(".carousel-btn");
  const bar = document.querySelector(".carousel-progress span");

  function cardStep() {
    const card = track.querySelector(".service-card:not(.service-card--main)") || track.firstElementChild;
    return card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 20);
  }
  function updateCarousel() {
    if (!track) return; // pagine senza carosello
    const max = track.scrollWidth - track.clientWidth;
    const ratio = max > 0 ? track.scrollLeft / max : 1;
    const visible = track.clientWidth / track.scrollWidth;
    bar.style.transform = "scaleX(" + Math.min(1, visible + ratio * (1 - visible)).toFixed(3) + ")";
    prevNext[0].disabled = track.scrollLeft <= 2;
    prevNext[1].disabled = track.scrollLeft >= max - 2;
  }
  // Con lo scroll orizzontale GSAP attivo (desktop) il carosello si muove con lo scroll della pagina
  let hscroll = null; // { st: ScrollTrigger, max: px }
  function hscrollGoTo(x) {
    const { st, max } = hscroll;
    const y = st.start + Math.max(0, Math.min(max, x)) / max * (st.end - st.start);
    window.scrollTo({ top: y, behavior: root.classList.contains("a11y-motion") ? "auto" : "smooth" });
  }
  if (track) {
  prevNext.forEach(btn => btn.addEventListener("click", () => {
    if (hscroll) { hscrollGoTo(hscroll.st.progress * hscroll.max + Number(btn.dataset.dir) * cardStep()); return; }
    track.scrollBy({ left: Number(btn.dataset.dir) * cardStep(), behavior: root.classList.contains("a11y-motion") ? "auto" : "smooth" });
  }));
  track.addEventListener("scroll", updateCarousel, { passive: true });
  window.addEventListener("resize", updateCarousel);
  track.addEventListener("keydown", e => {
    if (e.target !== track) return;
    if (e.key === "ArrowRight") { e.preventDefault(); prevNext[1].click(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); prevNext[0].click(); }
  });
  updateCarousel();

  // Da tastiera: la card che riceve il focus viene portata in vista anche nella modalità bloccata
  track.addEventListener("focusin", e => {
    if (!hscroll) return;
    const card = e.target.closest(".service-card");
    if (card) hscrollGoTo(card.offsetLeft - track.firstElementChild.offsetLeft);
  });

  // Trascinamento con il mouse (su touch lo scroll nativo basta)
  let drag = null;
  track.addEventListener("pointerdown", e => {
    if (hscroll || e.pointerType !== "mouse" || e.button !== 0) return;
    drag = { x: e.clientX, left: track.scrollLeft, moved: false };
  });
  window.addEventListener("pointermove", e => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 5) { drag.moved = true; track.classList.add("is-dragging"); }
    if (drag.moved) track.scrollLeft = drag.left - dx;
  });
  window.addEventListener("pointerup", () => {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    if (!moved) return;
    // riattiva lo snap partendo dalla card più vicina
    const step = cardStep();
    const target = Math.round(track.scrollLeft / step) * step;
    track.classList.remove("is-dragging");
    track.scrollTo({ left: target, behavior: "smooth" });
    track.addEventListener("click", ev => ev.preventDefault(), { once: true, capture: true });
  });
  } // fine carosello

  /* ---------- Recensioni: carosello con frecce (scroll nativo con snap) ---------- */
  const revTrack = document.getElementById("reviews-track");
  if (revTrack) {
    const revBtns = document.querySelectorAll(".reviews-btn");
    const revUpdate = () => {
      const max = revTrack.scrollWidth - revTrack.clientWidth;
      revBtns[0].disabled = revTrack.scrollLeft <= 2;
      revBtns[1].disabled = revTrack.scrollLeft >= max - 2;
    };
    revBtns.forEach(btn => btn.addEventListener("click", () => {
      const card = revTrack.querySelector(".review-card");
      const step = card.getBoundingClientRect().width + parseFloat(getComputedStyle(revTrack).columnGap || 20);
      revTrack.scrollBy({ left: Number(btn.dataset.dir) * step, behavior: root.classList.contains("a11y-motion") ? "auto" : "smooth" });
    }));
    revTrack.addEventListener("scroll", revUpdate, { passive: true });
    window.addEventListener("resize", revUpdate);
    revTrack.addEventListener("keydown", e => {
      if (e.target !== revTrack) return;
      if (e.key === "ArrowRight") { e.preventDefault(); revBtns[1].click(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); revBtns[0].click(); }
    });
    revUpdate();
  }

  /* ---------- Servizi: pannelli espandibili (mouse, tastiera e tocco) ---------- */
  const svcPanels = document.querySelectorAll(".svc-panel");
  const activate = panel => svcPanels.forEach(p => p.classList.toggle("is-active", p === panel));
  svcPanels.forEach(panel => {
    panel.addEventListener("mouseenter", () => activate(panel));
    panel.addEventListener("focusin", () => activate(panel));
    panel.addEventListener("click", () => activate(panel));
  });

  /* ---------- Video delle CTA: autoplay muto solo se in vista, con pausa ---------- */
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  document.querySelectorAll(".cta-video").forEach(section => {
    const video = section.querySelector("video");
    const toggle = section.querySelector(".video-toggle");
    const hasSource = video.querySelector("source") !== null;
    if (!hasSource) { toggle.hidden = true; return; } // placeholder: resta il poster
    let userPaused = reduceMotion.matches;
    const render = () => {
      toggle.setAttribute("aria-pressed", String(userPaused));
      toggle.textContent = userPaused ? "Riproduci il video" : "Metti in pausa il video";
    };
    toggle.addEventListener("click", () => {
      userPaused = !userPaused;
      userPaused ? video.pause() : video.play().catch(() => {});
      render();
    });
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !userPaused) video.play().catch(() => {});
      else video.pause();
    }, { threshold: .25 }).observe(section);
    render();
  });

  /* ---------- Pannelli: accessibilità e chatbot ---------- */
  const panels = {
    a11y: { btn: document.querySelector(".a11y-toggle"), panel: document.getElementById("a11y-panel") },
    chat: { btn: document.querySelector(".chat-toggle"), panel: document.getElementById("chat-panel") }
  };
  function openPanel(name) {
    Object.keys(panels).forEach(n => n !== name && closePanel(n));
    const p = panels[name];
    p.panel.hidden = false;
    p.btn.setAttribute("aria-expanded", "true");
    const first = p.panel.querySelector("button:not([disabled]), a, input:not([disabled])");
    if (first) first.focus();
    if (window.gsap && !root.classList.contains("a11y-motion") && !reduceMotion.matches) {
      gsap.fromTo(p.panel, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: .3, ease: "power2.out" });
    }
  }
  function closePanel(name) {
    const p = panels[name];
    if (p.panel.hidden) return;
    const hadFocus = p.panel.contains(document.activeElement);
    p.panel.hidden = true;
    p.btn.setAttribute("aria-expanded", "false");
    if (hadFocus) p.btn.focus();
  }
  Object.keys(panels).forEach(name => {
    panels[name].btn.addEventListener("click", () => panels[name].panel.hidden ? openPanel(name) : closePanel(name));
  });
  document.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => closePanel(b.dataset.close)));
  document.addEventListener("click", e => {
    Object.keys(panels).forEach(name => {
      const wrap = panels[name].btn.parentElement;
      if (!wrap.contains(e.target)) closePanel(name);
    });
  });

  /* Preferenze di accessibilità, ricordate nel browser */
  const prefs = Object.assign({ size: 0, contrast: false, links: false, spacing: false, motion: false }, store.get("sanna-a11y") || {});
  const sizeOut = document.getElementById("a11y-size-value");
  function applyPrefs() {
    root.style.setProperty("--text-scale", String(1 + prefs.size * 0.1));
    sizeOut.textContent = (100 + prefs.size * 10) + "%";
    ["contrast", "links", "spacing", "motion"].forEach(k => {
      root.classList.toggle("a11y-" + k, prefs[k]);
      document.querySelector('[data-a11y="' + k + '"]').setAttribute("aria-checked", String(prefs[k]));
    });
    if (typeof setupMotion === "function") setupMotion();
    store.set("sanna-a11y", prefs);
  }
  document.querySelectorAll("[data-a11y-size]").forEach(b => b.addEventListener("click", () => {
    prefs.size = Math.max(-1, Math.min(4, prefs.size + Number(b.dataset.a11ySize)));
    applyPrefs();
  }));
  document.querySelectorAll("[data-a11y]").forEach(b => b.addEventListener("click", () => {
    prefs[b.dataset.a11y] = !prefs[b.dataset.a11y];
    applyPrefs();
  }));
  document.querySelector("[data-a11y-reset]").addEventListener("click", () => {
    Object.assign(prefs, { size: 0, contrast: false, links: false, spacing: false, motion: false });
    applyPrefs();
  });
  applyPrefs();

  /* Chatbot segnaposto: risposte fisse finché non si collega il provider */
  const chatBody = document.querySelector(".chat-body");
  const replies = {
    "Come prenoto la prima visita?": "Puoi chiamare lo 351 510 1266 oppure lasciare i tuoi recapiti nella pagina Contatti: lo studio ti richiama per fissare l'appuntamento.",
    "Quali sono gli orari?": "Gli orari aggiornati sono nella pagina Contatti. Per sicurezza puoi chiamare lo 351 510 1266.",
    "Parla con una persona": "Certo. Chiama lo studio allo 351 510 1266: ti risponde una persona del team negli orari di apertura."
  };
  document.querySelectorAll(".chat-quick button").forEach(b => b.addEventListener("click", () => {
    const q = document.createElement("div");
    q.className = "msg msg-user"; q.textContent = b.textContent;
    const a = document.createElement("div");
    a.className = "msg msg-bot"; a.textContent = replies[b.textContent];
    chatBody.insertBefore(q, b.parentElement);
    chatBody.insertBefore(a, b.parentElement);
    chatBody.scrollTop = chatBody.scrollHeight;
  }));

  /* FAQ: apertura animata delle risposte (resta un <details> nativo, accessibile senza JS) */
  document.querySelectorAll(".faq-item").forEach(item => {
    const summary = item.querySelector("summary");
    const answer = item.querySelector(".faq-answer");
    // l'altezza della pagina cambia: ricalcola le posizioni delle animazioni allo scroll
    item.addEventListener("toggle", () => setTimeout(() => window.ScrollTrigger && ScrollTrigger.refresh(), 500));
    summary.addEventListener("click", e => {
      if (!window.gsap || prefs.motion || reduceMotion.matches) return;
      e.preventDefault();
      if (item.open) {
        gsap.to(answer, { height: 0, duration: .35, ease: "power2.inOut", onComplete: () => { item.open = false; answer.style.height = ""; } });
      } else {
        item.open = true;
        gsap.fromTo(answer, { height: 0 }, { height: "auto", duration: .45, ease: "power2.out", clearProps: "height" });
      }
    });
  });

  document.querySelectorAll("[data-cookie-prefs]").forEach(a => a.addEventListener("click", e => {
    e.preventDefault(); // da collegare al banner cookie (CMP) scelto
  }));

  /* ---------- Animazioni GSAP ---------- */
  var setupMotion; // usata da applyPrefs quando si attiva/disattiva "Ferma le animazioni"
  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);
  let mm = null;
  let introPlayed = false;

  setupMotion = function () {
    if (mm) mm.revert();
    mm = null;
    if (prefs.motion) { updateCarousel(); return; }
    mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // 1. Ingresso dell'hero, solo al primo caricamento
      // L'hero della home: le pagine interne hanno le loro animazioni (interna.js)
      if (hero && !introPlayed) {
        introPlayed = true;
        gsap.timeline({ defaults: { ease: "power3.out" } })
          .from(".hero-watermark", { opacity: 0, scale: .92, rotate: -6, duration: 2.2, ease: "power2.out" }, 0)
          .from(".hero-place", { opacity: 0, yPercent: 60, duration: .7 }, .2)
          .from(".hero-title .line > span", { yPercent: 105, duration: 1.1, stagger: .12 }, .3)
          .from(".hero-photo", { opacity: 0, y: 40, duration: 1.4 }, .35)
          .from(".hero-lead", { opacity: 0, yPercent: 15, duration: .8 }, .8)
          .from(".hero-ctas .btn", { opacity: 0, y: 14, duration: .7, stagger: .08 }, .95)
          .from(".info-item", { opacity: 0, duration: .8, stagger: .08 }, 1.1);
      }

      // 2. Parallax dell'hero a più piani: simbolo sullo sfondo, foto, e i blocchi di testo a velocità crescenti
      if (hero) {
      const heroScrub = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
      gsap.to(".hero-watermark", { rotate: 22, y: () => window.innerHeight * .45, scale: 1.15, ease: "none", scrollTrigger: heroScrub });
      gsap.to(".hero-photo", { yPercent: 22, scale: 1.04, ease: "none", scrollTrigger: heroScrub });
      [[".hero-place", -60], [".hero-title", -150], [".hero-lead", -230], [".hero-ctas", -300]].forEach(([sel, y]) => {
        gsap.to(sel, { y, ease: "none", scrollTrigger: heroScrub });
      });
      gsap.to(".hero-copy", { opacity: 0, ease: "power1.in", scrollTrigger: { trigger: ".hero", start: "top top", end: "70% top", scrub: true } });
      }

      // 3. CTA a tutta larghezza: video e simbolo scorrono in direzioni opposte, il testo resta centrato nella fascia
      gsap.utils.toArray(".cta-video").forEach(sec => {
        const scrub = { trigger: sec, start: "top bottom", end: "bottom top", scrub: true };
        const mark = sec.querySelector(".cta-mark");
        // con lo sfondo fisso il media non deve muoversi
        if (!sec.classList.contains("cta-video--fixed")) {
          gsap.fromTo(sec.querySelector(".cta-media"), { yPercent: -16, scale: 1.2 }, { yPercent: 16, scale: 1, ease: "none", scrollTrigger: scrub });
        }
        gsap.fromTo(mark, { y: 220, rotate: sec.classList.contains("cta-video--final") ? 18 : -18 }, { y: -220, rotate: 0, ease: "none", scrollTrigger: scrub });
        // l'overlay si schiarisce un poco quando la sezione è al centro dello schermo
        gsap.fromTo(sec.querySelector(".cta-overlay"), { opacity: .95 }, {
          opacity: .72, ease: "sine.inOut", yoyo: true, repeat: 1,
          scrollTrigger: scrub
        });
      });

      // Parallax anche al movimento del mouse, solo su schermi con puntatore
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const layers = [[".hero-watermark", 40], [".hero-photo", -18], [".cta-mark", 30]];
        const setters = layers.map(([sel, amt]) => gsap.utils.toArray(sel).map(el => ({
          x: gsap.quickTo(el, "xPercent", { duration: 1.2, ease: "power3.out" }), amt: amt / 10
        }))).flat();
        const onMove = e => {
          const dx = e.clientX / window.innerWidth - .5;
          setters.forEach(st => st.x(dx * st.amt));
        };
        window.addEventListener("pointermove", onMove);
        return () => window.removeEventListener("pointermove", onMove);
      }
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // 4. Zig-zag: l'immagine si apre dal lato del testo e il contenuto si avvicina mentre scorri (il testo resta centrato)
      gsap.utils.toArray(".zz").forEach(row => {
        const media = row.querySelector(".zz-media");
        const fromRight = row.classList.contains("zz--reverse");
        const scrub = { trigger: row, start: "top bottom", end: "bottom top", scrub: true };
        gsap.fromTo(media,
          { clipPath: fromRight ? "inset(0 0 0 100% round 18px)" : "inset(0 100% 0 0 round 18px)" },
          { clipPath: "inset(0 0% 0 0% round 18px)", duration: 1.3, ease: "power3.inOut",
            scrollTrigger: { trigger: row, start: "top 78%", once: true } });
        gsap.fromTo(media.firstElementChild, { scale: 1.18 }, { scale: 1, ease: "none", scrollTrigger: scrub });
      });
    });

    // 4b. Percorso del paziente: la linea oro si riempie mentre scorri i passaggi
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const steps = document.querySelector(".journey-steps");
      if (!steps) return;
      gsap.fromTo(steps, { "--journey-progress": 0 }, {
        "--journey-progress": 1, ease: "none",
        scrollTrigger: { trigger: steps, start: "top 70%", end: "bottom 60%", scrub: true }
      });
      gsap.utils.toArray(".journey-step").forEach(step => {
        gsap.from(step, { opacity: 0, x: 24, duration: .8, ease: "power3.out",
          scrollTrigger: { trigger: step, start: "top 82%", once: true } });
      });
    });

    // 5. Servizi: scroll orizzontale con la sezione bloccata (solo schermi ampi)
    mm.add("(prefers-reduced-motion: no-preference) and (min-width: 900px) and (min-height: 640px)", () => {
      const section = document.querySelector(".services");
      if (!section || !track) return;
      section.classList.add("is-hscroll");
      track.scrollLeft = 0;
      const getMax = () => {
        // fino al bordo destro dell'ultima card più lo stesso margine del lato sinistro
        const last = track.lastElementChild;
        return Math.max(0, last.offsetLeft + last.offsetWidth + parseFloat(getComputedStyle(track).paddingLeft) - track.clientWidth);
      };

      const tween = gsap.to(track, {
        x: () => -getMax(), ease: "none",
        scrollTrigger: {
          trigger: section, pin: true, start: "top top",
          end: () => "+=" + getMax(), scrub: .6, invalidateOnRefresh: true,
          onRefresh: self => { hscroll = { st: self, max: getMax() }; },
          onUpdate: self => {
            const visible = track.clientWidth / (track.clientWidth + getMax());
            bar.style.transform = "scaleX(" + (visible + self.progress * (1 - visible)).toFixed(3) + ")";
            prevNext[0].disabled = self.progress <= .001;
            prevNext[1].disabled = self.progress >= .999;
          }
        }
      });
      hscroll = { st: tween.scrollTrigger, max: getMax() };
      prevNext[0].disabled = true; prevNext[1].disabled = false;

      // Le card entrano con una leggera profondità mentre attraversano lo schermo
      gsap.utils.toArray(".service-card", track).forEach(card => {
        gsap.fromTo(card.querySelector(".service-icon"), { x: 40 }, {
          x: -20, ease: "none",
          scrollTrigger: { trigger: card, containerAnimation: tween, start: "left right", end: "right left", scrub: true }
        });
      });

      return () => {
        section.classList.remove("is-hscroll");
        hscroll = null;
        requestAnimationFrame(updateCarousel);
      };
    });
  };
  setupMotion();
})();
