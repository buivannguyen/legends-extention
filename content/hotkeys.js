const NON_TEXT_INPUTS = new Set([
  "button", "checkbox", "color", "file", "hidden", "image", "radio", "range", "reset", "submit"
]);

function deepActiveElement() {
  let el = document.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el;
}

// Đang gõ chữ (ô input, textarea, vùng soạn thảo) → không coi là bấm phím tắt
function isTyping() {
  const el = deepActiveElement();
  if (!el) return false;
  if (el.isContentEditable) return true;
  if (el.tagName === "TEXTAREA" || el.tagName === "SELECT") return true;
  if (el.tagName === "INPUT") return !NON_TEXT_INPUTS.has((el.type || "text").toLowerCase());
  return false;
}

// Bấm và thả riêng một phím bổ trợ (không kèm phím nào khác) → gọi taps[key]().
// Xử lý lúc thả phím để các tổ hợp như Ctrl+C, Shift+A vẫn dùng bình thường.
function bindTapKeys({ isActive, taps }) {
  let armedKey = null;
  const disarm = () => (armedKey = null);

  window.addEventListener(
    "keydown",
    (e) => {
      if (e.repeat && e.key === armedKey) return;
      const others = [e.ctrlKey && "Control", e.shiftKey && "Shift", e.altKey && "Alt", e.metaKey && "Meta"]
        .filter((k) => k && k !== e.key);
      armedKey = e.key in taps && others.length === 0 && !isTyping() ? e.key : null;
    },
    true
  );
  window.addEventListener(
    "keyup",
    (e) => {
      if (isActive() && armedKey && e.key === armedKey) taps[armedKey]();
      disarm();
    },
    true
  );
  window.addEventListener("blur", disarm);
  window.addEventListener("mousedown", disarm, true);
  window.addEventListener("wheel", disarm, true);
}

function bindMiddleClick({ isActive, action }) {
  window.addEventListener(
    "mousedown",
    (e) => {
      if (!isActive() || e.button !== 1) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      action();
    },
    true
  );
}
