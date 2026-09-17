window.addEventListener("DOMContentLoaded", () => {
    const prefersDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (prefersDark) {
        document.documentElement.setAttribute("data-bs-theme", "dark");
    }
});
