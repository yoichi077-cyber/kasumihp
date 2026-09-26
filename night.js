/**
 * 夜カフェの演出: スクロールで昼→夜に変わる
 *
 * 昼の明るい店内写真 → 店内が暗くなる → 星が瞬き、右側から満月がまっすぐ昇る
 * → 「20:30から、夜カフェ。」 → 夜の店内(月のライト)の写真へ → 夜カフェのメニュー
 *
 * 星と月はコードで描く(AI生成の絵は使わない)。
 * スマホの「動きを減らす」設定がオンでも演出は出す(2026-09-26 オーナー判断。入口と同じ理由)。
 */
(function () {
  const sec = document.getElementById("night");
  if (!sec) return;
  const sticky = sec.querySelector(".night-sticky");
  const day = sec.querySelector(".night-day");
  const dark = sec.querySelector(".night-dark");
  const sky = sec.querySelector(".night-sky");
  const moon = sec.querySelector(".night-moon");
  const cap = sec.querySelector(".night-caption");
  const interior = sec.querySelector(".night-interior");

  // 画面4つ分スクロールする間に演出が進む
  const SCREENS = 4;

  // ---- 星空(canvas) ----
  // 星は3段階: たくさんの小さな星(静かに明滅)、中くらいの星(柔らかい光)、
  // ごく少数の明るい星(十字のきらめき+ゆっくりした脈動)。色もわずかに違える。
  const ctx = sky.getContext("2d");
  const COLORS = ["#fff6df", "#f4f0ff", "#ffe9b8", "#dfe9ff"];
  let stars = [];
  let W = 0;
  let H = 0;
  function makeStar(tier) {
    const base = {
      x: Math.random() * W,
      y: Math.random() * H,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      phase: Math.random() * Math.PI * 2,
    };
    if (tier === 0) return Object.assign(base, { tier, r: 0.4 + Math.random() * 0.7, alpha: 0.25 + Math.random() * 0.35, amp: 0.25, speed: 0.15 + Math.random() * 0.35 });
    if (tier === 1) return Object.assign(base, { tier, r: 0.9 + Math.random() * 0.7, alpha: 0.55 + Math.random() * 0.25, amp: 0.35, speed: 0.25 + Math.random() * 0.5, glow: 5 + Math.random() * 4 });
    base.x = Math.random() * W * 0.62; // 明るい星は月(右上)と反対の左側に寄せる
    return Object.assign(base, { tier, r: 1.4 + Math.random() * 0.8, alpha: 0.75, amp: 0.25, speed: 0.18 + Math.random() * 0.3, glow: 12 + Math.random() * 8, spike: 10 + Math.random() * 12 });
  }
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = sticky.clientWidth;
    H = sticky.clientHeight;
    sky.width = Math.max(1, Math.round(W * dpr));
    sky.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((W * H) / 11000);
    stars = [];
    for (let i = 0; i < n; i++) {
      const u = Math.random();
      stars.push(makeStar(u < 0.72 ? 0 : u < 0.95 ? 1 : 2));
    }
  }
  function drawStars(t) {
    ctx.clearRect(0, 0, W, H);
    const sec = t / 1000;
    for (const s of stars) {
      // 0〜1 でゆっくり波打つ。明るい星はときどき「ピカッ」と鋭く光る
      const wave = 0.5 + 0.5 * Math.sin(sec * s.speed * Math.PI * 2 + s.phase);
      const a = Math.min(1, s.alpha + s.amp * (wave * 2 - 1));
      ctx.fillStyle = s.color;
      if (s.tier >= 1) {
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.glow);
        g.addColorStop(0, s.color);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.globalAlpha = a * (s.tier === 2 ? 0.45 : 0.3);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.glow, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = s.color;
      }
      if (s.tier === 2) {
        const flash = Math.pow(wave, 5); // 波の山のときだけ十字が伸びる
        const len = s.spike * (0.35 + 0.65 * flash);
        ctx.globalAlpha = a * (0.35 + 0.65 * flash);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(s.x - len, s.y); ctx.lineTo(s.x + len, s.y);
        ctx.moveTo(s.x, s.y - len); ctx.lineTo(s.x, s.y + len);
        ctx.stroke();
      }
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    drawMeteors(t);
  }

  // ---- 流れ星 ----
  // 月が右上に昇って空いた左側の空に、2.5〜6秒おきに1本、尾を引いて流れる
  let meteors = [];
  let nextMeteorAt = 0;
  function spawnMeteor(t) {
    const x0 = W * (0.04 + Math.random() * 0.5);   // 左半分から
    const y0 = H * (0.04 + Math.random() * 0.36);  // 上のほうから
    const dir = x0 < W * 0.28 ? 1 : -1;            // 端から出たときだけ右下へ、それ以外は左下へ(月を横切らない)
    const ang = 0.45 + Math.random() * 0.5;        // 下向きの角度(ラジアン)
    meteors.push({
      x0, y0, dx: Math.cos(ang) * dir, dy: Math.sin(ang),
      dist: 220 + Math.random() * 260, tail: 90 + Math.random() * 110,
      t0: t, dur: 650 + Math.random() * 450,
    });
  }
  function drawMeteors(t) {
    if (t > nextMeteorAt) {
      spawnMeteor(t);
      nextMeteorAt = t + 2500 + Math.random() * 3500;
    }
    meteors = meteors.filter((m) => t - m.t0 < m.dur);
    ctx.lineCap = "round";
    for (const m of meteors) {
      const k = (t - m.t0) / m.dur;
      const hx = m.x0 + m.dx * m.dist * k;
      const hy = m.y0 + m.dy * m.dist * k;
      const tail = Math.min(m.tail, m.dist * k);
      const tx = hx - m.dx * tail;
      const ty = hy - m.dy * tail;
      const a = Math.sin(Math.PI * k); // 現れて、消える
      const g = ctx.createLinearGradient(tx, ty, hx, hy);
      g.addColorStop(0, "rgba(255,246,223,0)");
      g.addColorStop(1, "rgba(255,246,223," + (0.85 * a).toFixed(3) + ")");
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(hx, hy);
      ctx.stroke();
      ctx.globalAlpha = a;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(hx, hy, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function setHeights() {
    const vh = window.innerHeight;
    sec.style.height = vh * SCREENS + "px";
    sticky.style.height = vh + "px";
    resizeCanvas();
  }

  // 次に出る夜の店内写真の中で、月がどこにあるか(ピクセル実測値)。
  // object-fit: cover で写真がどう切り取られても、画面上の月の中心と直径を計算できる。
  const MOON_IN_PHOTO = {
    landscape: { iw: 1706, ih: 960, cx: 1035, cy: 307, d: 348 },
    portrait: { iw: 960, ih: 1706, cx: 665, cy: 585, d: 355 },
  };
  function photoMoonOnScreen() {
    const img = interior.querySelector("img");
    const src = img.currentSrc || "";
    const key = src ? (src.indexOf("portrait") >= 0 ? "portrait" : "landscape") : (H > W ? "portrait" : "landscape");
    const m = MOON_IN_PHOTO[key];
    const s = Math.max(W / m.iw, H / m.ih); // cover の拡大率
    const ox = (W - m.iw * s) / 2;
    const oy = (H - m.ih * s) / 2;
    return { x: ox + m.cx * s, y: oy + m.cy * s, d: m.d * s };
  }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function ramp(p, a, b) {
    if (p <= a) return 0;
    if (p >= b) return 1;
    return (p - a) / (b - a);
  }

  let visible = false;
  let skyAlpha = 0;
  let starsDrawn = false;

  function update() {
    const rect = sec.getBoundingClientRect();
    const total = sec.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    const p = Math.max(0, Math.min(1, -rect.top / total));
    visible = rect.bottom > 0 && rect.top < window.innerHeight;
    // 暗くなり始めてから下(夜カフェのメニュー・アクセス)まで、上部のバーを夜色にして NIGHT CAFE を添える
    document.body.classList.toggle("is-night", -rect.top > total * 0.15);

    // 0〜0.45: 写真にゆっくり寄る
    day.style.transform = "scale(" + (1 + 0.08 * ramp(p, 0, 0.45)).toFixed(4) + ")";

    // 0.15〜0.40: 店内が暗くなる
    dark.style.opacity = ramp(p, 0.15, 0.36);

    // 0.38〜0.52: 暗くなりきってから、星が出て満月が下から昇る(写真の月と二重に見えないよう少し遅らせる)
    const moonIn = ramp(p, 0.38, 0.5);
    skyAlpha = ramp(p, 0.32, 0.52);

    // 月の位置と大きさ:
    //   0.38〜0.74 次の写真の月と同じ横位置(右側)で、画面の下から真上へまっすぐ昇り、
    //   写真の月の位置・大きさに着地する(横に動かない。着地は写真が出始める 0.78 より前)
    const base = Math.min(0.38 * W, 240); // 昇り始めの直径
    const t = photoMoonOnScreen();
    const k = easeOut(ramp(p, 0.38, 0.74));
    const sy = H + base * 0.6; // 画面の下端の外から
    const mx = t.x;
    const my = sy + (t.y - sy) * k;
    const md = base + (t.d - base) * k;
    moon.style.left = mx.toFixed(1) + "px";
    moon.style.top = my.toFixed(1) + "px";
    moon.style.width = md.toFixed(1) + "px";

    // 0.56〜0.64: 月が昇りきってから文字が浮かぶ → 0.70〜0.76 で消える(月の通り道と重ならない)
    const capIn = Math.min(ramp(p, 0.56, 0.64), 1 - ramp(p, 0.7, 0.76));
    cap.style.opacity = capIn;
    cap.style.transform = "translateY(" + ((1 - capIn) * 12).toFixed(1) + "px)";

    // 0.78〜0.95: 夜の店内写真(月のライト)が浮かび上がる。星は写真と入れ替わりで消える。
    // コードの月は写真の月に重なったまま残し、最後(0.92〜0.99)にすっと消して写真の月に引き継ぐ
    const intIn = ramp(p, 0.78, 0.95);
    interior.style.opacity = intIn;
    moon.style.opacity = Math.min(moonIn, 1 - ramp(p, 0.92, 0.99));
    sky.style.opacity = Math.min(skyAlpha, 1 - intIn);

    // 星は瞬きのループとは別に、スクロールのたびに1回は描いておく
    // (省電力モードなどで requestAnimationFrame が止まっていても星空が空にならないように)
    if (skyAlpha > 0 && !starsDrawn) {
      drawStars(performance.now());
      starsDrawn = true;
    }
  }

  // スクロール処理は1フレームに1回にまとめる。
  // requestAnimationFrame が止まっている状況(裏に隠れたタブなど)でも取り残されないよう、
  // 80ms 経っても呼ばれなければ setTimeout 側で実行する(どちらか早い方が1回だけ動く)。
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

  // 星の瞬きは、星空が見えている間だけ描く(負荷を抑える)
  function loop(t) {
    if (visible && parseFloat(sky.style.opacity || "0") > 0 && !document.hidden) {
      drawStars(t);
      starsDrawn = true;
    }
    requestAnimationFrame(loop);
  }

  setHeights();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    setHeights();
    onScroll();
  });
  update();
  requestAnimationFrame(loop);
})();
