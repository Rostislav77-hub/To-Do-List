const authScreen   = document.getElementById('auth-screen');
const appScreen    = document.getElementById('app-screen');
const authTabs     = document.querySelectorAll('.auth-tab');
const authEmail    = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authSubmit   = document.getElementById('auth-submit');
const authGoogle   = document.getElementById('auth-google');
const authError    = document.getElementById('auth-error');
const userEmailEl  = document.getElementById('user-email');
const logoutBtn    = document.getElementById('logout-btn');

const input      = document.getElementById('todo-input');
const addBtn     = document.getElementById('add-btn');
const list       = document.getElementById('todo-list');
const clearBtn   = document.getElementById('clear-btn');
const statTotal  = document.getElementById('stat-total');
const statDone   = document.getElementById('stat-done');
const statLeft   = document.getElementById('stat-left');
const footerMsg  = document.getElementById('footer-msg');
const filterBtns = document.querySelectorAll('.filter-btn');

let todos      = [];
let filter     = 'all';
let activeTab  = 'login';   
let currentUser = null;

function showApp(user) {
  currentUser = user;
  userEmailEl.textContent = user.email || 'Пользователь';
  authScreen.classList.add('hidden');
  appScreen.classList.remove('hidden');
  loadTodos();
  subscribeRealtime();
}

function showAuth() {
  currentUser = null;
  todos = [];
  appScreen.classList.add('hidden');
  authScreen.classList.remove('hidden');
}

authTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    activeTab = tab.dataset.tab;
    authTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === activeTab));
    authSubmit.textContent = activeTab === 'login' ? 'Войти' : 'Зарегистрироваться';
    authError.textContent  = '';
  });
});

authSubmit.addEventListener('click', async () => {
  const email    = authEmail.value.trim();
  const password = authPassword.value;
  authError.textContent = '';

  if (!email || !password) {
    authError.textContent = 'Заполните email и пароль';
    return;
  }

  authSubmit.disabled = true;
  authSubmit.textContent = 'Подождите…';

  let error;

  if (activeTab === 'login') {
    ({ error } = await db.auth.signInWithPassword({ email, password }));
  } else {
    ({ error } = await db.auth.signUp({ email, password }));
    if (!error) {
      authError.style.color = 'var(--green)';
      authError.textContent = 'Письмо с подтверждением отправлено на email';
      authSubmit.disabled = false;
      authSubmit.textContent = 'Зарегистрироваться';
      return;
    }
  }

  if (error) {
    authError.style.color = 'var(--accent2)';
    authError.textContent = translateAuthError(error.message);
  }

  authSubmit.disabled = false;
  authSubmit.textContent = activeTab === 'login' ? 'Войти' : 'Зарегистрироваться';
});

authGoogle.addEventListener('click', async () => {
  await db.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href }
  });
});

logoutBtn.addEventListener('click', async () => {
  await db.auth.signOut();
});

db.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    showApp(session.user);
  } else {
    showAuth();
  }
});

function translateAuthError(msg) {
  if (msg.includes('Invalid login'))       return 'Неверный email или пароль';
  if (msg.includes('Email not confirmed')) return 'Подтвердите email перед входом';
  if (msg.includes('User already'))        return 'Пользователь с таким email уже существует';
  if (msg.includes('Password'))            return 'Пароль должен быть не менее 6 символов';
  return msg;
}

async function loadTodos() {
  const { data, error } = await db
    .from('todos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { console.error('Ошибка загрузки:', error); return; }
  todos = data || [];
  render();
}

async function insertTodo(text) {
  const { data, error } = await db
    .from('todos')
    .insert({ text, user_id: currentUser.id })
    .select()
    .single();

  if (error) { console.error('Ошибка добавления:', error); return; }
  todos.unshift(data);
  render();
}

async function updateTodo(id, fields) {
  const { error } = await db
    .from('todos')
    .update(fields)
    .eq('id', id);

  if (error) console.error('Ошибка обновления:', error);
}

async function deleteTodo(id) {
  const { error } = await db
    .from('todos')
    .delete()
    .eq('id', id);

  if (error) console.error('Ошибка удаления:', error);
}

let realtimeChannel = null;

function subscribeRealtime() {
  if (realtimeChannel) db.removeChannel(realtimeChannel);

  realtimeChannel = db
    .channel('todos-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'todos', filter: `user_id=eq.${currentUser.id}` },
      () => loadTodos() 
    )
    .subscribe();
}

function formatDate(iso) {
  const d    = new Date(iso);
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const date = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
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
  const visible = todos.filter(t =>
    filter === 'all'    ? true :
    filter === 'done'   ? t.done :
                        ! t.done
  );

  list.innerHTML = '';

  if (visible.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty';
    const msg =
      filter === 'done'   ? 'Нет выполненных задач' :
      filter === 'active' ? 'Все задачи выполнены 🎉' :
                            'Список пуст. Добавьте задачу!';
    li.innerHTML = `<span class="icon">✦</span>${msg}`;
    list.appendChild(li);
  } else {
    visible.forEach(t => list.appendChild(createItem(t)));
  }

  const total = todos.length;
  const done  = todos.filter(t => t.done).length;
  statTotal.textContent = total;
  statDone.textContent  = done;
  statLeft.textContent  = total - done;
  clearBtn.disabled     = done === 0;
  footerMsg.textContent = total ? `${done} из ${total} выполнено` : '';
}

function createItem(todo) {
  const li = document.createElement('li');
  li.className = 'todo-item' + (todo.done ? ' done' : '');
  li.dataset.id = todo.id;

  const doneDateHtml = todo.done_at
    ? `<span class="todo-date date-done">
         ${iconDone} Выполнено: ${formatDate(todo.done_at)}
       </span>`
    : '';

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
        <span class="todo-date">
          ${iconCreated} Создано: ${formatDate(todo.created_at)}
        </span>
        ${doneDateHtml}
      </div>
    </div>
    <button class="del-btn" title="Удалить">
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M2 2l11 11M13 2L2 13" stroke="currentColor"
              stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    </button>
  `;

  li.querySelector('.check-btn').addEventListener('click', () => toggleDone(todo));
  li.querySelector('.del-btn').addEventListener('click', () => deleteItem(li, todo.id));
  return li;
}

async function addTodo() {
  const text = input.value.trim();
  if (!text) {
    input.classList.add('error');
    input.focus();
    setTimeout(() => input.classList.remove('error'), 600);
    return;
  }
  input.value = '';
  if (filter === 'done') { filter = 'all'; updateFilterUI(); }
  await insertTodo(text);
  input.focus();
}

async function toggleDone(todo) {
  const nowDone  = !todo.done;
  const doneAt   = nowDone ? new Date().toISOString() : null;

  todos = todos.map(t =>
    t.id === todo.id ? { ...t, done: nowDone, done_at: doneAt } : t
  );
  render();

  await updateTodo(todo.id, { done: nowDone, done_at: doneAt });
}

async function deleteItem(li, id) {
  li.classList.add('removing');
  li.addEventListener('animationend', async () => {
    todos = todos.filter(t => t.id !== id);
    render();
    await deleteTodo(id);
  }, { once: true });
}

async function clearDone() {
  const doneIds = todos.filter(t => t.done).map(t => t.id);
  todos = todos.filter(t => !t.done);
  render();
  await db.from('todos').delete().in('id', doneIds);
}

function updateFilterUI() {
  filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
}
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filter = btn.dataset.filter;
    updateFilterUI();
    render();
  });
});

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const eyeBtn    = document.getElementById('eye-btn');
const eyeOpen   = eyeBtn.querySelector('.eye-open');
const eyeClosed = eyeBtn.querySelector('.eye-closed');

eyeBtn.addEventListener('click', () => {
  const isPassword = authPassword.type === 'password';
  authPassword.type = isPassword ? 'text' : 'password';
  eyeOpen.classList.toggle('hidden', isPassword);
  eyeClosed.classList.toggle('hidden', !isPassword);
});


input.addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });
clearBtn.addEventListener('click', clearDone);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/To-Do-List/sw.js');
  });
}