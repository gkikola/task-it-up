/**
 * Defines the [TaskDisplay]{@link module:taskDisplay~TaskDisplay} class.
 * @module taskDisplay
 */

/**
 * A display panel showing a list of tasks.
 */
class TaskDisplay {
  /**
   * Create a task display.
   * @param {HTMLElement} parent The parent DOM node that will contain the
   *   panel.
   * @param {module:taskList~TaskList} taskList The
   *   [TaskList]{@link module:taskList~TaskList} holding all of the tasks.
   * @param {module:projectList~ProjectList} projectList The
   *   [ProjectList]{@link module:projectList~ProjectList} holding all of the
   *   projects.
   */
  constructor(parent, taskList, projectList) {
    const container = document.createElement('div');
    container.classList.add('task-panel');
    parent.appendChild(container);

    /**
     * The task container.
     * @type {module:taskList~TaskList}
     */
    this._tasks = taskList;

    /**
     * The project container.
     * @type {module:projectList~ProjectList}
     */
    this._projects = projectList;
  }
}

export default TaskDisplay;
