(function () {
  const SHOW_DELTAS_KEY = "SHOW_DELTAS";
  const SHOW_DELTAS_CLASS = "show-deltas";
  const checkbox = document.getElementById("show-deltas");

  function showOrHideDeltas() {
    if (checkbox.checked) {
      document.body.classList.add(SHOW_DELTAS_CLASS);
    } else {
      document.body.classList.remove(SHOW_DELTAS_CLASS);
    }
  }

  checkbox.checked = localStorage.getItem(SHOW_DELTAS_KEY) === "true";
  showOrHideDeltas();

  checkbox.addEventListener("change", () => {
    localStorage.setItem(SHOW_DELTAS_KEY, checkbox.checked);
    showOrHideDeltas();
  });
})();
