function todayIsWithin(start, end) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const today = `${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  if (start <= end) {
    return today >= start && today <= end;
  }
  // 年をまたぐ期間(例: 12-25 〜 01-05)
  return today >= start || today <= end;
}

function applySeasonalTheme() {
  const theme = (window.KASUMI_THEMES || []).find((t) =>
    todayIsWithin(t.start, t.end)
  );

  if (!theme) return; // 該当なし → 通常仕様のまま

  document.body.classList.add(theme.cssClass);

  const hero = document.querySelector("[data-hero-image]");
  if (hero && theme.heroImage) {
    hero.style.backgroundImage = `url('${theme.heroImage}')`;
  }

  const banner = document.querySelector("[data-season-banner]");
  if (banner && theme.bannerText) {
    banner.textContent = theme.bannerText;
    banner.hidden = false;
  }
}

document.addEventListener("DOMContentLoaded", applySeasonalTheme);

// ナビの高さ分ずらしてスムーズスクロール(固定ヘッダー対策)
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    const headerH = document.querySelector(".site-header").offsetHeight;
    const y = target.getBoundingClientRect().top + window.scrollY - headerH + 1;
    window.scrollTo({ top: y, behavior: "smooth" });
  });
});
