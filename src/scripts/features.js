(function () {
  function setUpFeatureToggle(feature) {
    const SHOW_FEATURE_KEY = "SHOW_" + feature.toUpperCase();
    const SHOW_FEATURE_CLASS = "show-" + feature;
    const checkbox = document.getElementById("show-" + feature);

    function showOrHide() {
      if (checkbox.checked) {
        document.body.classList.add(SHOW_FEATURE_CLASS);
      } else {
        document.body.classList.remove(SHOW_FEATURE_CLASS);
      }
    }

    checkbox.checked = localStorage.getItem(SHOW_FEATURE_KEY) === "true";
    showOrHide();

    checkbox.addEventListener("change", () => {
      localStorage.setItem(SHOW_FEATURE_KEY, checkbox.checked);
      showOrHide();
    });
  }

  setUpFeatureToggle("deltas");
  setUpFeatureToggle("power");
  setUpFeatureToggle("leagues");
})();
