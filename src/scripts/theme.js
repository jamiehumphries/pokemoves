(function () {
  const THEME_KEY = "THEME";
  const themes = ["dark", "light"];

  function useTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
    for (const theme of themes) {
      document.body.classList.remove(theme);
    }
    document.body.classList.add(theme);
  }

  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) {
    useTheme(savedTheme);
  }

  for (const theme of themes) {
    const button = document.getElementById(`use-${theme}-theme`);
    button.addEventListener("click", () => useTheme(theme));
  }
})();
