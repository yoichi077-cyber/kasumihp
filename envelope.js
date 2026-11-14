/**
 * クリスマス版の入口: 赤い封筒の招待状
 *
 * 封筒の表 → くるっと裏返す → 封ろうが外れて、ふたが開く → 手紙が出てくる
 * → 金色の文字が1行ずつ浮かぶ → 文字が光り、光が画面いっぱいに広がる → クリスマスの店内写真
 *
 * スクロール量(0〜1)で全部の動きを決める(基本版の入口と同じ方式)。
 * JS無効時は .entrance の高さを 0 のままにして、
 * 普通にヘッダー→ヒーローから始まる通常のページとして表示する(壊れない設計)。
 */
(function () {
  const root = document.getElementById("entrance");
  const header = document.querySelector(".site-header");
  const skipBtn = document.getElementById("entranceSkip");
  if (!root || !header) return;
  // スマホの「動きを減らす」設定がオンでも演出は出す(2026-09-26 オーナー判断。基本版と同じ)
  root.classList.add("is-ready"); // JSが動いた時だけ、入口の絵を表示する

  const sticky = root.querySelector(".xe-sticky");
  const env = root.querySelector(".xe-env");
  const front = root.querySelector(".xe-front");
  const back = root.querySelector(".xe-back");
  const flap = root.querySelector(".xe-flap");
  const seal = root.querySelector(".xe-seal");
  const card = root.querySelector(".xe-card");
  const letter = root.querySelector(".xe-letter");
  const lines = Array.from(root.querySelectorAll(".xe-line"));
  const flash = root.querySelector(".xe-flash");
  const photo = root.querySelector(".xe-photo");
  const caption = root.querySelector(".xe-caption");
  const hint = root.querySelector(".scroll-hint");
  const dust = root.querySelector(".xe-dust");
  const ctx = dust.getContext("2d");

  // 画面7つ分スクロールする間に演出が進む(手紙を読む時間を取る)
  const SCREENS = 7;

  let W = 0;
  let H = 0;
  function setHeights() {
    const vh = window.innerHeight;
    root.style.height = vh * (SCREENS + 1) + "px";
    sticky.style.height = vh + "px";
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = sticky.clientWidth;
    H = sticky.clientHeight;
    dust.width = Math.round(W * dpr);
    dust.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function ramp(p, a, b) {
    if (p <= a) return 0;
    if (p >= b) return 1;
    return (p - a) / (b - a);
  }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  // 金の光の粉(文字が光る場面で、手紙のまわりから舞い上がる)
  let glowLevel = 0;
  let visible = true;
  let particles = [];
  function spawn(n) {
    const r = letter.getBoundingClientRect();
    const sr = sticky.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      particles.push({
        x: r.left - sr.left + Math.random() * r.width,
        y: r.top - sr.top + r.height * (0.15 + Math.random() * 0.7),
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.3 - Math.random() * 0.9,
        r: 0.6 + Math.random() * 1.8,
        life: 0,
        max: 60 + Math.random() * 90,
      });
    }
  }
  function drawDust() {
    ctx.clearRect(0, 0, W, H);
    if (glowLevel > 0.02) spawn(Math.ceil(glowLevel * 4));
    particles = particles.filter((q) => q.life < q.max);
    for (const q of particles) {
      q.life++;
      q.x += q.vx;
      q.y += q.vy;
      const a = Math.sin((Math.PI * q.life) / q.max);
      ctx.globalAlpha = a * 0.9;
      const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r * 4);
      g.addColorStop(0, "rgba(255,240,196,1)");
      g.addColorStop(0.35, "rgba(236,198,120,0.6)");
      g.addColorStop(1, "rgba(236,198,120,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.r * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function loop() {
    if (visible && !document.hidden && (glowLevel > 0.02 || particles.length)) drawDust();
    requestAnimationFrame(loop);
  }

  function update() {
    const rect = root.getBoundingClientRect();
    const total = root.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    const p = Math.max(0, Math.min(1, -rect.top / total));
    visible = rect.bottom > 0;

    // 0〜0.10: 封筒の表がふわっと浮かぶ / 0.10〜0.18: 表が横を向き、0.18〜0.26: 裏が正面に戻る
    const enter = ease(ramp(p, 0, 0.06));
    const turnA = ease(ramp(p, 0.1, 0.18));
    const turnB = ease(ramp(p, 0.18, 0.26));
    front.style.transform = `rotateY(${(-90 * turnA).toFixed(2)}deg)`;
    front.style.visibility = turnA >= 1 ? "hidden" : "visible";
    back.style.transform = `rotateY(${(90 * (1 - turnB)).toFixed(2)}deg)`;
    back.style.visibility = p >= 0.18 ? "visible" : "hidden";

    // 0.27〜0.31: 封ろうが外れる / 0.30〜0.40: ふたが上へ開く(半分を過ぎたら手紙の後ろへ回る)
    const sealOff = ramp(p, 0.27, 0.31);
    seal.style.opacity = 1 - sealOff;
    seal.style.transform = `translate(-50%, -50%) scale(${(1 + 0.35 * sealOff).toFixed(3)}) rotate(${(-18 * sealOff).toFixed(1)}deg)`;
    const open = ease(ramp(p, 0.3, 0.4));
    flap.style.transform = `rotateX(${(180 * open).toFixed(2)}deg)`;
    flap.classList.toggle("is-open", open > 0.5);

    // 0.40〜0.50: 手紙が封筒から引き出される
    const pull = ease(ramp(p, 0.4, 0.5));
    card.style.transform = `translateY(${(-62 * pull).toFixed(2)}%)`;

    // 0.50〜0.60: 封筒は下へ沈み、手紙が大きく開いて正面へ
    const out = ease(ramp(p, 0.5, 0.6));
    const floatY = (1 - enter) * 4;
    env.style.transform = `translateY(${(floatY + out * 70).toFixed(2)}vh) scale(${(1 - 0.15 * out).toFixed(3)})`;
    env.style.opacity = 1 - ramp(p, 0.52, 0.6);
    env.style.visibility = p >= 0.6 ? "hidden" : "visible";
    letter.style.opacity = out;
    letter.style.visibility = out > 0 ? "visible" : "hidden";
    letter.style.transform = `translate(-50%, -50%) translateY(${((1 - out) * 12).toFixed(2)}vh) scale(${(0.55 + 0.45 * out).toFixed(3)})`;

    // 0.58〜0.76: 金の文字が1行ずつ浮かぶ
    lines.forEach((ln, i) => {
      const a = 0.58 + i * 0.024;
      const t = ramp(p, a, a + 0.04);
      ln.style.opacity = t;
      ln.style.transform = `translateY(${((1 - t) * 8).toFixed(1)}px)`;
      ln.style.filter = `blur(${((1 - t) * 4).toFixed(2)}px)`;
    });

    // 0.76〜0.86: 文字が光り始め、光の粉が舞う
    glowLevel = ramp(p, 0.76, 0.86) * (1 - ramp(p, 0.9, 0.95));
    letter.style.setProperty("--glow", ramp(p, 0.76, 0.86).toFixed(3));

    // 0.82〜0.90: 光が画面いっぱいに広がる → 0.92〜0.99: 光が引いて、店内写真が現れる
    const burst = ease(ramp(p, 0.82, 0.9));
    flash.style.transform = `translate(-50%, -50%) scale(${(0.2 + 5 * burst).toFixed(3)})`;
    flash.style.opacity = Math.min(ramp(p, 0.82, 0.87), 1 - ramp(p, 0.92, 0.99));
    const showPhoto = p >= 0.9;
    photo.style.opacity = showPhoto ? 1 : 0;
    photo.style.transform = `scale(${(1.08 - 0.08 * ramp(p, 0.9, 1)).toFixed(4)})`;
    if (p >= 0.9) letter.style.visibility = "hidden";

    const cap = ramp(p, 0.94, 0.985);
    caption.style.opacity = cap;
    caption.style.transform = `translateY(${((1 - cap) * 10).toFixed(1)}px)`;

    if (hint) hint.style.opacity = 1 - ramp(p, 0, 0.03);
    header.style.opacity = ramp(p, 0.95, 1);
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    const run = () => {
      if (!ticking) return;
      ticking = false;
      update();
    };
    requestAnimationFrame(run);
    setTimeout(run, 80);
  }

  setHeights();
  header.style.opacity = 0;
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    setHeights();
    onScroll();
  });
  update();
  requestAnimationFrame(loop);

  if (skipBtn) {
    skipBtn.addEventListener("click", () => {
      window.scrollTo({ top: root.offsetHeight, behavior: "auto" });
    });
  }
})();
