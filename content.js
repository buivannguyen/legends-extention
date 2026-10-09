(() => {
  const MARK = "data-legend-favicon";
  let rule = null;
  let originalTitle = null;
  let applying = false;
  let observer = null;

  // Cache data URL của các icon nằm trong extension
  const localIcons = {};

  // Chrome không hiển thị favicon dạng chrome-extension:// trên trang web,
  // nên đọc file icon trong extension rồi chuyển thành data: URL.
  function loadLocalIcon(path) {
    if (path in localIcons) return;
    localIcons[path] = null;
    fetch(chrome.runtime.getURL(path))
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          })
      )
      .then((dataUrl) => {
        localIcons[path] = dataUrl;
        apply();
      })
      .catch((err) => console.warn("[Legend] Không tải được icon", path, err));
  }

  function faviconHref(value) {
    if (/^(https?:|data:|blob:)/i.test(value)) return value;
    // Đường dẫn file nằm trong extension, ví dụ "icons/doc.png"
    if (/\.(png|ico|svg|jpe?g|gif|webp)$/i.test(value)) {
      loadLocalIcon(value);
      return localIcons[value]; // null khi chưa tải xong → apply() lại sau khi tải
    }
    // Còn lại coi như emoji/ký tự
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
      `<text y=".9em" font-size="90">${value}</text></svg>`;
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }

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
    const href = faviconHref(rule.favicon);
    if (!href) return;

    document.querySelectorAll(`link[rel~="icon"]:not([${MARK}])`).forEach((el) => el.remove());

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

  // Bấm và thả riêng một phím bổ trợ (không kèm phím nào khác) → thực hiện hành động.
  // Xử lý lúc thả phím để các tổ hợp như Ctrl+C, Shift+A vẫn dùng bình thường.
  const TAP_ACTIONS = {
    // Ctrl → đóng tất cả tab thuộc config
    Control: () => chrome.runtime.sendMessage({ type: "closeAll" }),
    // Shift → chuyển sang ChatGPT
    Shift: () => location.assign("https://chatgpt.com/")
  };

  let armedKey = null;
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.repeat && e.key === armedKey) return;
      const others = [e.ctrlKey && "Control", e.shiftKey && "Shift", e.altKey && "Alt", e.metaKey && "Meta"]
        .filter((k) => k && k !== e.key);
      armedKey = e.key in TAP_ACTIONS && others.length === 0 ? e.key : null;
    },
    true
  );
  window.addEventListener(
    "keyup",
    (e) => {
      if (rule && armedKey && e.key === armedKey) TAP_ACTIONS[armedKey]();
      armedKey = null;
    },
    true
  );
  window.addEventListener("blur", () => (armedKey = null));
  window.addEventListener("mousedown", () => (armedKey = null), true);
  window.addEventListener("wheel", () => (armedKey = null), true);

  // Bấm chuột giữa (con lăn) → đóng tất cả tab thuộc config
  window.addEventListener(
    "mousedown",
    (e) => {
      if (!rule || e.button !== 1) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      chrome.runtime.sendMessage({ type: "closeAll" });
    },
    true
  );

  function evaluate(rules) {
    const next = findRule(rules, location.href);
    if (!next) {
      if (rule) {
        // Rule bị gỡ: khôi phục tiêu đề, bỏ favicon giả
        stopObserver();
        if (originalTitle !== null) document.title = originalTitle;
        document.querySelector(`link[${MARK}]`)?.remove();
      }
      rule = null;
      return;
    }
    if (originalTitle === null) originalTitle = document.title;
    if (rule?.favicon && !next.favicon) document.querySelector(`link[${MARK}]`)?.remove();
    if (rule?.title && !next.title) document.title = originalTitle;
    rule = next;
    apply();
    startObserver();
  }

  let rules = [];
  function update(next) {
    rules = next || RULES;
    evaluate(rules);
  }
  getRules().then(update);
  chrome.storage.onChanged.addListener((changes) => changes.rules && update(changes.rules.newValue));

  // SPA đổi URL không reload trang
  let lastHref = location.href;
  setInterval(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      evaluate(rules);
    }
  }, 1000);
})();
