const RULES = [
  {
    match: "spankbang.com",
    title: "Tài liệu học tập lập trình nâng cao",
    favicon: "icons/google-docs.ico"
  },
  {
    match: "viet69.*",
    title: "Học tiếng Anh giao tiếp",
    favicon: "icons/duolingo.ico"
  },
  {
    match: "xvideos.com",
    title: "Học tiếng Anh với người bản xứ",
    favicon: "icons/elsa.png"
  },
  {
    match: "pornhub.com",
    title: "Báo cáo tuần",
    favicon: "icons/google-docs.ico"
  },
  {
    match: "heovl.*",
    title: "Kế hoạch tuần - Google tài liệu",
    favicon: "icons/google-docs.ico"
  },
  {
    match: "heo3x.*",
    title: "Tasks - Google trang tính",
    favicon: "icons/google-sheets.ico"
  }
];

// Thả riêng phím Shift → chuyển tab sang trang này
const SWITCH_URL = "https://chatgpt.com/";
// Đóng tab bằng phím tắt → mở trang này thay vào (bỏ trống = không mở)
const DECOY_URL = "https://docs.google.com/document/u/0/";
// Tắt tiếng tab ngụy trang khi chuyển sang tab khác
const AUTO_MUTE = true;
