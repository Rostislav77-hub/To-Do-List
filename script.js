const input      = document.getElementById('todo-input');
const addBtn     = document.getElementById('add-btn');
const list       = document.getElementById('todo-list');
const clearBtn   = document.getElementById('clear-btn');
const statTotal  = document.getElementById('stat-total');
const statDone   = document.getElementById('stat-done');
const statLeft   = document.getElementById('stat-left');
const footerMsg  = document.getElementById('footer-msg');
const filterBtns = document.querySelectorAll('.filter-btn');

let todos  = JSON.parse(localStorage.getItem('todos') || '[]');
let filter = 'all';

function render() {
  const visible = todos.filter(t =>
    filter === 'all'    ? true :
    filter === 'done'   ? t.done :
           !t.done
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
  statTotal.textContent  = total;
  statDone.textContent   = done;
  statLeft.textContent   = total - done;
  clearBtn.disabled      = done === 0;
  footerMsg.textContent  = total ? `${done} из ${total} выполнено` : '';

  localStorage.setItem('todos', JSON.stringify(todos));
}

function createItem(todo) {
  const li = document.createElement('li');
  li.className = 'todo-item' + (todo.done ? ' done' : '');
  li.dataset.id = todo.id;

  li.innerHTML = `
    <button class="check-btn" title="Отметить выполненным">
      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
        <path d="M1 4l3.5 3.5L10 1" stroke="#0f0e17" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <span class="todo-text">${escapeHtml(todo.text)}</span>
    <button class="del-btn" title="Удалить">
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M2 2l11 11M13 2L2 13" stroke="currentColor"
              stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    </button>
  `;

  li.querySelector('.check-btn').addEventListener('click', () => toggleDone(todo.id));
  li.querySelector('.del-btn').addEventListener('click', () => deleteItem(li, todo.id));

  return li;
}

function addTodo() {
  const text = input.value.trim();

  if (!text) {
    input.classList.add('error');
    input.focus();
    setTimeout(() => input.classList.remove('error'), 600);
    return;
  }

  todos.unshift({ id: Date.now(), text, done: false });
  input.value = '';

  if (filter === 'done') {
    filter = 'all';
    updateFilterUI();
  }

  render();
  input.focus();
}

function toggleDone(id) {
  todos = todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
  render();
}

function deleteItem(li, id) {
  li.classList.add('removing');
  li.addEventListener('animationend', () => {
    todos = todos.filter(t => t.id !== id);
    render();
  }, { once: true });
}

function clearDone() {
  todos = todos.filter(t => !t.done);
  render();
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

addBtn.addEventListener('click', addTodo);
input.addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });
clearBtn.addEventListener('click', clearDone);

render();