(() => {
  "use strict";

  const THEME_STORAGE_KEY = "tomichi:theme";
  const DARK_THEME_COLOR = "#171218";
  const LIGHT_THEME_COLOR = "#fff8fb";

  const readSavedTheme = () => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      return savedTheme === "light" || savedTheme === "dark" ? savedTheme : null;
    } catch {
      return null;
    }
  };

  const saveTheme = (theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // O tema ainda funciona durante a sessão quando o armazenamento é bloqueado.
    }
  };

  const updateThemeControls = (theme) => {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const nextTheme = theme === "dark" ? "claro" : "escuro";
      button.setAttribute("aria-label", `Ativar modo ${nextTheme}`);
      button.setAttribute("aria-pressed", String(theme === "dark"));
      button.title = `Ativar modo ${nextTheme}`;
    });

    const themeColor = document.querySelector("[data-theme-color]");
    if (themeColor) {
      themeColor.content = theme === "dark" ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;
    }
  };

  const applyTheme = (theme, persist = false) => {
    document.documentElement.dataset.theme = theme;
    updateThemeControls(theme);
    if (persist) saveTheme(theme);
  };

  const initializeTheme = () => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const savedTheme = readSavedTheme();
    const initialTheme = savedTheme || (mediaQuery.matches ? "dark" : "light");

    applyTheme(initialTheme);

    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const currentTheme = document.documentElement.dataset.theme;
        applyTheme(currentTheme === "dark" ? "light" : "dark", true);
      });
    });

    mediaQuery.addEventListener("change", (event) => {
      if (!readSavedTheme()) applyTheme(event.matches ? "dark" : "light");
    });
  };

  const initializeMenu = () => {
    const toggle = document.querySelector("[data-menu-toggle]");
    const menu = document.querySelector("[data-menu]");
    if (!toggle || !menu) return;

    const setMenuOpen = (isOpen, moveFocus = false) => {
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
      menu.classList.toggle("is-open", isOpen);
      document.body.classList.toggle("menu-open", isOpen);

      if (isOpen && moveFocus) {
        const firstMenuItem = menu.querySelector("a, button");
        window.requestAnimationFrame(() => firstMenuItem?.focus());
      }
    };

    toggle.addEventListener("click", () => {
      const shouldOpen = toggle.getAttribute("aria-expanded") !== "true";
      setMenuOpen(shouldOpen, shouldOpen);
    });

    menu.querySelectorAll("a, button").forEach((item) => {
      item.addEventListener("click", () => setMenuOpen(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenuOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) setMenuOpen(false);
    });
  };

  const initializePasswordToggles = () => {
    document.querySelectorAll("[data-password-toggle]").forEach((button) => {
      const input = document.getElementById(button.dataset.passwordToggle);
      if (!input) return;

      button.setAttribute("aria-label", "Mostrar senha");
      button.addEventListener("click", () => {
        const shouldShowPassword = input.type === "password";
        input.type = shouldShowPassword ? "text" : "password";
        button.textContent = shouldShowPassword ? "ocultar" : "ver";
        button.setAttribute(
          "aria-label",
          shouldShowPassword ? "Ocultar senha" : "Mostrar senha",
        );
      });
    });
  };

  const initializeDemoTasks = () => {
    const list = document.querySelector("[data-demo-task-list]");
    const progress = document.querySelector("[data-demo-progress]");
    const progressCopy = document.querySelector("[data-demo-progress-copy]");
    if (!list || !progress || !progressCopy) return;

    const tasks = [...list.querySelectorAll(".demo-task")];
    const updateProgress = () => {
      const completedTasks = tasks.filter((task) => task.classList.contains("is-done")).length;
      const percentage = tasks.length ? (completedTasks / tasks.length) * 100 : 0;

      progress.setAttribute("aria-valuenow", String(completedTasks));
      progress.querySelector("i").style.width = `${percentage}%`;
      progressCopy.textContent = `${completedTasks} de ${tasks.length}`;
    };

    tasks.forEach((task) => {
      task.addEventListener("click", () => {
        const isDone = task.classList.toggle("is-done");
        task.setAttribute("aria-pressed", String(isDone));
        updateProgress();
      });
    });
  };

  const updateCurrentYear = () => {
    document.querySelectorAll("[data-current-year]").forEach((element) => {
      element.textContent = String(new Date().getFullYear());
    });
  };

  initializeTheme();
  initializeMenu();
  initializePasswordToggles();
  initializeDemoTasks();
  updateCurrentYear();
})();
