/**
 * クリスマス版: クリスマスマーケットの飾り(コードで描く)
 *
 * data-deco="..." を付けた要素の中に、SVG の飾りを描き込む。
 *   lights   … またたく電球のストリングライト
 *   garland  … もみの木のガーランド(リボン・オーナメント・赤い実つき)
 *   bunting  … 三角の旗
 *   hang     … 上からぶら下がって揺れるオーナメント(data-count で本数)
 *   holly / divider / gifts / cane / ginger / star … 小さな飾り
 * さらに、画面全体に雪を降らせる(.xm-snow)。
 * 乱数は種を固定しているので、読み込み直しても同じ形になる。
 */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const RED = ["#b3202c", "#9c1622", "#c7303a"];
  const GREEN = ["#16392a", "#1d4a33", "#2a6444", "#3b7a52"];
  const BAUBLE = ["#b3202c", "#d4a94a", "#1f5a3f", "#efe6d2", "#8c1c3a", "#c99a3c"];
  const BULB = ["#ff5a4f", "#ffd36b", "#7fe08a", "#fff3d1", "#ff9f43", "#8fc7ff"];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }
  function svg(w, h, cls) {
    const el = document.createElementNS(NS, "svg");
    el.setAttribute("viewBox", `0 0 ${w} ${h}`);
    el.setAttribute("width", w);
    el.setAttribute("height", h);
    el.setAttribute("aria-hidden", "true");
    if (cls) el.setAttribute("class", cls);
    return el;
  }
  function add(parent, tag, attrs) {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    parent.appendChild(el);
    return el;
  }
  // 共通のグラデーション(オーナメントの光沢・電球の光)を1回だけ用意
  let defsDone = false;
  function ensureDefs() {
    if (defsDone) return;
    defsDone = true;
    const s = svg(0, 0, "xm-defs");
    s.style.position = "absolute";
    s.style.width = s.style.height = "0";
    const d = add(s, "defs", {});
    BAUBLE.forEach((c, i) => {
      const g = add(d, "radialGradient", { id: "xmb" + i, cx: "35%", cy: "32%", r: "70%" });
      add(g, "stop", { offset: "0", "stop-color": "#fff", "stop-opacity": "0.85" });
      add(g, "stop", { offset: "0.18", "stop-color": c });
      add(g, "stop", { offset: "1", "stop-color": c, "stop-opacity": "1" });
      add(g, "stop", { offset: "1", "stop-color": "#000", "stop-opacity": "0.35" });
    });
    const f = add(d, "filter", { id: "xmglow", x: "-100%", y: "-100%", width: "300%", height: "300%" });
    add(f, "feGaussianBlur", { stdDeviation: "3.2" });
    const pat = add(d, "pattern", { id: "xmdots", width: "8", height: "8", patternUnits: "userSpaceOnUse" });
    add(pat, "rect", { width: "8", height: "8", fill: "#f3ead6" });
    add(pat, "circle", { cx: "4", cy: "4", r: "1.6", fill: "#b3202c" });
    const pat2 = add(d, "pattern", { id: "xmcheck", width: "10", height: "10", patternUnits: "userSpaceOnUse" });
    add(pat2, "rect", { width: "10", height: "10", fill: "#1f5a3f" });
    add(pat2, "rect", { width: "5", height: "10", fill: "#b3202c", opacity: "0.55" });
    add(pat2, "rect", { width: "10", height: "5", fill: "#b3202c", opacity: "0.55" });
    document.body.prepend(s);
  }

  // ---- 部品 ----
  function bauble(g, x, y, r, ci, rot) {
    const b = add(g, "g", { transform: `translate(${x} ${y}) rotate(${rot || 0})` });
    add(b, "circle", { cx: 0, cy: r, r, fill: `url(#xmb${ci % BAUBLE.length})` });
    add(b, "rect", { x: -r * 0.32, y: -r * 0.18, width: r * 0.64, height: r * 0.34, rx: 1, fill: "#caa04e" });
    add(b, "circle", { cx: 0, cy: -r * 0.3, r: r * 0.16, fill: "none", stroke: "#caa04e", "stroke-width": 1.2 });
    if (r > 9 && ci % 3 === 0) add(b, "path", { d: `M${-r * 0.85} ${r * 1.05} q${r * 0.85} ${r * 0.4} ${r * 1.7} 0`, stroke: "#f6e2a6", "stroke-width": 1.2, fill: "none", opacity: 0.8 });
    return b;
  }
  function star(g, x, y, r, fill) {
    let d = "";
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const rr = i % 2 ? r * 0.45 : r;
      d += (i ? "L" : "M") + (x + Math.cos(a) * rr).toFixed(1) + " " + (y + Math.sin(a) * rr).toFixed(1);
    }
    return add(g, "path", { d: d + "Z", fill: fill || "#e3bb5c", stroke: "#a97c33", "stroke-width": 0.8 });
  }
  function bow(g, x, y, s) {
    const b = add(g, "g", { transform: `translate(${x} ${y}) scale(${s})` });
    add(b, "path", { d: "M0 0 C-14 -12 -22 -2 -16 6 C-12 10 -4 6 0 0 Z", fill: "#b3202c", stroke: "#7a1019", "stroke-width": 1 });
    add(b, "path", { d: "M0 0 C14 -12 22 -2 16 6 C12 10 4 6 0 0 Z", fill: "#b3202c", stroke: "#7a1019", "stroke-width": 1 });
    add(b, "path", { d: "M-2 2 L-9 22 L-4 19 L-1 24 L1 3 Z", fill: "#9c1622" });
    add(b, "path", { d: "M2 2 L9 22 L4 19 L1 24 L-1 3 Z", fill: "#9c1622" });
    add(b, "circle", { cx: 0, cy: 1, r: 3.6, fill: "#c7303a", stroke: "#7a1019", "stroke-width": 1 });
    return b;
  }
  function berries(g, x, y, r) {
    [[0, 0], [r * 1.7, r * 0.4], [r * 0.8, r * 1.5]].forEach(([dx, dy]) => {
      add(g, "circle", { cx: x + dx, cy: y + dy, r, fill: "#c7202e", stroke: "#7a1019", "stroke-width": 0.6 });
      add(g, "circle", { cx: x + dx - r * 0.3, cy: y + dy - r * 0.35, r: r * 0.28, fill: "#fff", opacity: 0.7 });
    });
  }
  function hollyLeaf(g, x, y, s, rot) {
    add(g, "path", {
      transform: `translate(${x} ${y}) rotate(${rot}) scale(${s})`,
      d: "M0 0 C4 -4 6 -2 8 -6 C9 -3 12 -3 14 -6 C15 -2 18 -2 21 -4 C20 0 22 3 26 3 C22 5 20 7 21 10 C18 8 15 8 14 12 C12 9 9 9 8 12 C6 8 4 9 0 6 C2 4 2 2 0 0 Z",
      fill: "#1f5a3f",
      stroke: "#123524",
      "stroke-width": 0.8,
    });
    add(g, "path", { transform: `translate(${x} ${y}) rotate(${rot}) scale(${s})`, d: "M1 3 L24 3.5", stroke: "#3b7a52", "stroke-width": 0.8, fill: "none" });
  }

  // ---- ガーランド ----
  function garland(el, seed) {
    const W = Math.max(320, el.clientWidth);
    const H = 96;
    const R = rng(seed);
    const s = svg(W, H);
    const spans = Math.max(2, Math.round(W / 250));
    const seg = W / spans;
    const needles = add(s, "g", { "stroke-linecap": "round" });
    const deco = add(s, "g", {});
    for (let i = 0; i < spans; i++) {
      const x0 = i * seg;
      const sag = 26 + R() * 8;
      for (let x = x0; x <= x0 + seg; x += 5) {
        const t = (x - x0) / seg;
        const y = 12 + sag * 4 * t * (1 - t);
        for (let k = 0; k < 6; k++) {
          const a = R() * Math.PI * 2;
          const len = 7 + R() * 11;
          add(needles, "line", {
            x1: x.toFixed(1), y1: y.toFixed(1),
            x2: (x + Math.cos(a) * len).toFixed(1), y2: (y + Math.sin(a) * len * 0.8).toFixed(1),
            stroke: GREEN[Math.floor(R() * GREEN.length)], "stroke-width": 2.2,
          });
        }
        if (R() < 0.12) berries(deco, x + (R() - 0.5) * 12, y + (R() - 0.5) * 8, 2.6);
        if (R() < 0.05) star(deco, x, y + 4, 5, "#e3bb5c");
      }
      // くぼみにオーナメント、つなぎ目にリボン
      const mx = x0 + seg / 2;
      const my = 12 + sag;
      const len = 6 + R() * 16;
      add(deco, "line", { x1: mx, y1: my, x2: mx, y2: my + len, stroke: "#caa04e", "stroke-width": 1 });
      bauble(deco, mx, my + len, 9 + R() * 4, Math.floor(R() * BAUBLE.length));
      [0.25, 0.75].forEach((f) => {
        const bx = x0 + seg * f;
        const by = 12 + sag * 4 * f * (1 - f);
        const l2 = 4 + R() * 8;
        add(deco, "line", { x1: bx, y1: by, x2: bx, y2: by + l2, stroke: "#caa04e", "stroke-width": 1 });
        bauble(deco, bx, by + l2, 6 + R() * 3, Math.floor(R() * BAUBLE.length));
      });
      bow(deco, x0, 14, 0.95);
    }
    bow(deco, W, 14, 0.95);
    el.replaceChildren(s);
  }

  // ---- ストリングライト ----
  function lights(el, seed) {
    const W = Math.max(320, el.clientWidth);
    const H = 44;
    const R = rng(seed);
    const s = svg(W, H);
    const spans = Math.max(2, Math.round(W / 190));
    const seg = W / spans;
    let d = "";
    const pts = [];
    for (let i = 0; i < spans; i++) {
      const x0 = i * seg;
      const sag = 14;
      d += `M${x0} 6 Q${x0 + seg / 2} ${6 + sag * 2} ${x0 + seg} 6 `;
      const n = Math.max(3, Math.round(seg / 38));
      for (let k = 1; k <= n; k++) {
        const t = k / (n + 1);
        const x = x0 + seg * t;
        const y = 6 + sag * 4 * t * (1 - t);
        const slope = sag * 4 * (1 - 2 * t) / seg;
        pts.push({ x, y, a: (Math.atan(slope) * 180) / Math.PI });
      }
    }
    add(s, "path", { d, fill: "none", stroke: "#1b2a1f", "stroke-width": 1.6 });
    pts.forEach((p, i) => {
      const c = BULB[i % BULB.length];
      const g = add(s, "g", { transform: `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${(p.a + (R() - 0.5) * 16).toFixed(1)})` });
      const glow = add(g, "circle", { cx: 0, cy: 10, r: 9, fill: c, filter: "url(#xmglow)", class: "xm-twinkle" });
      glow.style.animationDelay = (R() * 3).toFixed(2) + "s";
      glow.style.animationDuration = (1.6 + R() * 2.2).toFixed(2) + "s";
      add(g, "rect", { x: -2.6, y: 0, width: 5.2, height: 5, rx: 1, fill: "#23402d" });
      add(g, "ellipse", { cx: 0, cy: 10, rx: 3.8, ry: 6, fill: c });
      add(g, "ellipse", { cx: -1.2, cy: 8, rx: 1.1, ry: 2.2, fill: "#fff", opacity: 0.7 });
    });
    el.replaceChildren(s);
  }

  // ---- 三角の旗 ----
  function bunting(el, seed) {
    const W = Math.max(320, el.clientWidth);
    const H = 70;
    const R = rng(seed);
    const s = svg(W, H);
    const spans = Math.max(1, Math.round(W / 420));
    const seg = W / spans;
    const fills = ["#b3202c", "url(#xmdots)", "#1f5a3f", "#d4a94a", "url(#xmcheck)", "#efe6d2"];
    let fi = Math.floor(R() * fills.length);
    for (let i = 0; i < spans; i++) {
      const x0 = i * seg;
      const sag = 18;
      add(s, "path", { d: `M${x0} 4 Q${x0 + seg / 2} ${4 + sag * 2} ${x0 + seg} 4`, fill: "none", stroke: "#8a6a3a", "stroke-width": 1.4 });
      const n = Math.max(5, Math.round(seg / 34));
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n;
        const x = x0 + seg * t;
        const y = 4 + sag * 4 * t * (1 - t);
        const slope = (sag * 4 * (1 - 2 * t)) / seg;
        const a = (Math.atan(slope) * 180) / Math.PI;
        const w = 13;
        const g = add(s, "g", { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)})`, class: "xm-flag" });
        g.style.animationDelay = (R() * 2).toFixed(2) + "s";
        add(g, "path", { d: `M${-w} 0 L${w} 0 L0 30 Z`, fill: fills[fi++ % fills.length], stroke: "#caa04e", "stroke-width": 1 });
      }
    }
    el.replaceChildren(s);
  }

  // ---- ぶら下がるオーナメント ----
  function hang(el, seed) {
    const W = Math.max(60, el.clientWidth);
    const n = Number(el.dataset.count) || 5;
    const R = rng(seed);
    const maxLen = Number(el.dataset.len) || 170;
    const H = maxLen + 40;
    const s = svg(W, H);
    for (let i = 0; i < n; i++) {
      const x = ((i + 0.5) / n) * W + (R() - 0.5) * (W / n) * 0.5;
      const len = 30 + R() * (maxLen - 30);
      const g = add(s, "g", { class: "xm-sway", style: `transform-origin:${x.toFixed(1)}px 0px; animation-delay:${(-R() * 4).toFixed(2)}s; animation-duration:${(3.5 + R() * 2.5).toFixed(2)}s` });
      add(g, "line", { x1: x, y1: 0, x2: x, y2: len, stroke: "#b8913f", "stroke-width": 1 });
      const kind = R();
      if (kind < 0.62) bauble(g, x, len, 11 + R() * 7, Math.floor(R() * BAUBLE.length));
      else if (kind < 0.85) star(g, x, len + 12, 13 + R() * 4);
      else {
        // 雪の結晶
        const f = add(g, "g", { transform: `translate(${x} ${len + 14})`, stroke: "#f4efe3", "stroke-width": 1.8, "stroke-linecap": "round" });
        for (let k = 0; k < 6; k++) {
          const r = (k * 60 * Math.PI) / 180;
          const ex = Math.cos(r) * 13;
          const ey = Math.sin(r) * 13;
          add(f, "line", { x1: 0, y1: 0, x2: ex, y2: ey });
          add(f, "line", { x1: ex * 0.55, y1: ey * 0.55, x2: ex * 0.55 + Math.cos(r + 0.8) * 5, y2: ey * 0.55 + Math.sin(r + 0.8) * 5 });
          add(f, "line", { x1: ex * 0.55, y1: ey * 0.55, x2: ex * 0.55 + Math.cos(r - 0.8) * 5, y2: ey * 0.55 + Math.sin(r - 0.8) * 5 });
        }
      }
    }
    el.replaceChildren(s);
  }

  // ---- 小さな飾り ----
  function holly(el) {
    const s = svg(60, 34);
    hollyLeaf(s, 30, 16, 1, 200);
    hollyLeaf(s, 30, 14, 1, -20);
    berries(s, 26, 10, 3.6);
    el.replaceChildren(s);
  }
  function divider(el) {
    const s = svg(260, 24);
    add(s, "line", { x1: 0, y1: 12, x2: 104, y2: 12, stroke: "#c9a45c", "stroke-width": 1.2 });
    add(s, "line", { x1: 156, y1: 12, x2: 260, y2: 12, stroke: "#c9a45c", "stroke-width": 1.2 });
    add(s, "circle", { cx: 112, cy: 12, r: 2.4, fill: "#c9a45c" });
    add(s, "circle", { cx: 148, cy: 12, r: 2.4, fill: "#c9a45c" });
    star(s, 130, 12, 10);
    el.replaceChildren(s);
  }
  function gifts(el, seed) {
    const R = rng(seed);
    const s = svg(200, 130);
    const boxes = [
      [8, 58, 78, 70], [74, 30, 70, 98], [134, 70, 58, 58], [34, 16, 46, 42],
    ];
    const cols = [["#b3202c", "#e3bb5c"], ["#1f5a3f", "#c7303a"], ["#e9dfc8", "#b3202c"], ["#c99a3c", "#1f5a3f"]];
    boxes.forEach(([x, y, w, h], i) => {
      const [c, rb] = cols[(i + Math.floor(R() * 4)) % 4];
      add(s, "rect", { x, y, width: w, height: h, rx: 2, fill: c, stroke: "rgba(0,0,0,.25)", "stroke-width": 1 });
      add(s, "rect", { x: x - 2, y, width: w + 4, height: h * 0.18, rx: 2, fill: c, stroke: "rgba(0,0,0,.25)", "stroke-width": 1 });
      add(s, "rect", { x: x + w / 2 - 4, y, width: 8, height: h, fill: rb });
      add(s, "rect", { x: x - 2, y: y + h * 0.45, width: w + 4, height: 7, fill: rb, opacity: i === 1 ? 0 : 1 });
      bow(s, x + w / 2, y, 0.8);
    });
    el.replaceChildren(s);
  }
  function cane(el) {
    const s = svg(40, 90);
    const d = "M14 86 V26 a11 11 0 0 1 22 0 v4";
    add(s, "path", { d, fill: "none", stroke: "#f7f1e4", "stroke-width": 9, "stroke-linecap": "round" });
    add(s, "path", { d, fill: "none", stroke: "#c7202e", "stroke-width": 9, "stroke-dasharray": "5 6", "stroke-linecap": "butt" });
    add(s, "path", { d, fill: "none", stroke: "rgba(0,0,0,.15)", "stroke-width": 9.5, "stroke-linecap": "round", opacity: 0.4, transform: "translate(1 1)" });
    el.replaceChildren(s);
  }
  function ginger(el) {
    const s = svg(70, 84);
    const g = add(s, "g", { fill: "#b8743a", stroke: "#8a5325", "stroke-width": 1.2 });
    add(g, "circle", { cx: 35, cy: 17, r: 13 });
    add(g, "rect", { x: 22, y: 26, width: 26, height: 34, rx: 10 });
    add(g, "rect", { x: 4, y: 32, width: 62, height: 13, rx: 6.5 });
    add(g, "rect", { x: 20, y: 48, width: 13, height: 32, rx: 6.5, transform: "rotate(12 26 52)" });
    add(g, "rect", { x: 37, y: 48, width: 13, height: 32, rx: 6.5, transform: "rotate(-12 44 52)" });
    add(s, "rect", { x: 23, y: 27, width: 24, height: 32, rx: 9, fill: "#b8743a" });
    add(s, "rect", { x: 5.5, y: 33.5, width: 59, height: 10, rx: 5, fill: "#b8743a" });
    const w = add(s, "g", { fill: "none", stroke: "#fff8ee", "stroke-width": 1.8, "stroke-linecap": "round" });
    add(w, "path", { d: "M29 21 q6 5 12 0" });
    add(w, "path", { d: "M8 38 l3 -3 l3 3 l3 -3" });
    add(w, "path", { d: "M53 38 l3 -3 l3 3 l3 -3" });
    add(s, "circle", { cx: 30, cy: 14, r: 1.8, fill: "#3a2210" });
    add(s, "circle", { cx: 40, cy: 14, r: 1.8, fill: "#3a2210" });
    [36, 44, 52].forEach((y, i) => add(s, "circle", { cx: 35, cy: y, r: 2.4, fill: ["#c7202e", "#1f8a4f", "#e3bb5c"][i] }));
    bow(s, 35, 29, 0.45);
    el.replaceChildren(s);
  }
  function starOne(el) {
    const s = svg(40, 40);
    star(s, 20, 21, 17);
    el.replaceChildren(s);
  }

  const DRAW = { garland, lights, bunting, hang, holly, divider, gifts, cane, ginger, star: starOne };
  let seedBase = 7;
  const items = Array.from(document.querySelectorAll("[data-deco]")).map((el) => ({ el, seed: (seedBase += 97), w: -1 }));
  function drawAll() {
    ensureDefs();
    items.forEach((it) => {
      const w = it.el.clientWidth;
      if (Math.abs(w - it.w) < 8) return; // 幅が変わっていなければ描き直さない
      it.w = w;
      const fn = DRAW[it.el.dataset.deco];
      if (fn) fn(it.el, it.seed);
    });
  }
  drawAll();
  let rt = 0;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(drawAll, 200);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawAll);

  // ---- 雪(画面全体) ----
  if (reduce) return;
  const cv = document.createElement("canvas");
  cv.className = "xm-snow";
  cv.setAttribute("aria-hidden", "true");
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d");
  let W = 0;
  let H = 0;
  let flakes = [];
  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((W * H) / 16000);
    flakes = [];
    for (let i = 0; i < n; i++) {
      flakes.push({ x: Math.random() * W, y: Math.random() * H, r: 0.8 + Math.random() * 2.4, vy: 0.3 + Math.random() * 0.8, ph: Math.random() * 6.28, a: 0.45 + Math.random() * 0.45 });
    }
  }
  size();
  window.addEventListener("resize", size);
  let last = 0;
  function tick(t) {
    const dt = Math.min(50, last ? t - last : 16) / 16;
    last = t;
    if (!document.hidden) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
      for (const f of flakes) {
        f.y += f.vy * dt;
        f.ph += 0.01 * dt;
        f.x += Math.sin(f.ph) * 0.35 * dt;
        if (f.y > H + 5) { f.y = -5; f.x = Math.random() * W; }
        ctx.globalAlpha = f.a;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
