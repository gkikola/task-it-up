const taskProto = {
  title: null,
  dueDate: null,
  completionDate: null,
  priority: 'medium',
  description: null,
  notes: null,
  recurringDate: null,
  project: null,

  toString() {
    return this.title ? `Task: ${this.title}` : 'Task: (untitled)';
  },
};

function createTask(title) {
  const task = Object.create(taskProto);
  task.title = title;

  return task;
}

export { createTask };
