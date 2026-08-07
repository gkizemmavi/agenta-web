(function () {
  const KEY = "agenta_lang";

  function currentLang() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("lang");
    if (fromQuery === "tr" || fromQuery === "en") return fromQuery;
    const stored = localStorage.getItem(KEY);
    if (stored === "tr" || stored === "en") return stored;
    const nav = (navigator.language || "tr").toLowerCase();
    return nav.startsWith("tr") ? "tr" : "en";
  }

  function applyLang(lang) {
    localStorage.setItem(KEY, lang);
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-lang]").forEach((el) => {
      el.hidden = el.getAttribute("data-lang") !== lang;
    });
    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      const active = btn.getAttribute("data-lang-btn") === lang;
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
    const title = document.body.getAttribute(`data-title-${lang}`);
    if (title) document.title = title;
  }

  function init() {
    applyLang(currentLang());
    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      btn.addEventListener("click", () => {
        applyLang(btn.getAttribute("data-lang-btn"));
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
