const loadingScreen = document.getElementById("loading-screen");
const authScreen = document.getElementById("auth-screen");
const appScreen = document.getElementById("app-screen");
const authTabs = document.querySelectorAll(".auth-tab");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authSubmit = document.getElementById("auth-submit");
const authGoogle = document.getElementById("auth-google");
const authError = document.getElementById("auth-error");

const input = document.getElementById("todo-input");
const addBtn = document.getElementById("add-btn");
const list = document.getElementById("todo-list");
const clearBtn = document.getElementById("clear-btn");
const statTotal = document.getElementById("stat-total");
const statDone = document.getElementById("stat-done");
const statLeft = document.getElementById("stat-left");
const footerMsg = document.getElementById("footer-msg");
const filterBtns = document.querySelectorAll(".filter-btn");

const navBtns = document.querySelectorAll(".nav-btn");
const pageTasks = document.getElementById("page-tasks");
const pageSettings = document.getElementById("page-settings");
const themeBtns = document.querySelectorAll(".theme-btn");
const settingsLogoutBtn = document.getElementById("settings-logout-btn");

let todos = [];
let filter = "all";
let activeTab = "login";
let currentUser = null;
let isGuest = false;

function applyTheme(theme) {
  const root = document.documentElement;
  let actualTheme = theme;

  if (theme === "system") {
    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    actualTheme = dark ? "dark" : "light";
    root.setAttribute("data-theme", actualTheme);
  } else {
    root.setAttribute("data-theme", theme);
  }

  themeBtns.forEach((b) =>
    b.classList.toggle("active", b.dataset.theme === theme),
  );
  localStorage.setItem("theme", theme);

  const iconSun = document.querySelector(".icon-sun");
  const iconMoon = document.querySelector(".icon-moon");
  if (iconSun && iconMoon) {
    iconSun.classList.toggle("hidden", actualTheme !== "dark");
    iconMoon.classList.toggle("hidden", actualTheme === "dark");
  }
}

const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", () => {
    if (localStorage.getItem("theme") === "system") applyTheme("system");
  });

themeBtns.forEach((btn) => {
  btn.addEventListener("click", () => applyTheme(btn.dataset.theme));
});

function showPage(page) {
  pageTasks.classList.toggle("hidden", page !== "tasks");
  pageSettings.classList.toggle("hidden", page !== "settings");
  navBtns.forEach((b) => b.classList.toggle("active", b.dataset.page === page));
}

navBtns.forEach((btn) => {
  btn.addEventListener("click", () => showPage(btn.dataset.page));
});

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
const isInStandaloneMode =
  window.navigator.standalone === true ||
  window.matchMedia("(display-mode: standalone)").matches;

if (isInStandaloneMode) {
  document.getElementById("uninstall-section").style.display = "block";
} else if (isIOS) {
  document.getElementById("ios-install-section").style.display = "block";
}

document.getElementById("uninstall-btn").addEventListener("click", () => {
  const isAuthed = !!currentUser;
  const isIosDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);

  document.getElementById("modal-text").textContent = isAuthed
    ? "После удаления приложения потребуется войти в аккаунт заново. Все задачи сохранятся в облаке."
    : "Вы не авторизованы — задачи не сохранятся. Рекомендуем войти в аккаунт перед удалением.";

  if (isIosDevice) {
    document.getElementById("uninstall-step1").textContent =
      "Зажми иконку приложения на экране Домой";
    document.getElementById("uninstall-step2").innerHTML =
      "Нажми <strong>«Удалить приложение»</strong>";
    document.getElementById("uninstall-step3").innerHTML =
      "Подтверди нажав <strong>«Удалить»</strong>";
  } else {
    document.getElementById("uninstall-step1").textContent =
      "Нажми правой кнопкой на иконку в панели задач или на рабочем столе";
    document.getElementById("uninstall-step2").innerHTML =
      "Выбери <strong>«Удалить To-Do List»</strong>";
    document.getElementById("uninstall-step3").innerHTML =
      "Подтверди удаление в появившемся окне";
  }

  document.getElementById("uninstall-modal").classList.remove("hidden");
});

document.getElementById("modal-close-btn").addEventListener("click", () => {
  document.getElementById("uninstall-modal").classList.add("hidden");
});

document.getElementById("uninstall-modal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("uninstall-modal")) {
    document.getElementById("uninstall-modal").classList.add("hidden");
  }
});

let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  if (isIOS || isInStandaloneMode) return;
  deferredInstallPrompt = e;
  document.getElementById("install-section").style.display = "block";
});

window.addEventListener("appinstalled", () => {
  document.getElementById("install-section").style.display = "none";
  deferredInstallPrompt = null;
});

document.getElementById("install-btn").addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  document.getElementById("install-section").style.display = "none";
});

function showApp(user) {
  currentUser = isGuest ? null : user;

  document
    .getElementById("account-ui-authorized")
    .classList.toggle("hidden", isGuest);
  document
    .getElementById("account-ui-guest")
    .classList.toggle("hidden", !isGuest);

  if (!isGuest) {
    const email = user.email || "Пользователь";
    const avatar = email.charAt(0).toUpperCase();
    document.getElementById("account-avatar").textContent = avatar;
    document.getElementById("settings-user-email").textContent = email;
  }

  authScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
  showPage("tasks");
  loadTodos();
  if (!isGuest) subscribeRealtime();
}

function showAuth() {
  isGuest = false;
  currentUser = null;
  todos = [];
  activeTab = "login";
  authTabs.forEach((t) =>
    t.classList.toggle("active", t.dataset.tab === "login"),
  );
  authSubmit.textContent = "Войти";
  authError.textContent = "";
  authEmail.value = savedLoginEmail || "";
  authPassword.value = "";
  appScreen.classList.add("hidden");
  authScreen.classList.remove("hidden");
}

let savedLoginEmail = "";

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const prevTab = activeTab;
    activeTab = tab.dataset.tab;

    if (activeTab === "guest") {
      enterGuestMode();
      return;
    }

    if (activeTab === "register") {
      savedLoginEmail = authEmail.value;
      authEmail.value = "";
      authPassword.value = "";
    } else if (activeTab === "login" && prevTab === "register") {
      authEmail.value = savedLoginEmail;
      authPassword.value = "";
    }

    authTabs.forEach((t) =>
      t.classList.toggle("active", t.dataset.tab === activeTab),
    );
    authSubmit.textContent =
      activeTab === "login" ? "Войти" : "Зарегистрироваться";
    authError.textContent = "";
  });
});

function enterGuestMode() {
  isGuest = true;
  currentUser = null;
  showApp({ email: "Гость" });
}

authSubmit.addEventListener("click", async () => {
  const email = authEmail.value.trim();
  const password = authPassword.value;
  authError.textContent = "";

  if (!email || !password) {
    authError.textContent = "Заполните email и пароль";
    return;
  }

  authSubmit.disabled = true;
  authSubmit.textContent = "Подождите…";

  let error;

  if (activeTab === "login") {
    ({ error } = await db.auth.signInWithPassword({ email, password }));
  } else {
    ({ error } = await db.auth.signUp({ email, password }));
    if (!error) {
      authError.style.color = "var(--green)";
      authError.textContent = "Письмо с подтверждением отправлено на email";
      authSubmit.disabled = false;
      authSubmit.textContent = "Зарегистрироваться";
      return;
    }
  }

  if (error) {
    authError.style.color = "var(--accent2)";
    authError.textContent = translateAuthError(error.message);
  }

  authSubmit.disabled = false;
  authSubmit.textContent =
    activeTab === "login" ? "Войти" : "Зарегистрироваться";
});

authGoogle.addEventListener("click", async () => {
  await db.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.href },
  });
});

let logoutTimer;

function resetLogoutBtn() {
  settingsLogoutBtn.classList.remove("confirm-mode");
  settingsLogoutBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    Выйти из аккаунта
  `;
  settingsLogoutBtn.style.background = "";
  settingsLogoutBtn.style.borderColor = "";
}

settingsLogoutBtn.addEventListener("click", async () => {
  if (settingsLogoutBtn.classList.contains("confirm-mode")) {
    clearTimeout(logoutTimer);
    await db.auth.signOut();
    resetLogoutBtn();
  } else {
    settingsLogoutBtn.classList.add("confirm-mode");
    settingsLogoutBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2v8M8 14h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Подтвердить выход
    `;
    settingsLogoutBtn.style.background = "rgba(242,95,76,.15)";
    settingsLogoutBtn.style.borderColor = "var(--accent2)";

    logoutTimer = setTimeout(resetLogoutBtn, 3000);
  }
});

db.auth.onAuthStateChange((_event, session) => {
  loadingScreen.classList.add("fade-out");
  if (session?.user) {
    showApp(session.user);
  } else {
    showAuth();
  }
});

function translateAuthError(msg) {
  if (msg.includes("Invalid login")) return "Неверный email или пароль";
  if (msg.includes("Email not confirmed"))
    return "Подтвердите email перед входом";
  if (msg.includes("User already"))
    return "Пользователь с таким email уже существует";
  if (msg.includes("Password")) return "Пароль должен быть не менее 6 символов";
  return msg;
}

async function loadTodos() {
  if (isGuest) {
    todos = JSON.parse(localStorage.getItem("guest_todos") || "[]");
    render();
    return;
  }

  const { data, error } = await db
    .from("todos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }
  todos = data || [];
  render();
}

async function insertTodo(text) {
  if (isGuest) {
    const newTodo = {
      id: Date.now(),
      text,
      done: false,
      created_at: new Date().toISOString(),
      user_id: "guest",
    };
    todos.unshift(newTodo);
    localStorage.setItem("guest_todos", JSON.stringify(todos));
    render();
    return;
  }

  const { data, error } = await db
    .from("todos")
    .insert({ text, user_id: currentUser.id })
    .select()
    .single();

  if (error) {
    console.error(error);
    return;
  }
  todos.unshift(data);
  render();
}

async function updateTodo(id, fields) {
  if (isGuest) {
    todos = todos.map((t) => (t.id === id ? { ...t, ...fields } : t));
    localStorage.setItem("guest_todos", JSON.stringify(todos));
    return;
  }

  const { error } = await db.from("todos").update(fields).eq("id", id);
  if (error) console.error(error);
}

async function deleteTodo(id) {
  if (isGuest) {
    todos = todos.filter((t) => t.id !== id);
    localStorage.setItem("guest_todos", JSON.stringify(todos));
    return;
  }

  const { error } = await db.from("todos").delete().eq("id", id);
  if (error) console.error(error);
}

let realtimeChannel = null;

function subscribeRealtime() {
  if (realtimeChannel) db.removeChannel(realtimeChannel);
  realtimeChannel = db
    .channel("todos-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "todos",
        filter: `user_id=eq.${currentUser.id}`,
      },
      () => loadTodos(),
    )
    .subscribe();
}

function formatDate(iso) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${time} · ${date}`;
}

const iconCreated = `
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" stroke-width="1.2"/>
    <path d="M5.5 3v2.5l1.5 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`;

const iconDone = `
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <path d="M1.5 6l3 3 5-5.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

function render() {
  const visible = todos.filter((t) =>
    filter === "all" ? true : filter === "done" ? t.done : !t.done,
  );

  list.innerHTML = "";

  if (visible.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    const msg =
      filter === "done"
        ? "Нет выполненных задач"
        : filter === "active"
          ? "Все задачи выполнены 🎉"
          : "Список пуст. Добавьте задачу!";
    li.innerHTML = `<span class="icon">✦</span>${msg}`;
    list.appendChild(li);
  } else {
    visible.forEach((t) => list.appendChild(createItem(t)));
  }

  const total = todos.length;
  const done = todos.filter((t) => t.done).length;
  statTotal.textContent = total;
  statDone.textContent = done;
  statLeft.textContent = total - done;
  clearBtn.disabled = done === 0;
  footerMsg.textContent = total ? `${done} из ${total} выполнено` : "";
}

function createItem(todo) {
  const li = document.createElement("li");
  li.className = "todo-item" + (todo.done ? " done" : "");
  li.dataset.id = todo.id;

  const doneDateHtml = todo.done_at
    ? `<span class="todo-date date-done">${iconDone} Выполнено: ${formatDate(todo.done_at)}</span>`
    : "";

  li.innerHTML = `
    <button class="check-btn" title="Отметить выполненным">
      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
        <path d="M1 4l3.5 3.5L10 1" stroke="#0f0e17" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <div class="todo-body">
      <span class="todo-text">${escapeHtml(todo.text)}</span>
      <div class="todo-dates">
        <span class="todo-date">${iconCreated} Создано: ${formatDate(todo.created_at)}</span>
        ${doneDateHtml}
      </div>
    </div>
    <button class="del-btn" title="Удалить">
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M2 2l11 11M13 2L2 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    </button>
  `;

  li.querySelector(".check-btn").addEventListener("click", () =>
    toggleDone(todo),
  );
  li.querySelector(".del-btn").addEventListener("click", () =>
    deleteItem(li, todo.id),
  );
  return li;
}

async function addTodo() {
  const text = input.value.trim();
  if (!text) {
    input.classList.add("error");
    input.focus();
    setTimeout(() => input.classList.remove("error"), 600);
    return;
  }
  input.value = "";
  if (filter === "done") {
    filter = "all";
    updateFilterUI();
  }
  await insertTodo(text);
  input.focus();
}

async function toggleDone(todo) {
  const nowDone = !todo.done;
  const doneAt = nowDone ? new Date().toISOString() : null;
  todos = todos.map((t) =>
    t.id === todo.id ? { ...t, done: nowDone, done_at: doneAt } : t,
  );
  render();
  await updateTodo(todo.id, { done: nowDone, done_at: doneAt });
}

async function deleteItem(li, id) {
  li.classList.add("removing");
  li.addEventListener(
    "animationend",
    async () => {
      todos = todos.filter((t) => t.id !== id);
      render();
      await deleteTodo(id);
    },
    { once: true },
  );
}

async function clearDone() {
  const doneIds = todos.filter((t) => t.done).map((t) => t.id);
  todos = todos.filter((t) => !t.done);
  render();

  if (isGuest) {
    localStorage.setItem("guest_todos", JSON.stringify(todos));
    return;
  }

  await db.from("todos").delete().in("id", doneIds);
}

function updateFilterUI() {
  filterBtns.forEach((b) =>
    b.classList.toggle("active", b.dataset.filter === filter),
  );
}

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filter = btn.dataset.filter;
    updateFilterUI();
    render();
  });
});

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !authScreen.classList.contains("hidden")) {
    authSubmit.click();
  }
});

const eyeBtn = document.getElementById("eye-btn");
const eyeOpen = eyeBtn.querySelector(".eye-open");
const eyeClosed = eyeBtn.querySelector(".eye-closed");

eyeBtn.addEventListener("click", () => {
  const isPassword = authPassword.type === "password";
  authPassword.type = isPassword ? "text" : "password";
  eyeOpen.classList.toggle("hidden", isPassword);
  eyeClosed.classList.toggle("hidden", !isPassword);
});

addBtn.addEventListener("click", addTodo);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTodo();
});
clearBtn.addEventListener("click", clearDone);

document.getElementById("guest-login-btn")?.addEventListener("click", showAuth);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/To-Do-List/sw.js");
  });
}

const quickThemeToggle = document.getElementById("quick-theme-toggle");
if (quickThemeToggle) {
  quickThemeToggle.addEventListener("click", () => {
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    applyTheme(isDark ? "light" : "dark");
  });
}
