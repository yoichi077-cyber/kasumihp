/**
 * KASUMI ホームページ 季節テーマ設定
 *
 * 使い方: 下の配列に { id, start, end, heroImage, bannerText, cssClass } を
 * 1つ追加するだけで、新しい季節企画(バレンタイン、夏など)を自動切り替えに追加できる。
 *
 * - start / end は "MM-DD" 形式(年をまたぐ期間にも対応、例: "12-25" 〜 "01-05")
 * - 複数のテーマの期間が重なった場合は、配列の先頭にあるものが優先される
 * - 該当するテーマが無い日は、自動的に通常仕様(デフォルト)のまま表示される
 */

const KASUMI_THEMES = [
  // 例(まだ写真が無いのでコメントアウト中。写真ができたら有効化してください):
  // {
  //   id: "christmas",
  //   start: "11-15",
  //   end: "12-31",
  //   heroImage: "images/hero-christmas.jpg",
  //   bannerText: "🎄 クリスマス企画開催中！",
  //   cssClass: "theme-christmas",
  // },
];
