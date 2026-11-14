/**
 * クリスマス版: サンタとトナカイのソリが夜空を駆ける演出
 *
 * ヨーロッパの旧市街の屋根の上で、ソリが左下から右上へ月の前を横切る(後ろに金の光の粉が残る)
 * → カメラがそのまま雪の降る星空をずっと昇っていく(街・月・雲が下へ流れ去る)
 * → 昇りきった星空に金色の文字が浮かぶ → メニュー紹介へ(2026-09-26 オーナー案)
 *
 * 星と月はコードで描く。夜空・屋根・雲・ソリは Codex の水彩画を使う(無い間は仮の図形)。
 * ソリはスクロールに直接つなぐとカクつくので、表示位置をスクロール位置へ少しずつ追いつかせる。
 * スマホの「動きを減らす」設定がオンでも演出は出す(2026-09-26 オーナー判断)。
 */
(function () {
  const sec = document.getElementById("sleigh");
  if (!sec) return;
  const sticky = sec.querySelector(".xs-sticky");
  const skyEl = sec.querySelector(".xs-sky");
  const stars = sec.querySelector(".xs-stars");
  const moon = sec.querySelector(".xs-moon");
  const cloudA = sec.querySelector(".xs-cloud--a");
  const cloudB = sec.querySelector(".xs-cloud--b");
  const roofs = sec.querySelector(".xs-roofs");
  const sleigh = sec.querySelector(".xs-sleigh");
  const trail = sec.querySelector(".xs-trail");
  const caption = sec.querySelector(".xs-caption");
  const dusk = sec.querySelector(".xs-dusk");

  // 空を昇っていく時間と、金色の文字を読む時間を取るため、画面8つ分
  const SCREENS = 8;
  // 空の上のほうほど深い紺にする重ね(昇るほど濃くなる)
  const deep = document.createElement("div");
  deep.className = "xs-deep";
  deep.setAttribute("aria-hidden", "true");
  skyEl.after(deep);
  let starShift = 0;
  const sctx = stars.getContext("2d");
  const tctx = trail.getContext("2d");
  let W = 0;
  let H = 0;
  let starList = [];

  function sizeCanvas(c, g) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function setHeights() {
    const vh = window.innerHeight;
    sec.style.height = vh * SCREENS + "px";
    sticky.style.height = vh + "px";
    W = sticky.clientWidth;
    H = sticky.clientHeight;
    sizeCanvas(stars, sctx);
    sizeCanvas(trail, tctx);
    const n = Math.round((W * H) / 4500);
    starList = [];
    for (let i = 0; i < n; i++) {
      starList.push({
        x: Math.random() * W,
        y: Math.random() * H * 2,
        r: 0.4 + Math.random() * (Math.random() < 0.12 ? 1.6 : 0.8),
        a: 0.3 + Math.random() * 0.5,
        s: 0.2 + Math.random() * 0.6,
        ph: Math.random() * Math.PI * 2,
      });
    }
  }

  function ramp(p, a, b) {
    if (p <= a) return 0;
    if (p >= b) return 1;
    return (p - a) / (b - a);
  }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function drawStars(t) {
    sctx.clearRect(0, 0, W, H);
    const sec2 = t / 1000;
    for (const s of starList) {
      const w = 0.5 + 0.5 * Math.sin(sec2 * s.s * Math.PI * 2 + s.ph);
      sctx.globalAlpha = Math.min(1, s.a * (0.6 + 0.6 * w));
      sctx.fillStyle = "#fff4d6";
      // 空を昇ると、星はゆっくり下へ流れていく(2画面分の星空をくり返す)
      const y = ((s.y + starShift) % (H * 2)) - H * 0.5;
      if (y < -5 || y > H + 5) continue;
      sctx.beginPath();
      sctx.arc(s.x, y, s.r, 0, Math.PI * 2);
      sctx.fill();
    }
    sctx.globalAlpha = 1;
  }

  // ソリの通り道: t=0 左下の画面外 → t=1 右上の画面外。t≈0.66 で月の前を通る
  function sleighPos(t) {
    const x = (-0.3 + 1.6 * t) * W;
    const y = (0.74 - 0.56 * t - 0.06 * Math.sin(Math.PI * t)) * H;
    return { x, y };
  }

  // 金の光の粉
  let dust = [];
  let lastPos = null;
  function emit(pos, backX, backY) {
    if (!lastPos) { lastPos = pos; return; }
    const d = Math.hypot(pos.x - lastPos.x, pos.y - lastPos.y);
    const n = Math.min(24, Math.ceil(d / 3));
    for (let i = 0; i < n; i++) {
      const k = i / n;
      dust.push({
        x: lastPos.x + (pos.x - lastPos.x) * k + backX + (Math.random() - 0.5) * 10,
        y: lastPos.y + (pos.y - lastPos.y) * k + backY + (Math.random() - 0.5) * 10,
        vy: 0.08 + Math.random() * 0.25,
        r: 0.5 + Math.random() * 1.6,
        life: 0,
        max: 90 + Math.random() * 120,
      });
    }
    lastPos = pos;
  }
  function drawTrail() {
    tctx.clearRect(0, 0, W, H);
    dust = dust.filter((q) => q.life < q.max);
    for (const q of dust) {
      q.life++;
      q.y += q.vy;
      const a = 1 - q.life / q.max;
      const tw = 0.6 + 0.4 * Math.sin(q.life * 0.3 + q.x);
      tctx.globalAlpha = a * tw;
      const g = tctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r * 3.5);
      g.addColorStop(0, "rgba(255,244,210,1)");
      g.addColorStop(0.4, "rgba(240,205,130,0.7)");
      g.addColorStop(1, "rgba(240,205,130,0)");
      tctx.fillStyle = g;
      tctx.beginPath();
      tctx.arc(q.x, q.y, q.r * 3.5, 0, Math.PI * 2);
      tctx.fill();
    }
    tctx.globalAlpha = 1;
  }

  let target = 0;   // スクロール位置から決まる進み具合
  let shown = 0;    // 画面に出している進み具合(target へ少しずつ追いつく)
  let visible = false;

  function measure() {
    const rect = sec.getBoundingClientRect();
    const total = sec.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    target = Math.max(0, Math.min(1, -rect.top / total));
    visible = rect.bottom > 0 && rect.top < window.innerHeight;
    document.body.classList.toggle("is-xmas-night", -rect.top > total * 0.08 && rect.bottom > window.innerHeight * 0.4);
  }

  function render(p) {
    // 入りと出口は夜の紺でつなぐ(上下の区画も夜の色)
    // 出口では暗くしない(金色の文字を残したまま、次のメニューへ自然に流れる)
    dusk.style.opacity = (1 - ramp(p, 0, 0.07)).toFixed(3);
    dusk.style.backgroundColor = "#0f1428";

    // 流れ:
    //   0.00〜0.42 屋根の上から、ソリが夜の街を横切る(カメラは少しだけ上がる)
    //   0.40〜0.72 カメラがそのまま雪の降る星空をずっと昇っていく(街・月・雲が下へ流れ去る)
    //   0.64〜0.74 金色の文字が浮かび、そのあとは最後まで消えずに残る(読む時間を取る。2026-09-26 オーナー指示)
    const near = ease(ramp(p, 0.02, 0.42));
    const rise = ease(ramp(p, 0.4, 0.72));
    roofs.style.transform = `translateY(${(near * 16 + rise * 110).toFixed(2)}%)`;
    skyEl.style.transform = `translateY(${(-6 + near * 3 + rise * 8).toFixed(2)}%) scale(1.12)`;
    moon.style.transform = `translate(-50%, -50%) translateY(${(-10 + near * 8 + rise * 95).toFixed(2)}vh)`;
    cloudA.style.transform = `translate(${(-near * 6).toFixed(2)}vw, ${(near * 12 + rise * 130).toFixed(2)}vh)`;
    cloudB.style.transform = `translate(${(near * 5).toFixed(2)}vw, ${(near * 18 + rise * 150).toFixed(2)}vh)`;
    deep.style.opacity = rise.toFixed(3);
    starShift = (near * 0.15 + rise * 1.6) * H;

    // ソリ (0.07〜0.42): 左下から右上へ、月の前を横切る
    const st = ramp(p, 0.07, 0.42);
    const pos = sleighPos(st);
    const w = sleigh.offsetWidth;
    const h = sleigh.offsetHeight;
    const bob = Math.sin(st * Math.PI * 6) * 6;
    const tilt = -10 + 6 * Math.sin(st * Math.PI * 2);
    const sc = 0.72 + 0.28 * st;
    sleigh.style.transform = `translate(${(pos.x - w / 2).toFixed(1)}px, ${(pos.y - h / 2 + bob).toFixed(1)}px) rotate(${tilt.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
    sleigh.style.opacity = st > 0 && st < 1 ? 1 : 0;
    if (st > 0 && st < 1) {
      emit(pos, -w * 0.42 * sc, h * 0.18 * sc); // ソリの後ろ(左下)から粉が出る
    } else {
      lastPos = null;
    }

    // 金色の文字 (昇りきった星空で 0.80〜0.90 に浮かび、最後まで残る)
    const cap = ramp(p, 0.64, 0.74);
    caption.style.opacity = cap.toFixed(3);
    caption.style.transform = `translate(-50%, -50%) translateY(${((1 - cap) * 18).toFixed(1)}px) scale(${(0.94 + 0.06 * cap).toFixed(3)})`;
    caption.style.setProperty("--shine", ramp(p, 0.7, 0.82).toFixed(3));
  }

  let lastLoop = 0;
  function loop(t) {
    const dt = lastLoop ? t - lastLoop : 16;
    lastLoop = t;
    if (visible && !document.hidden) {
      // 0.15秒ほどでスクロール位置に追いつく(コマ落ちしても時間で追いつく)
      shown += (target - shown) * Math.min(1, dt / 150);
      if (Math.abs(target - shown) < 0.0005) shown = target;
      render(shown);
      drawStars(t);
      drawTrail();
    }
    requestAnimationFrame(loop);
  }

  // 省電力などで requestAnimationFrame が止まっていても、スクロールのたびに1回は描く
  function onScroll() {
    measure();
    setTimeout(() => {
      if (!visible) return;
      if (performance.now() - lastLoop > 200) shown = target; // ループが止まっている時だけ一気に合わせる
      render(shown);
      drawStars(performance.now());
    }, 80);
  }

  setHeights();
  measure();
  shown = target;
  render(shown);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    setHeights();
    measure();
  });
  requestAnimationFrame(loop);
})();
