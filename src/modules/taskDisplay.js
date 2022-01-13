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

const CHECKED_ICON = 'check_circle_outline';
const UNCHECKED_ICON = 'radio_button_unchecked';

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
   * @param {Object} [options={}] An object holding additional options for the
   *   display panel.
   * @property {module:settings~Settings~dateFormat} [options.dateFormat] An
   *   object holding information about the calendar date format to use when
   *   displaying dates.
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
     * An object holding information about the format to use for calendar
     * dates.
     * @type {module:settings~Settings~dateFormat}
     */
    this._dateFormat = options.dateFormat || Settings.lookupDateFormat();
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
}

export default TaskDisplay;
