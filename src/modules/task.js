class Task {
  title = null;
  dueDate = null;
  completionDate = null;
  priority = 'medium';
  description = null;
  notes = null;
  recurringDate = null;
  project = null;

  constructor(title) {
    this.title = title;
  }

  toString() {
    return this.title ? `Task: ${this.title}` : 'Task: (untitled)';
  }
}

export default Task;
