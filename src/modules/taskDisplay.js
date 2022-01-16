/**
 * Defines the [TaskDisplay]{@link module:taskDisplay~TaskDisplay} class.
 * @module taskDisplay
 */

import Settings from './settings';
import Task from './task';
import {
  createIconButton,
  formatDate,
} from './utility';

import { isSameDay } from 'date-fns';

const CHECKED_ICON = 'check_circle_outline';
const UNCHECKED_ICON = 'radio_button_unchecked';

/**
 * A display panel showing a list of tasks.
 */
class TaskDisplay {
  /**
   * Callback function that is invoked when the user chooses to perform an
   * action on a task.
   * @callback module:taskDisplay~TaskDisplay~taskCallback
   * @param {string} type The type of action that is being performed. If the
   *   user is marking a task as completed or incomplete, this will be set to
   *   'mark-complete' or 'mark-incomplete', respectively. If the user is
   *   editing the task, this will be 'edit'. If the user is deleting the task,
   *   this will be 'delete'.
   * @param {string} id The identifier for the task on which the action is
   *   being performed.
   * @param {module:task~Task} task The task on which the action is being
   *   performed.
   */

  /**
   * An object holding options for creating the task display panel.
   * @typedef {Object} module:taskDisplay~TaskDisplay~options
   * @property {module:taskDisplay~TaskDisplay~taskCallback} [taskCallback] A
   *   callback function that will be invoked when the user performs an action
   *   on a task.
   * @property {module:settings~Settings~dateFormat} [dateFormat] An object
   *   holding information about the calendar date format to use when
   *   displaying dates.
   */

  /**
   * An object holding options for updating the task display panel.
   * @typedef {Object} module:taskDisplay~TaskDisplay~updateOptions
   * @property {Date} [startDate] If provided, tasks with due dates before the
   *   given date will be excluded.
   * @property {Date} [endDate] If provided, tasks with due dates after the
   *   given date will be excluded.
   * @property {boolean} [completed=false] If set to true, then completed tasks
   *   will be included.
   * @property {boolean} [requireDueDate=false] If set to true, then tasks that
   *   do not have a due date will be excluded.
   * @property {string} [project] If provided, then only tasks with the
   *   specified project will be included. This can either be a project
   *   identifier, or the string 'none'.
   * @property {number} [priority] If provided, then only tasks with the given
   *   priority will be included.
   * @property {string} [groupBy=none] The field to group the tasks by:
   *   'due-date', 'priority', 'project', or 'none'.
   * @property {string} [sortBy=create-date] The primary field to sort the
   *   tasks by: 'name', 'due-date', 'create-date', 'priority', or 'project'.
   * @property {boolean} [sortDescending=false] If set to true, then results
   *   will be sorted in descending order.
   * @property {boolean} [caseSensitive=false] If set to true, then sorting for
   *   text-based fields will be case-sensitive.
   * @property {boolean} [missingLast=false] If set to true, then tasks that
   *   are missing a certain field will be sorted at the end of the list, when
   *   sorting by that field.
   */

  /**
   * Create a task display.
   * @param {HTMLElement} parent The parent DOM node that will contain the
   *   panel.
   * @param {module:taskList~TaskList} taskList The
   *   [TaskList]{@link module:taskList~TaskList} holding all of the tasks.
   * @param {module:projectList~ProjectList} projectList The
   *   [ProjectList]{@link module:projectList~ProjectList} holding all of the
   *   projects.
   * @param {module:taskDisplay~TaskDisplay~options} [options={}] An object
   *   holding additional options for the display panel.
   */
  constructor(parent, taskList, projectList, options = {}) {
    const container = document.createElement('div');
    container.classList.add('task-panel');
    parent.appendChild(container);

    /**
     * The container holding the display panel.
     * @type {HTMLElement}
     */
    this._container = container;

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

    /**
     * A callback function that is invoked when the user performs an action on
     * a task.
     * @type {?module:taskDisplay~TaskDisplay~taskCallback}
     */
    this._taskCallback = options.taskCallback || null;

    /**
     * An object holding information about the format to use for calendar
     * dates.
     * @type {module:settings~Settings~dateFormat}
     */
    this._dateFormat = options.dateFormat || Settings.lookupDateFormat();
  }

  /**
   * Refresh the display panel with a new list of tasks.
   * @param {module:taskDisplay~TaskDisplay~updateOptions} [options={}] An
   *   object holding options for updating the panel.
   */
  update(options = {}) {
    this._clear();

    const listOptions = {
      projectList: this._projects,
      startDate: options.startDate || null,
      endDate: options.endDate || null,
      completed: options.completed || false,
      requireDueDate: options.requireDueDate || false,
      project: options.project || null,
    };

    if (typeof options.priority === 'number')
      listOptions.priority = options.priority;

    const groupBy = options.groupBy || 'none';
    const descending = options.sortDescending || false;
    const caseSensitive = options.caseSensitive || false;
    const missingLast = options.missingLast || false;
    const pushSortField = field => {
      if (!listOptions.sortBy)
        listOptions.sortBy = [];
      listOptions.sortBy.push({
        field,
        descending,
        caseSensitive,
        missingLast,
      });
    };

    if (groupBy !== 'none')
      pushSortField(groupBy);
    if (options.sortBy)
      pushSortField(options.sortBy);
    if (options.sortBy !== 'create-date')
      pushSortField('create-date');

    let list = null;
    let prevTask = null;
    let empty = true;
    for (const entry of this._tasks.entries(listOptions)) {
      if (!prevTask || !this._isSameGroup(groupBy, entry.task, prevTask))
        list = this._createList(this._getGroupHeading(groupBy, entry.task));

      this._addTask(list, entry.id, entry.task);
      prevTask = entry.task;
      empty = false;
    }

    if (empty) {
      const message = document.createElement('div');
      message.classList.add('task-list-empty');
      message.textContent = 'No Tasks Found';
      this._container.appendChild(message);
    }
  }

  /**
   * Empty the display panel.
   */
  _clear() {
    this._container.innerHTML = '';
  }

  /**
   * Add a list element and optional heading to the panel for holding tasks.
   * @param {string} [label] The text content of the heading, if any.
   * @returns {HTMLElement} The list element where the task items can be
   *   inserted.
   */
  _createList(label) {
    if (label) {
      const heading = document.createElement('h4');
      heading.classList.add('task-list-heading');
      heading.textContent = label;
      this._container.appendChild(heading);
    }

    const list = document.createElement('ul');
    list.classList.add('task-list');
    this._container.appendChild(list);
    return list;
  }

  /**
   * Add a task entry to a group list.
   * @param {HTMLElement} list The list element in which the task information
   *   should be inserted.
   * @param {string} taskId The identifier for the task.
   * @param {module:task~Task} task The task to be added.
   */
  _addTask(list, taskId, task) {
    const itemElem = document.createElement('li');
    itemElem.classList.add('task-list-item');
    list.appendChild(itemElem);

    const iconType = task.completionDate ? CHECKED_ICON : UNCHECKED_ICON;
    const checkButton = createIconButton(iconType, {
      classList: ['task-list-item-checkbox'],
    });
    itemElem.appendChild(checkButton);
    checkButton.addEventListener('click', e => {
      const iconType = task.completionDate ? UNCHECKED_ICON : CHECKED_ICON;
      e.target.textContent = iconType;
      e.target.dataset.iconType = iconType;
      if (this._taskCallback) {
        const type = task.completionDate ? 'mark-incomplete' : 'mark-complete';
        this._taskCallback(type, taskId, task);
      }
    });

    const infoContainer = document.createElement('div');
    infoContainer.classList.add('task-list-item-info-container');
    itemElem.appendChild(infoContainer);

    const nameElem = document.createElement('div');
    nameElem.classList.add('task-list-item-name');
    nameElem.textContent = task.name;
    infoContainer.appendChild(nameElem);

    if (task.description) {
      const descElem = document.createElement('div');
      descElem.classList.add('task-list-item-description');
      descElem.textContent = task.description;
      infoContainer.appendChild(descElem);
    }

    const detailsContainer = document.createElement('div');
    infoContainer.appendChild(detailsContainer);
    const addDetail = (content, styleClass) => {
      if (detailsContainer.hasChildNodes()) {
        const comma = document.createElement('span');
        comma.classList.add('task-list-item-details');
        comma.textContent = ', ';
        detailsContainer.appendChild(comma);
      }

      const detail = document.createElement('span');
      detail.classList.add('task-list-item-details', styleClass);
      detail.textContent = content;
      detailsContainer.appendChild(detail);
    };

    if (task.dueDate) {
      const dateFormat = this._dateFormat.internal;
      const dateStr = formatDate(task.dueDate, dateFormat);
      addDetail(dateStr, 'task-list-item-due-date');
    }

    if (task.recurringDate) {
      const recurrenceStr = task.recurringDate.toString();
      addDetail(recurrenceStr, 'task-list-item-recurring-date');
    }

    if (task.project) {
      const project = this._projects.getProject(task.project);
      addDetail(project.name, 'task-list-item-project');
    }

    const priorityStr = Task.convertPriorityToPrettyString(task.priority);
    addDetail(`${priorityStr} Priority`, 'task-list-item-priority');

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('task-list-item-button-container');
    itemElem.appendChild(buttonContainer);
  }

  /**
   * Returns true if the two tasks belong to the same task group.
   * @param {string} groupBy The type of grouping being done: 'due-date',
   *   'project', 'priority', or 'none'.
   * @param {module:task~Task} task1 The first task to compare.
   * @param {module:task~Task} task2 The second task to compare.
   * @returns {boolean} True if the tasks belong to the same group and false
   *   otherwise.
   */
  _isSameGroup(groupBy, task1, task2) {
    switch (groupBy) {
      default:
      case 'none':
        return true;
      case 'due-date':
        if (!task1.dueDate && !task2.dueDate)
          return true;
        if (!task1.dueDate && task2.dueDate)
          return false;
        if (task1.dueDate && !task2.dueDate)
          return false;
        return isSameDay(task1.dueDate, task2.dueDate);
      case 'priority':
        return task1.priority === task2.priority;
      case 'project':
        if (!task1.project && !task2.project)
          return true;
        if (!task1.project && task2.project)
          return false;
        if (task1.project && !task2.project)
          return false;
        return task1.project === task2.project;
    }
  }

  /**
   * Get the heading label for a task group.
   * @param {string} groupBy The type of grouping being done: 'due-date',
   *   'project', 'priority', or 'none'.
   * @param {module:task~Task} task A task belonging to the group.
   * @returns {?string} The label for the heading, or null if no grouping is
   *   being done.
   */
  _getGroupHeading(groupBy, task) {
    switch (groupBy) {
      default:
      case 'none':
        return null;
      case 'due-date':
        if (task.dueDate) {
          const format = this._dateFormat.internal;
          return formatDate(task.dueDate, format);
        } else {
          return 'No Due Date';
        }
      case 'priority':
        return `${Task.convertPriorityToPrettyString(task.priority)} Priority`;
      case 'project':
        if (task.project)
          return this._projects.getProject(task.project).name;
        else
          return 'Uncategorized';
    }
  }
}

export default TaskDisplay;
