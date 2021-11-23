const taskProto = {
  title: null,
  dueDate: null,
  priority: null,
  description: null,
  notes: null,
  completed: false,
};

function createTask(title) {
  const task = Object.create(taskProto);
  task.title = title;

  return task;
}

export { createTask };
