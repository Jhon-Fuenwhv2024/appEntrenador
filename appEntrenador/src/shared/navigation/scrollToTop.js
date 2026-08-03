/**
 * Reset scroll when changing screens.
 * Scroll lives in `.main-content` (and sometimes window with CSS zoom),
 * so Vue remount alone is not enough — browser may restore window scroll.
 *
 * Do NOT touch `.chat-message-list`: the thread scrolls to the latest message.
 */

const SCROLL_ROOT_SELECTORS = [
  '.main-content',
  '.shell-body',
  '.trainer-inbox__list',
];

export function scrollAppToTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  document.querySelectorAll(SCROLL_ROOT_SELECTORS.join(',')).forEach((el) => {
    el.scrollTop = 0;
    el.scrollLeft = 0;
  });
}
