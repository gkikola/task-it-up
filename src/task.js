const taskProto = {
  title: null,
  dueDate: null,
  priority: null,
  description: null,
  notes: null,
  completed: false,
};

function createTask(title, dueDate) {
  if (dueDate && !dueDate instanceof Date)
    throw new TypeError('Invalid datatype for due date: expected Date object');

  const task = Object.create(taskProto);
  task.title = title;
  task.dueDate = dueDate;

  return task;
}

export { createTask };
