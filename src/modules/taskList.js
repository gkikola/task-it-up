/**
 * Defines the [TaskList]{@link module:taskList~TaskList} class.
 * @module taskList
 */

import {
  addToMapArray,
  findInMapArray,
  formatDate,
  removeFromMapArrayBy,
} from './utility';

import _ from 'lodash';
import { v4 as uuid } from 'uuid';
import { format } from 'date-fns';

const ISO_FORMAT = 'yyyy-MM-dd';

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

    /**
     * Holds a map associating ISO date strings to arrays of
     * [taskWrapper]{@link module:taskList~TaskList~taskWrapper} objects based
     * on the due dates of the tasks. Tasks with no due date are assigned to
     * the array associated with the string 'none'.
     * @type {Map}
     */
    this._tasksByDueDate = new Map();

    /**
     * Holds a map associating project identifiers to arrays of
     * [taskWrapper]{@link module:taskList~TaskList~taskWrapper} objects based
     * on the projects associated with the tasks. Tasks not belonging to any
     * project are assigned to the array associated with the string 'none'.
     * @type {Map}
     */
    this._tasksByProject = new Map();

    /**
     * Holds a map associating priority numbers to arrays of
     * [taskWrapper]{@link module:taskList~TaskList~taskWrapper} objects based
     * on the priorities of the tasks.
     * @type {Map}
     */
    this._tasksByPriority = new Map();
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
    const copy = _.cloneDeep(task);
    this._tasks.set(id, copy);

    // Add task to lookup maps
    const wrapper = { id, task: copy };
    let dateStr = 'none';
    if (task.dueDate)
      dateStr = formatDate(task.dueDate, ISO_FORMAT);
    const projectStr = task.project || 'none';
    const priority = task.priority;
    addToMapArray(this._tasksByDueDate, dateStr, Object.assign({}, wrapper));
    addToMapArray(this._tasksByProject, projectStr, Object.assign({}, wrapper));
    addToMapArray(this._tasksByPriority, priority, Object.assign({}, wrapper));

    return id;
  }

  /**
   * Get a task in the task list. This method only returns a copy of the task,
   * not an actual reference to the task itself. To modify a task in the list,
   * use the [updateTask]{@link module:taskList~TaskList#updateTask} method.
   * @param {string} id The unique identifier of the task to retrieve.
   * @returns {?module:task~Task} The requested task, or undefined if it could
   *   not be found.
   */
  getTask(id) {
    const task = this._tasks.get(id);
    if (task)
      return _.cloneDeep(task);

    return undefined;
  }

  /**
   * Update a task in the task list.
   * @param {string} id The unique identifier of the task to replace.
   * @param {module:task~Task} task The new task to associate with the given
   *   identifier.
   * @returns {boolean} Returns true if the task was replaced successfully. If
   *   the given id is invalid, returns false.
   */
  updateTask(id, task) {
    const oldTask = this._tasks.get(id);
    if (!oldTask)
      return false;

    const copy = _.cloneDeep(task);
    this._tasks.set(id, copy);

    const updateIndex = (map, oldKey, newKey) => {
      if (oldKey === newKey) {
        const entry = findInMapArray(map, newKey, elem => elem.id === id);
        entry.task = copy;
      } else {
        removeFromMapArrayBy(map, oldKey, elem => elem.id === id);
        addToMapArray(map, newKey, { id, task: copy });
      }
    };

    let oldKey = 'none', newKey = 'none';
    if (oldTask.dueDate)
      oldKey = formatDate(oldTask.dueDate, ISO_FORMAT);
    if (copy.dueDate)
      newKey = formatDate(copy.dueDate, ISO_FORMAT);
    updateIndex(this._tasksByDueDate, oldKey, newKey);

    oldKey = oldTask.project || 'none';
    newKey = copy.project || 'none';
    updateIndex(this._tasksByProject, oldKey, newKey);

    oldKey = oldTask.priority;
    newKey = copy.priority;
    updateIndex(this._tasksByPriority, oldKey, newKey);

    return true;
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
