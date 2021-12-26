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
   * @param {string} name The name of the task.
   */
  constructor(name) {
    /**
     * The name of the task.
     * @type {string}
     */
    this.name = name;

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
   * The priority of the task represented as a string value. This corresponds
   * to the numerical [priority]{@link module:task~Task~priority} property,
   * with the following correspondence: 'very-low' = -2, 'low' = -1, 'medium' =
   * 0, 'high' = 1, and 'very-high' = 2.
   * @type {string}
   */
  get priorityString() {
    switch (this.priority) {
      case -2: return 'very-low';
      case -1: return 'low';
      case 0: return 'medium';
      case 1: return 'high';
      case 2: return 'very-high';
      default: return 'unknown';
    }
  }

  set priorityString(priority) {
    switch (priority) {
      case 'very-low':
        this.priority = -2;
        break;
      case 'low':
        this.priority = -1;
        break;
      default:
      case 'medium':
        this.priority = 0;
        break;
      case 'high':
        this.priority = 1;
        break;
      case 'very-high':
        this.priority = 2;
        break;
    }
  }

  /**
   * Get a string representation of the task.
   * @returns {string} A string representation of the task.
   */
  toString() {
    return this.name ? `Task: ${this.name}` : 'Task: (untitled)';
  }
}

export default Task;
