/* ==========================================================================
   Vincent Cheng portfolio (Apple-style): page behaviour
   - Hero video shrinks into a rounded card as you scroll
   - Intro words light up as they pass the middle of the screen
   - Sections fade up once when they come into view
   - Highlights pin in place and slide sideways as you scroll
   - Eye diagrams, ScopeChat terminal demo
   Everything scroll-driven is skipped when the visitor prefers reduced motion.
   ========================================================================== */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Navs ---------- */
  const gnav = $("#gnav"), gBtn = $(".gnav-menu");
  const lnav = $("#lnav"), lBtn = $(".lnav-toggle");

  function setOpen(nav, btn, open) {
    nav.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", String(open));
  }
  gBtn.addEventListener("click", () => setOpen(gnav, gBtn, !gnav.classList.contains("open")));
  lBtn.addEventListener("click", () => setOpen(lnav, lBtn, !lnav.classList.contains("open")));
  $$("#gnav-links a").forEach((a) => a.addEventListener("click", () => setOpen(gnav, gBtn, false)));
  $$("#lnav-menu a").forEach((a) => a.addEventListener("click", () => setOpen(lnav, lBtn, false)));
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    setOpen(gnav, gBtn, false);
    setOpen(lnav, lBtn, false);
  });

  /* ---------- Hero video ---------- */
  const hero = $(".hero");
  const sticky = $(".hero-sticky");
  const media = $(".hero-media");
  const video = $(".hero-video");
  const toggle = $(".media-toggle");
  let userPaused = false;

  const noVideo = () => hero.classList.add("no-video");
  video.querySelector("source").addEventListener("error", noVideo);
  if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) noVideo();

  const showPaused = (paused) => {
    hero.classList.toggle("is-paused", paused);
    toggle.setAttribute("aria-label", paused ? "Play video" : "Pause video");
  };
  video.addEventListener("play", () => showPaused(false));
  video.addEventListener("pause", () => showPaused(true));
  toggle.addEventListener("click", () => {
    if (video.paused) { userPaused = false; video.play().catch(() => {}); }
    else { userPaused = true; video.pause(); }
  });
  if (reduce) { userPaused = true; video.removeAttribute("autoplay"); video.pause(); showPaused(true); }

  // Don't burn battery playing a video nobody can see.
  new IntersectionObserver(([e]) => {
    if (hero.classList.contains("no-video")) return;
    if (e.isIntersecting && !userPaused) video.play().catch(() => {});
    else if (!e.isIntersecting) video.pause();
  }).observe(hero);

  /* ---------- Intro: split into words ---------- */
  const lede = $("[data-words]");
  function splitWords(el) {
    [...el.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const w = document.createElement("span");
          w.className = "w";
          w.textContent = part;
          frag.append(w);
        });
        node.replaceWith(frag);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        splitWords(node);
      }
    });
  }
  let words = [];
  let litCount = -1;
  if (lede && !reduce) { splitWords(lede); words = $$(".w", lede); }

  /* ---------- Highlights ----------
     Normally the section pins under the nav and scrolling down slides through the
     cards, resting briefly on each one. With reduced motion it falls back to a
     plain swipeable row. */
  const hl = $(".highlights");
  const hlSticky = $(".hl-sticky");
  const gallery = $("#gallery");
  const track = $(".gallery-track");
  const cards = $$(".gcard", gallery);
  const dotsWrap = $("#dots");
  const pinned = !reduce;
  const HOLD = 0.55;  // scroll spent resting on a card...
  const MOVE = 1;     // ...relative to scroll spent moving to the next one
  const units = cards.length * HOLD + (cards.length - 1) * MOVE;
  let active = -1;

  if (pinned) {
    hl.classList.add("is-pinned");
    hl.style.setProperty("--slides", cards.length);
  }

  const dots = cards.map((card, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "dot";
    b.setAttribute("aria-label", `Highlight ${i + 1} of ${cards.length}`);
    b.addEventListener("click", () => goTo(i));
    dotsWrap.append(b);
    return b;
  });

  function setActive(i) {
    if (i === active) return;
    active = i;
    dots.forEach((d, k) => d.setAttribute("aria-current", String(k === i)));
    cards.forEach((c, k) => c.classList.toggle("is-active", k === i));
  }

  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  // Pinned progress (0..1) -> card position (0..n-1, fractional while sliding).
  function cardPosition(p) {
    let u = p * units;
    for (let i = 0; i < cards.length; i++) {
      if (u <= HOLD) return i;
      u -= HOLD;
      if (i === cards.length - 1) break;
      if (u <= MOVE) return i + easeInOut(u / MOVE);
      u -= MOVE;
    }
    return cards.length - 1;
  }
  const pinRange = () => hl.offsetHeight - hlSticky.offsetHeight;
  const pinStart = () => hl.getBoundingClientRect().top + scrollY - lnav.offsetHeight;

  function updateHighlights() {
    const r = hl.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const pos = cardPosition(clamp((scrollY - pinStart()) / pinRange()));
    const step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 0;
    track.style.setProperty("--x", (-pos * step).toFixed(1) + "px");
    setActive(Math.round(pos));
  }

  function goTo(i) {
    i = clamp(i, 0, cards.length - 1);
    if (pinned) {
      const u = i * (HOLD + MOVE) + HOLD / 2;
      scrollTo({ top: pinStart() + (u / units) * pinRange(), behavior: "smooth" });
    } else {
      const card = cards[i];
      gallery.scrollTo({ left: card.offsetLeft - (gallery.clientWidth - card.offsetWidth) / 2 });
    }
  }

  if (!pinned) {
    const syncDots = () => {
      const center = gallery.scrollLeft + gallery.clientWidth / 2;
      let best = 0, bestDist = Infinity;
      cards.forEach((c, i) => {
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      setActive(best);
    };
    gallery.addEventListener("scroll", () => requestAnimationFrame(syncDots), { passive: true });
    addEventListener("resize", syncDots);
    syncDots();
  }
  cards.forEach((c, i) => c.addEventListener("click", () => { if (i !== active) goTo(i); }));
  gallery.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(active + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(active - 1); }
  });

  /* ---------- Scroll-linked updates ---------- */
  let queued = false;
  function update() {
    queued = false;
    const vh = innerHeight;

    lnav.classList.toggle("is-stuck", scrollY >= gnav.offsetHeight);
    if (!lnav.classList.contains("open")) {
      const under = document.elementFromPoint(document.documentElement.clientWidth / 2, lnav.getBoundingClientRect().bottom + 1);
      lnav.classList.toggle("is-light", !!(under && under.closest(".light, .white, .footer")));
    }

    if (!reduce) {
      updateHighlights();

      // Hero: scale from full-bleed down to a rounded card over the sticky range.
      const r = hero.getBoundingClientRect();
      if (r.bottom > 0) {
        const range = hero.offsetHeight - sticky.offsetHeight;
        const p = clamp((lnav.offsetHeight - r.top) / range);
        const s = 1 - 0.1 * p;
        media.style.setProperty("--p", p.toFixed(3));
        media.style.setProperty("--s", s.toFixed(4));
        media.style.setProperty("--r", (28 * p / s).toFixed(2) + "px");
      }

      // Intro: light words from 82% of the viewport until the paragraph's bottom hits the middle.
      if (words.length) {
        const lr = lede.getBoundingClientRect();
        const p = clamp((vh * 0.82 - lr.top) / (vh * 0.32 + lr.height));
        const n = Math.round(p * words.length);
        if (n !== litCount) {
          litCount = n;
          words.forEach((w, i) => w.classList.toggle("lit", i < n));
        }
      }
    }
  }
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  update();

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Eye diagrams (generated, illustrative) ---------- */
  function drawEye(svg) {
    const traces = +svg.dataset.eye || 60;
    const W = 600, H = 300, mid = H / 2, amp = H * 0.34;
    const edge = (u) => 0.5 + 0.5 * Math.tanh(u);
    const bit = () => (Math.random() < 0.5 ? -1 : 1);
    const noise = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
    const id = "eye-" + Math.random().toString(36).slice(2, 8);
    let out = `<defs><linearGradient id="${id}" x1="0" x2="1">` +
      `<stop offset="0" stop-color="#64d2ff"/><stop offset=".5" stop-color="#8f9bff"/><stop offset="1" stop-color="#bf5af2"/>` +
      `</linearGradient></defs><g fill="none" stroke="url(#${id})" stroke-width="1.3" stroke-opacity=".2">`;
    for (let t = 0; t < traces; t++) {
      const b = [bit(), bit(), bit()];
      const j1 = noise() * 20, j2 = noise() * 20;
      const a = amp * (0.8 + Math.random() * 0.2);
      const off = noise() * 12;
      let d = "";
      for (let x = 0; x <= W; x += 6) {
        const v = b[0] + (b[1] - b[0]) * edge((x - W * 0.25 - j1) / 26) + (b[2] - b[1]) * edge((x - W * 0.75 - j2) / 26);
        const y = mid - v * a + off + Math.sin(x / 17 + t) * 1.5;
        d += (x ? "L" : "M") + x + " " + y.toFixed(1);
      }
      out += `<path vector-effect="non-scaling-stroke" d="${d}"/>`;
    }
    svg.innerHTML = out + "</g>";
  }
  $$("svg[data-eye]").forEach(drawEye);

  /* ---------- ScopeChat terminal ---------- */
  const term = $("#term");
  const replay = $(".term-replay");
  const CURSOR = '<span class="cursor"></span>';
  const PROMPT_OPEN = '<span class="t-p">';
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = term.innerHTML.split("\n");
  const finalPrompt = lines[0].slice(0, lines[0].indexOf("</span>") + 8);
  let run = 0;

  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  async function play() {
    const id = ++run;
    let html = "";
    const show = (extra = "") => { term.innerHTML = html + extra; };
    for (const line of lines) {
      if (line.startsWith(PROMPT_OPEN)) {
        const cut = line.indexOf("</span>") + 8;
        const prompt = line.slice(0, cut);
        const tmp = document.createElement("span");
        tmp.innerHTML = line.slice(cut);
        const cmd = tmp.textContent;
        show(prompt + CURSOR);
        await wait(550);
        for (let i = 1; i <= cmd.length; i++) {
          if (id !== run) return;
          show(prompt + esc(cmd.slice(0, i)) + CURSOR);
          await wait(26 + Math.random() * 42);
        }
        html += prompt + esc(cmd) + "\n";
        show();
        await wait(420);
      } else {
        html += line + "\n";
        show();
        await wait(line ? 170 : 300);
      }
      if (id !== run) return;
    }
    show(finalPrompt + CURSOR);
  }

  if (reduce) {
    term.innerHTML += "\n\n" + finalPrompt + CURSOR;
    replay.hidden = true;
  } else {
    term.innerHTML = "";
    new IntersectionObserver(([e], obs) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      play();
    }, { threshold: 0.35 }).observe(term);
  }
  replay.addEventListener("click", play);
})();
