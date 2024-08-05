(function () {
  const elements = Array.from(document.querySelectorAll("[data-name]"));
  const names = elements.map((el) => el.dataset.name);

  const search = document.getElementById("search");
  const SEARCH_RESET_MS = 3000;

  window.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.key.length > 1) {
      return;
    }
    search.focus();
  });

  let resetTimeout;
  search.addEventListener("input", function () {
    clearTimeout(resetTimeout);
    const i = names.findIndex((name) => name >= search.value.toLowerCase());
    const targetName = i === -1 ? names[names.length - 1] : names[i];
    const targetElement = document.querySelectorAll(
      `[data-name='${targetName}']`,
    )[0];
    targetElement.scrollIntoView();
    resetTimeout = setTimeout(function () {
      search.blur();
    }, SEARCH_RESET_MS);
  });

  search.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === "Escape") {
      search.blur();
    }
  });

  search.addEventListener("blur", function () {
    search.value = "";
  });

  search.style.visibility = "visible";
})();
