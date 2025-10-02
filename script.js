let draggedTask = null;
let draggedFrom = null;
let addTaskTargetColumn = null;

function renderBoard() {
  ['todo', 'inprogress', 'done'].forEach(col => {
    const column = document.getElementById(col);
    column.innerHTML = '';
    const tasks = getTasks(col);
    tasks.forEach((task, idx) => {
      const taskDiv = document.createElement('div');
      taskDiv.className = 'kanban-task';
      taskDiv.draggable = true;
      taskDiv.ondragstart = e => onDragStart(e, col, idx);
      taskDiv.ondragend = onDragEnd;
      taskDiv.innerHTML = `
        <span class="task-title">${task}</span>
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

function getTasks(col) {
  return JSON.parse(localStorage.getItem('kanban-' + col) || '[]');
}

function setTasks(col, tasks) {
  localStorage.setItem('kanban-' + col, JSON.stringify(tasks));
}

function addTask(col, title) {
  const tasks = getTasks(col);
  tasks.push(title);
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
  e.dataTransfer.effectAllowed = 'move';
}

function onDragEnd() {
  draggedTask = null;
  draggedFrom = null;
}

function onDrop(e, col) {
  if (draggedTask && draggedFrom) {
    // Remove from old column
    const fromTasks = getTasks(draggedFrom.col);
    fromTasks.splice(draggedFrom.idx, 1);
    setTasks(draggedFrom.col, fromTasks);
    // Add to new column
    const toTasks = getTasks(col);
    toTasks.push(draggedTask);
    setTasks(col, toTasks);
    renderBoard();
  }
}

function showAddTaskModal(col) {
  addTaskTargetColumn = col;
  document.getElementById('taskTitle').value = '';
  const modal = new bootstrap.Modal(document.getElementById('addTaskModal'));
  modal.show();
  document.getElementById('addTaskBtn').onclick = function() {
    const title = document.getElementById('taskTitle').value.trim();
    if (title) {
      addTask(addTaskTargetColumn, title);
      modal.hide();
    }
  };
}

document.addEventListener('DOMContentLoaded', renderBoard);
