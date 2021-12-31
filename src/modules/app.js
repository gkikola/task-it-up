/**
 * Defines the [App]{@link module:app~App} class.
 * @module app
 */

import '../styles/reset.css';
import '../styles/main.css';
import Collapsible from './collapsible';
import DatePicker from './datePicker';
import FilterMenu from './filterMenu';
import ModalStack from './modalStack';
import Project from './project';
import ProjectList from './projectList';
import RecurringDate from './recurringDate';
import Task from './task';
import TaskList from './taskList';
import {
  createFormControl,
  createIconButton,
  createToggleButton,
} from './utility';

import ordinal from 'ordinal';

const APP_NAME = 'Task It Up';
const APP_AUTHOR = 'Greg Kikola';
const APP_AUTHOR_WEBSITE = 'https://www.gregkikola.com/';
const APP_COPYRIGHT_YEARS = '2021';

const NARROW_LAYOUT_CUTOFF = 700;

/**
 * Class responsible for creating the DOM elements for the app and running the
 * event-driven logic.
 */
class App {
  /**
   * Append the DOM elements for the app to the given parent node.
   * @param {HTMLElement} parent The DOM node where the app elements should be
   *   appended.
   */
  constructor(parent) {
    /**
     * Holds the task container.
     * @type {module:taskList~TaskList}
     */
    this._tasks = new TaskList();

    /**
     * Holds the project container.
     * @type {module:projectList~ProjectList}
     */
    this._projects = new ProjectList();

    /**
     * Information about the currently selected filter.
     * @type {Object}
     * @property {string} type The type of filter that is currently selected.
     * @property {string} id The identifier for the currently selected filter.
     */
    this._selectedFilter = {
      type: null,
      id: null,
    };

    /**
     * Holds a reference to the DOM node holding the page elements for the app.
     * @type {HTMLElement}
     */
    this._appContainer = null;

    /**
     * Holds a reference to the side panel element in the DOM.
     * @type {HTMLElement}
     */
    this._sidePanel = null;

    /**
     * The stack of modal dialogs.
     * @type {module:modalStack~ModalStack}
     */
    this._modalStack = null;

    /**
     * Holds a reference to the resizing bar element for the side panel.
     * @type {HTMLElement}
     */
    this._resizer = null;

    /**
     * Holds a reference to the main panel element in the DOM.
     * @type {HTMLElement}
     */
    this._mainPanel = null;

    /**
     * Indicates whether the screen size is narrow. This should be true when
     * the viewport width is less than or equal to NARROW_LAYOUT_CUTOFF.
     * @type {boolean}
     */
    this._narrowScreen = false;

    /**
     * Holds the menu of task filters in the side panel.
     * @type {module:filterMenu~FilterMenu}
     */
    this._filterMenu = null;

    this._createPageElements(parent);
  }

  /**
   * Run the app. This method sets up the event handlers and performs
   * high-level logic. This should not be called until the page elements have
   * been added to the DOM.
   */
  run() {
    window.addEventListener('resize', () => {
      const width = document.documentElement.clientWidth;
      const narrow = width <= NARROW_LAYOUT_CUTOFF;

      // Adjust side panel if screen changes from narrow to wide or vice versa
      if (narrow && !this._narrowScreen) {
        this._closeSidePanel();
      } else if (!narrow && this._narrowScreen) {
        this._openSidePanel();
      }

      this._narrowScreen = narrow;
    });

    this._filterMenu.expandGroup('dates');
    this._filterMenu.expandGroup('projects');
    this._filterMenu.selectFilter('dates', 'today');

    const menuSelector = '.title-container .icon[data-icon-type="menu"]';
    const menuIcon = document.querySelector(menuSelector);
    menuIcon.addEventListener('click', () => {
      const closed = this._sidePanel.classList.toggle('closed');
      if (closed)
        this._resizer.classList.add('closed');
      else
        this._resizer.classList.remove('closed');
    });

    const mainPanelHeader = document.getElementById('main-panel-header');
    const addTaskIcon
      = mainPanelHeader.querySelector('.icon[data-icon-type="add"]');
    addTaskIcon.addEventListener('click', () => {
      this._showAddTaskModal();
    });
  }

  /**
   * Open the side panel, so that the filter menu is visible.
   */
  _openSidePanel() {
    this._sidePanel.classList.remove('closed');
    this._resizer.classList.remove('closed');
  }

  /**
   * Close the side panel, so that the filter menu is hidden.
   */
  _closeSidePanel() {
    this._sidePanel.classList.add('closed');
    this._resizer.classList.add('closed');
  }

  /**
   * Create the app's task filter menu.
   */
  _createFilterMenu() {
    const filterGroups = [
      { id: 'default', label: null },
      { id: 'dates', label: 'Dates' },
      { id: 'projects', label: 'Projects' },
      { id: 'priorities', label: 'Priorities' },
    ];

    this._filterMenu = new FilterMenu(this._sidePanel, filterGroups);

    const filters = [
      { groupId: 'default', filterId: 'all', label: 'All Tasks' },
      { groupId: 'dates', filterId: 'today', label: 'Today' },
      { groupId: 'dates', filterId: 'week', label: 'This Week' },
      { groupId: 'dates', filterId: 'past-due', label: 'Past Due' },
      { groupId: 'priorities', filterId: 'very-high', label: 'Very High' },
      { groupId: 'priorities', filterId: 'high', label: 'High' },
      { groupId: 'priorities', filterId: 'medium', label: 'Medium' },
      { groupId: 'priorities', filterId: 'low', label: 'Low' },
      { groupId: 'priorities', filterId: 'very-low', label: 'Very Low' },
      {
        groupId: 'projects',
        filterId: 'uncategorized',
        label: 'Uncategorized',
      },
    ];

    filters.forEach(filter => {
      this._filterMenu.addFilter(filter.groupId, filter.filterId, filter.label);
    });

    this._filterMenu.addEventListener('select-filter',
      this._handleFilterChange.bind(this));
  }

  /**
   * Create the DOM elements for the page content.
   * @param {HTMLElement} parent The container element under which the page
   *   elements should be inserted.
   */
  _createPageElements(parent) {
    const container = document.createElement('div');
    container.id = 'app';
    this._appContainer = container;

    this._createHeader(container);

    const middleContainer = document.createElement('div');
    middleContainer.id = 'middle-container';
    this._createSidePanel(middleContainer);
    this._createResizer(middleContainer);
    this._createMainPanel(middleContainer);
    container.appendChild(middleContainer);

    this._createFooter(container);

    parent.appendChild(container);

    this._modalStack = new ModalStack(parent, container);
  }

  /**
   * Create the app's header.
   * @param {HTMLElement} parent The parent element under which the header
   *   should be inserted.
   */
  _createHeader(parent) {
    const header = document.createElement('header');
    header.id = 'header';

    const titleContainer = document.createElement('div');
    titleContainer.classList.add('title-container');
    titleContainer.appendChild(createIconButton('menu'));
    const title = document.createElement('p');
    title.classList.add('title');
    title.textContent = APP_NAME;
    titleContainer.appendChild(title);
    header.appendChild(titleContainer);

    const toolContainer = document.createElement('div');
    toolContainer.classList.add('tools');
    toolContainer.appendChild(createIconButton('settings'));
    header.appendChild(toolContainer);

    parent.appendChild(header);
  }

  /**
   * Create the app's side panel.
   * @param {HTMLElement} parent The parent element under which the side panel
   *   should be inserted.
   */
  _createSidePanel(parent) {
    this._sidePanel = document.createElement('aside');
    this._sidePanel.id = 'side-panel';
    this._createFilterMenu();
    parent.appendChild(this._sidePanel);
  }

  /**
   * Create the resizing bar for the side panel.
   * @param {HTMLElement} parent The parent element under which the resizer is
   *   to be inserted.
   */
  _createResizer(parent) {
    this._resizer = document.createElement('div');
    this._resizer.classList.add('resizer');

    const handler = e => {
      const size = `${e.x}px`;
      this._sidePanel.style.width = size;
      e.preventDefault();
    };

    this._resizer.addEventListener('mousedown', e => {
      // Check for left-click
      if (e.button === 0) {
        document.addEventListener('mousemove', handler);
        e.target.classList.add('dragging');
        e.preventDefault();
      }
    });

    document.addEventListener('mouseup', e => {
      if (e.button === 0) {
        document.removeEventListener('mousemove', handler);
        this._resizer.classList.remove('dragging');
      }
    });

    parent.appendChild(this._resizer);
  }

  /**
   * Create the app's main panel.
   * @param {HTMLElement} parent The parent element under which the main panel
   *   is to be inserted.
   */
  _createMainPanel(parent) {
    this._mainPanel = document.createElement('div');
    this._mainPanel.id = 'main-panel';

    const content = document.createElement('main');
    content.id = 'main-panel-content';

    const header = document.createElement('div');
    header.id = 'main-panel-header';
    const headingContainer = document.createElement('div');
    headingContainer.id = 'main-panel-heading-container';
    header.appendChild(headingContainer);
    const heading = document.createElement('h2');
    heading.id = 'main-panel-heading';
    headingContainer.appendChild(heading);
    const subheading = document.createElement('h3');
    subheading.id = 'main-panel-subheading';
    headingContainer.appendChild(subheading);

    const iconContainer = document.createElement('div');
    iconContainer.classList.add('icon-container');
    iconContainer.appendChild(createIconButton('add'));
    iconContainer.appendChild(createIconButton('more_horiz'));
    header.appendChild(iconContainer);

    content.appendChild(header);

    this._mainPanel.appendChild(content);
    parent.appendChild(this._mainPanel);
  }

  /**
   * Create the app's footer.
   * @param {HTMLElement} parent The parent element under which the footer is
   *   to be inserted.
   */
  _createFooter(parent) {
    const footer = document.createElement('footer');
    footer.id = 'footer';

    const copyright = document.createElement('div');
    copyright.classList.add('copyright');
    copyright.innerHTML = `Copyright &copy; ${APP_COPYRIGHT_YEARS} ` +
      `<a href="${APP_AUTHOR_WEBSITE}" target="_blank">` +
      `${APP_AUTHOR}</a>`;
    footer.appendChild(copyright);

    parent.appendChild(footer);
  }

  /**
   * Display the modal dialog for selecting a date.
   * @param {Function} [confirmCallback] A callback function to be invoked when
   *   the user confirms the date selection. The chosen date will be passed to
   *   the function.
   * @param {Function} [cancelCallback] A callback function to be invoked when
   *   the user cancels the modal.
   * @param {Date} [startDate] The date that will be initially selected. If not
   *   given, then the present date is used.
   */
  _showDatePickerModal(confirmCallback, cancelCallback, startDate) {
    const container = document.createElement('div');
    const picker = new DatePicker(container, startDate);

    this._modalStack.showModal(container, {
      title: 'Select Date',
      id: 'date-picker',
      confirmCallback: () => {
        if (confirmCallback)
          confirmCallback(picker.date);
      },
      cancelCallback: () => { if (cancelCallback) cancelCallback(); },
    });
  }

  /**
   * Display the modal dialog for adding a new task. After the user confirms
   * the dialog, the task is added to the task list. If the user cancels, the
   * modal is closed and nothing happens.
   */
  _showAddTaskModal() {
    const container = document.createElement('div');
    this._createAddTaskForm(container);

    const controls = {
      name: container.querySelector('#task-name'),
      dueDate: container.querySelector('#task-due-date'),
      recurringDate: container.querySelector('#task-recurring-date'),
      priority: container.querySelector('#task-priority'),
      project: container.querySelector('#task-project'),
      description: container.querySelector('#task-description'),
    };

    let customRecurrence = null;
    let recurrenceSelectValue = controls.recurringDate.value;
    const processRecurrence = recurrence => {
      customRecurrence = recurrence;

      // Update select box options
      const selector = 'option[value="custom-result"]';
      let optElem = controls.recurringDate.querySelector(selector);
      if (!optElem) {
        optElem = document.createElement('option');
        optElem.value = 'custom-result';
      }
      optElem.textContent = recurrence.toString();
      controls.recurringDate.insertBefore(optElem,
        controls.recurringDate.lastChild);
      controls.recurringDate.value = 'custom-result';
    };
    const cancelRecurrence = () => {
      controls.recurringDate.value = recurrenceSelectValue;
    };
    controls.recurringDate.addEventListener('change', e => {
      if (e.target.value === 'custom') {
        this._showRecurringDateModal(processRecurrence, cancelRecurrence,
          customRecurrence);
        controls.recurringDate.value = recurrenceSelectValue;
      } else {
        recurrenceSelectValue = e.target.value;
      }
    });

    this._modalStack.showModal(container, {
      title: 'Add Task',
      id: 'add-task',
      confirmCallback: () => {
        const task = new Task(controls.name.value);
        task.priorityString = controls.priority.value;
        task.description = controls.description.value || null;

        let recurrence = null;
        switch (controls.recurringDate.value) {
          case 'daily':
            break;
          case 'weekly':
            break;
          case 'monthly':
            break;
          case 'annually':
            break;
          case 'custom-result':
            recurrence = customRecurrence;
            break;
          default:
          case 'none':
            break;
        }
        task.recurringDate = recurrence;

        this._tasks.addTask(task);
      },
      confirmLabel: 'Add',
    });
  }

  /**
   * Display the modal dialog for selecting a recurring date.
   * @param {Function} [confirmCallback] A callback function that will receive
   *   the recurring date that the user selected.
   * @param {Function} [cancelCallback] A callback function that will be
   *   invoked when the modal is canceled.
   * @param {module:recurringDate~RecurringDate} [base] A recurring date to use
   *   as default values for the form controls.
   */
  _showRecurringDateModal(confirmCallback, cancelCallback, base) {
    const container = document.createElement('div');
    this._createRecurrenceForm(container);

    const getElement = id => container.querySelector(`#recurring-date-${id}`);
    const controls = {
      intervalLength: getElement('interval-length'),
      intervalUnit: getElement('interval-unit'),
    };

    this._modalStack.showModal(container, {
      title: 'Edit Recurring Date',
      id: 'recurring-date',
      confirmCallback: () => {
      },
    });
  }

  /**
   * Create the form elements for adding a new task.
   * @param {HTMLElement} parent The parent DOM node under which the form
   *   should be inserted.
   */
  _createAddTaskForm(parent) {
    const containerType = { classList: ['form-input-container'] };
    const labelType = value => ({ value, classList: ['form-input-label'] });
    parent.appendChild(createFormControl({
      type: 'text',
      id: 'task-name',
      name: 'task-name',
      classList: ['form-input'],
      label: labelType('Name'),
      container: containerType,
    }));
    this._createDateInputField(parent, {
      id: 'task-due-date',
      label: 'Due Date',
    });
    parent.appendChild(createFormControl({
      type: 'select',
      id: 'task-recurring-date',
      name: 'task-recurring-date',
      classList: ['form-select'],
      label: labelType('Recurrence'),
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

    const projectSelect = parent.querySelector('#task-project');
    const projectCollapsible = new Collapsible(projectSelect.parentNode,
      null, { collapsed: true });
    this._createShortAddProjectForm(projectCollapsible.content);
    projectSelect.addEventListener('change', e => {
      if (e.target.value === 'new')
        projectCollapsible.expand();
      else
        projectCollapsible.collapse();
    });

    parent.appendChild(createFormControl({
      type: 'textarea',
      id: 'task-description',
      name: 'task-description',
      classList: ['form-textarea'],
      label: labelType('Description'),
      container: containerType,
      size: { rows: 4, cols: 20 },
    }));
  }

  /**
   * Create the form elements for setting a recurring date.
   * @param {HTMLElement} parent The parent DOM node under which the form
   *   should be inserted.
   */
  _createRecurrenceForm(parent) {
    let container = document.createElement('div');
    container.classList.add('form-input-container');
    container.appendChild(createFormControl({
      type: 'number',
      id: 'recurring-date-interval-length',
      name: 'recurring-date-interval-length',
      value: '1',
      classList: ['form-input-inline', 'form-input-count'],
      container: { inline: true },
      label: {
        value: 'Repeat every ',
        classList: ['form-input-label-inline'],
      },
    }));
    container.appendChild(createFormControl({
      type: 'select',
      id: 'recurring-date-interval-unit',
      name: 'recurring-date-interval-unit',
      classList: ['form-select-inline'],
      container: { inline: true },
      label: {
        value: ' ',
        classList: ['form-input-label-inline'],
      },
      menuItems: [
        { value: 'day', label: 'Day' },
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' },
        { value: 'year', label: 'Year' },
      ],
    }));
    parent.appendChild(container);

    const dayContainer = document.createElement('div');
    parent.appendChild(dayContainer);

    const endContainer = document.createElement('div');
    endContainer.classList.add('form-input-container');

    let label, optionContainer;
    label = document.createElement('div');
    label.classList.add('form-input-label-inline');
    label.textContent = 'Stop repeating';
    endContainer.appendChild(label);

    endContainer.appendChild(createFormControl({
      type: 'radio',
      id: 'recurring-date-end-type-never',
      name: 'recurring-date-end-type',
      value: 'never',
      checked: true,
      label: { value: 'Never', classList: ['form-input-label-inline'] },
      container: { classList: ['form-input-item-container'] },
    }));

    optionContainer = document.createElement('div');
    optionContainer.classList.add('form-input-item-container');
    optionContainer.appendChild(createFormControl({
      type: 'radio',
      id: 'recurring-date-end-type-date',
      name: 'recurring-date-end-type',
      value: 'date',
    }));

    label = document.createElement('label');
    label.classList.add('form-input-label-inline');
    label.htmlFor = 'recurring-date-end-type-date';
    label.textContent = 'On date ';
    optionContainer.appendChild(label);

    this._createDateInputField(optionContainer, {
      id: 'recurring-date-end-date',
      inline: true,
    });

    endContainer.appendChild(optionContainer);

    optionContainer = document.createElement('div');
    optionContainer.classList.add('form-input-item-container');
    optionContainer.appendChild(createFormControl({
      type: 'radio',
      id: 'recurring-date-end-type-count',
      name: 'recurring-date-end-type',
      value: 'count',
    }));

    label = document.createElement('label');
    label.classList.add('form-input-label-inline');
    label.htmlFor = 'recurring-date-end-type-count';
    label.textContent = 'After ';
    optionContainer.appendChild(label);

    optionContainer.appendChild(createFormControl({
      type: 'number',
      id: 'recurring-date-end-count',
      name: 'recurring-date-end-count',
      value: '1',
      classList: ['form-input-inline', 'form-input-count'],
    }));

    label = document.createElement('span');
    label.classList.add('form-input-label-inline');
    label.textContent = ' occurrences';
    optionContainer.appendChild(label);

    endContainer.appendChild(optionContainer);

    parent.appendChild(endContainer);

    const unitSelect = parent.querySelector('#recurring-date-interval-unit');
    unitSelect.addEventListener('change', e => {
      dayContainer.innerHTML = '';
      switch (e.target.value) {
        case 'week':
          this._createRecurrenceWeekdayForm(dayContainer);
          break;
        case 'month':
          this._createRecurrenceMonthlyForm(dayContainer);
          break;
      }
    });
  }

  /**
   * Create the form elements for selecting days of the week in a recurrence.
   * @param {HTMLElement} parent The parent DOM node under which the form
   *   should be inserted.
   */
  _createRecurrenceWeekdayForm(parent) {
    const container = document.createElement('div');
    container.classList.add('form-input-container');

    const label = document.createElement('div');
    label.classList.add('form-input-label-inline');
    label.textContent = 'Repeat on';
    container.appendChild(label);
    const days = [
      { name: 'Sunday', value: 'sunday', short: 'Sun' },
      { name: 'Monday', value: 'monday', short: 'Mon' },
      { name: 'Tuesday', value: 'tuesday', short: 'Tue' },
      { name: 'Wednesday', value: 'wednesday', short: 'Wed' },
      { name: 'Thursday', value: 'thursday', short: 'Thu' },
      { name: 'Friday', value: 'friday', short: 'Fri' },
      { name: 'Saturday', value: 'saturday', short: 'Sat' },
    ];
    days.forEach(day => {
      container.appendChild(createToggleButton(day.short, {
        id: `recurring-date-weekday-${day.value}`,
        name: 'recurring-date-weekday',
        value: day.value,
        classList: ['toggle-button', 'form-weekday-button'],
      }));
    });
    parent.appendChild(container);
  }

  /**
   * Create the form elements for selecting a day of the month in a recurrence.
   * @param {HTMLElement} parent The parent DOM node under which the form
   *   should be inserted.
   */
  _createRecurrenceMonthlyForm(parent) {
    const container = document.createElement('div');
    container.classList.add('form-input-container');

    let label, optionContainer, selectItems;

    label = document.createElement('div');
    label.classList.add('form-input-label-inline');
    label.textContent = 'Repeat on';
    container.appendChild(label);

    optionContainer = document.createElement('div');
    optionContainer.classList.add('form-input-item-container');
    optionContainer.appendChild(createFormControl({
      type: 'radio',
      id: 'recurring-date-month-type-day',
      name: 'recurring-date-month-type',
      value: 'day-of-month',
      checked: true,
    }));

    label = document.createElement('span');
    label.classList.add('form-input-label-inline');
    label.textContent = 'The ';
    optionContainer.appendChild(label);

    selectItems = [];
    for (let day = 1; day <= 31; day++)
      selectItems.push({ value: day.toString(), label: ordinal(day) });
    optionContainer.appendChild(createFormControl({
      type: 'select',
      id: 'recurring-date-month-day',
      name: 'recurring-date-month-day',
      classList: ['form-select-inline'],
      menuItems: selectItems,
    }));

    label = document.createElement('span');
    label.classList.add('form-input-label-inline');
    label.textContent = ' day of the month';
    optionContainer.appendChild(label);

    container.appendChild(optionContainer);

    optionContainer = document.createElement('div');
    optionContainer.classList.add('form-input-item-container');
    optionContainer.appendChild(createFormControl({
      type: 'radio',
      id: 'recurring-date-month-type-week',
      name: 'recurring-date-month-type',
      value: 'week-of-month',
    }));

    label = document.createElement('span');
    label.classList.add('form-input-label-inline');
    label.textContent = 'The ';
    optionContainer.appendChild(label);

    selectItems = [];
    for (let week = 1; week <= 5; week++)
      selectItems.push({ value: week.toString(), label: ordinal(week) });
    optionContainer.appendChild(createFormControl({
      type: 'select',
      id: 'recurring-date-month-week-number',
      name: 'recurring-date-month-week-number',
      classList: ['form-select-inline'],
      menuItems: selectItems,
    }));

    label = document.createElement('span');
    label.classList.add('form-input-label-inline');
    label.textContent = ' ';
    optionContainer.appendChild(label);

    selectItems = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ].map(day => ({ value: day.toLowerCase(), label: day }));
    optionContainer.appendChild(createFormControl({
      type: 'select',
      id: 'recurring-date-month-week-day',
      name: 'recurring-date-month-week-day',
      classList: ['form-select-inline'],
      menuItems: selectItems,
    }));

    label = document.createElement('span');
    label.classList.add('form-input-label-inline');
    label.textContent = ' of the month';
    optionContainer.appendChild(label);

    container.appendChild(optionContainer);

    parent.appendChild(container);
  }

  /**
   * Create the form elements for adding a new project. This method only
   * creates a short form, just asking for the project name.
   * @param {HTMLElement} parent The parent DOM node under which the form
   *   should be inserted.
   */
  _createShortAddProjectForm(parent) {
  }

  /**
   * Reset the form inputs in a modal dialog.
   * @param {module:modal~Modal} modal The modal dialog whose forms are to be
   *   reset.
   */
  _resetModal(modal) {
    const checkAttr = '[type="checkbox"]';
    const radioAttr = '[type="radio"]';
    const textQuery = `input:not(${checkAttr}):not(${radioAttr})`;
    const checkRadioQuery = `input${checkAttr}, input${radioAttr}`;
    const changeEvent = new Event('change');
    modal.content.querySelectorAll(textQuery).forEach(elem => {
      elem.value = elem.defaultValue;
      elem.dispatchEvent(changeEvent);
    });
    modal.content.querySelectorAll(checkRadioQuery).forEach(elem => {
      elem.checked = elem.defaultChecked;
      elem.dispatchEvent(changeEvent);
    });
    modal.content.querySelectorAll('option').forEach(elem => {
      elem.selected = elem.defaultSelected;
    });
    modal.content.querySelectorAll('select').forEach(elem => {
      elem.dispatchEvent(changeEvent);
    });
    modal.content.querySelectorAll('textarea').forEach(elem => {
      elem.value = elem.textContent;
      elem.dispatchEvent(changeEvent);
    });
    modal.content.scrollTop = 0;
    modal.content.scrollLeft = 0;
  }

  /**
   * Create an input field for entering dates. This will create a text input
   * control together with a button that will open the date picker modal when
   * clicked.
   * @param {HTMLElement} parent The DOM element under which the input elements
   *   should be inserted.
   * @param {Object} [options={}] An object holding configuration options for
   *   controlling the form element creation.
   * @param {string} [options.id] The identifier for the text input control.
   * @param {string} [options.value] The default value for the text input
   *   control.
   * @param {string} [options.label] The label for the input element.
   * @param {boolean} [options.inline=false] If true, the form elements are
   *   placed in an inline container. Otherwise, a block container is used.
   *   This also affects the CSS classes that are applied to the elements.
   */
  _createDateInputField(parent, options = {}) {
    const container = document.createElement(options.inline ? 'span' : 'div');
    if (!options.inline)
      container.classList.add('form-input-container');
    else
      container.classList.add('form-input-date-container-inline');

    if (options.label) {
      const label = document.createElement('label');
      if (options.id)
        label.htmlFor = options.id;
      if (options.inline)
        label.classList.add('form-input-label-inline');
      else
        label.classList.add('form-input-label');
      label.textContent = options.label;
      container.appendChild(label);
    }

    let flex = null;
    if (!options.inline) {
      flex = document.createElement('div');
      flex.classList.add('form-input-date-container');
      container.appendChild(flex);
    }

    const input = createFormControl({
      type: 'text',
      id: options.id || null,
      name: options.id || null,
      value: options.value || null,
      classList: ['form-input-inline'],
    });

    const button = document.createElement('button');
    button.classList.add('form-button');
    button.textContent = 'Choose...';
    button.addEventListener('click', () => {
      const value = input.value;
      this._showDatePickerModal();
    });

    if (flex) {
      flex.appendChild(input);
      flex.appendChild(button);
    } else {
      container.appendChild(input);
      container.appendChild(button);
    }

    parent.appendChild(container);
  }

  /**
   * Respond to a change in the filter menu selection.
   * @param {Object} e The event object.
   * @param {string} [e.groupId] The identifier for the group containing the
   *   filter that was selected, if any.
   * @param {string} [e.filterId] The identifier for the filter that was
   *   selected, if any.
   * @param {string} [e.filterLabel] The displayed label for the selected
   *   filter, if any.
   */
  _handleFilterChange(e) {
    if (!e.filterId)
      return;

    const heading = document.getElementById('main-panel-heading');
    let labelText = e.filterLabel;
    if (e.groupId === 'priorities')
      labelText += ' Priority';
    heading.textContent = labelText;

    const subheading = document.getElementById('main-panel-subheading');
    labelText = '';
    subheading.textContent = labelText;
    subheading.style.display = (labelText.length > 0) ? 'block' : 'none';

    // TODO: Update main panel
  }
};

export default App;
