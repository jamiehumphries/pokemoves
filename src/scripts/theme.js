(function () {
  const THEME_KEY = "THEME";

  function useTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
    document.body.classList.forEach((c) => document.body.classList.remove(c));
    document.body.classList.add(theme);
  }

  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) {
    useTheme(savedTheme);
  }

  ["dark", "light"].forEach((theme) => {
    const button = document.getElementById(`use-${theme}-theme`);
    button.addEventListener("click", () => useTheme(theme));
  });
})();
