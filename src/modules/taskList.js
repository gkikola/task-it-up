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
   * Create a task list.
   */
  constructor() {
    /**
     * Holds a map associating UUIDs to tasks.
     * @type {Map}
     */
    this.tasks = new Map();
  }

  /**
   * Adds a task to the task list and returns its unique ID. In order to
   * prevent unintentional external modification of the task, a deep copy is
   * made, and the original object is not kept.
   * @param {module:task~Task} task The task to be added.
   * @returns {string} The ID of the newly-added task.
   */
  addTask(task) {
    // Generate UUID (loop just in case there's a collision)
    let id;
    do {
      id = uuid();
    } while (this.tasks.has(id));

    // Add task to task map
    this.tasks.set(id, _.cloneDeep(task));
    return id;
  }
}

export default TaskList;
