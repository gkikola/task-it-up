/**
 * Defines the [TaskList]{@link module:taskList~TaskList} class.
 * @module taskList
 */

import { isBefore as isDateBefore, isSameDay } from 'date-fns';
import EventEmitter from 'events';
import _ from 'lodash';
import { v4 as generateUuid } from 'uuid';

import RecurringDate from './recurringDate';
import Task from './task';
import {
  addToMapArray,
  findInMapArray,
  getJsonType,
  isUuidValid,
  removeFromMapArrayBy,
  validateValue,
} from './utility/data';
import {
  formatIsoDate,
  getMonthIndex,
  getMonthName,
  getWeekdayIndex,
  getWeekdayName,
} from './utility/dates';
import { arrayToCsvRecord } from './utility/storage';

/**
 * Object holding private members for the
 * [TaskList]{@link module:taskList~TaskList} class.
 * @typedef {Object} module:taskList~TaskList~privates
 * @property {Map} tasks Holds a map associating UUIDs to tasks.
 * @property {Map} tasksByDueDate Holds a map associating ISO date strings to
 *   arrays of [taskWrapper]{@link module:taskList~TaskList~taskWrapper}
 *   objects based on the due dates of the tasks. Tasks with no due date are
 *   assigned to the array associated with the string 'none'.
 * @property {Map} tasksByProject Holds a map associating project identifiers
 *   to arrays of [taskWrapper]{@link module:taskList~TaskList~taskWrapper}
 *   objects based on the projects associated with the tasks. Tasks not
 *   belonging to any project are assigned to the array associated with the
 *   string 'none'.
 * @property {Map} tasksByPriority Holds a map associating priority numbers to
 *   arrays of [taskWrapper]{@link module:taskList~TaskList~taskWrapper}
 *   objects based on the priorities of the tasks.
 * @property {EventEmitter} eventEmitter Holds the event emitter which
 *   dispatches events to attached event listeners.
 */

/**
 * Holds private data for the [TaskList]{@link module:taskList~TaskList} class.
 * @type {WeakMap}
 * @see module:taskList~TaskList~privates
 */
const privateMembers = new WeakMap();

/**
 * Filter tasks in the list according to the given criteria.
 * @param {module:taskList~TaskList} instance The
 *   [TaskList]{@link module:taskList~TaskList} instance on which to run the
 *   function.
 * @param {Object} [options={}] An object holding options to control which
 *   tasks are to be included.
 * @param {boolean} [options.cloneTasks=false] If set to true, then the tasks
 *   in the returned array will be deep clones of the tasks in the list.
 *   Otherwise, references to the original tasks are used.
 * @param {Date} [options.startDate] If provided, only tasks with due dates
 *   on or after the given date will be included.
 * @param {Date} [options.endDate] If provided, only tasks with due dates
 *   on or before the given date will be included.
 * @param {boolean} [options.completed=false] If set to true, then tasks that
 *   have been completed will be included. Otherwise, they are excluded.
 * @param {boolean} [options.requireDueDate=false] If set to true, then only
 *   tasks that have a due date will be included.
 * @param {string} [options.project] If provided, only tasks belonging to the
 *   specified project will be included. If set to 'none', then only tasks
 *   that do not have a project assigned will be included.
 * @param {number} [options.priority] If provided, only tasks with the
 *   specified priority will be included.
 * @returns {Task[]} An array containing all tasks in the list that match the
 *   given criteria.
 */
function filterTasks(instance, options = {}) {
  const privates = privateMembers.get(instance);

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
  const copyTask = (task) => (options.cloneTasks ? _.cloneDeep(task) : task);
  const pushTasks = (map, key) => {
    const tasks = map.get(key);
    if (tasks) tasks.forEach((task) => output.push(copyTask(task)));
  };

  switch (lookupType) {
    case 'due-date': {
      const dates = [...privates.tasksByDueDate.keys()];
      dates.sort();

      let startKey = null;
      let endKey = null;
      if (options.startDate) {
        startKey = formatIsoDate(options.startDate);
      }
      if (options.endDate) {
        endKey = formatIsoDate(options.endDate);
      }

      let lowIndex = 0;
      let highIndex = dates.length;
      if (startKey) {
        lowIndex = _.sortedIndex(dates, startKey);
      }
      if (endKey) {
        highIndex = _.sortedLastIndex(dates, endKey);
      } else if (dates.length > 0 && dates[dates.length - 1] === 'none') {
        highIndex -= 1;
      }

      dates.slice(lowIndex, highIndex).forEach((key) => {
        pushTasks(privates.tasksByDueDate, key);
      });
      pushTasks(privates.tasksByDueDate, 'none');
      break;
    }
    case 'priority': {
      pushTasks(privates.tasksByPriority, options.priority);
      break;
    }
    case 'project':
      pushTasks(privates.tasksByProject, options.project);
      break;
    case 'default':
    default:
      privates.tasks.forEach((task, id) => {
        output.push({ id, task: copyTask(task) });
      });
      break;
  }

  output = output.filter(({ task }) => {
    if (task.dueDate) {
      if (options.startDate
        && isDateBefore(task.dueDate, options.startDate)) {
        return false;
      }
      if (options.endDate && isDateBefore(options.endDate, task.dueDate)) {
        return false;
      }
    }
    if (!options.completed && task.isComplete()) return false;
    if (options.requireDueDate && !task.dueDate) return false;
    if (options.project) {
      if (options.project === 'none' && task.project) return false;
      if (options.project !== 'none' && task.project !== options.project) {
        return false;
      }
    }
    if (typeof options.priority === 'number'
      && task.priority !== options.priority) {
      return false;
    }

    return true;
  });

  return output;
}

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
   * Event that is fired when a task is added to the task list.
   * @event module:taskList~TaskList~addTask
   * @type {Object}
   * @property {string} type The event type: 'add-task'.
   * @property {string} id The unique identifier of the newly-added task.
   * @property {module:task~Task} task A copy of the newly-added task.
   */

  /**
   * Event that is fired when a task in the list is modified.
   * @event module:taskList~TaskList~updateTask
   * @type {Object}
   * @property {string} type The event type: 'update-task'.
   * @property {string} id The unique identifier of the updated task.
   * @property {module:task~Task} task A copy of the modified task.
   */

  /**
   * Event that is fired when a task in the list is deleted.
   * @event module:taskList~TaskList~deleteTask
   * @type {Object}
   * @property {string} type The event type: 'delete-task'.
   * @property {string} id The unique identifier for the deleted task.
   * @property {module:task~Task} task A copy of the task that was deleted.
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
   * An object holding information about the status of a data import.
   * @typedef {Object} module:taskList~TaskList~importStatus
   * @property {Object} tasks An object holding information about the number of
   *   tasks that were imported.
   * @property {number} tasks.added The number of new tasks that were added to
   *   the task list.
   * @property {number} tasks.updated The number of existing tasks in the task
   *   list that were updated.
   * @property {number} tasks.failed The number of tasks that failed to import.
   * @property {number} tasks.total The total number of tasks that were
   *   processed.
   * @property {Object} [projects] An object holding information about the
   *   number of projects that were imported. This is not used for JSON
   *   imports.
   * @property {number} projects.added The number of new projects that were
   *   added to the project list.
   * @property {number} projects.updated The number of existing projects in the
   *   project list that were updated.
   * @property {number} projects.failed The number of projects that failed to
   *   import.
   * @property {number} projects.total The total number of projects that were
   *   processed.
   * @property {string[]} errors An array of error messages describing any
   *   errors that occurred during the import.
   */

  /**
   * Create a task list.
   */
  constructor() {
    const privates = {
      tasks: new Map(),
      tasksByDueDate: new Map(),
      tasksByProject: new Map(),
      tasksByPriority: new Map(),
      eventEmitter: new EventEmitter(),
    };
    privateMembers.set(this, privates);
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
    const task = privateMembers.get(this).tasks.get(id);
    if (task) return _.cloneDeep(task);
    return undefined;
  }

  /**
   * Update a task in the task list.
   * @param {string} id The unique identifier of the task to replace.
   * @param {module:task~Task} task The new task to associate with the given
   *   identifier.
   * @returns {boolean} Returns true if the task was replaced successfully. If
   *   the given id is invalid, returns false.
   * @fires module:taskList~TaskList~updateTask
   */
  updateTask(id, task) {
    const privates = privateMembers.get(this);
    const oldTask = privates.tasks.get(id);
    if (!oldTask) return false;

    const copy = _.cloneDeep(task);
    privates.tasks.set(id, copy);

    const updateIndex = (map, oldKey, newKey) => {
      if (oldKey === newKey) {
        const entry = findInMapArray(map, newKey, (elem) => elem.id === id);
        entry.task = copy;
      } else {
        removeFromMapArrayBy(map, oldKey, (elem) => elem.id === id);
        addToMapArray(map, newKey, { id, task: copy });
      }
    };

    let oldKey = 'none';
    let newKey = 'none';
    if (oldTask.dueDate) oldKey = formatIsoDate(oldTask.dueDate);
    if (copy.dueDate) newKey = formatIsoDate(copy.dueDate);
    updateIndex(privates.tasksByDueDate, oldKey, newKey);

    oldKey = oldTask.project || 'none';
    newKey = copy.project || 'none';
    updateIndex(privates.tasksByProject, oldKey, newKey);

    oldKey = oldTask.priority;
    newKey = copy.priority;
    updateIndex(privates.tasksByPriority, oldKey, newKey);

    privates.eventEmitter.emit('update-task', {
      type: 'update-task',
      id,
      task: _.cloneDeep(task),
    });

    return true;
  }

  /**
   * Add or update a task. If a task with the given identifier exists, then it
   * is replaced with the given task. Otherwise, the task is added to the list
   * as a new task. If the given identifier is not a valid UUID, then the
   * method returns false and nothing happens.
   * @param {string} id The unique identifier of the task.
   * @param {module:task~Task} task The task that should be added or with which
   *   an existing task should be replaced.
   * @returns {boolean} True if the task was successfully added or updated, or
   *   false if the given identifier is not a valid UUID.
   * @fires module:taskList~TaskList~addTask
   * @fires module:taskList~TaskList~updateTask
   */
  addOrUpdateTask(id, task) {
    if (!isUuidValid(id)) return false;

    if (!this.updateTask(id, task)) {
      const privates = privateMembers.get(this);

      // Add task to task map
      const copy = _.cloneDeep(task);
      privates.tasks.set(id, copy);

      // Add task to lookup maps
      const wrapper = { id, task: copy };
      let dateStr = 'none';
      if (task.dueDate) dateStr = formatIsoDate(task.dueDate);
      const projectStr = task.project || 'none';
      const { priority } = task;
      addToMapArray(
        privates.tasksByDueDate,
        dateStr,
        { ...wrapper },
      );
      addToMapArray(
        privates.tasksByProject,
        projectStr,
        { ...wrapper },
      );
      addToMapArray(
        privates.tasksByPriority,
        priority,
        { ...wrapper },
      );

      privates.eventEmitter.emit('add-task', {
        type: 'add-task',
        id,
        task: _.cloneDeep(task),
      });
    }

    return true;
  }

  /**
   * Adds a task to the task list and returns its unique identifier. In order
   * to prevent unintentional external modification of the task, a deep copy is
   * made, and the original object is not kept.
   * @param {module:task~Task} task The task to be added.
   * @returns {string} The identifier of the newly-added task.
   * @fires module:taskList~TaskList~addTask
   */
  addTask(task) {
    const privates = privateMembers.get(this);

    // Generate UUID (loop just in case there's a collision)
    let id;
    do {
      id = generateUuid();
    } while (privates.tasks.has(id));

    this.addOrUpdateTask(id, task);
    return id;
  }

  /**
   * Determines whether a task with the given identifier exists within the task
   * list.
   * @param {string} id The unique identifier of the task to look for.
   * @returns {boolean} True if the task exists, and false otherwise.
   */
  hasTask(id) {
    return privateMembers.get(this).tasks.has(id);
  }

  /**
   * Remove a task from the task list.
   * @param {string} id The unique identifier of the task to remove.
   * @returns {boolean} Returns true if the task was found and removed
   *   successfully. Otherwise, if the given id was not found, returns false.
   * @fires module:taskList~TaskList~deleteTask
   */
  deleteTask(id) {
    const privates = privateMembers.get(this);
    const task = privates.tasks.get(id);
    if (!task) return false;

    let dateStr = 'none';
    if (task.dueDate) dateStr = formatIsoDate(task.dueDate);
    const projectStr = task.project || 'none';
    const { priority } = task;

    privates.tasks.delete(id);
    removeFromMapArrayBy(privates.tasksByDueDate, dateStr, (elem) => (
      elem.id === id
    ));
    removeFromMapArrayBy(privates.tasksByProject, projectStr, (elem) => (
      elem.id === id
    ));
    removeFromMapArrayBy(privates.tasksByPriority, priority, (elem) => (
      elem.id === id
    ));

    privates.eventEmitter.emit('delete-task', {
      type: 'delete-task',
      id,
      task,
    });

    return true;
  }

  /**
   * Delete all tasks in the task list.
   * @fires module:taskList~TaskList~deleteTask
   */
  deleteAll() {
    const privates = privateMembers.get(this);

    // Save task information in order to emit delete events later
    const tasks = [];
    privates.tasks.forEach((task, id) => tasks.push({ id, task }));

    privates.tasks.clear();
    privates.tasksByDueDate.clear();
    privates.tasksByProject.clear();
    privates.tasksByPriority.clear();

    tasks.forEach(({ id, task }) => {
      privates.eventEmitter.emit('delete-task', {
        type: 'delete-task',
        id,
        task,
      });
    });
  }

  /**
   * For each task belonging to a given project, remove the task from that
   * project. Afterward, there will be no tasks assigned to the project.
   * @param {string} projectId The unique identifier of the project to clear.
   * @fires module:taskList~TaskList~updateTask
   */
  clearProject(projectId) {
    const privates = privateMembers.get(this);
    const map = privates.tasksByProject;
    const tasks = map.get(projectId);
    if (!tasks) return;

    // Save modified tasks in order to emit events later
    const updatedTasks = [];

    tasks.forEach((entry) => {
      const { task } = entry;
      task.project = null;
      addToMapArray(map, 'none', entry);
      updatedTasks.push(entry);
    });
    map.delete(projectId);

    updatedTasks.forEach(({ id, task }) => {
      privates.eventEmitter.emit('update-task', {
        type: 'update-task',
        id,
        task: _.cloneDeep(task),
      });
    });
  }

  /**
   * Execute the provided function on each task in the list. Note that the task
   * instance passed to the callback function is only a copy of the task in the
   * list.
   * @param {Function} callback The function to execute on each task. The
   *   function will be passed a
   *   [wrapper]{@link module:taskList~TaskList~taskWrapper} containing the
   *   task and its identifier.
   */
  forEach(callback) {
    privateMembers.get(this).tasks.forEach((task, id) => {
      const copy = _.cloneDeep(task);
      callback({ id, task: copy });
    });
  }

  /**
   * Count the number of tasks in the list, optionally restricted to tasks
   * matching a set of criteria.
   * @param {Object} [options={}] An object holding options to control which
   *   tasks are to be counted.
   * @param {Date} [options.startDate] If provided, only tasks with due dates
   *   on or after the given date will be counted.
   * @param {Date} [options.endDate] If provided, only tasks with due dates
   *   on or before the given date will be counted.
   * @param {boolean} [options.completed=false] If set to true, then tasks that
   *   have been completed will be counted. Otherwise, they are excluded.
   * @param {boolean} [options.requireDueDate=false] If set to true, then only
   *   tasks that have a due date will be counted.
   * @param {string} [options.project] If provided, only tasks belonging to the
   *   specified project will be counted. If set to 'none', then only tasks
   *   that do not have a project assigned will be counted.
   * @param {number} [options.priority] If provided, only tasks with the
   *   specified priority will be counted.
   * @returns {number} The number of tasks in the list matching the given
   *   criteria, or the total number of tasks if no criteria was given.
   */
  count(options = {}) {
    return filterTasks(this, options).length;
  }

  /**
   * Get an array of [taskWrapper]{@link module:taskList~TaskList~taskWrapper}
   * objects filtered and sorted according to the given options.
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
   * @returns {module:taskList~TaskList~taskWrapper[]} The array of
   *   [taskWrapper]{@link module:taskList~TaskList~taskWrapper} objects.
   */
  entries(options = {}) {
    const sortBy = options.sortBy || [];

    const filterCriteria = options;
    filterCriteria.cloneTasks = true;
    let output = filterTasks(this, filterCriteria);

    output = output.sort((a, b) => {
      const leftTask = a.task;
      const rightTask = b.task;
      for (let index = 0; index < sortBy.length; index += 1) {
        const caseSensitive = sortBy[index].caseSensitive ?? false;
        const descending = sortBy[index].descending ?? false;
        const missingLast = sortBy[index].missingLast ?? false;
        const LESS = descending ? 1 : -1;
        const MORE = descending ? -1 : 1;
        switch (sortBy[index].field) {
          case 'name': {
            let leftName = leftTask.name;
            let rightName = rightTask.name;
            if (!caseSensitive) {
              leftName = leftName.toLowerCase();
              rightName = rightName.toLowerCase();
            }
            if (leftName < rightName) return LESS;
            if (leftName > rightName) return MORE;
            break;
          }
          case 'due-date': {
            const leftDate = leftTask.dueDate;
            const rightDate = rightTask.dueDate;
            if (!leftDate && rightDate) return missingLast ? MORE : LESS;
            if (leftDate && !rightDate) return missingLast ? LESS : MORE;
            if (leftDate && rightDate && !isSameDay(leftDate, rightDate)) {
              return isDateBefore(leftDate, rightDate) ? LESS : MORE;
            }
            break;
          }
          case 'create-date':
            if (isDateBefore(leftTask.creationDate, rightTask.creationDate)) {
              return LESS;
            }
            if (isDateBefore(rightTask.creationDate, leftTask.creationDate)) {
              return MORE;
            }
            break;
          case 'priority':
            if (leftTask.priority < rightTask.priority) return LESS;
            if (leftTask.priority > rightTask.priority) return MORE;
            break;
          case 'project': {
            const leftProj = leftTask.project;
            const rightProj = rightTask.project;
            if (!leftProj && rightProj) return missingLast ? MORE : LESS;
            if (leftProj && !rightProj) return missingLast ? LESS : MORE;
            if (leftProj && rightProj) {
              const { projectList } = options;
              if (!projectList) break;

              let leftName = projectList.getProject(leftProj).name;
              let rightName = projectList.getProject(rightProj).name;
              if (!caseSensitive) {
                leftName = leftName.toLowerCase();
                rightName = rightName.toLowerCase();
              }
              if (leftName < rightName) return LESS;
              if (leftName > rightName) return MORE;
            }
            break;
          }
          default:
            return 0;
        }
      }

      return 0;
    });

    return output;
  }

  /**
   * Add an event listener to the task list.
   * @param {string} type The type of event to listen for.
   * @param {Function} listener A callback function to be invoked when the
   *   event is triggered.
   */
  addEventListener(type, listener) {
    privateMembers.get(this).eventEmitter.on(type, listener);
  }

  /**
   * Convert data to an object suitable for serialization.
   * @returns {Object} An object representing serializable data for the class.
   */
  toJSON() {
    const tasks = [];
    privateMembers.get(this).tasks.forEach((task, id) => {
      const copy = _.cloneDeep(task);
      copy.id = id;
      tasks.push(copy);
    });
    return tasks;
  }

  /**
   * Convert data to a string in CSV (comma-separated values) format.
   * @param {Object} [options={}] An object holding additional options.
   * @param {string} [options.newlineSequence] The character sequence to use
   *   for newlines. If not given, then a carriage return/line feed pair (CRLF)
   *   is used, as suggested by the
   *   [RFC 4180]{@link https://datatracker.ietf.org/doc/html/rfc4180}
   *   specification.
   * @param {module:projectList~ProjectList} [options.projectList] The project
   *   container. If not provided, then no project information besides the
   *   project identifier will be included in the CSV fields.
   * @returns {string} The task data in CSV format.
   */
  toCsv(options = {}) {
    const projectFields = [];
    if (options.projectList) projectFields.push('Project Name');
    projectFields.push('Project UUID');
    if (options.projectList) projectFields.push('Project Description');

    const header = [
      'Name',
      'UUID',
      'Due Date',
      'Date Added',
      'Date Completed',
      'Priority',
      'Description',
      ...projectFields,
      'Recurrence Interval Unit',
      'Recurrence Interval Length',
      'Recurrence Start Date',
      'Recurrence Based on Completion?',
      'Recurrence Week Number',
      'Recurrence Week Days',
      'Recurrence Month',
      'Recurrence Day',
      'Recurrence Weekend Behavior',
      'Recurrence End Date',
      'Recurrence Max Count',
    ];

    const newlineSequence = options.newlineSequence ?? '\r\n';
    const csvOptions = { newlineSequence };
    const convertDate = (date) => date?.toJSON() ?? '';
    const lines = [arrayToCsvRecord(header, csvOptions)];
    privateMembers.get(this).tasks.forEach((task, id) => {
      const fields = [
        task.name,
        id,
        convertDate(task.dueDate),
        convertDate(task.creationDate),
        convertDate(task.completionDate),
        Task.convertPriorityToPrettyString(task.priority),
        task.description ?? '',
      ];

      if (options.projectList) {
        let project = null;
        if (task.project) {
          project = options.projectList.getProject(task.project);
        }
        fields.push(
          project?.name ?? '',
          task.project ?? '',
          project?.description ?? '',
        );
      } else {
        fields.push(task.project ?? '');
      }

      const { recurringDate } = task;
      let intervalUnit = '';
      switch (recurringDate?.intervalUnit) {
        case 'day':
          intervalUnit = 'Day';
          break;
        case 'week':
          intervalUnit = 'Week';
          break;
        case 'month':
          intervalUnit = 'Month';
          break;
        case 'year':
          intervalUnit = 'Year';
          break;
        default:
          break;
      }
      let daysOfWeek = '';
      if (recurringDate?.daysOfWeek) {
        daysOfWeek = recurringDate.daysOfWeek.map(getWeekdayName).join(', ');
      }
      let month = '';
      if (Number.isInteger(recurringDate?.month)) {
        month = getMonthName(recurringDate.month);
      }
      let onWeekend = '';
      switch (recurringDate?.onWeekend) {
        case 'no-change':
          onWeekend = 'No Change';
          break;
        case 'previous-weekday':
          onWeekend = 'Use Previous Weekday';
          break;
        case 'next-weekday':
          onWeekend = 'Use Next Weekday';
          break;
        case 'nearest-weekday':
          onWeekend = 'Use Nearest Weekday';
          break;
        default:
          break;
      }
      fields.push(
        intervalUnit,
        recurringDate?.intervalLength.toString() ?? '',
        convertDate(recurringDate?.startDate),
        recurringDate?.baseOnCompletion.toString() ?? '',
        recurringDate?.weekNumber?.toString() ?? '',
        daysOfWeek,
        month,
        recurringDate?.dayOfMonth?.toString() ?? '',
        onWeekend,
        convertDate(recurringDate?.endDate),
        recurringDate?.maxCount?.toString() ?? '',
      );
      lines.push(arrayToCsvRecord(fields, csvOptions));
    });
    lines.push('');

    return lines.join(newlineSequence);
  }

  /**
   * Import tasks from a JSON object.
   * @param {Object} data The serialized JSON object to import.
   * @param {Object} [options={}] An object holding additional options for the
   *   import.
   * @param {module:projectList~ProjectList} [options.projectList] The project
   *   container. If not provided, then full validation will not be performed
   *   on project identifiers.
   * @returns {module:taskList~TaskList~importStatus} An object holding
   *   information about the status of the import.
   * @fires module:taskList~TaskList~addTask
   * @fires module:taskList~TaskList~updateTask
   */
  importFromJson(data, options = {}) {
    const counts = {
      added: 0,
      updated: 0,
      failed: 0,
      total: 0,
    };
    const errors = [];

    if (!Array.isArray(data)) {
      errors.push('Error: Expected "tasks" property to be an array.');
      return { tasks: counts, errors };
    }

    data.forEach((task) => {
      const handleError = (errorType, value, opts) => {
        if (value == null) return;
        const msgPrefix = `Warning: Task "${task.name}"`;
        let msg;
        switch (errorType) {
          case 'bad-type':
            if (opts.allowConversion && typeof value === 'string') {
              msg = `Expected type "${opts.expectedType}" for property "${opts.valueName}" (conversion from type "string" failed).`;
            } else {
              msg = `Expected type "${opts.expectedType}" for property "${opts.valueName}" (received "${getJsonType(value)}").`;
            }
            break;
          case 'unknown-value':
            msg = `Unrecognized value "${value}" for property "${opts.valueName}".`;
            break;
          case 'not-integer':
            msg = `Value for property "${opts.valueName}" must be an integer (received "${value}").`;
            break;
          case 'too-low':
            msg = `Value for property "${opts.valueName}" cannot be below "${opts.min}" (received "${value}").`;
            break;
          case 'too-high':
            msg = `Value for property "${opts.valueName}" cannot be above "${opts.max}" (received "${value}").`;
            break;
          case 'bad-date':
            msg = `Expected a date in ISO format for property "${opts.valueName}" (received "${value}").`;
            break;
          case 'bad-id':
            msg = `Expected a version 4 UUID for property "${opts.valueName}" (received "${value}").`;
            break;
          case 'failed-predicate':
            if (opts.valueName === 'project') {
              msg = `Unrecognized project identifier "${value}" for property "${opts.valueName}".`;
            } else {
              msg = `Failed custom validation for property "${opts.valueName}.`;
            }
            break;
          default:
            msg = `Encountered unrecognized error "${errorType}" for property "${opts.valueName}".`;
            break;
        }

        errors.push(`${msgPrefix}: ${msg}`);
      };

      if (task.name == null) {
        errors.push('Error: Task must have a name.');
        counts.failed += 1;
      } else if (typeof task.name !== 'string') {
        errors.push(`Error: Expected type "string" for task name (received "${getJsonType(task.name)}").`);
        counts.failed += 1;
      } else if (task.name.length === 0) {
        errors.push('Error: Task name must not be empty.');
        counts.failed += 1;
      } else {
        const taskOptions = {};

        let newId = null;
        if (validateValue(task.id, {
          valueName: 'id',
          expectedType: 'string',
          requireUuid: true,
          errorCallback: handleError,
        })) newId = task.id;

        validateValue(task.dueDate, {
          valueName: 'dueDate',
          expectedType: 'date',
          allowConversion: true,
          successCallback: (value) => {
            taskOptions.dueDate = value;
          },
          errorCallback: handleError,
        });

        validateValue(task.creationDate, {
          valueName: 'creationDate',
          expectedType: 'date',
          allowConversion: true,
          successCallback: (value) => {
            taskOptions.creationDate = value;
          },
          errorCallback: handleError,
        });

        validateValue(task.completionDate, {
          valueName: 'completionDate',
          expectedType: 'date',
          allowConversion: true,
          successCallback: (value) => {
            taskOptions.completionDate = value;
          },
          errorCallback: handleError,
        });

        if (task.priority != null) {
          const setPriority = (value) => {
            taskOptions.priority = value;
          };
          if (typeof task.priority === 'string') {
            validateValue(task.priority, {
              valueName: 'priority',
              expectedValues: [
                'very-low',
                'low',
                'medium',
                'high',
                'very-high',
              ],
              successCallback: setPriority,
              errorCallback: handleError,
            });
          } else {
            validateValue(task.priority, {
              valueName: 'priority',
              expectedType: 'number',
              requireInteger: true,
              successCallback: setPriority,
              errorCallback: handleError,
            });
          }
        }

        if (validateValue(task.description, {
          valueName: 'description',
          expectedType: 'string',
          errorCallback: handleError,
        })) taskOptions.description = task.description;

        if (validateValue(task.recurringDate, {
          valueName: 'recurringDate',
          expectedType: 'object',
          errorCallback: handleError,
        }) && validateValue(task.recurringDate.intervalUnit, {
          valueName: 'recurringDate.intervalUnit',
          expectedType: 'string',
          expectedValues: [
            'day',
            'week',
            'month',
            'year',
          ],
          errorCallback: handleError,
        })) {
          const { recurringDate } = task;
          const recOptions = {};

          if (validateValue(recurringDate.intervalLength, {
            valueName: 'recurringDate.intervalLength',
            expectedType: 'number',
            requireInteger: true,
            min: 1,
            errorCallback: handleError,
          })) recOptions.intervalLength = recurringDate.intervalLength;

          validateValue(recurringDate.startDate, {
            valueName: 'recurringDate.startDate',
            expectedType: 'date',
            allowConversion: true,
            successCallback: (value) => {
              recOptions.startDate = value;
            },
            errorCallback: handleError,
          });

          if (validateValue(recurringDate.baseOnCompletion, {
            valueName: 'recurringDate.baseOnCompletion',
            expectedType: 'boolean',
            errorCallback: handleError,
          })) recOptions.baseOnCompletion = recurringDate.baseOnCompletion;

          if (validateValue(recurringDate.weekNumber, {
            valueName: 'recurringDate.weekNumber',
            expectedType: 'number',
            requireInteger: true,
            min: 1,
            max: 5,
            errorCallback: handleError,
          })) recOptions.weekNumber = recurringDate.weekNumber;

          if (validateValue(recurringDate.daysOfWeek, {
            valueName: 'recurringDate.daysOfWeek',
            expectedType: 'array',
            errorCallback: handleError,
          })) {
            const daysOfWeek = [];
            recurringDate.daysOfWeek.forEach((value, index) => {
              if (validateValue(value, {
                valueName: `recurringDate.daysOfWeek[${index}]`,
                expectedType: 'number',
                requireInteger: true,
                min: 0,
                max: 6,
                errorCallback: handleError,
              })) daysOfWeek.push(value);
            });
            recOptions.daysOfWeek = daysOfWeek;
          }

          if (validateValue(recurringDate.month, {
            valueName: 'recurringDate.month',
            expectedType: 'number',
            requireInteger: true,
            min: 0,
            max: 11,
            errorCallback: handleError,
          })) recOptions.month = recurringDate.month;

          if (validateValue(recurringDate.dayOfMonth, {
            valueName: 'recurringDate.dayOfMonth',
            expectedType: 'number',
            requireInteger: true,
            min: 1,
            max: 31,
            errorCallback: handleError,
          })) recOptions.dayOfMonth = recurringDate.dayOfMonth;

          if (validateValue(recurringDate.onWeekend, {
            valueName: 'recurringDate.onWeekend',
            expectedType: 'string',
            expectedValues: [
              'no-change',
              'previous-weekday',
              'next-weekday',
              'nearest-weekday',
            ],
            errorCallback: handleError,
          })) recOptions.onWeekend = recurringDate.onWeekend;

          validateValue(recurringDate.endDate, {
            valueName: 'recurringDate.endDate',
            expectedType: 'date',
            allowConversion: true,
            successCallback: (value) => {
              recOptions.endDate = value;
            },
            errorCallback: handleError,
          });

          if (validateValue(recurringDate.maxCount, {
            valueName: 'recurringDate.maxCount',
            expectedType: 'number',
            requireInteger: true,
            min: 0,
            errorCallback: handleError,
          })) recOptions.maxCount = recurringDate.maxCount;

          const recurrence = new RecurringDate(
            task.recurringDate.intervalUnit,
            recOptions,
          );
          taskOptions.recurringDate = recurrence;
        }

        if (validateValue(task.project, {
          valueName: 'project',
          expectedType: 'string',
          requireUuid: true,
          customPredicate: (value) => {
            const { projectList } = options;
            return !projectList || projectList.hasProject(value);
          },
          errorCallback: handleError,
        })) taskOptions.project = task.project;

        if (newId && this.hasTask(newId)) counts.updated += 1;
        else counts.added += 1;

        const newTask = new Task(task.name, taskOptions);
        if (newId) this.addOrUpdateTask(newId, newTask);
        else this.addTask(newTask);
      }
    });

    counts.total = counts.added + counts.updated + counts.failed;

    return { tasks: counts, errors };
  }

  /**
   * Import tasks from parsed CSV data.
   * @param {string[][]} data An array of string arrays. Each member of the
   *   outer array represents a single task, and each member of each inner
   *   array is a data field for that particular task. The first member of the
   *   outer array should be a header holding field names.
   * @param {Object} [options={}] An object holding additional options for the
   *   import.
   * @param {module:projectList~ProjectList} [options.projectList] The project
   *   container. If not provided, then full validation will not be performed
   *   on project identifiers.
   * @returns {module:taskList~TaskList~importStatus} An object holding
   *   information about the status of the import.
   * @fires module:taskList~TaskList~addTask
   * @fires module:taskList~TaskList~updateTask
   */
  importFromCsv(data, options = {}) {
    const header = (data.length > 0) ? data[0] : [];
    const entries = [];

    data.forEach((csvRecord, csvIndex) => {
      if (csvIndex === 0) return;

      const entry = {};
      const recurringDate = {};
      csvRecord.forEach((value, index) => {
        if (index >= header.length || value.length === 0) return;

        switch (header[index].toLowerCase()) {
          case 'name':
            entry.name = value;
            break;
          case 'uuid':
            entry.id = value;
            break;
          case 'due date':
          case 'due-date':
            entry.dueDate = value;
            break;
          case 'date added':
          case 'date-added':
            entry.creationDate = value;
            break;
          case 'date completed':
          case 'date-completed':
            entry.completionDate = value;
            break;
          case 'priority':
            entry.priority = Task.convertStringToPriority(value);
            break;
          case 'description':
            entry.description = value;
            break;
          case 'project uuid':
          case 'project-uuid':
            entry.project = value;
            break;
          case 'recurrence interval unit':
          case 'recurrence-interval-unit':
            recurringDate.intervalUnit = value.toLowerCase();
            break;
          case 'recurrence interval length':
          case 'recurrence-interval-length':
            recurringDate.intervalLength = Number(value);
            break;
          case 'recurrence start date':
          case 'recurrence-start-date':
            recurringDate.startDate = value;
            break;
          case 'recurrence based on completion?':
          case 'recurrence based on completion':
          case 'recurrence-based-on-completion':
            recurringDate.baseOnCompletion = value.toLowerCase() === 'true';
            break;
          case 'recurrence week number':
          case 'recurrence-week-number':
            recurringDate.weekNumber = Number(value);
            break;
          case 'recurrence week days':
          case 'recurrence-week-days':
            recurringDate.daysOfWeek = value.split(',').map((day) => (
              getWeekdayIndex(day.trim())
            )).filter((day) => day != null);
            break;
          case 'recurrence month':
          case 'recurrence-month':
            recurringDate.month = getMonthIndex(value);
            break;
          case 'recurrence day':
          case 'recurrence-day':
            recurringDate.dayOfMonth = Number(value);
            break;
          case 'recurrence weekend behavior':
          case 'recurrence-weekend-behavior': {
            let behavior = null;
            switch (value.toLowerCase()) {
              case 'no change':
              case 'no-change':
                behavior = 'no-change';
                break;
              case 'use previous weekday':
              case 'previous weekday':
              case 'previous-weekday':
                behavior = 'previous-weekday';
                break;
              case 'use next weekday':
              case 'next weekday':
              case 'next-weekday':
                behavior = 'next-weekday';
                break;
              case 'use nearest weekday':
              case 'nearest weekday':
              case 'nearest-weekday':
                behavior = 'nearest-weekday';
                break;
              default:
                break;
            }
            recurringDate.onWeekend = behavior;
            break;
          }
          case 'recurrence end date':
          case 'recurrence-end-date':
            recurringDate.endDate = value;
            break;
          case 'recurrence max count':
          case 'recurrence-max-count':
            recurringDate.maxCount = Number(value);
            break;
          default:
            break;
        }
      });
      if (!_.isEmpty(recurringDate)) entry.recurringDate = recurringDate;
      if (!_.isEmpty(entry)) entries.push(entry);
    });

    return this.importFromJson(entries, options);
  }
}

export default TaskList;
