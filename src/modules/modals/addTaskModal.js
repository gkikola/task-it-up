/**
 * Defines the [AddTaskModal]{@link module:addTaskModal~AddTaskModal} class.
 * @module addTaskModal
 */

import Task from '../task';
import DatePickerModal from './datePickerModal';
import RecurrenceModal from './recurrenceModal';
import Settings from '../settings';
import {
  createDateInputField,
  createFormControl,
  formatDate,
  parseDate,
} from '../utility';

/**
 * A modal dialog for adding or editing a task.
 * @implements {module:modalStack~Modal}
 */
class AddTaskModal {
  /**
   * Initialize the modal.
   * @param {module:taskList~TaskList} taskList The task list in which the new
   *   task should be inserted.
   * @param {module:projectList~ProjectList} projectList The project list that
   *   will be used to populate the Project select box. The user can also
   *   create a new project, which will be added to the list.
   * @param {Object} [options={}] Holds configuration options for the modal.
   * @param {Function} [options.confirm] A callback function that will be
   *   invoked when the user successfully confirms the modal. The function will
   *   be passed the unique identifier of the task that was inserted into the
   *   task list (or the identifier of the existing task that was modified).
   * @param {Function} [options.cancel] A callback function that will be
   *   invoked when the user cancels the modal.
   * @param {Function} [options.newProject] A callback function that will be
   *   invoked when the user adds a new project to the project list. The unique
   *   identifier for the project will be passed to the function as an
   *   argument.
   * @param {string} [options.taskId] The unique identifier for the task that
   *   is being edited, if any. If not provided, then a new task will be
   *   created.
   * @param {string} [options.projectId] The unique identifier for the project
   *   to use as the default selection in the Project field. If not provided,
   *   then the task will default to having no project. This property is
   *   ignored if an existing task is being edited.
   * @param {module:settings~Settings~dateFormat} [options.dateFormat] An
   *   object holding information about the calendar date format to use for
   *   date fields. If not given, then the browser default is used.
   */
  constructor(taskList, projectList, options = {}) {
    /**
     * The task list to update.
     * @type {module:taskList~TaskList}
     */
    this._tasks = taskList;

    /**
     * The project list to use for the Project field.
     * @type {module:projectList~ProjectList}
     */
    this._projects = projectList;

    /**
     * The unique identifier for the task being edited (if any).
     * @type {string}
     */
    this._taskId = options.taskId || null;

    /**
     * The unique identifier for the default project (if any).
     * @type {string}
     */
    this._projectId = options.projectId || null;

    /**
     * Indicates the status of the task being entered. If set to 'add', a new
     * task is being created, and if set to 'edit', then an existing task is
     * being updated.
     * @type {string}
     */
    this._mode = options.taskId ? 'edit' : 'add';

    /**
     * The custom recurrence that the user added, if any.
     * @type {?module:recurringDate~RecurringDate}
     */
    this._customRecurrence = null;

    /**
     * An object holding date format information.
     * @type {module:settings~Settings~dateFormat}
     */
    this._dateFormat = options.dateFormat || Settings.lookupDateFormat();

    /**
     * An object holding callback functions.
     * @type {Object}
     * @property {Function} [confirm] A callback function that will be invoked
     *   when the user successfully confirms the modal.
     * @property {Function} [cancel] A callback function that will be invoked
     *   when the user cancels the modal.
     * @property {Function} [newProject] A callback function that will be
     *   invoked when the user adds a new project.
     */
    this._callbacks = {
      confirm: options.confirm || null,
      cancel: options.cancel || null,
      newProject: options.newProject || null,
    };

    /**
     * An object holding the form input elements for the modal.
     * @type {Object}
     * @property {HTMLElement} name The text input element for the task name.
     * @property {HTMLElement} dueDate The text input element for the task due
     *   date.
     * @property {HTMLElement} recurringDate The select element for the task
     *   recurring date.
     * @property {HTMLElement} priority The select element for the task
     *   priority.
     * @property {HTMLElement} project The select element for the task's
     *   containing project.
     * @property {HTMLElement} description The textarea element for the task
     *   description.
     */
    this._controls = {
      name: null,
      dueDate: null,
      recurringDate: null,
      priority: null,
      project: null,
      description: null,
    };
  }

  get title() {
    return (this._mode === 'edit') ? 'Edit Task' : 'Add Task';
  }

  get confirmLabel() {
    return (this._mode === 'edit') ? 'Update' : 'Add';
  }

  get cancelLabel() {
    return 'Cancel';
  }

  get noCancelButton() {
    return false;
  }

  addContent(parent, modalStack) {
    let task = null;
    if (this._taskId)
      task = this._tasks.getTask(this._taskId);

    const containerType = { classList: ['form-input-container'] };
    const labelType = value => ({ value, classList: ['form-input-label'] });
    parent.appendChild(createFormControl({
      type: 'text',
      id: 'task-name',
      name: 'task-name',
      value: task ? task.name : null,
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
      placeholder: this._dateFormat.visual,
      classList: ['form-input-inline'],
      container: { classList: ['form-input-date-container'] },
      button: {
        classList: ['form-button'],
        callback: () => this._pickDueDate(modalStack),
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

    const projectItems = [{ value: 'none', label: 'None', selected: true }];
    this._projects.forEach(entry => {
      projectItems.push({ value: entry.id, label: entry.project.name });
    });
    projectItems.push({ value: 'new', label: 'New Project...' });
    parent.appendChild(createFormControl({
      type: 'select',
      id: 'task-project',
      name: 'task-project',
      classList: ['form-select'],
      label: labelType('Project'),
      container: containerType,
      menuItems: projectItems,
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

    this._controls = {
      name: parent.querySelector('#task-name'),
      dueDate: parent.querySelector('#task-due-date'),
      recurringDate: parent.querySelector('#task-recurring-date'),
      priority: parent.querySelector('#task-priority'),
      project: parent.querySelector('#task-project'),
      description: parent.querySelector('#task-description'),
    };
    this._initFormValues();
    this._addListeners(modalStack);
  }

  confirm() {
    const controls = this._controls;
    const task = new Task(controls.name.value);
    task.priorityString = controls.priority.value;
    task.description = controls.description.value || null;

    let id;
    if (this._taskId) {
      id = this._taskId;
      this._tasks.updateTask(id, task);
    } else {
      id = this._tasks.addTask(task);
    }

    if (this._callbacks.confirm)
      this._callbacks.confirm(id);
  }

  cancel() {
    if (this._callbacks.cancel)
      this._callbacks.cancel();
  }

  validate() {
    const controls = this._controls;
    if (!controls.name.reportValidity())
      return false;

    return true;
  }

  /**
   * Initialize the values of the form elements based on the initial task that
   * was passed to the constructor, if any.
   */
  _initFormValues() {
    const controls = this._controls;
    let task = null;
    if (this._taskId)
      task = this._tasks.getTask(this._taskId);

    if (task?.name)
      controls.name.value = task.name;

    if (task?.dueDate) {
      controls.dueDate.value = formatDate(task.dueDate,
        this._dateFormat.internal);
    }

    if (task?.recurringDate) {
      // TODO: initialize recurrence
    }

    if (task?.priorityString && task.priorityString !== 'unknown')
      controls.priority.value = task.priorityString;

    let projectId = this._projectId;
    if (task?.project)
      projectId = task.project;
    controls.project.value = projectId;

    if (task?.description)
      controls.description.value = task.description;
  }

  /**
   * Add the event listeners to the form controls in the modal.
   * @param {module:modalStack~ModalStack} modalStack The modal stack in which
   *   the modal is being inserted.
   */
  _addListeners(modalStack) {
    const controls = this._controls;

    const recurringDate = controls.recurringDate;
    let recurrenceValue = recurringDate.value;
    const processRecurrence = recurrence => {
      // Update select box options
      const selector = 'option[value="custom-result"]';
      let optElem = recurringDate.querySelector(selector);
      if (!optElem) {
        optElem = document.createElement('option');
        optElem.value = 'custom-result';
        recurringDate.insertBefore(optElem, recurringDate.lastChild);
      }
      optElem.textContent = recurrence.toString();
      recurringDate.value = 'custom-result';
      recurrenceValue = recurringDate.value;

      this._customRecurrence = recurrence;
    };
    const cancelRecurrence = () => recurringDate.value = recurrenceValue;
    recurringDate.addEventListener('change', e => {
      if (e.target.value === 'custom') {
        const modal = new RecurrenceModal({
          confirm: processRecurrence,
          cancel: cancelRecurrence,
          initial: this._customRecurrence,
        });
        modalStack.showModal(modal);
      } else {
        recurrenceValue = e.target.value;
      }
    });
  }

  /**
   * Opens a date picker and updates the due date field.
   * @param {module:modalStack~ModalStack} modalStack The modal stack in which
   *   the modal has been inserted.
   */
  _pickDueDate(modalStack) {
    modalStack.showModal(new DatePickerModal());
  }
}

export default AddTaskModal;
