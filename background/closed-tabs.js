// Lưu trong chrome.storage.session: chỉ nằm trong bộ nhớ, tự mất khi tắt trình duyệt.

function createClosedTabs() {
  const KEY = "closedTabs";

  function remember(tabs) {
    const urls = tabs.map((t) => t.url || t.pendingUrl).filter(Boolean);
    return chrome.storage.session.set({ [KEY]: urls });
  }

  async function count() {
    const { [KEY]: urls = [] } = await chrome.storage.session.get(KEY);
    return urls.length;
  }

  // Mở lại các tab đã nhớ, trả về số tab được mở
  async function restore() {
    const { [KEY]: urls = [] } = await chrome.storage.session.get(KEY);
    await chrome.storage.session.remove(KEY);
    urls.forEach((url, i) => chrome.tabs.create({ url, active: i === urls.length - 1 }));
    return urls.length;
  }

  return { remember, count, restore };
}
