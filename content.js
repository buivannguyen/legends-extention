(() => {
  // Dùng danh sách mặc định ngay để không thoáng hiện tiêu đề thật, rồi cập nhật khi đọc xong storage
  let rules = RULES;
  let rule = null;
  const disguise = createDisguise(createIconResolver());
  const isActive = () => rule !== null;
  const closeAll = () => chrome.runtime.sendMessage({ type: "closeAll" });

  bindTapKeys({
    isActive,
    taps: {
      // Ctrl → đóng tất cả tab thuộc config
      Control: closeAll,
      // Shift → chuyển sang SWITCH_URL (mặc định ChatGPT)
      Shift: () => location.assign(SWITCH_URL)
    }
  });
  // Bấm chuột giữa (con lăn) → đóng tất cả tab thuộc config
  bindMiddleClick({ isActive, action: closeAll });

  function evaluate() {
    rule = findRule(rules, location.href);
    if (rule) disguise.enable(rule);
    else disguise.disable();
  }

  function update(next) {
    rules = next || RULES;
    evaluate();
  }

  evaluate();
  getRules().then(update);
  chrome.storage.onChanged.addListener((changes) => changes.rules && update(changes.rules.newValue));
  // Popup lưu video yêu thích cần tiêu đề thật, tiêu đề tab lúc này là tiêu đề ngụy trang
  chrome.runtime.onMessage.addListener((msg, sender, reply) => msg?.type === "realTitle" && reply(disguise.realTitle()));
  watchUrl(evaluate);
})();
