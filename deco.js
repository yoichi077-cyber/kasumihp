/**
 * クリスマス版: 夜のクリスマスマーケットの飾り(コードで描く)
 *
 * 参考: 海外(ドイツ・フランスなど)のクリスマスマーケットの写真
 *   - 夜。灯りは暖かい電球色だけ(カラフルな電球は使わない)
 *   - 頭上に電球のひもが何本も交差する / 木の屋台(雪の三角屋根・赤白の縞の布屋根)
 *   - 麦わらの星、木のクリスマスピラミッド、ろうそくの木のアーチ、古い街並み
 *   (調査メモ: 第2の脳/リサーチ/店舗ネタ/2026-09-26_海外のクリスマスマーケットの見た目)
 *
 * data-deco="..." を付けた要素の中に SVG を描き込む。
 *   canopy … 頭上で交差する電球のひも      lights  … 1本の電球のひも
 *   garland … もみの木のガーランド         stars   … 吊るした麦わらの星とガラスのオーナメント(ハートは使わない)
 *   pyramid … 木のクリスマスピラミッド     tree    … 電球色の灯りの大きなツリー
 *   skyline … 古い街並みの影絵             arch    … ろうそくの木のアーチ(看板)
 *   hang    … 揺れるオーナメント           holly / divider … 小さな飾り
 * さらに .xmas-menu のメニューカードを「木の屋台」にし、画面全体に雪を降らせる。
 * 乱数は種を固定しているので、読み込み直しても同じ形になる。
 */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const GREEN = ["#123024", "#1a3d2c", "#24533b", "#2f6547"];
  const BAUBLE = ["#a3202b", "#d4a94a", "#8c1c2a", "#c99a3c", "#e7d7b0"];
  const WARM = ["#ffd98f", "#ffe7b3", "#ffcf7a", "#fff1cf"];

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
  function add(parent, tag, attrs, text) {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (text) el.textContent = text;
    parent.appendChild(el);
    return el;
  }

  // 共通のグラデーションとぼかし(1回だけ用意)
  let defsDone = false;
  function ensureDefs() {
    if (defsDone) return;
    defsDone = true;
    const s = svg(0, 0, "xm-defs");
    s.style.cssText = "position:absolute;width:0;height:0";
    const d = add(s, "defs", {});
    BAUBLE.forEach((c, i) => {
      const g = add(d, "radialGradient", { id: "xmb" + i, cx: "35%", cy: "32%", r: "70%" });
      add(g, "stop", { offset: "0", "stop-color": "#fff", "stop-opacity": "0.9" });
      add(g, "stop", { offset: "0.2", "stop-color": c });
      add(g, "stop", { offset: "1", "stop-color": c });
    });
    const f = add(d, "filter", { id: "xmglow", x: "-150%", y: "-150%", width: "400%", height: "400%" });
    add(f, "feGaussianBlur", { stdDeviation: "3" });
    const wg = add(d, "linearGradient", { id: "xmwood", x1: "0", y1: "0", x2: "0", y2: "1" });
    add(wg, "stop", { offset: "0", "stop-color": "#8a5a30" });
    add(wg, "stop", { offset: "1", "stop-color": "#5a3719" });
    const fl = add(d, "radialGradient", { id: "xmflame", cx: "50%", cy: "65%", r: "60%" });
    add(fl, "stop", { offset: "0", "stop-color": "#fff6d8" });
    add(fl, "stop", { offset: "0.5", "stop-color": "#ffc861" });
    add(fl, "stop", { offset: "1", "stop-color": "#ff9a2e", "stop-opacity": "0" });
    document.body.prepend(s);
  }

  // ---- 部品 ----
  function bulb(g, x, y, R, size) {
    const r = size || 1;
    const c = WARM[Math.floor(R() * WARM.length)];
    const glow = add(g, "circle", { cx: x, cy: y + 5 * r, r: 7 * r, fill: c, filter: "url(#xmglow)", class: "xm-twinkle" });
    glow.style.animationDelay = (R() * 3).toFixed(2) + "s";
    glow.style.animationDuration = (1.8 + R() * 2.4).toFixed(2) + "s";
    add(g, "circle", { cx: x, cy: y + 5 * r, r: 2.3 * r, fill: "#fff6dc" });
  }
  function catenary(x0, y0, x1, y1, sag, t) {
    return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t + sag * 4 * t * (1 - t) };
  }
  function bauble(g, x, y, r, ci) {
    const b = add(g, "g", { transform: `translate(${x} ${y})` });
    add(b, "circle", { cx: 0, cy: r, r, fill: `url(#xmb${ci % BAUBLE.length})` });
    add(b, "rect", { x: -r * 0.3, y: -r * 0.16, width: r * 0.6, height: r * 0.3, rx: 1, fill: "#caa04e" });
  }
  function star(g, x, y, r, fill) {
    let d = "";
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const rr = i % 2 ? r * 0.45 : r;
      d += (i ? "L" : "M") + (x + Math.cos(a) * rr).toFixed(1) + " " + (y + Math.sin(a) * rr).toFixed(1);
    }
    return add(g, "path", { d: d + "Z", fill: fill || "#f0c865", stroke: "#a97c33", "stroke-width": 0.8 });
  }
  function bow(g, x, y, s) {
    const b = add(g, "g", { transform: `translate(${x} ${y}) scale(${s})` });
    add(b, "path", { d: "M0 0 C-14 -12 -22 -2 -16 6 C-12 10 -4 6 0 0 Z", fill: "#a3202b", stroke: "#6d1018", "stroke-width": 1 });
    add(b, "path", { d: "M0 0 C14 -12 22 -2 16 6 C12 10 4 6 0 0 Z", fill: "#a3202b", stroke: "#6d1018", "stroke-width": 1 });
    add(b, "path", { d: "M-2 2 L-9 22 L-4 19 L-1 24 L1 3 Z", fill: "#8c1622" });
    add(b, "path", { d: "M2 2 L9 22 L4 19 L1 24 L-1 3 Z", fill: "#8c1622" });
    add(b, "circle", { cx: 0, cy: 1, r: 3.6, fill: "#b8303a" });
  }
  function berries(g, x, y, r) {
    [[0, 0], [r * 1.7, r * 0.4], [r * 0.8, r * 1.5]].forEach(([dx, dy]) => {
      add(g, "circle", { cx: x + dx, cy: y + dy, r, fill: "#c0202c", stroke: "#6d1018", "stroke-width": 0.6 });
    });
  }
  function hollyLeaf(g, x, y, s, rot) {
    add(g, "path", {
      transform: `translate(${x} ${y}) rotate(${rot}) scale(${s})`,
      d: "M0 0 C4 -4 6 -2 8 -6 C9 -3 12 -3 14 -6 C15 -2 18 -2 21 -4 C20 0 22 3 26 3 C22 5 20 7 21 10 C18 8 15 8 14 12 C12 9 9 9 8 12 C6 8 4 9 0 6 C2 4 2 2 0 0 Z",
      fill: "#24533b", stroke: "#0f2a1d", "stroke-width": 0.8,
    });
  }
  function candle(g, x, y, h, R) {
    add(g, "rect", { x: x - 3, y: y - h, width: 6, height: h, rx: 1, fill: "#f3ead6" });
    const f = add(g, "g", { class: "xm-flicker" });
    f.style.transformOrigin = `${x}px ${y - h}px`;
    f.style.animationDelay = (R() * 2).toFixed(2) + "s";
    add(f, "circle", { cx: x, cy: y - h - 7, r: 12, fill: "#ffc861", opacity: 0.35, filter: "url(#xmglow)" });
    add(f, "path", { d: `M${x} ${y - h - 13} C${x + 4} ${y - h - 6} ${x + 3} ${y - h - 1} ${x} ${y - h - 1} C${x - 3} ${y - h - 1} ${x - 4} ${y - h - 6} ${x} ${y - h - 13} Z`, fill: "url(#xmflame)" });
  }

  // ---- 頭上で交差する電球のひも ----
  function canopy(el, seed) {
    const W = Math.max(320, el.clientWidth);
    const H = Number(el.dataset.h) || 150;
    const R = rng(seed);
    const s = svg(W, H);
    const strands = [];
    // 左右の高い所から、斜めに交差するように張る
    const n = Math.max(4, Math.round(W / 260));
    for (let i = 0; i < n; i++) {
      const xa = (i / n) * W - W * 0.1;
      const xb = xa + W * (0.35 + R() * 0.3);
      strands.push([xa, R() * 20, xb, 10 + R() * 30, 30 + R() * 60]);
      strands.push([xb, R() * 20, xa + W * 0.05, 14 + R() * 26, 34 + R() * 55]);
    }
    strands.push([0, 6, W, 6, H * 0.55]);
    strands.forEach(([x0, y0, x1, y1, sag]) => {
      let d = "";
      for (let t = 0; t <= 1.0001; t += 0.05) {
        const p = catenary(x0, y0, x1, y1, sag, t);
        d += (t ? "L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1);
      }
      add(s, "path", { d, fill: "none", stroke: "rgba(20,14,8,.75)", "stroke-width": 1.1 });
      const len = Math.hypot(x1 - x0, y1 - y0);
      const cnt = Math.round(len / 26);
      for (let k = 1; k < cnt; k++) {
        const p = catenary(x0, y0, x1, y1, sag, k / cnt);
        if (p.x < -10 || p.x > W + 10) continue;
        bulb(s, p.x, p.y, R, 0.9);
      }
    });
    el.replaceChildren(s);
  }

  // ---- 1本の電球のひも(屋台の軒など) ----
  function lights(el, seed) {
    const W = Math.max(80, el.clientWidth);
    const H = 30;
    const R = rng(seed);
    const s = svg(W, H);
    const spans = Math.max(1, Math.round(W / 120));
    const seg = W / spans;
    for (let i = 0; i < spans; i++) {
      const x0 = i * seg;
      let d = "";
      for (let t = 0; t <= 1.0001; t += 0.1) {
        const p = catenary(x0, 3, x0 + seg, 3, 10, t);
        d += (t ? "L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1);
      }
      add(s, "path", { d, fill: "none", stroke: "rgba(20,14,8,.7)", "stroke-width": 1 });
      const cnt = Math.max(3, Math.round(seg / 20));
      for (let k = 1; k < cnt; k++) {
        const p = catenary(x0, 3, x0 + seg, 3, 10, k / cnt);
        bulb(s, p.x, p.y, R, 0.8);
      }
    }
    el.replaceChildren(s);
  }

  // ---- ガーランド(電球色の灯りを編み込む) ----
  function garland(el, seed) {
    const flat = el.dataset.flat === "1"; // 屋台の軒に巻く、まっすぐな帯(下に垂れる飾りなし)
    const W = Math.max(flat ? 60 : 320, el.clientWidth);
    const H = flat ? 30 : 96;
    const R = rng(seed);
    const s = svg(W, H);
    const spans = Math.max(flat ? 1 : 2, Math.round(W / 250));
    const seg = W / spans;
    const needles = add(s, "g", { "stroke-linecap": "round" });
    const deco = add(s, "g", {});
    for (let i = 0; i < spans; i++) {
      const x0 = i * seg;
      const sag = flat ? 2 : 26 + R() * 8;
      for (let x = x0; x <= x0 + seg; x += 5) {
        const t = (x - x0) / seg;
        const y = (flat ? 14 : 12) + sag * 4 * t * (1 - t);
        for (let k = 0; k < 6; k++) {
          const a = R() * Math.PI * 2;
          const len = flat ? 5 + R() * 7 : 7 + R() * 11;
          add(needles, "line", {
            x1: x.toFixed(1), y1: y.toFixed(1),
            x2: (x + Math.cos(a) * len).toFixed(1), y2: (y + Math.sin(a) * len * 0.8).toFixed(1),
            stroke: GREEN[Math.floor(R() * GREEN.length)], "stroke-width": 2.2,
          });
        }
        if (R() < 0.1) berries(deco, x + (R() - 0.5) * 12, y + (R() - 0.5) * 8, 2.4);
        if (R() < 0.22) bulb(deco, x + (R() - 0.5) * 14, y - 4 + (R() - 0.5) * 8, R, 0.8);
      }
      if (flat) { bow(deco, x0 + 4, 12, 0.6); continue; }
      const mx = x0 + seg / 2;
      const my = 12 + sag;
      const len = 6 + R() * 16;
      add(deco, "line", { x1: mx, y1: my, x2: mx, y2: my + len, stroke: "#caa04e", "stroke-width": 1 });
      bauble(deco, mx, my + len, 9 + R() * 4, Math.floor(R() * BAUBLE.length));
      bow(deco, x0, 14, 0.95);
    }
    bow(deco, flat ? W - 4 : W, flat ? 12 : 14, flat ? 0.6 : 0.95);
    el.replaceChildren(s);
  }

  // ---- 吊るした麦わらの星(ドイツのマーケットの定番の飾り)とガラスのオーナメント ----
  // ハートの形と茶色は使わない(2月のバレンタインカフェ用に取っておく。2026-09-26 オーナー指示)
  function strawStar(g, x, y, r, R) {
    const rays = add(g, "g", { stroke: "#f3dc9a", "stroke-width": 1.6, "stroke-linecap": "round" });
    const n = 8;
    for (let k = 0; k < n; k++) {
      const a = (Math.PI * 2 * k) / n;
      add(rays, "line", { x1: x - Math.cos(a) * r, y1: y - Math.sin(a) * r, x2: x + Math.cos(a) * r, y2: y + Math.sin(a) * r, "stroke-width": k % 2 ? 1.2 : 2 });
      if (k % 2 === 0) {
        add(rays, "line", { x1: x + Math.cos(a - 0.12) * r * 0.55, y1: y + Math.sin(a - 0.12) * r * 0.55, x2: x + Math.cos(a) * r, y2: y + Math.sin(a) * r, "stroke-width": 1 });
        add(rays, "line", { x1: x + Math.cos(a + 0.12) * r * 0.55, y1: y + Math.sin(a + 0.12) * r * 0.55, x2: x + Math.cos(a) * r, y2: y + Math.sin(a) * r, "stroke-width": 1 });
      }
    }
    add(g, "circle", { cx: x, cy: y, r: r * 0.18, fill: "#c0202c" });
    add(g, "circle", { cx: x, cy: y, r: r * 0.08, fill: "#f3dc9a" });
  }
  function stars(el, seed) {
    const W = Math.max(60, el.clientWidth);
    const n = Number(el.dataset.count) || 3;
    const R = rng(seed);
    const maxLen = Number(el.dataset.len) || 150;
    const s = svg(W, maxLen + 80);
    const per = n * 2;
    for (let i = 0; i < per; i++) {
      const x = ((i + 0.5) / per) * W;
      const len = 20 + R() * (maxLen - 20);
      const g = add(s, "g", { class: "xm-sway" });
      g.style.transformOrigin = `${x.toFixed(1)}px 0px`;
      g.style.animationDelay = (-R() * 4).toFixed(2) + "s";
      add(g, "line", { x1: x, y1: 0, x2: x, y2: len, stroke: i % 2 ? "#c0202c" : "#d4a94a", "stroke-width": 1.4 });
      if (i % 2 === 0) strawStar(g, x, len + 26, 24 + R() * 8, R);
      else bauble(g, x, len, 12 + R() * 5, [0, 1, 4][Math.floor(R() * 3)]);
    }
    el.replaceChildren(s);
  }

  // ---- 木のクリスマスピラミッド ----
  function pyramid(el, seed) {
    const R = rng(seed);
    const s = svg(200, 330);
    // 上の羽根(回る)
    const top = add(s, "g", { class: "xm-spin" });
    top.style.transformOrigin = "100px 38px";
    for (let k = 0; k < 8; k++) {
      add(top, "path", { d: "M100 38 L162 30 L164 40 Z", fill: "#c99a58", stroke: "#6b4420", "stroke-width": 0.8, transform: `rotate(${k * 45} 100 38)`, opacity: 0.9 });
    }
    add(s, "circle", { cx: 100, cy: 38, r: 6, fill: "#d4a94a" });
    add(s, "rect", { x: 97, y: 38, width: 6, height: 260, fill: "#6b4420" });
    // 3段の台と柱
    const tiers = [[110, 70], [180, 88], [250, 106]];
    tiers.forEach(([y, hw], ti) => {
      add(s, "rect", { x: 100 - hw, y, width: hw * 2, height: 8, rx: 2, fill: "url(#xmwood)" });
      [-1, 1].forEach((sgn) => add(s, "rect", { x: 100 + sgn * (hw - 6) - 2, y: y - 62, width: 4, height: 62, fill: "#7a4f28" }));
      add(s, "rect", { x: 100 - hw, y: y - 64, width: hw * 2, height: 5, rx: 2, fill: "url(#xmwood)" });
      // 回っているように、人形が左右に行き来する
      const figs = add(s, "g", { class: ti % 2 ? "xm-walk xm-walk--rev" : "xm-walk" });
      figs.style.setProperty("--walk", (hw - 22) + "px");
      for (let k = -1; k <= 1; k++) {
        const fx = 100 + k * (hw * 0.55);
        add(figs, "circle", { cx: fx, cy: y - 34, r: 6, fill: "#f0dcc0", stroke: "#6b4420", "stroke-width": 0.8 });
        add(figs, "path", { d: `M${fx - 9} ${y} L${fx - 5} ${y - 28} L${fx + 5} ${y - 28} L${fx + 9} ${y} Z`, fill: ["#a3202b", "#1f5a3f", "#d4a94a"][(k + 1 + ti) % 3], stroke: "#4a2a12", "stroke-width": 0.8 });
        if (ti === 0 && k === 0) star(figs, fx, y - 48, 6);
      }
      // 台の上のろうそく
      [-1, 1].forEach((sgn) => candle(s, 100 + sgn * (hw + 2), y, 16, R));
    });
    add(s, "rect", { x: 10, y: 300, width: 180, height: 16, rx: 3, fill: "url(#xmwood)" });
    add(s, "rect", { x: 22, y: 316, width: 156, height: 10, rx: 2, fill: "#4a2a12" });
    el.replaceChildren(s);
  }

  // ---- 電球色の灯りの大きなツリー ----
  function tree(el, seed) {
    const R = rng(seed);
    const s = svg(220, 340);
    const layers = [[70, 150, 110], [120, 210, 160], [170, 272, 210]];
    add(s, "rect", { x: 100, y: 290, width: 20, height: 36, fill: "#4a2a12" });
    layers.forEach(([top, bottom, width]) => {
      add(s, "path", { d: `M110 ${top - 40} L${110 + width / 2} ${bottom} Q110 ${bottom + 14} ${110 - width / 2} ${bottom} Z`, fill: "#163826", stroke: "#0d2519", "stroke-width": 1 });
    });
    // 雪
    add(s, "path", { d: "M78 150 Q110 160 142 150 Q130 146 110 148 Q90 146 78 150 Z", fill: "#f4f1ea", opacity: 0.9 });
    add(s, "path", { d: "M58 210 Q110 224 162 210 Q140 205 110 207 Q80 205 58 210 Z", fill: "#f4f1ea", opacity: 0.9 });
    // 灯りを散らす(三角形の中だけ)
    for (let i = 0; i < 90; i++) {
      const y = 50 + R() * 225;
      const half = ((y - 30) / 245) * 105;
      const x = 110 + (R() * 2 - 1) * half * 0.92;
      bulb(s, x, y - 5, R, 0.55);
    }
    for (let i = 0; i < 9; i++) {
      const y = 90 + R() * 180;
      const half = ((y - 30) / 245) * 95;
      bauble(s, 110 + (R() * 2 - 1) * half * 0.8, y, 5 + R() * 2, Math.floor(R() * BAUBLE.length));
    }
    const st = add(s, "g", { class: "xm-twinkle" });
    add(st, "circle", { cx: 110, cy: 26, r: 18, fill: "#ffd98f", opacity: 0.5, filter: "url(#xmglow)" });
    star(st, 110, 26, 15);
    el.replaceChildren(s);
  }

  // ---- 古い街並みの影絵(切妻屋根・木組み・教会の塔) ----
  // data-town="1" のときは、ソリの場面用の「クリスマス一色のヨーロッパの旧市街」を描く
  // (色のついた壁・木組み・階段状の破風・煙突・教会の塔・屋根の電球・窓のリース)
  function skyline(el, seed) {
    const W = Math.max(320, el.clientWidth);
    const H = Math.max(120, el.clientHeight || Number(el.dataset.h) || 180);
    const town = el.dataset.town === "1";
    const R = rng(seed);
    const s = svg(W, H);
    const WALLS = town ? ["#3b2f4f", "#2e3a5c", "#4a3044", "#35405e", "#503a3a", "#2c4250"] : ["#1b2146"];
    function roofLights(g, pts) {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[i + 1];
        const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 11));
        for (let k = 0; k < n; k++) {
          const t = k / n;
          const x = x0 + (x1 - x0) * t;
          const y = y0 + (y1 - y0) * t;
          const c = add(g, "circle", { cx: x, cy: y + 2, r: 3.4, fill: "#ffd98f", filter: "url(#xmglow)", class: "xm-twinkle" });
          c.style.animationDelay = (R() * 3).toFixed(2) + "s";
          add(g, "circle", { cx: x, cy: y + 2, r: 1.2, fill: "#fff6dc" });
        }
      }
    }
    function wreath(g, x, y, r) {
      add(g, "circle", { cx: x, cy: y, r, fill: "none", stroke: "#2f6547", "stroke-width": r * 0.55 });
      add(g, "path", { d: `M${x - r * 0.5} ${y + r * 0.9} l${r * 0.5} ${-r * 0.4} l${r * 0.5} ${r * 0.4}`, stroke: "#c0202c", "stroke-width": 1.6, fill: "none" });
    }
    function house(g, x, w, h, lit, front) {
      const y = H - h;
      const wall = WALLS[Math.floor(R() * WALLS.length)];
      const kind = town ? R() : 0;
      const roofH = w * (0.55 + R() * 0.45);
      let outline;
      if (kind > 0.72) {
        // 階段状の破風
        const st = 4;
        let d = `M${x} ${H} V${y}`;
        const pts = [[x, y]];
        for (let i = 1; i <= st; i++) {
          const xx = x + (w / 2) * (i / st);
          const yy = y - roofH * (i / st);
          d += ` V${yy} H${xx}`;
          pts.push([x + (w / 2) * ((i - 1) / st), yy], [xx, yy]);
        }
        for (let i = st - 1; i >= 0; i--) {
          const xx = x + w - (w / 2) * (i / st);
          const yy = y - roofH * (i / st);
          d += ` H${xx} V${yy}`;
        }
        d += ` V${H} Z`;
        add(g, "path", { d, fill: wall });
        outline = [[x, y], [x + w / 2, y - roofH], [x + w, y]];
        add(g, "path", { d: `M${x + w * 0.3} ${y - roofH * 0.62} h${w * 0.4}`, stroke: "#eef2f8", "stroke-width": 3, opacity: 0.8 });
      } else {
        add(g, "path", { d: `M${x} ${H} V${y} L${x + w / 2} ${y - roofH} L${x + w} ${y} V${H} Z`, fill: wall });
        add(g, "path", { d: `M${x - 4} ${y + 2} L${x + w / 2} ${y - roofH - 2} L${x + w + 4} ${y + 2} L${x + w - 1} ${y + 5} L${x + w / 2} ${y - roofH + 5} L${x + 1} ${y + 5} Z`, fill: "#eef2f8", opacity: 0.9 });
        outline = [[x - 2, y + 3], [x + w / 2, y - roofH], [x + w + 2, y + 3]];
      }
      if (town && R() < 0.5) {
        const cx = x + w * (0.65 + R() * 0.15);
        add(g, "rect", { x: cx, y: y - roofH * 0.7, width: 7, height: roofH * 0.5, fill: "#2a1f28" });
        add(g, "rect", { x: cx - 1, y: y - roofH * 0.72, width: 9, height: 3, fill: "#eef2f8" });
      }
      if (town && R() < 0.45) {
        // 木組み
        add(g, "path", { d: `M${x + 3} ${y + h * 0.3} H${x + w - 3} M${x + 3} ${y + h * 0.58} H${x + w - 3} M${x + w * 0.2} ${y} V${H} M${x + w * 0.8} ${y} V${H} M${x + w * 0.2} ${y + h * 0.3} L${x + w * 0.5} ${y + h * 0.58} L${x + w * 0.8} ${y + h * 0.3}`, stroke: "#1a1420", "stroke-width": 2, fill: "none", opacity: 0.8 });
      }
      const rows = Math.max(1, Math.floor((h - 16) / 30));
      const cols = Math.max(1, Math.floor(w / (town ? 26 : 20)));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (R() > lit) continue;
          const ww = town ? 10 : 8;
          const wh = town ? 15 : 11;
          const wx = x + (w / cols) * (c + 0.5) - ww / 2;
          const wy = y + 12 + r * 30;
          if (wy + wh > H - 4) continue;
          add(g, "rect", { x: wx, y: wy, width: ww, height: wh, rx: town ? 4 : 1, fill: R() < 0.8 ? "#ffcf7a" : "#ffe6ad", opacity: 0.95 });
          if (town) {
            add(g, "path", { d: `M${wx + ww / 2} ${wy + 2} V${wy + wh} M${wx} ${wy + wh * 0.5} H${wx + ww}`, stroke: wall, "stroke-width": 1.2 });
            if (R() < 0.18) wreath(g, wx + ww / 2, wy + wh / 2, 3.6);
          }
        }
      }
      if (town && front && R() < 0.75) roofLights(g, outline);
    }
    const back = add(s, "g", {});
    let x = -20;
    while (x < W) {
      const w = town ? 50 + R() * 40 : 46 + R() * 44;
      house(back, x, w, H * (town ? 0.5 + R() * 0.25 : 0.42 + R() * 0.3), 0.35, false);
      x += w - 2;
    }
    // 教会の塔
    const tower = add(s, "g", {});
    const cx = W * (0.3 + R() * 0.4);
    const tw = town ? 36 : 28;
    add(tower, "rect", { x: cx - tw / 2, y: H * 0.3, width: tw, height: H * 0.7, fill: town ? "#2b2440" : "#141934" });
    add(tower, "path", { d: `M${cx - tw / 2 - 3} ${H * 0.3} L${cx} ${H * -0.08} L${cx + tw / 2 + 3} ${H * 0.3} Z`, fill: town ? "#1f2a3e" : "#141934" });
    add(tower, "circle", { cx, cy: H * 0.4, r: tw * 0.28, fill: "#ffe6ad", opacity: 0.9 });
    if (town) {
      star(tower, cx, H * -0.1, 7);
      roofLights(tower, [[cx - tw / 2 - 3, H * 0.3], [cx, H * -0.06], [cx + tw / 2 + 3, H * 0.3]]);
    }
    const front = add(s, "g", {});
    x = -30;
    while (x < W) {
      const w = town ? 58 + R() * 44 : 56 + R() * 46;
      house(front, x, w, H * (town ? 0.3 + R() * 0.2 : 0.24 + R() * 0.2), 0.55, true);
      x += w + (town ? 0 : 2 + R() * 6);
    }
    el.replaceChildren(s);
  }

  // ---- ろうそくの木のアーチ(ドレスデンの看板の形) ----
  function arch(el, seed) {
    const R = rng(seed);
    const W = 640;
    const H = 260;
    const s = svg(W, H);
    s.setAttribute("viewBox", `0 0 ${W} ${H}`);
    s.removeAttribute("width");
    s.removeAttribute("height");
    const outer = `M20 250 V150 A300 190 0 0 1 620 150 V250 Z`;
    const inner = `M52 250 V156 A268 160 0 0 1 588 156 V250 Z`;
    add(s, "path", { d: outer + " " + inner, fill: "url(#xmwood)", "fill-rule": "evenodd", stroke: "#3d220d", "stroke-width": 2 });
    add(s, "path", { d: `M36 250 V152 A284 175 0 0 1 604 152 V250`, fill: "none", stroke: "#d4a94a", "stroke-width": 1.6, "stroke-dasharray": "2 6" });
    // アーチの上に並ぶろうそく
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI - (Math.PI * i) / 10;
      const x = 320 + Math.cos(a) * 300;
      const y = 150 - Math.sin(a) * 190 + (i === 0 || i === 10 ? 0 : 0);
      if (i === 0 || i === 10) candle(s, x, 150, 18, R);
      else candle(s, x, y, 18, R);
    }
    el.replaceChildren(s);
  }

  // ---- 揺れるオーナメント ----
  function hang(el, seed) {
    const W = Math.max(60, el.clientWidth);
    const n = Number(el.dataset.count) || 5;
    const R = rng(seed);
    const maxLen = Number(el.dataset.len) || 170;
    const s = svg(W, maxLen + 40);
    for (let i = 0; i < n; i++) {
      const x = ((i + 0.5) / n) * W + (R() - 0.5) * (W / n) * 0.5;
      const len = 30 + R() * (maxLen - 30);
      const g = add(s, "g", { class: "xm-sway" });
      g.style.transformOrigin = `${x.toFixed(1)}px 0px`;
      g.style.animationDelay = (-R() * 4).toFixed(2) + "s";
      add(g, "line", { x1: x, y1: 0, x2: x, y2: len, stroke: "#b8913f", "stroke-width": 1 });
      if (R() < 0.7) bauble(g, x, len, 11 + R() * 7, Math.floor(R() * BAUBLE.length));
      else star(g, x, len + 12, 13 + R() * 4);
    }
    el.replaceChildren(s);
  }

  function holly(el) {
    const s = svg(60, 34);
    hollyLeaf(s, 30, 16, 1, 200);
    hollyLeaf(s, 30, 14, 1, -20);
    berries(s, 26, 10, 3.6);
    el.replaceChildren(s);
  }
  function divider(el) {
    const s = svg(260, 24);
    add(s, "line", { x1: 0, y1: 12, x2: 104, y2: 12, stroke: "#d4a94a", "stroke-width": 1.2 });
    add(s, "line", { x1: 156, y1: 12, x2: 260, y2: 12, stroke: "#d4a94a", "stroke-width": 1.2 });
    add(s, "circle", { cx: 112, cy: 12, r: 2.4, fill: "#d4a94a" });
    add(s, "circle", { cx: 148, cy: 12, r: 2.4, fill: "#d4a94a" });
    star(s, 130, 12, 10);
    el.replaceChildren(s);
  }

  // ---- メニューのカードを木の屋台にする ----
  // ---- 光る陶器の家(ランタンハウス)を棚に並べた帯 ----
  // ニュルンベルクの屋台で、窓や星の穴から灯りがもれる白い小さな家がずらりと並ぶ
  function lanterns(el, seed) {
    const W = Math.max(320, el.clientWidth);
    const H = 150;
    const R = rng(seed);
    const s = svg(W, H);
    add(s, "rect", { x: 0, y: H - 14, width: W, height: 14, fill: "url(#xmwood)" });
    let x = 6;
    while (x < W - 30) {
      const w = 44 + R() * 34;
      const h = 44 + R() * 50;
      const roof = w * (0.45 + R() * 0.25);
      const y = H - 14 - h;
      const g = add(s, "g", {});
      // 家から外へもれる光
      const halo = add(g, "ellipse", { cx: x + w / 2, cy: y + h * 0.55, rx: w * 0.9, ry: h * 0.8, fill: "#ffbf66", opacity: 0.22, filter: "url(#xmglow)", class: "xm-twinkle" });
      halo.style.animationDuration = (3 + R() * 3).toFixed(2) + "s";
      halo.style.animationDelay = (R() * 3).toFixed(2) + "s";
      add(g, "path", { d: `M${x} ${y + h} V${y} L${x + w / 2} ${y - roof} L${x + w} ${y} V${y + h} Z`, fill: "#f4eee2", stroke: "#d8cdb8", "stroke-width": 1 });
      add(g, "path", { d: `M${x - 3} ${y + 2} L${x + w / 2} ${y - roof - 2} L${x + w + 3} ${y + 2}`, fill: "none", stroke: "#ffffff", "stroke-width": 3.5, "stroke-linecap": "round" });
      // くり抜いた窓・扉・星から灯り
      const glow = "#ffc768";
      const cols = w > 62 ? 3 : 2;
      for (let c = 0; c < cols; c++) {
        const wx = x + (w / cols) * (c + 0.5) - 4;
        if (R() < 0.85) add(g, "path", { d: `M${wx} ${y + h * 0.22 + 8} v-3 a4 4 0 0 1 8 0 v3 Z`, fill: glow });
      }
      if (h > 60) for (let c = 0; c < cols; c++) {
        const wx = x + (w / cols) * (c + 0.5) - 3.5;
        if (R() < 0.7) add(g, "rect", { x: wx, y: y + h * 0.5, width: 7, height: 9, rx: 1, fill: glow });
      }
      add(g, "path", { d: `M${x + w / 2 - 6} ${y + h} v-12 a6 6 0 0 1 12 0 v12 Z`, fill: glow });
      if (R() < 0.6) star(g, x + w / 2, y - roof * 0.45, Math.min(6, roof * 0.2), "#ffd98f");
      x += w + 4 + R() * 10;
    }
    el.replaceChildren(s);
  }

  // ---- 電球で縁取った看板文字(ニュルンベルクの「Christkindlesmarkt」の看板のように) ----
  function marquee(el) {
    const text = el.dataset.text || "Christmas Market";
    const W = 900;
    const H = 150;
    const s = svg(W, H);
    s.removeAttribute("width");
    s.removeAttribute("height");
    const base = { x: W / 2, y: 108, "text-anchor": "middle", "font-family": "UnifrakturMaguntia, serif", "font-size": 104 };
    add(s, "text", Object.assign({}, base, { fill: "rgba(255, 190, 100, 0.10)" }), text);
    const glow = add(s, "text", Object.assign({}, base, { fill: "none", stroke: "#ffcf7a", "stroke-width": 7, "stroke-dasharray": "0 9", "stroke-linecap": "round", filter: "url(#xmglow)", class: "xm-twinkle" }), text);
    glow.style.animationDuration = "3.2s";
    add(s, "text", Object.assign({}, base, { fill: "none", stroke: "#fff5dc", "stroke-width": 3.2, "stroke-dasharray": "0 9", "stroke-linecap": "round" }), text);
    el.replaceChildren(s);
  }

  // ニュルンベルクの屋台: 赤白の縞の布屋根、縁取りの垂れ幕、もみのガーランド、軒の電球
  // (写真の上には何も重ねない。飾りはすべて屋根の中に収める)
  function makeHuts() {
    document.querySelectorAll(".xmas-menu .menu-card, .xm-vhut").forEach((card) => {
      if (card.querySelector(".xm-roof")) return;
      const roof = document.createElement("div");
      roof.className = "xm-roof";
      roof.setAttribute("aria-hidden", "true");
      roof.innerHTML = '<div class="xm-valance"></div><div class="xm-hut-eave" data-deco="lights"></div><div class="xm-roof-garland" data-deco="garland" data-flat="1"></div>';
      card.prepend(roof);
    });
  }

  const DRAW = { canopy, lights, garland, stars, pyramid, tree, skyline, arch, hang, holly, divider, lanterns, marquee };
  makeHuts();
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

  // 去年の動画: 画面に見えている間だけ再生する(電池と通信の節約)
  const videos = document.querySelectorAll(".xm-vhut video");
  if (videos.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.play().catch(() => {});
        else e.target.pause();
      });
    }, { threshold: 0.2 });
    videos.forEach((v) => io.observe(v));
  } else {
    videos.forEach((v) => { v.autoplay = true; v.play().catch(() => {}); });
  }
  let rt = 0;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(drawAll, 200);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawAll);

  // ---- 雪(画面全体) ----
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
    const n = Math.round((W * H) / 12000);
    flakes = [];
    for (let i = 0; i < n; i++) {
      flakes.push({ x: Math.random() * W, y: Math.random() * H, r: 0.8 + Math.random() * 2.4, vy: 0.3 + Math.random() * 0.8, ph: Math.random() * 6.28, a: 0.45 + Math.random() * 0.45 });
    }
  }
  size();
  window.addEventListener("resize", size);
  const PHOTOS = ".hero, .concept img, .concept-strip img, .menu-card .thumb, .xe-photo, .xm-vhut video";
  let holes = [];
  let holesAt = -1e9;
  function photoRects() {
    const out = [];
    document.querySelectorAll(PHOTOS).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < H && r.width > 0 && getComputedStyle(el).opacity !== "0") out.push(r);
    });
    return out;
  }
  let last = 0;
  function tick(t) {
    const dt = Math.min(50, last ? t - last : 16) / 16;
    last = t;
    if (!document.hidden) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
      // 写真の上には雪を降らせない(写真に飾りを重ねない)
      if (t - holesAt > 250) { holes = photoRects(); holesAt = t; }
      ctx.save();
      if (holes.length) {
        ctx.beginPath();
        ctx.rect(0, 0, W, H);
        holes.forEach((r) => ctx.rect(r.left, r.top, r.width, r.height));
        ctx.clip("evenodd");
      }
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
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
