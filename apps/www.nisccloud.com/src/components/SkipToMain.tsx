export function SkipToMain() {
  return (
    <a
      href="#main-content"
      className="skip-to-main"
      onFocus={(event) => event.currentTarget.classList.add("is-shown")}
      onBlur={(event) => event.currentTarget.classList.remove("is-shown")}
      onClick={(event) => {
        const main = document.getElementById("main-content");
        if (!main) return;
        event.preventDefault();
        if (!main.hasAttribute("tabindex")) main.tabIndex = -1;
        main.focus({ preventScroll: true });
        main.scrollIntoView({ block: "start" });
      }}
    >
      Skip to main content
    </a>
  );
}
