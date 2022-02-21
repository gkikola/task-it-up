/**
 * Defines the [AddTaskModal]{@link module:addTaskModal~AddTaskModal} class.
 * @module addTaskModal
 */

import AddProjectModal from './addProjectModal';
import DatePickerModal from './datePickerModal';
import RecurrenceModal from './recurrenceModal';
import RecurringDate from '../recurringDate';
import Settings from '../settings';
import Task from '../task';
import { formatDate, parseDate } from '../utility/dates';
import { createDateInputField, createFormControl } from '../utility/dom';

/**
 * Object holding private members for the
 * [AddTaskModal]{@link module:addTaskModal~AddTaskModal} class.
 * @typedef {Object} module:addTaskModal~AddTaskModal~privates
 * @property {module:taskList~TaskList} tasks The task list to update.
 * @property {module:projectList~ProjectList} projects The project list to use
 *   for the Project field.
 * @property {string} [taskId] The unique identifier for the task being edited,
 *   if any.
 * @property {string} [projectId] The unique identifier for the default
 *   project, if any.
 * @property {number} priority The default priority.
 * @property {string} mode Indicates the status of the task being entered. If
 *   set to 'add', a new task is being created, and if set to 'edit', then an
 *   existing task is being updated.
 * @property {module:recurringDate~RecurringDate} [customRecurrence] The custom
 *   recurrence that the user added, if any.
 * @property {module:settings~Settings~dateFormat} dateFormat An object holding
 *   date format information.
 * @property {Object} callbacks An object holding callback functions.
 * @property {Function} [callbacks.confirm] A callback function that will be
 *   invoked when the user successfully confirms the modal.
 * @property {Function} [callbacks.cancel] A callback function that will be
 *   invoked when the user cancels the modal.
 * @property {Function} [callbacks.newProject] A callback function that will be
 *   invoked when the user adds a new project.
 * @property {Object} controls An object holding the form input elements for
 *   the modal.
 * @property {HTMLElement} controls.name The text input element for the task
 *   name.
 * @property {HTMLElement} controls.dueDate The text input element for the task
 *   due date.
 * @property {HTMLElement} controls.recurringDate The select element for the
 *   task recurring date.
 * @property {HTMLElement} controls.priority The select element for the task
 *   priority.
 * @property {HTMLElement} controls.project The select element for the task's
 *   containing project.
 * @property {HTMLElement} controls.description The textarea element for the
 *   task description.
 */

/**
 * Holds private data for the
 * [AddTaskModal]{@link module:addTaskModal~AddTaskModal} class.
 * @type {WeakMap}
 * @see module:addTaskModal~AddTaskModal~privates
 */
const privateMembers = new WeakMap();

/**
 * Update the project select box options.
 * @param {module:addTaskModal~AddTaskModal} instance The class instance on
 *   which to apply the function.
 */
function updateProjects(instance) {
  const privates = privateMembers.get(instance);
  const projectItems = [{ value: 'none', label: 'None' }];
  privates.projects.forEach((entry) => {
    projectItems.push({ value: entry.id, label: entry.project.name });
  });
  projectItems.push({ value: 'new', label: 'New Project...' });

  const selectBox = privates.controls.project;
  selectBox.innerHTML = '';
  projectItems.forEach((entry) => {
    const optElem = document.createElement('option');
    optElem.value = entry.value;
    optElem.textContent = entry.label;
    selectBox.appendChild(optElem);
  });
}

/**
 * Initialize the values of the form elements based on the initial task that
 * was passed to the constructor, if any.
 * @param {module:addTaskModal~AddTaskModal} instance The class instance on
 *   which to apply the function.
 */
function initFormValues(instance) {
  updateProjects(instance);

  const privates = privateMembers.get(instance);
  const { controls } = privates;
  let task = null;
  if (privates.taskId) task = privates.tasks.getTask(privates.taskId);

  if (task?.name) controls.name.value = task.name;

  if (task?.dueDate) {
    controls.dueDate.value = formatDate(
      task.dueDate,
      privates.dateFormat.outputPattern,
    );
  }

  if (task?.recurringDate) {
    let value;
    if (task.recurringDate.isDefault()) {
      switch (task.recurringDate.intervalUnit) {
        case 'day':
          value = 'daily';
          break;
        case 'week':
          value = 'weekly';
          break;
        case 'month':
          value = 'monthly';
          break;
        case 'year':
          value = 'annually';
          break;
        default:
          value = 'custom';
          break;
      }
    } else {
      value = 'custom';
    }
    controls.recurringDate.value = value;
    if (value === 'custom') privates.customRecurrence = task.recurringDate;
  }

  if (task?.priorityString && task.priorityString !== 'unknown') {
    controls.priority.value = task.priorityString;
  } else {
    controls.priority.value = Task.convertPriorityToString(privates.priority);
  }

  let { projectId } = privates;
  if (task?.project) projectId = task.project;
  if (projectId) controls.project.value = projectId;

  if (task?.description) controls.description.value = task.description;
}

/**
 * Opens a date picker and updates the due date field.
 * @param {module:addTaskModal~AddTaskModal} instance The class instance on
 *   which to apply the function.
 * @param {module:modalStack~ModalStack} modalStack The modal stack in which
 *   the modal has been inserted.
 */
function pickDueDate(instance, modalStack) {
  const privates = privateMembers.get(instance);
  const input = privates.controls.dueDate;
  let startDate = null;
  if (input.value) {
    startDate = parseDate(input.value, privates.dateFormat.inputPatterns);
  }

  modalStack.showModal(new DatePickerModal({
    confirm: (date) => {
      input.value = formatDate(date, privates.dateFormat.outputPattern);
      input.setCustomValidity('');
    },
    startDate,
    title: 'Select Due Date',
  }));
}

/**
 * Add the event listeners to the form controls in the modal.
 * @param {module:addTaskModal~AddTaskModal} instance The class instance on
 *   which to apply the function.
 * @param {module:modalStack~ModalStack} modalStack The modal stack in which
 *   the modal is being inserted.
 */
function addListeners(instance, modalStack) {
  const privates = privateMembers.get(instance);
  const { controls, dateFormat } = privates;

  // Handle recurrence selection
  const { recurringDate } = controls;
  let recurrenceValue = recurringDate.value;
  const processRecurrence = (recurrence) => {
    privates.customRecurrence = recurrence;

    let newValue = 'custom-result';
    if (recurrence.isDefault()) {
      switch (recurrence.intervalUnit) {
        case 'day':
          newValue = 'daily';
          break;
        case 'week':
          newValue = 'weekly';
          break;
        case 'month':
          newValue = 'monthly';
          break;
        case 'year':
          newValue = 'annually';
          break;
        default:
          break;
      }
    }

    // Update select box options
    const selector = 'option[value="custom-result"]';
    let optElem = recurringDate.querySelector(selector);
    if (optElem && newValue !== 'custom-result') {
      recurringDate.removeChild(optElem);
    } else if (newValue === 'custom-result') {
      if (!optElem) {
        optElem = document.createElement('option');
        optElem.value = 'custom-result';
        recurringDate.insertBefore(optElem, recurringDate.lastChild);
      }
      const dateFormatStr = dateFormat.outputPattern;
      optElem.textContent = recurrence.toStringVerbose(dateFormatStr);
    }

    recurringDate.value = newValue;
    recurrenceValue = newValue;
  };

  if (privates.customRecurrence) processRecurrence(privates.customRecurrence);

  const cancelRecurrence = () => { recurringDate.value = recurrenceValue; };

  recurringDate.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
      // Get due date, if any
      const dateInput = controls.dueDate;
      let baseDate = null;
      if (dateInput.value) {
        baseDate = parseDate(dateInput.value, dateFormat.inputPatterns);
      }

      const modal = new RecurrenceModal({
        confirm: processRecurrence,
        cancel: cancelRecurrence,
        initial: privates.customRecurrence,
        baseDate,
        dateFormat,
      });
      modalStack.showModal(modal);
    } else {
      recurrenceValue = e.target.value;
    }
  });

  // Handle project selection
  let projectValue = controls.project.value;
  controls.project.addEventListener('change', (e) => {
    if (e.target.value === 'new') {
      const modal = new AddProjectModal({
        confirm: (project) => {
          const id = privates.projects.addProject(project);
          updateProjects(instance);
          controls.project.value = id;
          projectValue = id;
          if (privates.callbacks.newProject) privates.callbacks.newProject(id);
        },
        cancel: () => { controls.project.value = projectValue; },
      });
      modalStack.showModal(modal);
    } else {
      projectValue = e.target.value;
    }
  });

  // Check date validity
  controls.dueDate.addEventListener('change', (e) => {
    const { value } = e.target;
    if (value.length > 0) {
      let message = '';
      if (!parseDate(value, dateFormat.inputPatterns)) {
        const format = dateFormat.visualPattern;
        message = `Please enter a valid date in ${format} format.`;
      }
      e.target.setCustomValidity(message);
    }
  });
}

/**
 * A modal dialog for adding or editing a task.
 * @implements {module:modalStack~Modal}
 */
class AddTaskModal {
  /**
   * Specifies options for the modal.
   * @typedef {Object} module:addTaskModal~AddTaskModal~options
   * @property {Function} [confirm] A callback function that will be invoked
   *   when the user successfully confirms the modal. The function will be
   *   passed the unique identifier of the task that was inserted into the task
   *   list (or the identifier of the existing task that was modified).
   * @property {Function} [cancel] A callback function that will be invoked
   *   when the user cancels the modal.
   * @property {Function} [newProject] A callback function that will be invoked
   *   when the user adds a new project to the project list. The unique
   *   identifier for the project will be passed to the function as an
   *   argument.
   * @property {string} [taskId] The unique identifier for the task that is
   *   being edited, if any. If not provided, then a new task will be created.
   * @property {string} [projectId] The unique identifier for the project to
   *   use as the default selection in the Project field. If not provided, then
   *   the task will default to having no project. This property is ignored if
   *   an existing task is being edited.
   * @property {number} [priority=0] The default priority to use for the task.
   *   This is ignored if an existing task is being edited.
   * @property {module:settings~Settings~dateFormat} [dateFormat] An object
   *   holding information about the calendar date format to use for date
   *   fields. If not given, then the browser default is used.
   */

  /**
   * Initialize the modal.
   * @param {module:taskList~TaskList} taskList The task list in which the new
   *   task should be inserted.
   * @param {module:projectList~ProjectList} projectList The project list that
   *   will be used to populate the Project select box. The user can also
   *   create a new project, which will be added to the list.
   * @param {module:addTaskModal~AddTaskModal~options} [options={}] Holds
   *   configuration options for the modal.
   */
  constructor(taskList, projectList, options = {}) {
    const privates = {
      tasks: taskList,
      projects: projectList,
      taskId: options.taskId || null,
      projectId: options.projectId || null,
      priority: options.priority ?? 0,
      mode: options.taskId ? 'edit' : 'add',
      customRecurrence: null,
      dateFormat: options.dateFormat || Settings.lookupDateFormat(),
      callbacks: {
        confirm: options.confirm || null,
        cancel: options.cancel || null,
        newProject: options.newProject || null,
      },
      controls: {
        name: null,
        dueDate: null,
        recurringDate: null,
        priority: null,
        project: null,
        description: null,
      },
    };
    privateMembers.set(this, privates);
  }

  get title() {
    const privates = privateMembers.get(this);
    return (privates.mode === 'edit') ? 'Edit Task' : 'Add Task';
  }

  get confirmLabel() {
    const privates = privateMembers.get(this);
    return (privates.mode === 'edit') ? 'Update' : 'Add';
  }

  get initFocus() {
    return privateMembers.get(this).controls.name;
  }

  addContent(parent, modalStack) {
    const privates = privateMembers.get(this);

    const containerType = { classList: ['form-input-container'] };
    const labelType = (value) => ({ value, classList: ['form-input-label'] });
    parent.appendChild(createFormControl({
      type: 'text',
      id: 'task-name',
      name: 'task-name',
      classList: ['form-input'],
      required: true,
      label: labelType('Name'),
      container: containerType,
    }));

    const dateContainer = document.createElement('div');
    dateContainer.classList.add(...containerType.classList);
    const dateLabel = document.createElement('label');
    dateLabel.textContent = 'Due Date';
    dateLabel.htmlFor = 'task-due-date';
    dateLabel.classList.add('form-input-label');
    dateContainer.appendChild(dateLabel);

    dateContainer.appendChild(createDateInputField({
      id: 'task-due-date',
      name: 'task-due-date',
      placeholder: privates.dateFormat.visualPattern,
      classList: ['form-input-inline'],
      container: { classList: ['form-input-date-container'] },
      button: {
        classList: ['form-button'],
        callback: () => pickDueDate(this, modalStack),
      },
    }));
    parent.appendChild(dateContainer);

    parent.appendChild(createFormControl({
      type: 'select',
      id: 'task-recurring-date',
      name: 'task-recurring-date',
      classList: ['form-select'],
      label: labelType('Recurring Date'),
      container: containerType,
      menuItems: [
        { value: 'none', label: 'Never Repeat', selected: true },
        { value: 'daily', label: 'Repeat Daily' },
        { value: 'weekly', label: 'Repeat Weekly' },
        { value: 'monthly', label: 'Repeat Monthly' },
        { value: 'annually', label: 'Repeat Annually' },
        { value: 'custom', label: 'Custom Recurrence...' },
      ],
    }));

    parent.appendChild(createFormControl({
      type: 'select',
      id: 'task-priority',
      name: 'task-priority',
      classList: ['form-select'],
      label: labelType('Priority'),
      container: containerType,
      menuItems: [
        { value: 'very-high', label: 'Very High' },
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium', selected: true },
        { value: 'low', label: 'Low' },
        { value: 'very-low', label: 'Very Low' },
      ],
    }));

    parent.appendChild(createFormControl({
      type: 'select',
      id: 'task-project',
      name: 'task-project',
      classList: ['form-select'],
      label: labelType('Project'),
      container: containerType,
      menuItems: [{ value: 'none', label: 'None' }],
    }));

    parent.appendChild(createFormControl({
      type: 'textarea',
      id: 'task-description',
      name: 'task-description',
      classList: ['form-textarea'],
      label: labelType('Description'),
      container: containerType,
      size: { rows: 4, cols: 20 },
    }));

    privates.controls = {
      name: parent.querySelector('#task-name'),
      dueDate: parent.querySelector('#task-due-date'),
      recurringDate: parent.querySelector('#task-recurring-date'),
      priority: parent.querySelector('#task-priority'),
      project: parent.querySelector('#task-project'),
      description: parent.querySelector('#task-description'),
    };
    initFormValues(this);
    addListeners(this, modalStack);
  }

  confirm() {
    const privates = privateMembers.get(this);
    const { controls, dateFormat } = privates;

    let dueDate = null;
    if (controls.dueDate.value) {
      dueDate = parseDate(controls.dueDate.value, dateFormat.inputPatterns);
    }

    let creationDate = null;
    let completionDate = null;
    if (privates.taskId) {
      const task = privates.tasks.getTask(privates.taskId);
      creationDate = task.creationDate;
      completionDate = task.completionDate;
    }

    let recurringDate = null;
    switch (controls.recurringDate.value) {
      case 'daily':
        recurringDate = new RecurringDate('day');
        break;
      case 'weekly':
        recurringDate = new RecurringDate('week');
        break;
      case 'monthly':
        recurringDate = new RecurringDate('month');
        break;
      case 'annually':
        recurringDate = new RecurringDate('year');
        break;
      case 'custom-result':
        recurringDate = privates.customRecurrence;
        break;
      default:
        break;
    }

    let project = null;
    switch (controls.project.value) {
      case 'none':
      case 'new':
        break;
      default:
        project = controls.project.value;
        break;
    }

    const task = new Task(controls.name.value, {
      dueDate,
      creationDate,
      completionDate,
      priority: controls.priority.value,
      description: controls.description.value || null,
      recurringDate,
      project,
    });

    let id;
    if (privates.taskId) {
      id = privates.taskId;
      privates.tasks.updateTask(id, task);
    } else {
      id = privates.tasks.addTask(task);
    }

    if (privates.callbacks.confirm) privates.callbacks.confirm(id);
  }

  cancel() {
    const { callbacks } = privateMembers.get(this);
    if (callbacks.cancel) callbacks.cancel();
  }

  validate() {
    const { controls } = privateMembers.get(this);
    if (!controls.name.reportValidity()) return false;
    if (!controls.dueDate.reportValidity()) return false;
    return true;
  }
}

export default AddTaskModal;
