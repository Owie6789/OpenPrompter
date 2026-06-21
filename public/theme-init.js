(function(){
  function prefersDark() {
    return globalThis.matchMedia?.("(prefers-color-scheme: dark)")?.matches === true;
  }
  try {
    const theme = globalThis.localStorage?.getItem("theme");
    if (theme === "dark" || (theme == null && prefersDark())) {
      document.documentElement.classList.add("dark");
    }
  } catch {
    if (prefersDark()) {
      document.documentElement.classList.add("dark");
    }
  }
})();
