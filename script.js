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
          <div class="task-title" contenteditable="true" onblur="updateTask('${col}', ${idx}, 'title', this.innerText)">${escapeHtml(task.title)}</div>
          <div class="task-description" contenteditable="true" onblur="updateTask('${col}', ${idx}, 'description', this.innerText)">${escapeHtml(task.description)}</div>
          <span class="task-due ${dueClass}">📅 ${task.dueDate || 'No due date'}</span>
        </div>
        <span class="task-actions">
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

function addTask(col, title, description, dueDate) {
  const tasks = getTasks(col);
  tasks.push({ title, description, dueDate });
  setTasks(col, tasks);
  renderBoard();
}

function updateTask(col, idx, field, value) {
  const tasks = getTasks(col);
  if (tasks[idx]) {
    tasks[idx][field] = value;
    setTasks(col, tasks);
  }
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
  if (addBtn) {
    addBtn.onclick = function() {
      const title = (titleEl && titleEl.value) ? titleEl.value.trim() : '';
      const description = (descriptionEl && descriptionEl.value) ? descriptionEl.value.trim() : '';
      const dueDate = dueEl ? dueEl.value : '';
      if (title) {
        addTask(addTaskTargetColumn, title, description, dueDate);
        modal.hide();
      }
    };
  }
}


