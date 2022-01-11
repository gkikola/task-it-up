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
   * @param {Object} [options={}] An object specifying additional options for
   *   the task.
   * @param {Date} [options.dueDate] The date when the task is due, if any.
   * @param {Date} [options.completionDate] The date when the task was
   *   completed, if any.
   * @param {number|string} [options.priority=0] The priority of the task. For
   *   numeric values, a larger value indicates a higher priority, with 0
   *   representing medium priority, positive values representing higher-than-
   *   medium priority, and negative values representing lower-than-medium
   *   priority. For string values, possible settings are 'very-low', 'low',
   *   'medium', 'high', and 'very-high'.
   * @param {string} [options.description] A description for the task.
   * @param {module:recurringDate~RecurringDate} [options.recurringDate] A
   *   recurring date for the task, if any.
   * @param {string} [options.project] The identifier of the project to which
   *   the task belongs, if any.
   */
  constructor(name, options = {}) {
    /**
     * The name of the task.
     * @type {string}
     */
    this.name = name;

    /**
     * The date when the task is due, if any.
     * @type {?Date}
     */
    this.dueDate = options.dueDate || null;

    /**
     * The date when the task was completed, or null if it is not completed.
     * @type {?Date}
     */
    this.completionDate = options.completionDate || null;

    /**
     * The priority of the task. A larger value indicates a higher priority,
     * with 0 representing medium priority. Positive values are higher than
     * medium, and negative values are lower than medium.
     * @type {number}
     */
    this.priority = 0;
    if (typeof options.priority === 'number')
      this.priority = options.priority;
    else if (typeof options.priority === 'string')
      this.priorityString = options.priority;

    /**
     * An optional description of the task.
     * @type {?string}
     */
    this.description = options.description || null;

    /**
     * A recurring date for the task, if any.
     * @type {?module:recurringDate~RecurringDate}
     */
    this.recurringDate = options.recurringDate || null;

    /**
     * The identifier of the project to which this task belongs, if any.
     * @type {?string}
     */
    this.project = options.project || null;
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
