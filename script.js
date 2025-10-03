/* script.js - Kanban board behavior
   This file should contain only JavaScript. The original file included a full HTML document
   which caused a syntax error when loaded as a script (unexpected token '<').
*/

let draggedTask = null;
let draggedFrom = null;
let addTaskTargetColumn = null;
let tempLabels = [];

function renderBoard() {
  ['todo', 'inprogress', 'done'].forEach(col => {
    const column = document.getElementById(col);
    if (!column) return;
    column.innerHTML = '';
    const tasks = getTasks(col);

    tasks.forEach((task, idx) => {
      const taskDiv = document.createElement('div');
      taskDiv.className = 'kanban-task';
      taskDiv.draggable = true;
      taskDiv.ondragstart = e => onDragStart(e, col, idx);
      taskDiv.ondragend = onDragEnd;

      const overdue = task.dueDate && new Date(task.dueDate) < new Date();
      const dueClass = overdue ? 'text-danger fw-bold' : '';

      taskDiv.innerHTML = `
        <div>
          <span class="task-title">${escapeHtml(task.title)}</span>
          <span class="task-due ${dueClass}">📅 ${task.dueDate || 'No due date'}</span>
        </div>
        <span class="task-actions">
          <button class="btn btn-sm btn-primary" onclick="editTask('${col}', ${idx})">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="deleteTask('${col}', ${idx})">&times;</button>
        </span>
      `;

      column.appendChild(taskDiv);
    });

    column.ondragover = e => e.preventDefault();
    column.ondrop = e => onDrop(e, col);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getTasks(col) {
  return JSON.parse(localStorage.getItem('kanban-' + col) || '[]');
}

function setTasks(col, tasks) {
  localStorage.setItem('kanban-' + col, JSON.stringify(tasks));
}

function addTask(col, title, dueDate) {
  const tasks = getTasks(col);
  tasks.push({ title, dueDate });
  setTasks(col, tasks);
  renderBoard();
}

function deleteTask(col, idx) {
  const tasks = getTasks(col);
  tasks.splice(idx, 1);
  setTasks(col, tasks);
  renderBoard();
}

function onDragStart(e, col, idx) {
  draggedTask = getTasks(col)[idx];
  draggedFrom = { col, idx };
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
}

function onDragEnd() {
  draggedTask = null;
  draggedFrom = null;
}

function onDrop(e, col) {
  if (draggedTask && draggedFrom) {
    const fromTasks = getTasks(draggedFrom.col);
    fromTasks.splice(draggedFrom.idx, 1);
    setTasks(draggedFrom.col, fromTasks);

    const toTasks = getTasks(col);
    toTasks.push(draggedTask);
    setTasks(col, toTasks);

    renderBoard();
  }
}

function showAddTaskModal(col) {
  addTaskTargetColumn = col;
  const titleEl = document.getElementById('taskTitle');
  const dueEl = document.getElementById('taskDueDate');
  if (titleEl) titleEl.value = '';
  if (dueEl) dueEl.value = '';
  const modalEl = document.getElementById('addTaskModal');
  if (!modalEl) return;
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
  const addBtn = document.getElementById('addTaskBtn');
  if (addBtn) {
    addBtn.onclick = function() {
      const title = (titleEl && titleEl.value) ? titleEl.value.trim() : '';
      const dueDate = dueEl ? dueEl.value : '';
      if (title) {
        addTask(addTaskTargetColumn, title, dueDate);
        modal.hide();
      }
    };
  }
}

function editTask(col, idx) {
  const tasks = getTasks(col);
  const task = tasks[idx];
  if (!task) return;
  const newTitle = prompt('Edit task title:', task.title);
  const newDueDate = prompt('Edit due date (YYYY-MM-DD):', task.dueDate || '');
  if (newTitle !== null && newTitle.trim() !== '') {
    tasks[idx].title = newTitle.trim();
    tasks[idx].dueDate = newDueDate;
    setTasks(col, tasks);
    renderBoard();
  }
}

// Add single label to tempLabels
document.getElementById('addLabelBtn').onclick = function() {
  const name = document.getElementById('taskLabels').value.trim();
  const color = document.getElementById('taskLabelColor').value;
  if (!name) return;

  tempLabels.push({ name, color });

  // Show currently added labels
  const current = document.getElementById('currentLabels');
  const span = document.createElement('span');
  span.textContent = name;
  span.style.backgroundColor = color;
  span.className = 'task-label me-1 mb-1';
  current.appendChild(span);

  // Reset inputs
  document.getElementById('taskLabels').value = '';
  document.getElementById('taskLabelColor').value = '#6c757d';
};

document.addEventListener('DOMContentLoaded', renderBoard);