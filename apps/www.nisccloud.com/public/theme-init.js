// Sets the theme class before React loads to avoid a flash of the wrong theme.
// Kept as a file (not inline) so the Content-Security-Policy can forbid inline scripts.
try {
  var theme = localStorage.getItem("theme");
  if (theme === "system" || !theme) {
    theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.classList.add(theme);
} catch (e) {}
