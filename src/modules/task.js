/**
 * Defines the [Task]{@link module:task~Task} class.
 * @module task
 */

/**
 * Represents a task.
 */
class Task {
  /**
   * Create a task.
   * @param {string} title The title of the task.
   */
  constructor(title) {
    /**
     * The title of the task.
     * @type {string}
     */
    this.title = title;

    /**
     * The date when the task is due, if any.
     * @type {?Date}
     */
    this.dueDate = null;

    /**
     * The date when the task was completed, or null if it is not completed.
     * @type {?Date}
     */
    this.completionDate = null;

    /**
     * The priority of the task. A larger value indicates a higher priority,
     * with 0 representing medium priority. Positive values are higher than
     * medium, and negative values are lower than medium.
     * @type {number}
     */
    this.priority = 0;

    /**
     * An optional description of the task.
     * @type {?string}
     */
    this.description = null;

    /**
     * An optional collection of notes related to the task.
     * @type {?string}
     */
    this.notes = null;

    /**
     * A recurring due date for the task, if any.
     * @type {?module:recurringDate~RecurringDate}
     */
    this.recurringDate = null;

    /**
     * The identifier of the project to which this task belongs, if any.
     * @type {?string}
     */
    this.project = null;
  }

  /**
   * Get a string representation of the task.
   * @returns {string} A string representation of the task.
   */
  toString() {
    return this.title ? `Task: ${this.title}` : 'Task: (untitled)';
  }
}

export default Task;
