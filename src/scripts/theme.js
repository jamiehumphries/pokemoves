(function () {
  const THEME_KEY = "THEME";
  const themes = ["dark", "light"];

  function useTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
    themes.forEach((t) => document.body.classList.remove(t));
    document.body.classList.add(theme);
  }

  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) {
    useTheme(savedTheme);
  }

  themes.forEach((theme) => {
    const button = document.getElementById(`use-${theme}-theme`);
    button.addEventListener("click", () => useTheme(theme));
  });
})();
