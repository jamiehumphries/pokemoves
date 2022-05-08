(function () {
  const THRESHOLD_PIXELS = 5;

  const elements = document.querySelectorAll("[data-name]");
  const fromTop = [...elements];
  const fromBottom = [...elements].reverse();

  window.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      next();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      previous();
    }
  });

  function next() {
    for (const el of fromTop) {
      const { top } = el.getBoundingClientRect();
      if (top > THRESHOLD_PIXELS) {
        window.scrollBy(0, top);
        return;
      }
    }
    window.scrollTo(0, document.body.scrollHeight);
  }

  function previous() {
    for (const el of fromBottom) {
      const { top } = el.getBoundingClientRect();
      if (top < -THRESHOLD_PIXELS) {
        window.scrollBy(0, top);
        return;
      }
    }
    window.scrollTo(0, 0);
  }
})();
