/**
 * Defines the [TaskDisplay]{@link module:taskDisplay~TaskDisplay} class.
 * @module taskDisplay
 */

import {
  isBefore as isDateBefore,
  isSameDay,
  startOfDay,
} from 'date-fns';

import CheckedIcon from '../images/radio-checked.svg';
import CopyIcon from '../images/copy.svg';
import DeleteIcon from '../images/delete.svg';
import EditIcon from '../images/edit.svg';
import MoreIcon from '../images/more.svg';
import ProjectIcon from '../images/project.svg';
import UncheckedIcon from '../images/radio-unchecked.svg';

import PopupMenu from './popupMenu';
import Settings from './settings';
import Task from './task';
import { formatDate } from './utility/dates';
import { createImageButton } from './utility/dom';

const ICON_WIDTH = 24;
const ICON_HEIGHT = 24;

const STANDARD_MENU_ITEMS = [
  {
    label: 'Edit Task...',
    id: 'edit',
    icon: { source: EditIcon, width: ICON_WIDTH, height: ICON_HEIGHT },
  },
  {
    label: 'Clone Task',
    id: 'clone',
    icon: { source: CopyIcon, width: ICON_WIDTH, height: ICON_HEIGHT },
  },
  {
    label: 'Delete Task...',
    id: 'delete',
    icon: { source: DeleteIcon, width: ICON_WIDTH, height: ICON_HEIGHT },
  },
];
const PROJECT_MENU_ITEMS = [
  {
    label: 'Go To Project',
    id: 'go-to-project',
    icon: { source: ProjectIcon, width: ICON_WIDTH, height: ICON_HEIGHT },
  },
];

/**
 * Object holding private members for the
 * [TaskDisplay]{@link module:taskDisplay~TaskDisplay} class.
 * @typedef {Object} module:taskDisplay~TaskDisplay~privates
 * @property {HTMLElement} container The top-level container holding the
 *   display panel.
 * @property {HTMLElement} content The container holding the panel content.
 * @property {module:taskList~TaskList} tasks The task container.
 * @property {module:projectList~ProjectList} projects The project container.
 * @property {module:taskDisplay~TaskDisplay~taskCallback} [taskCallback] A
 *   callback function that is invoked when the user performs an action on a
 *   task.
 * @property {module:settings~Settings~dateFormat} dateFormat An object holding
 *   information about the format to use for calendar dates.
 * @property {module:popupMenu~PopupMenu} taskMenu The popup menu that is shown
 *   when the user clicks the 'more' button next to a task.
 */

/**
 * Holds private data for the
 * [TaskDisplay]{@link module:taskDisplay~TaskDisplay} class.
 * @type {WeakMap}
 * @see module:taskDisplay~TaskDisplay~privates
 */
const privateMembers = new WeakMap();

/**
 * Returns true if the two tasks belong to the same task group.
 * @param {string} groupBy The type of grouping being done: 'due-date',
 *   'project', 'priority', or 'none'.
 * @param {module:task~Task} task1 The first task to compare.
 * @param {module:task~Task} task2 The second task to compare.
 * @returns {boolean} True if the tasks belong to the same group and false
 *   otherwise.
 */
function isSameGroup(groupBy, task1, task2) {
  switch (groupBy) {
    case 'due-date':
      if (!task1.dueDate && !task2.dueDate) return true;
      if (!task1.dueDate && task2.dueDate) return false;
      if (task1.dueDate && !task2.dueDate) return false;
      return isSameDay(task1.dueDate, task2.dueDate);
    case 'priority':
      return task1.priority === task2.priority;
    case 'project':
      if (!task1.project && !task2.project) return true;
      if (!task1.project && task2.project) return false;
      if (task1.project && !task2.project) return false;
      return task1.project === task2.project;
    case 'none':
    default:
      return true;
  }
}

/**
 * Empty the display panel.
 * @param {module:taskDisplay~TaskDisplay} instance The class instance on which
 *   to apply the function.
 */
function clear(instance) {
  privateMembers.get(instance).content.innerHTML = '';
}

/**
 * Add a list element and optional heading to the panel for holding tasks.
 * @param {module:taskDisplay~TaskDisplay} instance The class instance on which
 *   to apply the function.
 * @param {string} [label] The text content of the heading, if any.
 * @param {string[]} [headingStyleClasses] An array of style classes to add to
 *   the heading, if any. These classes are applied in addition to the default
 *   class of 'task-list-heading'.
 * @returns {HTMLElement} The list element where the task items can be
 *   inserted.
 */
function createList(instance, label = null, headingStyleClasses = []) {
  const privates = privateMembers.get(instance);

  if (label) {
    const heading = document.createElement('h4');
    heading.classList.add('task-list-heading', ...headingStyleClasses);
    heading.textContent = label;
    privates.content.appendChild(heading);
  }

  const list = document.createElement('ul');
  list.classList.add('task-list');
  privates.content.appendChild(list);
  return list;
}

/**
 * Add a task entry to a group list.
 * @param {module:taskDisplay~TaskDisplay} instance The class instance on which
 *   to apply the function.
 * @param {HTMLElement} list The list element in which the task information
 *   should be inserted.
 * @param {string} taskId The identifier for the task.
 * @param {module:task~Task} task The task to be added.
 */
function addTask(instance, list, taskId, task) {
  const privates = privateMembers.get(instance);

  const itemElem = document.createElement('li');
  itemElem.classList.add('task-list-item');
  list.appendChild(itemElem);

  const iconSrc = task.isComplete() ? CheckedIcon : UncheckedIcon;
  const iconAlt = task.isComplete() ? 'Mark as incomplete' : 'Mark as complete';
  const checkButton = createImageButton(iconSrc, {
    altText: iconAlt,
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    classList: ['task-list-item-checkbox'],
  });
  itemElem.appendChild(checkButton);
  if (privates.taskCallback) {
    checkButton.addEventListener('click', () => {
      const type = task.isComplete() ? 'mark-incomplete' : 'mark-complete';
      privates.taskCallback(type, taskId, task);
    });
  }

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
  const addDetail = (content, styleClasses) => {
    if (detailsContainer.hasChildNodes()) {
      const comma = document.createElement('span');
      comma.classList.add('task-list-item-details');
      comma.textContent = ', ';
      detailsContainer.appendChild(comma);
    }

    const detail = document.createElement('span');
    detail.classList.add('task-list-item-details', ...styleClasses);
    detail.textContent = content;
    detailsContainer.appendChild(detail);
  };

  if (task.dueDate) {
    const dateFormat = privates.dateFormat.outputPattern;
    const dateStr = formatDate(task.dueDate, dateFormat);

    const styleClasses = ['task-list-item-due-date'];
    const today = startOfDay(new Date());
    if (!task.isComplete() && isDateBefore(task.dueDate, today)) {
      styleClasses.push('task-list-item-past-due');
    }

    addDetail(dateStr, styleClasses);
  }

  if (task.recurringDate) {
    const recurrenceStr = task.recurringDate.toString();
    addDetail(recurrenceStr, ['task-list-item-recurring-date']);
  }

  if (task.project) {
    const project = privates.projects.getProject(task.project);
    addDetail(project.name, ['task-list-item-project']);
  }

  const priorityStr = Task.convertPriorityToPrettyString(task.priority);
  addDetail(`${priorityStr} Priority`, ['task-list-item-priority']);

  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('icon-container');
  itemElem.appendChild(buttonContainer);

  const editButton = createImageButton(EditIcon, {
    altText: 'Edit task',
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    callback: () => {
      if (privates.taskCallback) privates.taskCallback('edit', taskId, task);
    },
  });
  buttonContainer.appendChild(editButton);

  const moreButton = createImageButton(MoreIcon, {
    altText: 'More actions',
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    callback: (e) => {
      privates.taskMenu.open((id) => {
        if (privates.taskCallback) {
          privates.taskCallback(id, taskId, task);
        }
      }, { referenceElement: e.target });
    },
  });
  buttonContainer.appendChild(moreButton);
}

/**
 * Get the heading label for a task group.
 * @param {module:taskDisplay~TaskDisplay} instance The class instance on which
 *   to apply the function.
 * @param {string} groupBy The type of grouping being done: 'due-date',
 *   'project', 'priority', or 'none'.
 * @param {module:task~Task} task A task belonging to the group.
 * @returns {?string} The label for the heading, or null if no grouping is
 *   being done.
 */
function getGroupHeading(instance, groupBy, task) {
  const privates = privateMembers.get(instance);
  switch (groupBy) {
    case 'due-date':
      if (task.dueDate) {
        const format = privates.dateFormat.outputPattern;
        return formatDate(task.dueDate, format);
      }
      return 'No Due Date';
    case 'priority':
      return `${Task.convertPriorityToPrettyString(task.priority)} Priority`;
    case 'project':
      if (task.project) return privates.projects.getProject(task.project).name;
      return 'Uncategorized';
    case 'none':
    default:
      return null;
  }
}

/**
 * A display panel showing a list of tasks.
 */
class TaskDisplay {
  /**
   * Callback function that is invoked when the user chooses to perform an
   * action on a task.
   * @callback module:taskDisplay~TaskDisplay~taskCallback
   * @param {string} type The type of action that is being performed:
   *   'mark-complete', 'mark-incomplete', 'edit', 'clone', 'delete', or
   *   'go-to-project'.
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
   * @property {boolean} [groupDescending=false] If set to true and if tasks
   *   are being grouped (using groupBy), then the groups will be sorted in
   *   descending order.
   * @property {boolean} [sortDescending=false] If set to true, then results
   *   will be sorted in descending order.
   * @property {boolean} [caseSensitive=false] If set to true, then sorting for
   *   text-based fields will be case-sensitive.
   * @property {boolean} [missingLast=false] If set to true, then tasks that
   *   are missing a certain field will be sorted at the end of the list, when
   *   sorting by that field.
   * @property {boolean} [resetScroll=true] If set to true (the default), the
   *   panel's scroll position will be reset back to the top. Otherwise the
   *   scroll position will not be changed.
   * @property {module:settings~Settings~dateFormat} [dateFormat] An object
   *   holding information about the calendar date format to use when
   *   displaying dates.
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
    const panel = document.createElement('div');
    panel.classList.add('task-panel');
    parent.appendChild(panel);

    const content = document.createElement('div');
    content.classList.add('task-panel-content');
    panel.appendChild(content);

    const privates = {
      container: panel,
      content,
      tasks: taskList,
      projects: projectList,
      taskCallback: options.taskCallback || null,
      dateFormat: Settings.lookupDateFormat('iso'),
      taskMenu: null,
    };
    privateMembers.set(this, privates);

    privates.taskMenu = new PopupMenu({ closeIfScrolled: panel });
  }

  /**
   * Refresh the display panel with a new list of tasks.
   * @param {module:taskDisplay~TaskDisplay~updateOptions} [options={}] An
   *   object holding options for updating the panel.
   */
  update(options = {}) {
    const privates = privateMembers.get(this);

    privates.dateFormat = options.dateFormat ?? Settings.lookupDateFormat();
    clear(this);

    const listOptions = {
      projectList: privates.projects,
      startDate: options.startDate || null,
      endDate: options.endDate || null,
      completed: options.completed ?? false,
      requireDueDate: options.requireDueDate ?? false,
      project: options.project || null,
    };

    if (typeof options.priority === 'number') {
      listOptions.priority = options.priority;
    }

    const groupBy = options.groupBy || 'none';
    const groupDescending = options.groupDescending ?? false;
    const sortDescending = options.sortDescending ?? false;
    const caseSensitive = options.caseSensitive ?? false;
    const missingLast = options.missingLast ?? false;
    const pushSortField = (field, descending) => {
      if (!listOptions.sortBy) listOptions.sortBy = [];
      listOptions.sortBy.push({
        field,
        descending,
        caseSensitive,
        missingLast,
      });
    };

    if (groupBy !== 'none') pushSortField(groupBy, groupDescending);
    if (options.sortBy) pushSortField(options.sortBy, sortDescending);
    if (options.sortBy !== 'create-date') {
      pushSortField('create-date', sortDescending);
    }

    const entries = privates.tasks.entries(listOptions);

    let list = null;
    let prevTask = null;
    entries.forEach(({ task, id }) => {
      if (!prevTask || !isSameGroup(groupBy, task, prevTask)) {
        const headingStyles = [];
        const today = startOfDay(new Date());
        if (groupBy === 'due-date' && !task.isComplete()
          && isDateBefore(task.dueDate, today)) {
          headingStyles.push('task-list-heading-past-due');
        }
        list = createList(
          this,
          getGroupHeading(this, groupBy, task),
          headingStyles,
        );
      }

      addTask(this, list, id, task);
      prevTask = task;
    });

    if (entries.length === 0) {
      const message = document.createElement('div');
      message.classList.add('task-list-empty');
      message.textContent = 'No Tasks Found';
      privates.content.appendChild(message);
    }

    // Set menu items for the 'more' button
    if (options.project) {
      privates.taskMenu.setMenuItems(STANDARD_MENU_ITEMS);
    } else {
      const menuItems = [...PROJECT_MENU_ITEMS, ...STANDARD_MENU_ITEMS];
      privates.taskMenu.setMenuItems(menuItems);
    }

    // Reset the scroll position
    if (options.resetScroll !== false) {
      privates.container.scrollTop = 0;
      privates.container.scrollLeft = 0;
    }
  }
}

export default TaskDisplay;
