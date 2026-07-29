(() => {
  "use strict";

  const SESSION_PROFILE_KEY = "tomichi:session-profile";
  const PLACEHOLDER_MARKER = "ATENÇÃO!!!!!!!!!!!!";
  const API_ROUTES = Object.freeze({
    currentUser: "[-------ATENÇÃO!!!!!!!!!!!!----------SUBSTITUIR-AQUI-POR:-----{[(current_user_endpoint)]}-----------]",
    listTasks: (userId) => `/${encodeURIComponent(userId)}/tasks`,
    createTask: (userId) => `/${encodeURIComponent(userId)}/create_task`,
    updateTask: "[-------ATENÇÃO!!!!!!!!!!!!----------SUBSTITUIR-AQUI-POR:-----{[(update_task_endpoint)]}-----------]",
    deleteTask: "[-------ATENÇÃO!!!!!!!!!!!!----------SUBSTITUIR-AQUI-POR:-----{[(delete_task_endpoint)]}-----------]",
    logout: "[-------ATENÇÃO!!!!!!!!!!!!----------SUBSTITUIR-AQUI-POR:-----{[(logout_endpoint)]}-----------]",
  });

  const dashboard = document.querySelector("[data-dashboard]");
  if (!dashboard) return;

  const elements = {
    userFirstName: dashboard.querySelector("[data-user-first-name]"),
    userUsername: dashboard.querySelector("[data-user-username]"),
    userEmail: dashboard.querySelector("[data-user-email]"),
    totalTasks: dashboard.querySelector("[data-total-tasks]"),
    upcomingTasks: dashboard.querySelector("[data-upcoming-tasks]"),
    overdueTasks: dashboard.querySelector("[data-overdue-tasks]"),
    undatedTasks: dashboard.querySelector("[data-undated-tasks]"),
    taskList: dashboard.querySelector("[data-task-list]"),
    taskTemplate: dashboard.querySelector("[data-task-template]"),
    loadingState: dashboard.querySelector("[data-task-loading]"),
    errorState: dashboard.querySelector("[data-task-error]"),
    errorMessage: dashboard.querySelector("[data-task-error-message]"),
    emptyState: dashboard.querySelector("[data-task-empty]"),
    emptyTitle: dashboard.querySelector("[data-empty-title]"),
    emptyCopy: dashboard.querySelector("[data-empty-copy]"),
    search: dashboard.querySelector("[data-task-search]"),
    filters: [...dashboard.querySelectorAll("[data-task-filter]")],
    taskDialog: document.querySelector("[data-task-dialog]"),
    taskForm: document.querySelector("[data-task-form]"),
    taskDialogEyebrow: document.querySelector("[data-task-dialog-eyebrow]"),
    taskDialogTitle: document.querySelector("[data-task-dialog-title]"),
    taskSubmitLabel: document.querySelector("[data-task-submit-label]"),
    taskFormNotice: document.querySelector("[data-task-form-notice]"),
    titleCount: document.querySelector("[data-title-count]"),
    contentCount: document.querySelector("[data-content-count]"),
    deleteDialog: document.querySelector("[data-delete-dialog]"),
    deleteTaskTitle: document.querySelector("[data-delete-task-title]"),
    deleteNotice: document.querySelector("[data-delete-notice]"),
    deleteLabel: document.querySelector("[data-delete-label]"),
    confirmDelete: document.querySelector("[data-confirm-delete]"),
    toast: document.querySelector("[data-dashboard-notice]"),
    openTaskButtons: [...document.querySelectorAll("[data-open-task-dialog]")],
  };

  const state = {
    user: null,
    tasks: [],
    filter: "all",
    search: "",
    editingTaskId: null,
    deletingTaskId: null,
    dialogTrigger: null,
    loadSequence: 0,
    toastTimer: null,
    viewStatus: "loading",
  };

  const isUnresolvedPlaceholder = (value) => (
    typeof value !== "string" || value.includes(PLACEHOLDER_MARKER)
  );

  const buildEndpoint = (route, userId, taskId = "") => (
    route
      .replaceAll("{user_id}", encodeURIComponent(userId))
      .replaceAll("{task_id}", encodeURIComponent(taskId))
  );

  const parseJsonResponse = async (response) => {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return null;
    try {
      return await response.json();
    } catch {
      return null;
    }
  };

  const request = async (url, options = {}) => {
    const headers = {
      "Accept": "application/json",
      ...(options.body ? {"Content-Type": "application/json"} : {}),
      ...(options.headers || {}),
    };
    const response = await fetch(url, {
      ...options,
      credentials: options.credentials || "same-origin",
      headers,
    });
    const body = await parseJsonResponse(response);
    return {response, body};
  };

  const readCachedProfile = () => {
    try {
      const profile = JSON.parse(sessionStorage.getItem(SESSION_PROFILE_KEY));
      return profile && Number.isInteger(profile.user_id) ? profile : null;
    } catch {
      return null;
    }
  };

  const clearCachedProfile = () => {
    try {
      sessionStorage.removeItem(SESSION_PROFILE_KEY);
    } catch {
      // A navegação continua mesmo quando o armazenamento está bloqueado.
    }
  };

  const saveCachedProfile = (profile) => {
    try {
      sessionStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // O perfil continua disponível em memória durante esta página.
    }
  };

  const getTemplateUserId = () => {
    const value = dashboard.dataset.userId;
    if (isUnresolvedPlaceholder(value)) return null;
    const userId = Number(value);
    return Number.isInteger(userId) && userId > 0 ? userId : null;
  };

  const normalizeProfile = (profile) => {
    if (!profile || !Number.isInteger(Number(profile.user_id))) return null;
    return {
      user_id: Number(profile.user_id),
      username: typeof profile.username === "string" ? profile.username : "",
      first_name: typeof profile.first_name === "string" ? profile.first_name : "",
      last_name: typeof profile.last_name === "string" ? profile.last_name : "",
      email: typeof profile.email === "string" ? profile.email : "",
      created_at: typeof profile.created_at === "string" ? profile.created_at : null,
    };
  };

  const getRenderedProfileValue = (element, removeAtSign = false) => {
    const value = element?.textContent.trim() || "";
    if (!value || isUnresolvedPlaceholder(value)) return "";
    return removeAtSign ? value.replace(/^@/, "") : value;
  };

  const getTemplateProfile = () => {
    const userId = getTemplateUserId();
    if (!userId) return null;
    return normalizeProfile({
      user_id: userId,
      first_name: getRenderedProfileValue(elements.userFirstName),
      username: getRenderedProfileValue(elements.userUsername, true),
      email: getRenderedProfileValue(elements.userEmail),
    });
  };

  const hydrateProfile = (profile) => {
    state.user = profile;
    dashboard.dataset.userId = String(profile.user_id);

    if (elements.userFirstName) {
      elements.userFirstName.textContent = profile.first_name || profile.username || "por aqui";
    }
    if (elements.userUsername) {
      elements.userUsername.textContent = profile.username ? `@${profile.username}` : "usuário Tomichi";
    }
    if (elements.userEmail) {
      elements.userEmail.textContent = profile.email || "E-mail não informado pela API";
    }
  };

  const loadCurrentUser = async () => {
    const cachedProfile = normalizeProfile(readCachedProfile());

    if (!isUnresolvedPlaceholder(API_ROUTES.currentUser)) {
      let result;
      try {
        result = await request(API_ROUTES.currentUser);
      } catch {
        throw new Error("Não foi possível consultar o usuário atual.");
      }

      if (!result.response.ok) {
        if (result.response.status === 401 || result.response.status === 403) {
          clearCachedProfile();
          throw new Error("Sua sessão expirou. Entre novamente.");
        }
        throw new Error("Não foi possível validar o usuário atual.");
      }

      const apiProfile = normalizeProfile(result.body);
      if (!apiProfile) throw new Error("A API devolveu um perfil de usuário inválido.");
      saveCachedProfile(apiProfile);
      return apiProfile;
    }

    if (cachedProfile) return cachedProfile;

    return getTemplateProfile();
  };

  const normalizeTask = (task) => {
    if (!task || task.task_id === undefined || typeof task.title !== "string") return null;
    return {
      task_id: task.task_id,
      user_id: task.user_id,
      title: task.title,
      content: typeof task.content === "string" ? task.content : "",
      due_date: typeof task.due_date === "string" ? task.due_date : null,
      created_at: typeof task.created_at === "string" ? task.created_at : null,
      updated_at: typeof task.updated_at === "string" ? task.updated_at : null,
    };
  };

  const parseDate = (value) => {
    if (!value) return null;
    const hasExplicitTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
    const normalizedValue = (
      typeof value === "string"
      && value.includes("T")
      && !hasExplicitTimezone
    ) ? `${value}Z` : value;
    const date = new Date(normalizedValue);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatDateTime = (value, fallback = "Não informado") => {
    const date = parseDate(value);
    if (!date) return fallback;
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  };

  const normalizeDateTimeAttribute = (value) => {
    const date = parseDate(value);
    return date ? date.toISOString() : "";
  };

  const formatShortDate = (date) => (
    new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
    }).format(date)
  );

  const isSameLocalDay = (firstDate, secondDate) => (
    firstDate.getFullYear() === secondDate.getFullYear()
    && firstDate.getMonth() === secondDate.getMonth()
    && firstDate.getDate() === secondDate.getDate()
  );

  const getDeadlinePresentation = (value) => {
    const dueDate = parseDate(value);
    if (!dueDate) {
      return {label: "Sem prazo", className: "deadline-badge--undated", title: "Sem prazo definido"};
    }

    const now = new Date();
    if (dueDate.getTime() < now.getTime()) {
      return {
        label: "Prazo vencido",
        className: "deadline-badge--overdue",
        title: formatDateTime(value),
      };
    }
    if (isSameLocalDay(dueDate, now)) {
      return {label: "Prazo hoje", className: "deadline-badge--today", title: formatDateTime(value)};
    }
    return {
      label: `Prazo ${formatShortDate(dueDate)}`,
      className: "deadline-badge--upcoming",
      title: formatDateTime(value),
    };
  };

  const setStateVisibility = (activeState) => {
    const toolbarEnabled = activeState === "list" || activeState === "empty";
    state.viewStatus = activeState;
    elements.loadingState.hidden = activeState !== "loading";
    elements.errorState.hidden = activeState !== "error";
    elements.emptyState.hidden = activeState !== "empty";
    elements.taskList.hidden = activeState !== "list";
    elements.search.disabled = !toolbarEnabled;
    elements.filters.forEach((button) => {
      button.disabled = !toolbarEnabled;
    });
  };

  const updateSummary = () => {
    const now = new Date();
    const datedTasks = state.tasks.filter((task) => parseDate(task.due_date));
    const upcoming = datedTasks.filter((task) => parseDate(task.due_date) >= now).length;
    const overdue = datedTasks.filter((task) => parseDate(task.due_date) < now).length;
    const undated = state.tasks.length - datedTasks.length;

    elements.totalTasks.textContent = String(state.tasks.length);
    elements.upcomingTasks.textContent = String(upcoming);
    elements.overdueTasks.textContent = String(overdue);
    elements.undatedTasks.textContent = String(undated);
  };

  const taskMatchesView = (task) => {
    const normalizedSearch = state.search.toLocaleLowerCase("pt-BR");
    const searchableText = `${task.title} ${task.content}`.toLocaleLowerCase("pt-BR");
    const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
    const hasDate = Boolean(parseDate(task.due_date));
    const matchesFilter = (
      state.filter === "all"
      || (state.filter === "dated" && hasDate)
      || (state.filter === "undated" && !hasDate)
    );
    return matchesSearch && matchesFilter;
  };

  const createTaskCard = (task) => {
    const fragment = elements.taskTemplate.content.cloneNode(true);
    const card = fragment.querySelector("[data-task-card]");
    const title = fragment.querySelector("[data-task-title]");
    const content = fragment.querySelector("[data-task-content]");
    const deadline = fragment.querySelector("[data-task-deadline]");
    const createdAt = fragment.querySelector("[data-task-created]");
    const updatedAt = fragment.querySelector("[data-task-updated]");
    const editButton = fragment.querySelector("[data-edit-task]");
    const deleteButton = fragment.querySelector("[data-delete-task]");
    const deadlinePresentation = getDeadlinePresentation(task.due_date);

    card.dataset.taskId = String(task.task_id);
    title.textContent = task.title;
    content.textContent = task.content;
    deadline.textContent = deadlinePresentation.label;
    deadline.title = deadlinePresentation.title;
    deadline.classList.add(deadlinePresentation.className);

    createdAt.textContent = formatDateTime(task.created_at);
    if (task.created_at) createdAt.dateTime = normalizeDateTimeAttribute(task.created_at);
    updatedAt.textContent = formatDateTime(task.updated_at, "Ainda não atualizada");
    if (task.updated_at) updatedAt.dateTime = normalizeDateTimeAttribute(task.updated_at);

    editButton.setAttribute("aria-label", `Editar task: ${task.title}`);
    deleteButton.setAttribute("aria-label", `Excluir task: ${task.title}`);
    return fragment;
  };

  const renderTasks = () => {
    const visibleTasks = state.tasks.filter(taskMatchesView);
    elements.taskList.replaceChildren();
    updateSummary();

    if (!visibleTasks.length) {
      const hasTasks = state.tasks.length > 0;
      elements.emptyTitle.textContent = hasTasks
        ? "Nenhuma task combina com esse filtro."
        : "Sua lista ainda está vazia.";
      elements.emptyCopy.textContent = hasTasks
        ? "Ajuste a busca ou mostre todas as tasks."
        : "Crie a primeira task e deixe o próximo passo mais visível.";
      setStateVisibility("empty");
      return;
    }

    visibleTasks.forEach((task) => {
      elements.taskList.append(createTaskCard(task));
    });
    setStateVisibility("list");
  };

  const loadTasks = async () => {
    if (!state.user) return;
    const currentLoad = ++state.loadSequence;
    setStateVisibility("loading");

    try {
      const {response, body} = await request(API_ROUTES.listTasks(state.user.user_id));
      if (currentLoad !== state.loadSequence) return;

      if (response.status === 404) {
        const detail = typeof body?.detail === "string" ? body.detail.toLowerCase() : "";
        if (detail.includes("user")) {
          throw new Error("O usuário atual não foi encontrado pela API.");
        }
        state.tasks = [];
        renderTasks();
        return;
      }
      if (!response.ok || !Array.isArray(body)) {
        throw new Error("A API não devolveu uma lista de tasks válida.");
      }

      state.tasks = body.map(normalizeTask).filter(Boolean);
      renderTasks();
    } catch (error) {
      if (currentLoad !== state.loadSequence) return;
      elements.errorMessage.textContent = error instanceof Error
        ? error.message
        : "Tente novamente em alguns instantes.";
      setStateVisibility("error");
    }
  };

  const showToast = (message, type = "success") => {
    if (!elements.toast) return;
    window.clearTimeout(state.toastTimer);
    elements.toast.textContent = message;
    elements.toast.dataset.type = type;
    elements.toast.hidden = false;
    state.toastTimer = window.setTimeout(() => {
      elements.toast.hidden = true;
    }, 4500);
  };

  const clearTaskFormFeedback = () => {
    elements.taskForm.querySelectorAll("[data-task-error-for]").forEach((element) => {
      element.textContent = "";
    });
    elements.taskForm.querySelectorAll("[aria-invalid='true']").forEach((input) => {
      input.removeAttribute("aria-invalid");
    });
    elements.taskFormNotice.textContent = "";
    elements.taskFormNotice.hidden = true;
  };

  const showTaskFormNotice = (message) => {
    elements.taskFormNotice.textContent = message;
    elements.taskFormNotice.hidden = false;
  };

  const showTaskFieldError = (fieldName, message) => {
    const input = elements.taskForm.elements.namedItem(fieldName);
    const target = elements.taskForm.querySelector(`[data-task-error-for="${fieldName}"]`);
    if (input instanceof HTMLElement) input.setAttribute("aria-invalid", "true");
    if (target) target.textContent = message;
  };

  const updateCharacterCounts = () => {
    elements.titleCount.textContent = String(elements.taskForm.elements.title.value.length);
    elements.contentCount.textContent = String(elements.taskForm.elements.content.value.length);
  };

  const toDateTimeLocalValue = (value) => {
    const date = parseDate(value);
    if (!date) return "";
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 16);
  };

  const restoreDialogFocus = () => {
    if (state.dialogTrigger instanceof HTMLElement) state.dialogTrigger.focus();
    state.dialogTrigger = null;
  };

  const useStableDialogReturnTarget = () => {
    state.dialogTrigger = dashboard.querySelector(".task-section__heading [data-open-task-dialog]");
  };

  const openTaskDialog = (task = null, trigger = null) => {
    if (!state.user) {
      showToast("Não foi possível identificar o usuário atual.", "error");
      return;
    }

    state.editingTaskId = task?.task_id ?? null;
    state.dialogTrigger = trigger;
    elements.taskForm.reset();
    clearTaskFormFeedback();

    elements.taskForm.elements.task_id.value = task ? String(task.task_id) : "";
    elements.taskForm.elements.title.value = task?.title || "";
    elements.taskForm.elements.content.value = task?.content || "";
    elements.taskForm.elements.due_date.value = toDateTimeLocalValue(task?.due_date);

    const editing = Boolean(task);
    elements.taskDialogEyebrow.textContent = editing ? "EDITAR TASK" : "NOVA TASK";
    elements.taskDialogTitle.textContent = editing
      ? "O que precisa mudar?"
      : "O que precisa acontecer?";
    elements.taskSubmitLabel.textContent = editing ? "Salvar alterações" : "Criar task";
    updateCharacterCounts();

    elements.taskDialog.showModal();
    window.requestAnimationFrame(() => elements.taskForm.elements.title.focus());
  };

  const closeTaskDialog = () => {
    if (elements.taskDialog.open) elements.taskDialog.close();
  };

  const mapTaskValidationErrors = (detail) => {
    if (!Array.isArray(detail)) return false;
    detail.forEach((item) => {
      const fieldName = Array.isArray(item.loc) ? item.loc.at(-1) : null;
      if (typeof fieldName === "string") showTaskFieldError(fieldName, "Revise este campo.");
    });
    return true;
  };

  const buildTaskPayload = () => {
    const data = new FormData(elements.taskForm);
    const dueDateValue = String(data.get("due_date") || "");
    return {
      title: String(data.get("title") || "").trim(),
      content: String(data.get("content") || "").trim(),
      due_date: dueDateValue ? new Date(dueDateValue).toISOString() : null,
    };
  };

  const setTaskFormBusy = (isBusy) => {
    elements.taskForm.setAttribute("aria-busy", String(isBusy));
    elements.taskForm.querySelectorAll("button, input, textarea").forEach((control) => {
      control.disabled = isBusy;
    });
  };

  const submitTaskForm = async (event) => {
    event.preventDefault();
    clearTaskFormFeedback();

    if (!state.user) {
      showTaskFormNotice("Não foi possível identificar o usuário atual.");
      return;
    }

    if (!elements.taskForm.checkValidity()) {
      elements.taskForm.reportValidity();
      return;
    }

    const editing = state.editingTaskId !== null;
    if (editing && isUnresolvedPlaceholder(API_ROUTES.updateTask)) {
      showTaskFormNotice(
        "A interface de edição está pronta. Substitua o marcador da rota de atualização em tasks.js para conectá-la.",
      );
      return;
    }

    const endpoint = editing
      ? buildEndpoint(API_ROUTES.updateTask, state.user.user_id, state.editingTaskId)
      : API_ROUTES.createTask(state.user.user_id);
    const payload = buildTaskPayload();
    setTaskFormBusy(true);

    try {
      const {response, body} = await request(endpoint, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        mapTaskValidationErrors(body?.detail);
        showTaskFormNotice(
          response.status === 422
            ? "Revise os campos destacados."
            : "A API não conseguiu salvar esta task. Seus dados foram mantidos.",
        );
        return;
      }

      useStableDialogReturnTarget();
      closeTaskDialog();
      showToast(editing ? "Task atualizada com sucesso." : "Task criada com sucesso.");
      await loadTasks();
    } catch {
      showTaskFormNotice("Não foi possível falar com o servidor. Tente novamente.");
    } finally {
      setTaskFormBusy(false);
    }
  };

  const openDeleteDialog = (task, trigger) => {
    state.deletingTaskId = task.task_id;
    state.dialogTrigger = trigger;
    elements.deleteTaskTitle.textContent = task.title;
    elements.deleteNotice.textContent = "";
    elements.deleteNotice.hidden = true;
    elements.deleteDialog.showModal();
    window.requestAnimationFrame(() => elements.confirmDelete.focus());
  };

  const closeDeleteDialog = () => {
    if (elements.deleteDialog.open) elements.deleteDialog.close();
  };

  const setDeleteBusy = (isBusy) => {
    elements.confirmDelete.disabled = isBusy;
    elements.deleteLabel.textContent = isBusy ? "Excluindo…" : "Excluir task";
  };

  const deleteTask = async () => {
    if (state.deletingTaskId === null) return;

    if (isUnresolvedPlaceholder(API_ROUTES.deleteTask)) {
      elements.deleteNotice.textContent = (
        "A confirmação está pronta. Substitua o marcador da rota de exclusão em tasks.js para conectá-la."
      );
      elements.deleteNotice.hidden = false;
      return;
    }

    const endpoint = buildEndpoint(
      API_ROUTES.deleteTask,
      state.user.user_id,
      state.deletingTaskId,
    );
    setDeleteBusy(true);

    try {
      const {response} = await request(endpoint, {method: "DELETE"});
      if (!response.ok) {
        elements.deleteNotice.textContent = "A API não conseguiu excluir esta task.";
        elements.deleteNotice.hidden = false;
        return;
      }

      useStableDialogReturnTarget();
      closeDeleteDialog();
      showToast("Task excluída com sucesso.");
      await loadTasks();
    } catch {
      elements.deleteNotice.textContent = "Não foi possível falar com o servidor. Tente novamente.";
      elements.deleteNotice.hidden = false;
    } finally {
      setDeleteBusy(false);
    }
  };

  const findTaskFromControl = (control) => {
    const card = control.closest("[data-task-card]");
    if (!card) return null;
    return state.tasks.find((task) => String(task.task_id) === card.dataset.taskId) || null;
  };

  const logout = async (button) => {
    button.disabled = true;

    if (!isUnresolvedPlaceholder(API_ROUTES.logout)) {
      try {
        const {response} = await request(API_ROUTES.logout, {method: "POST"});
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            clearCachedProfile();
            window.location.assign("/login");
            return;
          }
          showToast("Não foi possível encerrar a sessão no servidor.", "error");
          return;
        }
      } catch {
        showToast("Não foi possível falar com o servidor.", "error");
        return;
      } finally {
        button.disabled = false;
      }
    }

    clearCachedProfile();
    window.location.assign("/login");
  };

  const initializeInteractions = () => {
    document.querySelectorAll("[data-open-task-dialog]").forEach((button) => {
      button.addEventListener("click", () => openTaskDialog(null, button));
    });
    document.querySelectorAll("[data-close-task-dialog]").forEach((button) => {
      button.addEventListener("click", closeTaskDialog);
    });
    document.querySelectorAll("[data-close-delete-dialog]").forEach((button) => {
      button.addEventListener("click", closeDeleteDialog);
    });
    document.querySelectorAll("[data-logout]").forEach((button) => {
      button.addEventListener("click", () => logout(button));
    });

    elements.taskList.addEventListener("click", (event) => {
      const editButton = event.target.closest("[data-edit-task]");
      const deleteButton = event.target.closest("[data-delete-task]");
      const control = editButton || deleteButton;
      if (!control) return;

      const task = findTaskFromControl(control);
      if (!task) return;
      if (editButton) openTaskDialog(task, editButton);
      if (deleteButton) openDeleteDialog(task, deleteButton);
    });

    elements.search.addEventListener("input", () => {
      state.search = elements.search.value.trim();
      if (state.viewStatus === "list" || state.viewStatus === "empty") renderTasks();
    });

    elements.filters.forEach((button) => {
      button.addEventListener("click", () => {
        state.filter = button.dataset.taskFilter;
        elements.filters.forEach((item) => {
          const isActive = item === button;
          item.classList.toggle("is-active", isActive);
          item.setAttribute("aria-pressed", String(isActive));
        });
        if (state.viewStatus === "list" || state.viewStatus === "empty") renderTasks();
      });
    });

    elements.taskForm.elements.title.addEventListener("input", updateCharacterCounts);
    elements.taskForm.elements.content.addEventListener("input", updateCharacterCounts);
    elements.taskForm.addEventListener("submit", submitTaskForm);
    elements.confirmDelete.addEventListener("click", deleteTask);
    dashboard.querySelector("[data-retry-tasks]").addEventListener("click", loadDashboardData);

    elements.taskDialog.addEventListener("close", restoreDialogFocus);
    elements.deleteDialog.addEventListener("close", () => {
      state.deletingTaskId = null;
      restoreDialogFocus();
    });

    [elements.taskDialog, elements.deleteDialog].forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
    });
  };

  const setTaskCreationEnabled = (isEnabled) => {
    elements.openTaskButtons.forEach((button) => {
      button.disabled = !isEnabled;
    });
  };

  const loadDashboardData = async () => {
    setTaskCreationEnabled(false);
    setStateVisibility("loading");
    state.user = null;

    try {
      const profile = await loadCurrentUser();
      if (!profile) {
        elements.errorMessage.textContent = (
          "Faça login novamente ou conecte a rota de usuário atual indicada em tasks.js."
        );
        setStateVisibility("error");
        return;
      }
      hydrateProfile(profile);
      setTaskCreationEnabled(true);
      await loadTasks();
    } catch (error) {
      elements.errorMessage.textContent = error instanceof Error
        ? error.message
        : "Não foi possível identificar o usuário atual.";
      setStateVisibility("error");
    }
  };

  const initializeDashboard = () => {
    initializeInteractions();
    loadDashboardData();
  };

  initializeDashboard();
})();
