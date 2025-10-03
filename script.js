let draggedTask = null;
let draggedFrom = null;
let addTaskTargetColumn = null;
let tempLabels = [];

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

      // Build labels HTML
      const labelsHTML = task.labels 
        ? task.labels.map(label => 
            `<span class="task-label" style="background-color: ${label.color}">${label.name}</span>`).join(' ') 
        : '';

      taskDiv.innerHTML = `
        <div>
          <span class="task-title">${task.title}</span><br>
          <div class="task-labels">${labelsHTML}</div>
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


function getTasks(col) {
  return JSON.parse(localStorage.getItem('kanban-' + col) || '[]');
}

function setTasks(col, tasks) {
  localStorage.setItem('kanban-' + col, JSON.stringify(tasks));
}

function addTask(col, title, labels = []) {
  const tasks = getTasks(col);
  tasks.push({ title, labels });
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
  tempLabels = [];
  document.getElementById('taskTitle').value = '';
  document.getElementById('taskLabels').value = '';
  document.getElementById('taskLabelColor').value = '#6c757d';
  document.getElementById('currentLabels').innerHTML = '';

  const modalEl = document.getElementById('addTaskModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  // Add Task button
  document.getElementById('addTaskBtn').onclick = function() {
    const title = document.getElementById('taskTitle').value.trim();

    // Automatically push label input if any
    const name = document.getElementById('taskLabels').value.trim();
    const color = document.getElementById('taskLabelColor').value;
    if (name) {
      tempLabels.push({ name, color });
    }

    if (title) {
      addTask(addTaskTargetColumn, title, tempLabels);
      modal.hide();
    }
  };
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