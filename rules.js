// Logic so khớp URL với rule, dùng chung cho content script và background.

function wildcardToRegExp(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp("^" + escaped + "$", "i");
}

function matchesRule(match, url) {
  if (!match) return false;
  // Có "://" hoặc "/" → pattern trên toàn URL, ví dụ "*://mail.google.com/*"
  if (match.includes("://") || match.includes("/")) {
    return wildcardToRegExp(match).test(url.href);
  }
  // Còn lại → pattern trên hostname, khớp cả subdomain.
  // Cho phép "*", ví dụ "abc.*" khớp abc.com, abc.net, www.abc.xyz, abc.co.uk
  const host = url.hostname.toLowerCase();
  const target = match.toLowerCase().replace(/^www\./, "");
  const re = wildcardToRegExp(target);
  return host.split(".").some((_, i, parts) => re.test(parts.slice(i).join(".")));
}

function findRule(rules, href) {
  let url;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  return rules.find((r) => matchesRule(r.match, url)) || null;
}
