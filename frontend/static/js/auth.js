(() => {
  "use strict";

  const SESSION_PROFILE_KEY = "tomichi:session-profile";
  const form = document.querySelector("[data-auth-form]");
  if (!form) return;

  const formType = form.dataset.authForm;
  const notice = form.querySelector("[data-form-notice]");
  const submitButton = form.querySelector('button[type="submit"]');
  const submitLabel = form.querySelector("[data-submit-label]");
  const defaultSubmitLabel = submitLabel?.textContent || "Enviar";

  const clearFeedback = () => {
    form.querySelectorAll("[data-error-for]").forEach((element) => {
      element.textContent = "";
    });
    form.querySelectorAll("[aria-invalid='true']").forEach((input) => {
      input.removeAttribute("aria-invalid");
    });
    if (notice) {
      notice.hidden = true;
      notice.textContent = "";
    }
  };

  const showNotice = (message) => {
    if (!notice) return;
    notice.textContent = message;
    notice.hidden = false;
  };

  const showFieldError = (fieldName, message) => {
    const input = form.elements.namedItem(fieldName);
    const errorTarget = form.querySelector(`[data-error-for="${fieldName}"]`);

    if (input instanceof HTMLElement) input.setAttribute("aria-invalid", "true");
    if (errorTarget) errorTarget.textContent = message;
  };

  const setBusy = (isBusy, busyLabel) => {
    form.setAttribute("aria-busy", String(isBusy));
    if (submitButton) submitButton.disabled = isBusy;
    if (submitLabel) submitLabel.textContent = isBusy ? busyLabel : defaultSubmitLabel;
  };

  const parseResponse = async (response) => {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return null;

    try {
      return await response.json();
    } catch {
      return null;
    }
  };

  const mapValidationErrors = (detail) => {
    if (!Array.isArray(detail)) return false;

    detail.forEach((item) => {
      const fieldName = Array.isArray(item.loc) ? item.loc.at(-1) : null;
      if (typeof fieldName === "string") {
        showFieldError(fieldName, "Revise este campo.");
      }
    });
    return true;
  };

  const registerErrorMessage = (response, body) => {
    const detail = typeof body?.detail === "string" ? body.detail.toLowerCase() : "";
    const hasValidationErrors = mapValidationErrors(body?.detail);

    if (detail.includes("username")) {
      showFieldError("username", "Esse nome de usuário já está em uso.");
      return "Escolha outro nome de usuário para continuar.";
    }
    if (detail.includes("email")) {
      showFieldError("email", "Esse e-mail já está cadastrado.");
      return "Entre com a conta existente ou use outro e-mail.";
    }
    if (response.status === 422 || hasValidationErrors) {
      return "Alguns dados não passaram pela validação. Revise os campos destacados.";
    }
    return "Não foi possível criar sua conta agora. Tente novamente em alguns instantes.";
  };

  const loginErrorMessage = (response, body) => {
    const hasValidationErrors = mapValidationErrors(body?.detail);
    if (response.status === 401 || response.status === 404) {
      return "Usuário ou senha inválidos.";
    }
    if (response.status === 422 || hasValidationErrors) {
      return "Revise o nome de usuário e a senha.";
    }
    return "Não foi possível entrar agora. Tente novamente em alguns instantes.";
  };

  const buildRegisterPayload = (data) => ({
    username: String(data.get("username") || "").trim(),
    first_name: String(data.get("first_name") || "").trim(),
    last_name: String(data.get("last_name") || "").trim(),
    email: String(data.get("email") || "").trim(),
    password: String(data.get("password") || ""),
  });

  const buildLoginPayload = (data) => ({
    username: String(data.get("username") || "").trim(),
    password: String(data.get("password") || ""),
  });

  const savePresentationProfile = (body) => {
    if (!body || typeof body.user_id !== "number") return false;

    const profile = {
      user_id: body.user_id,
      username: typeof body.username === "string" ? body.username : "",
      first_name: typeof body.first_name === "string" ? body.first_name : "",
      last_name: typeof body.last_name === "string" ? body.last_name : "",
      email: typeof body.email === "string" ? body.email : "",
      created_at: typeof body.created_at === "string" ? body.created_at : null,
    };

    try {
      sessionStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(profile));
    } catch {
      return false;
    }
    return true;
  };

  const finishRegistration = (firstName) => {
    const success = document.querySelector("[data-register-success]");
    if (!success) return;

    const createdUser = success.querySelector("[data-created-user]");
    if (createdUser) createdUser.textContent = firstName;
    form.hidden = true;
    success.hidden = false;
    success.focus();
  };

  const redirectAfterLogin = (body) => {
    if (!savePresentationProfile(body)) {
      showNotice("O login foi aceito, mas a API não devolveu o perfil esperado.");
      return;
    }

    const destination = form.dataset.successUrl || "/logged/dashboard";
    window.location.assign(destination);
  };

  const initializePasswordStrength = () => {
    const password = form.elements.namedItem("password");
    const strength = form.querySelector("[data-password-strength]");
    if (!(password instanceof HTMLInputElement) || !strength) return;

    password.addEventListener("input", () => {
      const value = password.value;
      if (!value) {
        strength.textContent = "";
        strength.dataset.level = "";
        return;
      }

      const checks = [
        value.length >= 12,
        /[a-z]/.test(value) && /[A-Z]/.test(value),
        /\d/.test(value),
        /[^A-Za-z0-9]/.test(value),
      ];
      const score = value.length < 8 ? 0 : 1 + checks.filter(Boolean).length;
      const labels = ["muito curta", "básica", "razoável", "boa", "forte", "muito forte"];

      strength.textContent = `Força estimada: ${labels[score]}.`;
      strength.dataset.level = String(score);
    });
  };

  const validateRegisterConfirmation = () => {
    const password = form.elements.namedItem("password");
    const confirmation = form.elements.namedItem("confirm_password");
    if (!(password instanceof HTMLInputElement) || !(confirmation instanceof HTMLInputElement)) {
      return true;
    }
    if (password.value === confirmation.value) return true;

    showFieldError("confirm_password", "As duas senhas precisam ser iguais.");
    confirmation.focus();
    return false;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFeedback();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (formType === "register" && !validateRegisterConfirmation()) return;

    const data = new FormData(form);
    const payload = formType === "register"
      ? buildRegisterPayload(data)
      : buildLoginPayload(data);
    const busyLabel = formType === "register" ? "Criando sua conta…" : "Entrando…";

    setBusy(true, busyLabel);

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const body = await parseResponse(response);

      if (!response.ok) {
        const message = formType === "register"
          ? registerErrorMessage(response, body)
          : loginErrorMessage(response, body);
        showNotice(message);
        return;
      }

      if (formType === "register") {
        finishRegistration(payload.first_name);
      } else {
        redirectAfterLogin(body);
      }
    } catch {
      showNotice("Não foi possível falar com o servidor. Confirme se o FastAPI está rodando.");
    } finally {
      setBusy(false, busyLabel);
    }
  });

  initializePasswordStrength();
})();
