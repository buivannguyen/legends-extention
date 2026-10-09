function createIconResolver() {
  const cache = {};

  // Chrome không hiển thị favicon dạng chrome-extension:// trên trang web,
  // nên đọc file icon trong extension rồi chuyển thành data: URL.
  function loadLocal(path, onLoad) {
    if (path in cache) return;
    cache[path] = null;
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
        cache[path] = dataUrl;
        onLoad();
      })
      .catch((err) => console.warn("[Legend] Không tải được icon", path, err));
  }

  function escapeXml(text) {
    return text.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
  }

  function emojiIcon(value) {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
      `<text y=".9em" font-size="90">${escapeXml(value)}</text></svg>`;
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }

  // Trả về href, hoặc null khi icon trong extension chưa tải xong (onLoad được gọi khi xong)
  function resolve(value, onLoad) {
    if (/^(https?:|data:|blob:)/i.test(value)) return value;
    // Đường dẫn file nằm trong extension, ví dụ "icons/doc.png"
    if (/\.(png|ico|svg|jpe?g|gif|webp)$/i.test(value)) {
      loadLocal(value, onLoad);
      return cache[value];
    }
    // Còn lại coi như emoji/ký tự
    return emojiIcon(value);
  }

  return { resolve };
}
