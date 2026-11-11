/**
 * neon.js — dependency-free neon glow for any DOM element.
 *
 *   neon(target, color, size, intensity, options)
 *
 *   target     Element, CSS selector, NodeList or array of elements (the only required argument)
 *   color      Default "#00f0ff". Any of:
 *                "#0ff"                                       solid ("#" optional; 4/8-digit alpha hex works)
 *                ["#ff2bd6", "#00f0ff"]                       gradient, evenly spaced stops
 *                "linear-gradient(90deg, #f0f, #0ff 60%)"     CSS-style gradient with hex stops
 *                "conic-gradient(#f0f, #0ff, #f0f)"           colours that travel around the element
 *   size       Default 12. How far the glow reaches, in px.
 *   intensity  Default 1. 0–5: 0 = off, 1 = classic neon, 2+ = brighter (gradients top out near 2).
 *   options    Optional object; every key is optional:
 *                mode      "auto" | "box" | "text" | "both"
 *                gradient  "linear" | "conic" (for colour arrays; default linear)
 *                angle     gradient angle in degrees, CSS style (0 = top, 90 = right)
 *                rotate    spin the gradient, degrees per second
 *                cycle     shift every colour's hue, degrees per second
 *                pulse     breathe in and out, cycles per second
 *                flicker   true = occasional neon-sign dropouts
 *                force     true = animate even when the visitor prefers reduced motion
 *
 *   Anything left out, or unusable, falls back to its default, so neon(el) alone works.
 *   Returns a handle: { elements, update(changes), start(), stop(), remove() }
 *
 *   neon(".title");                                              // all defaults
 *   const fx = neon(".title", ["#ff2bd6", "#00f0ff"], 24, 1.2, { rotate: 90, pulse: 0.5 });
 *   fx.update({ color: "#39ff14", size: 40 });                   // change anything later
 *   fx.stop();  fx.start();  fx.remove();                        // pause, resume, undo
 *
 *   Changing colour over time: a plain for loop finishes before the browser repaints, so only
 *   the last colour would show. Use { cycle: 60 }, or call fx.update({ color }) from
 *   requestAnimationFrame / setInterval.
 *
 * Why it can't clash with elements behind or in front of the target
 *   • It only writes box-shadow / text-shadow (plus a lighter text colour on text). No extra
 *     DOM nodes, no ::before/::after overlays, and it never touches position, z-index,
 *     transform, opacity, overflow or isolation (nor filter on HTML elements), so it creates
 *     no stacking context and changes no paint order. Gradients are built from offset,
 *     coloured shadows, and animation only rewrites those same properties.
 *   • Shadows take up no layout space and are never hit-tested: nothing shifts, and clicks
 *     pass straight through the glow to whatever lies underneath.
 *   • Whatever was in front of the target stays in front of its glow; whatever is behind it
 *     is lit, never covered or displaced.
 *   • Shadows the element already had are kept, and remove() restores its original inline
 *     styles exactly. Calling neon() again on the same element updates the glow instead of
 *     stacking a second one.
 *
 * Animation: all animated handles share one requestAnimationFrame loop, which pauses with the
 * tab, drops elements that leave the page, and stays still when the visitor has
 * prefers-reduced-motion set (unless options.force is true). Keep animated glows to a handful
 * of elements: large blurs repaint every frame.
 *
 * Notes: neon reads best on dark backgrounds. A parent with overflow:hidden will clip the
 * glow, and an SVG shape's glow is clipped by its own <svg> unless that has overflow:visible.
 * SVG shapes get the gradient's average colour. text-shadow is inherited, so text inside the
 * target glows too. Works as a plain <script> (global `neon`) or via require().
 */
(function (root) {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const PROPS = ['box-shadow', 'text-shadow', 'color', 'filter']; // the only properties ever written
  const MODES = ['box', 'text', 'both'];
  const FIELDS = ['input', 'textarea', 'select'];
  const BOXED = ['img', 'video', 'canvas', 'svg', 'iframe', 'object', 'embed', 'button', ...FIELDS];
  const DEFAULTS = { color: '#00f0ff', size: 12, intensity: 1 };
  const SAMPLES = 8; // directions sampled around the element for gradient glows
  const STILL = { spin: 0, hue: 0, mul: 1 };

  const applied = new WeakMap(); // element → saved inline styles + pre-existing shadows
  const running = new Set(); // animated handles, driven by one shared rAF loop
  let raf = 0;
  let lastTs = 0;

  // Solid glow recipe, tight and hot first → wide and soft last: [blur ÷ size, tone, alpha]
  const OUTER = [
    [0.06, 'core', 1.0],
    [0.18, 'tint', 0.9],
    [0.4, 'base', 0.8],
    [0.7, 'base', 0.6],
    [1.0, 'base', 0.4],
  ];
  const INNER = [0.3, 0.55]; // soft glow just inside the edge: [blur ÷ size, alpha]
  // Gradient glow: rings of offset, coloured shadows: [blur ÷ size, offset ÷ size, alpha]
  const RINGS = [
    [0.45, 0.12, 0.55],
    [1.0, 0.3, 0.45],
  ];

  // ---- small helpers ----------------------------------------------------------
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const num = (v, fallback) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  };

  // ---- colour -----------------------------------------------------------------
  function parseHex(input) {
    let h = String(input).trim().replace(/^#/, '');
    if (/^[0-9a-f]{3,4}$/i.test(h)) h = h.replace(/./g, (c) => c + c); // #0f8 → #00ff88
    if (!/^(?:[0-9a-f]{6}|[0-9a-f]{8})$/i.test(h)) return null;
    const byte = (i) => parseInt(h.slice(i, i + 2), 16);
    return { r: byte(0), g: byte(2), b: byte(4), a: h.length === 8 ? byte(6) / 255 : 1 };
  }

  // → { stops: [{ c, p }], type, angle } (type/angle undefined unless a gradient string set them)
  function parseColor(input) {
    let list;
    let type;
    let angle;
    if (Array.isArray(input)) {
      list = input.map((h, i) => [parseHex(h), i / Math.max(1, input.length - 1)]);
    } else {
      const s = String(input);
      if (/gradient\(/i.test(s)) {
        type = /conic/i.test(s) ? 'conic' : 'linear';
        const deg = /(-?\d+(?:\.\d+)?)deg/i.exec(s);
        if (deg) angle = parseFloat(deg[1]);
        const found = [...s.matchAll(/(#[0-9a-f]{3,8})\b(?:\s+(-?\d+(?:\.\d+)?)%)?/gi)];
        list = found.map((m, i) => [
          parseHex(m[1]),
          m[2] !== undefined ? parseFloat(m[2]) / 100 : i / Math.max(1, found.length - 1),
        ]);
      } else {
        list = [[parseHex(s), 0]];
      }
    }
    const stops = list.filter(([c]) => c).map(([c, p]) => ({ c, p })).sort((a, b) => a.p - b.p);
    return stops.length ? { stops, type, angle } : null;
  }

  function makeSpec(color, opts) {
    let parsed = parseColor(color);
    if (!parsed) {
      console.warn(`neon(): could not read colour ${JSON.stringify(color)}, using ${DEFAULTS.color}`);
      parsed = parseColor(DEFAULTS.color);
    }
    const type = opts.gradient || parsed.type || 'linear';
    const angle = Number.isFinite(opts.angle) ? opts.angle : parsed.angle !== undefined ? parsed.angle : type === 'conic' ? 0 : 90;
    return { stops: parsed.stops, type, angle };
  }

  const lighten = (c, t) => ({
    r: c.r + (255 - c.r) * t,
    g: c.g + (255 - c.g) * t,
    b: c.b + (255 - c.b) * t,
  });

  function rgba(c, alpha) {
    const a = +clamp(alpha, 0, 1).toFixed(3);
    return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${a})`;
  }

  function shiftHue(c, deg) {
    if (!deg) return c;
    const r = c.r / 255;
    const g = c.g / 255;
    const b = c.b / 255;
    const max = Math.max(r, g, b);
    const d = max - Math.min(r, g, b);
    const l = (max + Math.min(r, g, b)) / 2;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    let h = 0;
    if (d) h = 60 * (max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4);
    h = (((h + deg) % 360) + 360) % 360;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
      const k = (n + h / 30) % 12;
      return (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255;
    };
    return { r: f(0), g: f(8), b: f(4), a: c.a };
  }

  function gradientAt(stops, t) {
    if (t <= stops[0].p) return stops[0].c;
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i].p) {
        const a = stops[i - 1];
        const b = stops[i];
        const u = b.p === a.p ? 1 : (t - a.p) / (b.p - a.p);
        const mix = (k) => a.c[k] + (b.c[k] - a.c[k]) * u;
        return { r: mix('r'), g: mix('g'), b: mix('b'), a: mix('a') };
      }
    }
    return stops[stops.length - 1].c;
  }

  // ---- the glow itself --------------------------------------------------------
  const tones = (rgb) => ({ core: lighten(rgb, 0.85), tint: lighten(rgb, 0.45), base: rgb });
  const px = (f, size) => `${Math.max(1, f * size).toFixed(1)}px`;

  // Stacked shadows add up, so intensity 2.5 → two full passes plus one half-strength pass.
  function passesFor(k, max) {
    const p = new Array(Math.min(max, Math.floor(k))).fill(1);
    if (p.length < max && k % 1 > 0.001) p.push(k % 1);
    return p;
  }

  // Chained drop-shadows feed on each other (SVG shapes only): tighter radii, at most two passes.
  function dropShadows(rgb, size, k) {
    const tone = tones(rgb);
    const out = [];
    passesFor(k, 2).forEach((m) => {
      for (const [f, t, a] of OUTER) {
        out.push(`drop-shadow(0 0 ${px(f * 0.4, size)} ${rgba(tone[t], a * m * rgb.a)})`);
      }
    });
    return out;
  }

  function solidGlow(rgb, size, k) {
    const tone = tones(rgb);
    const text = [];
    const box = [];
    for (const m of passesFor(k, 5)) {
      for (const [f, t, a] of OUTER) {
        const layer = `0 0 ${px(f, size)} ${rgba(tone[t], a * m * rgb.a)}`;
        text.push(layer);
        box.push(layer);
      }
      box.push(`inset 0 0 ${px(INNER[0], size)} ${rgba(rgb, INNER[1] * m * rgb.a)}`);
    }
    return { text, box, filter: () => dropShadows(rgb, size, k), textColor: rgba(lighten(rgb, 0.7), 1) };
  }

  // A gradient glow: each sampled direction gets its own coloured shadow, pushed that way.
  function gradientGlow(stops, spec, size, k, spin) {
    const closed = spec.type === 'conic' ? [...stops, { p: 1, c: stops[0].c }] : stops;
    const avg = { r: 0, g: 0, b: 0, a: 0 };
    stops.forEach((s) => ['r', 'g', 'b', 'a'].forEach((ch) => (avg[ch] += s.c[ch] / stops.length)));
    const tone = tones(avg);
    const ang = spec.angle + spin;

    const dirs = Array.from({ length: SAMPLES }, (_, i) => {
      const deg = (360 / SAMPLES) * i;
      const rad = (deg * Math.PI) / 180;
      const t =
        spec.type === 'conic'
          ? ((((deg - ang) % 360) + 360) % 360) / 360
          : 0.5 + 0.5 * Math.cos(((deg - ang) * Math.PI) / 180);
      return { dx: Math.sin(rad), dy: -Math.cos(rad), c: gradientAt(closed, t) };
    });

    const text = [];
    const box = [];
    for (const m of passesFor(k, 2)) {
      for (const [f, t, a] of OUTER.slice(0, 2)) {
        const layer = `0 0 ${px(f, size)} ${rgba(tone[t], a * m * avg.a)}`; // tight white-hot tube
        text.push(layer);
        box.push(layer);
      }
      for (const [f, off, a] of RINGS) {
        for (const d of dirs) {
          const layer = `${(d.dx * off * size).toFixed(1)}px ${(d.dy * off * size).toFixed(1)}px ${px(f, size)} ${rgba(d.c, a * m * d.c.a)}`;
          text.push(layer);
          box.push(layer);
        }
      }
      box.push(`inset 0 0 ${px(INNER[0], size)} ${rgba(avg, INNER[1] * 0.8 * m * avg.a)}`);
    }
    return { text, box, filter: () => dropShadows(avg, size, k), textColor: rgba(lighten(avg, 0.7), 1) };
  }

  // One frame of the glow, or null when it should be off.
  function buildGlow(spec, size, intensity, fr) {
    const k = clamp(intensity * fr.mul, 0, 5);
    if (!k || !size) return null;
    const stops = spec.stops.map((s) => ({ p: s.p, c: shiftHue(s.c, fr.hue) }));
    return stops.length > 1 ? gradientGlow(stops, spec, size, k, fr.spin) : solidGlow(stops[0].c, size, k);
  }

  // ---- options and motion -----------------------------------------------------
  function readOptions(o) {
    o = o && typeof o === 'object' ? o : {};
    return {
      mode: MODES.includes(o.mode) ? o.mode : 'auto',
      gradient: o.gradient === 'linear' || o.gradient === 'conic' ? o.gradient : undefined,
      angle: parseFloat(o.angle), // NaN → use the gradient's own angle
      rotate: num(o.rotate, 0),
      cycle: num(o.cycle, 0),
      pulse: Math.max(0, num(o.pulse, 0)),
      flicker: !!o.flicker,
      force: !!o.force,
    };
  }

  const animated = (o) => !!(o.rotate || o.cycle || o.pulse || o.flicker);

  function motion(o, t) {
    let mul = 1;
    if (o.pulse) mul *= 0.675 + 0.325 * Math.sin(2 * Math.PI * o.pulse * t); // breathes 0.35 ↔ 1
    if (o.flicker && Math.sin(t * 37) * Math.sin(t * 23.3) > 0.95) mul *= 0.3; // rare dropouts
    return { spin: o.rotate * t, hue: o.cycle * t, mul };
  }

  const reducedMotion = () =>
    typeof root.matchMedia === 'function' && root.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- element helpers --------------------------------------------------------
  const isClear = (c) =>
    !c ||
    c === 'transparent' ||
    /^rgba\((?:[^,]+,){3}\s*0(?:\.0+)?\s*\)$/.test(c) || // rgba(0, 0, 0, 0)
    /\/\s*0(?:\.0+)?%?\s*\)$/.test(c); //                  rgb(0 0 0 / 0)

  const hasBorder = (cs) =>
    ['Top', 'Right', 'Bottom', 'Left'].some((s) => parseFloat(cs[`border${s}Width`]) > 0);

  // Which kind of glow suits this element?
  function detectMode(el, cs) {
    // SVG shapes ignore box-/text-shadow; drop-shadow doesn't alter HTML stacking for them.
    if (el.namespaceURI === SVG_NS && el.localName !== 'svg') return 'filter';

    const hasBox =
      BOXED.includes(el.localName) ||
      (cs.backgroundImage && cs.backgroundImage !== 'none') ||
      !isClear(cs.backgroundColor) ||
      hasBorder(cs);
    const ownText =
      FIELDS.includes(el.localName) ||
      Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.nodeValue.trim() !== '');

    if (hasBox) return ownText ? 'both' : 'box'; // button/sign → frame + lettering; card/image → frame
    return el.textContent.trim() !== '' ? 'text' : 'box'; // bare text → lettering; empty shape → frame
  }

  const readInline = (el, p) => ({ v: el.style.getPropertyValue(p), pr: el.style.getPropertyPriority(p) });

  function restoreInline(el, st) {
    for (const p of PROPS) {
      const o = st.original[p];
      if (o.v) el.style.setProperty(p, o.v, o.pr);
      else el.style.removeProperty(p);
    }
  }

  const real = (v) => (v && v !== 'none' ? v : ''); // computed "none" → nothing to keep

  function render(el, cfg, glow) {
    let st = applied.get(el);
    if (!st) {
      const cs = (el.ownerDocument.defaultView || root).getComputedStyle(el);
      st = {
        auto: detectMode(el, cs),
        original: Object.fromEntries(PROPS.map((p) => [p, readInline(el, p)])),
        keep: { 'box-shadow': real(cs.boxShadow), 'text-shadow': real(cs.textShadow), filter: real(cs.filter) },
      };
      applied.set(el, st);
    }

    restoreInline(el, st); // always start from the original look
    if (!glow) return; // size 0 or intensity 0 = effect off

    const mode = st.auto === 'filter' || cfg.opts.mode === 'auto' ? st.auto : cfg.opts.mode;
    const join = (list, sep) => list.filter(Boolean).join(sep);

    if (mode === 'filter') {
      el.style.setProperty('filter', join([st.keep.filter, ...glow.filter()], ' '));
      return;
    }
    if (mode !== 'text') {
      el.style.setProperty('box-shadow', join([...glow.box, st.keep['box-shadow']], ', '));
    }
    if (mode !== 'box') {
      el.style.setProperty('text-shadow', join([...glow.text, st.keep['text-shadow']], ', '));
      el.style.setProperty('color', glow.textColor);
    }
  }

  function toElements(target) {
    const list =
      typeof target === 'string'
        ? document.querySelectorAll(target)
        : target && target.nodeType === 1
          ? [target]
          : target && typeof target.length === 'number'
            ? target
            : [];
    return Array.from(list).filter((n) => n && n.nodeType === 1);
  }

  // ---- painting and the shared animation loop ---------------------------------
  function paint(cfg) {
    const fr = cfg.still ? STILL : motion(cfg.opts, cfg.clock);
    const glow = buildGlow(cfg.spec, cfg.size, cfg.intensity, fr);
    cfg.elements.forEach((el) => render(el, cfg, glow));
  }

  function tick(ts) {
    raf = 0;
    const dt = lastTs ? Math.min(0.1, (ts - lastTs) / 1000) : 0; // cap so a hidden tab can't cause a jump
    lastTs = ts;
    for (const cfg of running) {
      if (!cfg.elements.some((el) => el.isConnected)) {
        running.delete(cfg); // elements left the page: stop animating them
        continue;
      }
      cfg.clock += dt;
      paint(cfg);
    }
    if (running.size) raf = requestAnimationFrame(tick);
  }

  function begin(cfg) {
    if (!animated(cfg.opts)) return;
    cfg.still = !cfg.opts.force && reducedMotion();
    if (cfg.still) return paint(cfg); // reduced motion: hold a steady frame
    running.add(cfg);
    if (!raf) {
      lastTs = 0;
      raf = requestAnimationFrame(tick);
    }
  }

  // ---- public API -------------------------------------------------------------
  function neon(target, color = DEFAULTS.color, size = DEFAULTS.size, intensity = DEFAULTS.intensity, options = {}) {
    if (typeof options === 'string') options = { mode: options }; // neon(el, c, s, i, "box") still works

    const cfg = {
      elements: toElements(target),
      raw: { ...options },
      color,
      size: Math.max(0, num(size, DEFAULTS.size)),
      intensity: clamp(num(intensity, DEFAULTS.intensity), 0, 5),
      clock: 0,
      still: false,
    };
    cfg.opts = readOptions(cfg.raw);
    cfg.spec = makeSpec(cfg.color, cfg.opts);

    const check = () => {
      if (cfg.opts.rotate && cfg.spec.stops.length < 2) {
        console.warn('neon(): rotate needs a gradient; pass an array of colours');
      }
    };
    if (!cfg.elements.length) console.warn('neon(): no element matched', target);
    check();
    paint(cfg);
    begin(cfg);

    const handle = {
      elements: cfg.elements,
      update(changes = {}) {
        const was = animated(cfg.opts);
        if (changes.color !== undefined) cfg.color = changes.color;
        if (changes.size !== undefined) cfg.size = Math.max(0, num(changes.size, cfg.size));
        if (changes.intensity !== undefined) cfg.intensity = clamp(num(changes.intensity, cfg.intensity), 0, 5);
        cfg.raw = { ...cfg.raw, ...changes };
        cfg.opts = readOptions(cfg.raw);
        cfg.spec = makeSpec(cfg.color, cfg.opts);
        check();
        if (was && !animated(cfg.opts)) running.delete(cfg);
        paint(cfg);
        if (!was) begin(cfg);
        return handle;
      },
      start() {
        begin(cfg);
        return handle;
      },
      stop() {
        running.delete(cfg); // freezes on the current frame
        return handle;
      },
      remove() {
        running.delete(cfg);
        cfg.elements.forEach((el) => {
          const st = applied.get(el);
          if (!st) return;
          restoreInline(el, st);
          applied.delete(el);
        });
        return handle;
      },
    };
    return handle;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = neon;
  else root.neon = neon;
})(typeof window !== 'undefined' ? window : globalThis);