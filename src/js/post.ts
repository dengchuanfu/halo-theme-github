const backToTop = document.querySelector<HTMLButtonElement>("[data-post-back-to-top]");

if (backToTop) {
  const updateVisibility = () => {
    backToTop.disabled = window.scrollY <= 320;
  };

  backToTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
  window.addEventListener("scroll", updateVisibility, { passive: true });
  updateVisibility();
}
