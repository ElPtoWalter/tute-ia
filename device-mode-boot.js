(() => {
  "use strict";

  const root = document.documentElement;
  const meta = document.querySelector('meta[name="viewport"]');
  const mobileQuery = window.matchMedia("(max-width: 820px)");

  const applyMode = () => {
    const mode = mobileQuery.matches ? "mobile" : "desktop";
    root.dataset.deviceMode = mode;
    root.dataset.deviceRecommended = mode;
    root.dataset.deviceModeSaved = "true";
    if (meta) {
      meta.setAttribute(
        "content",
        "width=device-width, initial-scale=1, viewport-fit=cover"
      );
    }
  };

  applyMode();
  mobileQuery.addEventListener?.("change", applyMode);
})();
