// Ngụy trang tiêu đề + favicon của tab theo rule, và giữ nguyên dù trang tự đổi lại.

function createDisguise(iconResolver) {
  const MARK = "data-legend-favicon";
  let rule = null;
  let originalTitle = null;
  let applying = false;
  let observer = null;
  // Favicon gốc của trang bị gỡ ra khi ngụy trang, cất lại để trả về khi bỏ ngụy trang
  let originalIcons = [];

  function computeTitle() {
    return rule.title.replace(/\{title\}/g, originalTitle || "");
  }

  function applyTitle() {
    if (!rule.title) return;
    const wanted = computeTitle();
    if (document.title !== wanted) document.title = wanted;
  }

  function applyFavicon() {
    if (!rule.favicon) return;
    const head = document.head || document.documentElement;
    if (!head) return;
    const href = iconResolver.resolve(rule.favicon, apply);
    if (!href) return;

    document.querySelectorAll(`link[rel~="icon"]:not([${MARK}])`).forEach((el) => {
      originalIcons = originalIcons.filter((old) => old.href !== el.href).concat(el);
      el.remove();
    });

    let link = document.querySelector(`link[${MARK}]`);
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.setAttribute(MARK, "");
      head.appendChild(link);
    }
    if (link.getAttribute("href") !== href) link.href = href;
  }

  function apply() {
    if (!rule || applying) return;
    applying = true;
    try {
      applyTitle();
      applyFavicon();
    } finally {
      applying = false;
    }
  }

  function onMutation() {
    if (applying || !rule) return;
    // Trang tự đổi tiêu đề (SPA) → ghi nhận làm tiêu đề gốc mới
    if (rule.title && document.title !== computeTitle()) {
      originalTitle = document.title;
    }
    apply();
  }

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver(onMutation);
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["href", "rel"]
    });
  }

  function stopObserver() {
    if (observer) observer.disconnect();
    observer = null;
  }

  function restoreTitle() {
    if (originalTitle !== null && document.title !== originalTitle) document.title = originalTitle;
  }

  function restoreFavicon() {
    document.querySelector(`link[${MARK}]`)?.remove();
    const head = document.head || document.documentElement;
    originalIcons.forEach((el) => head.appendChild(el));
    originalIcons = [];
  }

  function enable(next) {
    if (originalTitle === null) originalTitle = document.title;
    rule = next;
    applying = true;
    try {
      if (!rule.title) restoreTitle();
      if (!rule.favicon) restoreFavicon();
    } finally {
      applying = false;
    }
    apply();
    startObserver();
  }

  // Gỡ ngụy trang: khôi phục tiêu đề, bỏ favicon giả
  function disable() {
    if (!rule) return;
    stopObserver();
    rule = null;
    restoreTitle();
    restoreFavicon();
  }

  // Tiêu đề thật của trang, kể cả khi đang ngụy trang
  const realTitle = () => (rule?.title ? originalTitle : document.title);

  return { enable, disable, realTitle };
}
