/**
 * Defines the [TaskList]{@link module:taskList~TaskList} class.
 * @module taskList
 */

import _ from 'lodash';
import { v4 as uuid } from 'uuid';

/**
 * Container holding a list of tasks.
 */
class TaskList {
  /**
   * Wrapper object holding a task along with its UUID.
   * @typedef {Object} module:taskList~TaskList~taskWrapper
   * @property {string} id The unique identifier for the task.
   * @property {module:task~Task} task The task instance.
   */

  /**
   * Create a task list.
   */
  constructor() {
    /**
     * Holds a map associating UUIDs to tasks.
     * @type {Map}
     */
    this._tasks = new Map();
  }

  /**
   * Adds a task to the task list and returns its unique identifier. In order
   * to prevent unintentional external modification of the task, a deep copy is
   * made, and the original object is not kept.
   * @param {module:task~Task} task The task to be added.
   * @returns {string} The identifier of the newly-added task.
   */
  addTask(task) {
    // Generate UUID (loop just in case there's a collision)
    let id;
    do {
      id = uuid();
    } while (this._tasks.has(id));

    // Add task to task map
    this._tasks.set(id, _.cloneDeep(task));
    return id;
  }

  /**
   * Iterate over the task list. Each iteration yields a wrapper containing the
   * identifier of the task along with the task itself.
   * @yields {module:taskList~TaskList~taskWrapper} The next task in the list.
   */
  *[Symbol.iterator]() {
    for (const entry of this._tasks)
      yield { id: entry[0], task: _.cloneDeep(entry[1]) };
  }
}

export default TaskList;
