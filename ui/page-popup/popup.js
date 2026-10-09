const tbody = document.querySelector("tbody");
const status = document.getElementById("status");
const btn = document.getElementById("add-current");
const icons = document.getElementById("icons");
let rules = [];
let picking = null;

function save() {
  chrome.storage.local.set({ rules: rules.filter((r) => r.match.trim()) });
}

function render() {
  tbody.replaceChildren(
    ...rules.map((rule, i) => {
      const tr = document.createElement("tr");
      for (const field of ["match", "title", "favicon"]) {
        const input = document.createElement("input");
        input.value = rule[field] || "";
        if (field === "favicon") {
          input.onclick = () => {
            picking = input;
            icons.showPopover({ source: input });
          };
          // Xem trước icon trong ô; emoji thì tự hiện bằng chữ
          (input.oninput = () => {
            const url = input.value && URL.parse(input.value, chrome.runtime.getURL(""));
            input.style.backgroundImage = url ? `url("${url}")` : "";
          })();
        }
        input.onchange = () => {
          rule[field] = input.value;
          save();
        };
        tr.insertCell().append(input);
      }
      const del = document.createElement("button");
      del.textContent = "✕";
      del.onclick = () => {
        rules.splice(i, 1);
        save();
        render();
      };
      tr.insertCell().append(del);
      return tr;
    })
  );
}

icons.onclick = (e) => {
  const opt = e.target.closest("button");
  if (!opt) return;
  picking.value = opt.value;
  picking.oninput();
  picking.onchange();
  icons.hidePopover();
};

document.getElementById("add").onclick = () => {
  rules.push({ match: "", title: "", favicon: "" });
  render();
};

Promise.all([getRules(), chrome.tabs.query({ active: true, currentWindow: true })]).then(([r, [tab]]) => {
  rules = r;
  render();
  if (!/^https?:/.test(tab?.url || "")) return (status.textContent = "Không dùng được trên trang này.");
  if (findRule(rules, tab.url)) return (status.textContent = "Trang này đang được ngụy trang.");
  const host = new URL(tab.url).hostname.replace(/^www\./, "");
  btn.textContent = `+ Ngụy trang trang này (${host})`;
  btn.hidden = false;
  btn.onclick = () => {
    rules.push({ match: host, title: "Kế hoạch tuần - Google Tài liệu", favicon: "icons/google-docs.ico" });
    save();
    render();
    btn.hidden = true;
    status.textContent = "Trang này đang được ngụy trang.";
  };
});

// Khôi phục các tab vừa bị đóng bằng phím tắt
const restore = document.getElementById("restore");
chrome.runtime.sendMessage({ type: "closedCount" }).then((count) => {
  if (!count) return;
  restore.textContent = `↺ Khôi phục ${count} tab vừa đóng`;
  restore.hidden = false;
  restore.onclick = () => chrome.runtime.sendMessage({ type: "restoreClosed" }).then(() => window.close());
});
