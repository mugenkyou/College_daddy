(() => {
  const SELECTORS = {
    menuButton: ".menu-button",
    navLinks: ".nav-links",
    navLinksItems: ".nav-link",
    themeToggle: ".theme-toggle",
    themeIcon: ".theme-toggle .theme-icon",
  };

  class NavigationController {
    constructor() {
      this.menuButton = document.querySelector(SELECTORS.menuButton);
      this.navLinks = document.querySelector(SELECTORS.navLinks);
      this.themeToggle = document.querySelector(SELECTORS.themeToggle);
      this.overlay = null;
      this.theme = this.getStoredTheme() || "dark";
    }

    init() {
      this.applyTheme(this.theme);
      this.initThemeToggle();
      this.initMobileMenu();
      this.markActiveLink();
    }

    getStoredTheme() {
      try {
        return localStorage.getItem("theme");
      } catch (_err) {
        return null;
      }
    }

    setStoredTheme(theme) {
      try {
        localStorage.setItem("theme", theme);
      } catch (_err) {
        // Ignore write errors from restricted contexts.
      }
    }

    applyTheme(theme) {
      this.theme = theme;
      document.documentElement.setAttribute("data-theme", theme);
      this.setStoredTheme(theme);
      this.updateThemeIcon();
    }

    updateThemeIcon() {
      const themeIcon = document.querySelector(SELECTORS.themeIcon);
      if (!themeIcon) {
        return;
      }
      themeIcon.innerHTML = this.theme === "dark" ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    }

    initThemeToggle() {
      if (!this.themeToggle) {
        return;
      }
      this.themeToggle.addEventListener("click", (event) => {
        event.preventDefault();
        const nextTheme = this.theme === "dark" ? "light" : "dark";
        this.applyTheme(nextTheme);
      });
    }

    initMobileMenu() {
      if (!this.menuButton || !this.navLinks) {
        return;
      }

      this.menuButton.setAttribute("aria-expanded", "false");
      this.navLinks.setAttribute("id", "site-navigation");
      this.menuButton.setAttribute("aria-controls", "site-navigation");

      this.overlay = document.querySelector(".nav-overlay");
      if (!this.overlay) {
        this.overlay = document.createElement("div");
        this.overlay.className = "nav-overlay";
        document.body.appendChild(this.overlay);
      }

      this.menuButton.addEventListener("click", (event) => {
        event.preventDefault();
        this.toggleMenu();
      });

      this.overlay.addEventListener("click", () => this.closeMenu());

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          this.closeMenu();
        }
      });

      window.addEventListener("resize", () => {
        if (window.innerWidth > 960) {
          this.closeMenu();
        }
      });

      this.navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => this.closeMenu());
      });
    }

    toggleMenu() {
      if (!this.navLinks) {
        return;
      }
      const isActive = this.navLinks.classList.toggle("active");
      this.overlay?.classList.toggle("active", isActive);
      this.menuButton?.setAttribute(
        "aria-expanded",
        isActive ? "true" : "false",
      );
      document.body.style.overflow = isActive ? "hidden" : "";
    }

    closeMenu() {
      if (!this.navLinks) {
        return;
      }
      this.navLinks.classList.remove("active");
      this.overlay?.classList.remove("active");
      this.menuButton?.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }

    markActiveLink() {
      const navLinks = document.querySelectorAll(SELECTORS.navLinksItems);
      if (!navLinks.length) {
        return;
      }

      const normalize = (value) =>
        value
          .toLowerCase()
          .replace(/\/index\.html$/, "/")
          .replace(/\/$/, "") || "/";

      const current = normalize(window.location.pathname);

      navLinks.forEach((link) => {
        const href = link.getAttribute("href");
        if (!href || href.startsWith("#")) {
          return;
        }
        const path = normalize(new URL(href, window.location.href).pathname);
        if (path === current) {
          link.classList.add("active");
          link.setAttribute("aria-current", "page");
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const navigationController = new NavigationController();
    navigationController.init();
  });
})();
