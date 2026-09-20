(() => {
  "use strict";

  const root = document.documentElement;
  const mobileQuery = window.matchMedia("(max-width: 820px)");

  const updateViewport = () => {
    const height = Math.round(
      window.visualViewport?.height ||
      window.innerHeight ||
      document.documentElement.clientHeight
    );
    root.style.setProperty("--mobile-vh", `${height}px`);
    root.dataset.deviceMode = mobileQuery.matches ? "mobile" : "desktop";
  };

  updateViewport();
  window.addEventListener("resize", updateViewport, { passive: true });
  window.addEventListener("orientationchange", updateViewport, { passive: true });
  window.visualViewport?.addEventListener("resize", updateViewport, { passive: true });
  mobileQuery.addEventListener?.("change", updateViewport);
})();
