/**
 * 入口ギミック: 絵本の8場面をスクロールで進んでいく
 *
 * 鍵穴の向こうへ → 草原の小道 → ヤイチ班長に近づく → すれ違う → KASUMIの家 → 扉を抜けて店内へ
 *
 * 絵そのものはイラストレーター(ChatGPT生成)が描いたものを使い、
 * ここではカメラワーク(ズームとクロスフェード)だけを担当している。
 *
 * JS無効時 / prefers-reduced-motion 時は .entrance の高さを 0 のままにして、
 * 普通にヘッダー→ヒーローから始まる通常のページとして表示する(壊れない設計)。
 */
(function () {
  const entrance = document.getElementById("entrance");
  const header = document.querySelector(".site-header");
  const skipBtn = document.getElementById("entranceSkip");
  if (!entrance || !header) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return; // 高さ0のまま = ギミックなしで通常表示

  const sticky = entrance.querySelector(".entrance-sticky");
  const scenes = Array.from(entrance.querySelectorAll(".scene"));
  const captions = Array.from(entrance.querySelectorAll(".scene-caption"));
  const scrollHint = entrance.querySelector(".scroll-hint");
  if (!scenes.length) return;

  // 1場面あたり、画面1つ分ぶんスクロールする
  const SCENE_COUNT = scenes.length;

  // vh単位はモバイルのアドレスバー表示/非表示で変動して scroll 計算が狂うため、
  // window.innerHeight を使って px 固定で高さを与える。
  function setHeights() {
    const vh = window.innerHeight;
    entrance.style.height = vh * (SCENE_COUNT + 1) + "px";
    sticky.style.height = vh + "px";
  }
  setHeights();

  // どの場面で、どの字幕を出すか(場面の番号 → 字幕の番号)
  const CAPTION_AT = { 0: 0, 1: 1, 2: 2, 3: 3 };

  // 0〜1の範囲で a→b の間を 0→1 に補間(クランプ付き)
  function ramp(p, a, b) {
    if (p <= a) return 0;
    if (p >= b) return 1;
    return (p - a) / (b - a);
  }

  function update() {
    const rect = entrance.getBoundingClientRect();
    const total = entrance.offsetHeight - window.innerHeight;
    if (total <= 0) return;

    // rect.top が 0 の時点で entrance の先頭、-total の時点で終端
    let progress = -rect.top / total;
    progress = Math.max(0, Math.min(1, progress));

    // 進み具合を「何場面目の、どのくらい進んだか」に変換する
    const pos = progress * SCENE_COUNT;

    // 場面は「重ねて、上から順にフェードインさせる」方式。
    // 出ていく側を薄くすると、2枚とも半透明になった瞬間に背景が透けて
    // 色が抜けてしまうため、下の場面は不透明のまま残す。
    let topOpaque = 0;
    const opacities = scenes.map((scene, i) => {
      const local = pos - i; // この場面の中での進み具合
      const o = ramp(local, -0.4, 0); // 手前に重なりながらフェードイン
      if (o >= 1) topOpaque = i;
      return o;
    });

    scenes.forEach((scene, i) => {
      const o = opacities[i];
      // 上に完全に覆われている場面は、描画自体を止めて軽くする
      const covered = i < topOpaque;
      scene.style.visibility = covered || o <= 0 ? "hidden" : "visible";
      scene.style.opacity = o;
      if (covered || o <= 0) return;

      // 表示されている間、ゆっくりカメラが寄っていく。
      // その場面に入った時点(local=0)がズームなしの状態。
      const local = pos - i;
      const zoom = parseFloat(scene.style.getPropertyValue("--zoom")) || 1.2;
      const t = Math.max(0, Math.min(1, local));
      const scale = 1 + (zoom - 1) * t;
      const ox = scene.style.getPropertyValue("--origin-x") || "50%";
      const oy = scene.style.getPropertyValue("--origin-y") || "50%";
      scene.style.transformOrigin = `${ox} ${oy}`;
      scene.style.transform = `scale(${scale.toFixed(4)})`;
    });

    // 字幕。その場面の真ん中あたりで、ふわっと出して消す
    captions.forEach((cap, ci) => {
      const sceneIndex = Object.keys(CAPTION_AT).find((k) => CAPTION_AT[k] === ci);
      if (sceneIndex === undefined) return;
      const local = pos - Number(sceneIndex);
      const show = Math.min(ramp(local, 0.05, 0.25), 1 - ramp(local, 0.55, 0.78));
      cap.style.opacity = Math.max(0, show);
      cap.style.transform = `translateY(${(1 - Math.max(0, show)) * 10}px)`;
    });

    // 最初のスクロールを促す案内は、動き出したら消す
    if (scrollHint) scrollHint.style.opacity = 1 - ramp(progress, 0, 0.04);

    // ヘッダーは、最後に本編へ入る直前でふわっと表示
    header.style.opacity = ramp(progress, 0.93, 1);
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }

  function onResize() {
    setHeights();
    onScroll();
  }

  header.style.opacity = 0;
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  update();

  if (skipBtn) {
    skipBtn.addEventListener("click", () => {
      window.scrollTo({ top: entrance.offsetHeight, behavior: "auto" });
    });
  }
})();
