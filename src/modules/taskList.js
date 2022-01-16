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

import {
  isBefore as isDateBefore,
  isSameDay,
} from 'date-fns';
import _ from 'lodash';
import { v4 as uuid } from 'uuid';

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
   * An object specifying options for sorting tasks.
   * @typedef {Object} module:taskList~TaskList~sortOptions
   * @property {string} field The field to sort by. Can be one of 'name',
   *   'due-date', 'create-date', 'priority', or 'project'.
   * @property {boolean} [descending=false] If set to true, then the tasks will
   *   be sorted in descending order, rather than in ascending order.
   * @property {boolean} [caseSensitive=false] If set to true, then the sorting
   *   will be case-sensitive (only applies to text-based fields).
   * @property {boolean} [missingLast=false] If set to true, then tasks that do
   *   not have the specified field will be sorted at the end (or at the
   *   beginning if descending is true). Otherwise, tasks that are missing the
   *   specified field are sorted at the beginning (or end if descending).
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

  /**
   * Returns a new Iterator object that contains a
   * [taskWrapper]{@link module:taskList~TaskList~taskWrapper} for each task in
   * the list matching the given options.
   * @param {Object} [options={}] An object holding options to control which
   *   tasks to include in the Iterator.
   * @param {module:projectList~ProjectList} [options.projectList] The project
   *   container. If not provided, then sorting by project will be disabled.
   * @param {Date} [options.startDate] If provided, all tasks with due dates
   *   before the given date will be excluded.
   * @param {Date} [options.endDate] If provided, all tasks with due dates
   *   after the given date will be excluded.
   * @param {boolean} [options.completed=false] If set to true, then tasks that
   *   have been completed will be included. Otherwise they are excluded.
   * @param {boolean} [options.requireDueDate=false] If set to true, then tasks
   *   that do not have a due date will be excluded.
   * @param {string} [options.project] If provided, only tasks belonging to the
   *   specified project will be included. If set to 'none', then only tasks
   *   that do not have a project assigned will be included.
   * @param {number} [options.priority] If provided, only tasks with the
   *   specified priority will be included.
   * @param {module:taskList~TaskList~sortOptions[]} [options.sortBy] An array
   *   of objects specifying the sort order. The first element in the array
   *   determines the primary field on which to sort the tasks, the second
   *   element determines the field used to break ties, the third element
   *   determines the field used to break further ties, and so on.
   * @yields {module:taskList~TaskList~taskWrapper} The next task in the list.
   */
  *entries(options = {}) {
    const sortBy = options.sortBy || [];

    // Which index to use: default | due-date | project | priority
    let lookupType = 'default';
    if (options.project) {
      lookupType = 'project';
    } else if (typeof options.priority === 'number') {
      lookupType = 'priority';
    } else if (options.startDate || options.endDate) {
      lookupType = 'due-date';
    }

    let output = [];
    const copyTasks = (map, key) => {
      const tasks = map.get(key);
      if (tasks)
        tasks.forEach(task => output.push(_.cloneDeep(task)));
    };
    switch (lookupType) {
      default:
      case 'default':
        output = [...this];
        break;
      case 'due-date': {
        const dates = [...this._tasksByDueDate.keys()];
        dates.sort();

        let startKey = null, endKey = null;
        if (options.startDate)
          startKey = formatDate(options.startDate, ISO_FORMAT);
        if (options.endDate)
          endKey = formatDate(options.endDate, ISO_FORMAT);

        let lowIndex = 0, highIndex = dates.length;
        if (startKey)
          lowIndex = _.sortedIndex(dates, startKey);
        if (endKey)
          highIndex = _.sortedLastIndex(dates, endKey);
        else if (dates.length > 0 && dates[dates.length - 1] === 'none')
          highIndex--;

        dates.slice(lowIndex, highIndex).forEach(key => {
          copyTasks(this._tasksByDueDate, key);
        });
        copyTasks(this._tasksByDueDate, 'none');
        break;
      }
      case 'priority': {
        copyTasks(this._tasksByPriority, options.priority);
        break;
      }
      case 'project':
        copyTasks(this._tasksByProject, options.project);
        break;
    }

    output = output.filter(entry => {
      const task = entry.task;
      if (task.dueDate) {
        if (options.startDate && isDateBefore(task.dueDate, options.startDate))
          return false;
        if (options.endDate && isDateBefore(options.endDate, task.dueDate))
          return false;
      }
      if (!options.completed && task.completionDate)
        return false;
      if (options.requireDueDate && !task.dueDate)
        return false;
      if (options.project) {
        if (options.project === 'none' && task.project)
          return false;
        if (options.project !== 'none' && task.project !== options.project)
          return false;
      }
      if (typeof options.priority === 'number'
        && task.priority !== options.priority)
        return false;

      return true;
    });

    output = output.sort((a, b) => {
      const leftTask = a.task;
      const rightTask = b.task;
      for (let index = 0; index < sortBy.length; index++) {
        const caseSensitive = sortBy[index].caseSensitive || false;
        const descending = sortBy[index].descending || false;
        const missingLast = sortBy[index].missingLast || false;
        const LESS = descending ? 1 : -1;
        const MORE = descending ? -1 : 1;
        switch (sortBy[index].field) {
          default:
            return 0;
          case 'name': {
            let leftName = leftTask.name;
            let rightName = rightTask.name;
            if (!caseSensitive) {
              leftName = leftName.toLowerCase();
              rightName = rightName.toLowerCase();
            }
            if (leftName < rightName)
              return LESS;
            else if (leftName > rightName)
              return MORE;
            break;
          }
          case 'due-date': {
            const leftDate = leftTask.dueDate;
            const rightDate = rightTask.dueDate;
            if (!leftDate && rightDate)
              return missingLast ? MORE : LESS;
            if (leftDate && !rightDate)
              return missingLast ? LESS : MORE;
            if (leftDate && rightDate && !isSameDay(leftDate, rightDate))
              return isDateBefore(leftDate, rightDate) ? LESS : MORE;
            break;
          }
          case 'create-date':
            if (isDateBefore(leftTask.createDate, rightTask.createDate))
              return LESS;
            if (isDateBefore(rightTask.createDate, leftTask.createDate))
              return MORE;
            break;
          case 'priority':
            if (leftTask.priority > rightTask.priority)
              return LESS;
            if (leftTask.priority < rightTask.priority)
              return MORE;
            break;
          case 'project': {
            const leftProj = leftTask.project;
            const rightProj = rightTask.project;
            if (!leftProj && rightProj)
              return missingLast ? MORE : LESS;
            if (leftProj && !rightProj)
              return missingLast ? LESS : MORE;
            if (leftProj && rightProj) {
              const projectList = options.projectList;
              if (!projectList)
                break;
              let leftName = projectList.getProject(leftProj).name;
              let rightName = projectList.getProject(rightProj).name;
              if (!caseSensitive) {
                leftName = leftName.toLowerCase();
                rightName = rightName.toLowerCase();
              }
              if (leftName < rightName)
                return LESS;
              else if (leftName > rightName)
                return MORE;
            }
            break;
          }
        }
      }

      return 0;
    });

    for (const entry of output)
      yield entry;
  }
}

export default TaskList;
