function watchUrl(onChange) {
  let lastHref = location.href;
  const check = () => {
    if (location.href === lastHref) return;
    lastHref = location.href;
    onChange();
  };

  // Navigation API bắt được cả pushState/replaceState của trang
  if (window.navigation) {
    navigation.addEventListener("navigatesuccess", check);
    navigation.addEventListener("currententrychange", check);
  }
  window.addEventListener("popstate", check);
  window.addEventListener("hashchange", check);
  // Dự phòng cho trình duyệt chưa có Navigation API
  if (!window.navigation) setInterval(check, 1000);
}
