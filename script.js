/* script.js - Kanban board behavior with persistent localStorage (single key) */

const BOARD_KEY = 'kanbanBoard';
let board = { todo: [], inprogress: [], done: [] };
let draggedFrom = null; // { col, idx }
let addTaskTargetColumn = null;

/* ---------- Persistence helpers ---------- */
function loadBoardFromStorage() {
  const raw = localStorage.getItem(BOARD_KEY);
  if (raw) {
    try {
      board = JSON.parse(raw);
      // Ensure keys exist
      board.todo = board.todo || [];
      board.inprogress = board.inprogress || [];
      board.done = board.done || [];
    } catch (e) {
      console.error('Failed to parse saved board, starting fresh.', e);
      board = { todo: [], inprogress: [], done: [] };
      saveBoardToStorage();
    }
  } else {
    // optional: seed with one example; remove if you want empty board
    board = {
      todo: [{ title: 'Example: Add a task', description: 'Try dragging me between columns', dueDate: '' }],
      inprogress: [],
      done: []
    };
    saveBoardToStorage();
  }
}

function saveBoardToStorage() {
  localStorage.setItem(BOARD_KEY, JSON.stringify(board));
}

/* ---------- Render ---------- */
function renderBoard() {
  ['todo', 'inprogress', 'done'].forEach(col => {
    const column = document.getElementById(col);
    if (!column) return;
    column.innerHTML = '';
    const tasks = board[col] || [];

    tasks.forEach((task, idx) => {
      const taskDiv = document.createElement('div');
      taskDiv.className = 'kanban-task';
      taskDiv.draggable = true;
      taskDiv.addEventListener('dragstart', e => onDragStart(e, col, idx));
      taskDiv.addEventListener('dragend', onDragEnd);

      // left container (title, desc, due)
      const left = document.createElement('div');

      const titleEl = document.createElement('div');
      titleEl.className = 'task-title';
      titleEl.contentEditable = 'true';
      titleEl.innerText = task.title || '';
      titleEl.addEventListener('blur', () => {
        board[col][idx].title = titleEl.innerText.trim();
        saveBoardToStorage();
      });

      const descEl = document.createElement('div');
      descEl.className = 'task-description';
      descEl.contentEditable = 'true';
      descEl.innerText = task.description || '';
      descEl.addEventListener('blur', () => {
        board[col][idx].description = descEl.innerText.trim();
        saveBoardToStorage();
      });

      const dueSpan = document.createElement('span');
      dueSpan.className = 'task-due';
      if (task.dueDate) {
        const dueDateObj = new Date(task.dueDate);
        // treat midnight of that date as the due moment
        const endOfDay = new Date(task.dueDate + 'T23:59:59');
        const overdue = endOfDay < new Date();
        if (overdue) dueSpan.classList.add('text-danger', 'fw-bold');
      }
      dueSpan.innerText = '📅 ' + (task.dueDate || 'No due date');

      left.appendChild(titleEl);
      left.appendChild(descEl);
      left.appendChild(dueSpan);

      // actions (delete)
      const actions = document.createElement('span');
      actions.className = 'task-actions';
      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-sm btn-danger';
      delBtn.innerHTML = '&times;';
      delBtn.addEventListener('click', () => deleteTask(col, idx));
      actions.appendChild(delBtn);

      taskDiv.appendChild(left);
      taskDiv.appendChild(actions);

      column.appendChild(taskDiv);
    });

    // drag target behavior
    column.addEventListener('dragover', e => e.preventDefault());
    column.addEventListener('drop', e => onDrop(e, col));
  });
}

/* ---------- CRUD ---------- */
function addTask(col, title, description, dueDate) {
  board[col] = board[col] || [];
  board[col].push({ title, description, dueDate });
  saveBoardToStorage();
  renderBoard();
}

function updateTask(col, idx, field, value) {
  if (board[col] && board[col][idx]) {
    board[col][idx][field] = value;
    saveBoardToStorage();
    renderBoard();
  }
}

function deleteTask(col, idx) {
  if (!Array.isArray(board[col])) return;
  board[col].splice(idx, 1);
  saveBoardToStorage();
  renderBoard();
}

/* ---------- Drag & Drop ---------- */
function onDragStart(e, col, idx) {
  draggedFrom = { col, idx };
  if (e.dataTransfer) {
    // we set some data to allow drop in some browsers
    e.dataTransfer.setData('text/plain', JSON.stringify(draggedFrom));
    e.dataTransfer.effectAllowed = 'move';
  }
}

function onDragEnd() {
  draggedFrom = null;
}

function onDrop(e, col) {
  e.preventDefault();
  if (!draggedFrom) return;
  // take the item from source
  const task = board[draggedFrom.col].splice(draggedFrom.idx, 1)[0];
  // push into destination column
  board[col].push(task);
  saveBoardToStorage();
  renderBoard();
  draggedFrom = null;
}

/* ---------- Modal / Add Task ---------- */
function showAddTaskModal(col) {
  addTaskTargetColumn = col;
  const titleEl = document.getElementById('taskTitle');
  const descriptionEl = document.getElementById('taskDescription');
  const dueEl = document.getElementById('taskDueDate');
  if (titleEl) titleEl.value = '';
  if (descriptionEl) descriptionEl.value = '';
  if (dueEl) dueEl.value = '';

  const modalEl = document.getElementById('addTaskModal');
  if (!modalEl) return;
  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  const addBtn = document.getElementById('addTaskBtn');
  // override previous onclick to avoid stacking handlers
  addBtn.onclick = null;
  addBtn.onclick = function () {
    const title = (titleEl && titleEl.value) ? titleEl.value.trim() : '';
    const description = (descriptionEl && descriptionEl.value) ? descriptionEl.value.trim() : '';
    const dueDate = dueEl ? dueEl.value : '';
    if (title) {
      addTask(addTaskTargetColumn, title, description, dueDate);
      modal.hide();
    } else {
      // small UX: focus title if empty
      if (titleEl) titleEl.focus();
    }
  };
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  loadBoardFromStorage();
  renderBoard();
});
