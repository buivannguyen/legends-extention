// Khoá danh sách rule trong popup bằng mã PIN.
// Mã chỉ lưu dạng băm SHA-256 kèm salt. Mở khoá xong giữ trong chrome.storage.session
// (mất khi tắt trình duyệt) đến hết LOCK_AFTER_MINUTES phút.

function createLock() {
  async function hash(pin, salt) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + pin));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function hasPin() {
    const { pin } = await chrome.storage.local.get("pin");
    return !!pin;
  }

  async function isUnlocked() {
    const { unlockedUntil = 0 } = await chrome.storage.session.get("unlockedUntil");
    return Date.now() < unlockedUntil;
  }

  function keepUnlocked() {
    return chrome.storage.session.set({ unlockedUntil: Date.now() + LOCK_AFTER_MINUTES * 60000 });
  }

  function lock() {
    return chrome.storage.session.remove("unlockedUntil");
  }

  async function setPin(value) {
    const salt = crypto.randomUUID();
    await chrome.storage.local.set({ pin: { salt, hash: await hash(value, salt) } });
    return keepUnlocked();
  }

  // Đúng mã → mở khoá, trả về true
  async function unlock(value) {
    const { pin } = await chrome.storage.local.get("pin");
    if (!pin || (await hash(value, pin.salt)) !== pin.hash) return false;
    await keepUnlocked();
    return true;
  }

  function removePin() {
    return chrome.storage.local.remove("pin");
  }

  // Quên mã: xoá mã cùng toàn bộ rule và video yêu thích, để không ai đọc được danh sách bằng cách đặt mã mới.
  // Ghi rules = [] chứ không xoá, nếu không getRules() sẽ trả về danh sách mặc định trong config.js.
  async function reset() {
    await chrome.storage.local.set({ rules: [], bookmarks: [] });
    await chrome.storage.local.remove("pin");
    return lock();
  }

  return { hasPin, isUnlocked, keepUnlocked, lock, setPin, unlock, removePin, reset };
}
