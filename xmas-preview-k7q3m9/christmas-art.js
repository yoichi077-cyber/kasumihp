/**
 * クリスマス版: Codex が描いた絵の差し替え
 *
 * data-art="images/christmas/xxx.png" を持つ要素について、その絵が読み込めたら
 * 背景に敷いて .has-art を付ける。まだ保存されていない絵は読み込みに失敗するので、
 * CSS で描いた仮の図形のまま表示される(絵が届いたら、何もしなくても差し替わる)。
 */
(function () {
  document.querySelectorAll("[data-art]").forEach((el) => {
    const src = el.getAttribute("data-art");
    const img = new Image();
    img.onload = () => {
      el.style.backgroundImage = `url("${src}")`;
      el.style.setProperty("--art", `url("${src}")`); // 灯りのまたたきを、絵の形の中だけに出すため
      el.classList.add("has-art");
    };
    img.src = src;
  });
})();
