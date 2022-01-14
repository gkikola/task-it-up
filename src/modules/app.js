/**
 * Defines the [App]{@link module:app~App} class.
 * @module app
 */

import '../styles/reset.css';
import '../styles/main.css';
import AddProjectModal from './modals/addProjectModal';
import AddTaskModal from './modals/addTaskModal';
import FilterMenu from './filterMenu';
import ModalStack from './modalStack';
import Project from './project';
import ProjectList from './projectList';
import RecurringDate from './recurringDate';
import Settings from './settings';
import Task from './task';
import TaskDisplay from './taskDisplay';
import TaskList from './taskList';

import { createIconButton, formatDate } from './utility';

import {
  add as addToDate,
  endOfDay,
  startOfDay,
} from 'date-fns';

const APP_NAME = 'Task It Up';
const APP_AUTHOR = 'Greg Kikola';
const APP_AUTHOR_WEBSITE = 'https://www.gregkikola.com/';
const APP_COPYRIGHT_YEARS = '2021-2022';

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

    /**
     * Holds the task filter that is currently being displayed in the main
     * panel.
     * @type {module:filterMenu~FilterMenu~filterInfo}
     */
    this._currentFilter = { group: null, filter: null };

    /**
     * Holds the task display panel.
     * @type {module:taskDisplay~TaskDisplay}
     */
    this._taskDisplay = null;

    /**
     * Holds user app settings.
     * @type {module:app~App~settings}
     */
    this._settings = new Settings();

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

    /* Add random task and project data for testing */
    this._addRandomData(50, 10);
    this._updateProjectFilters();
    this._settings.filters.default.sortBy = 'project';
    this._filterMenu.selectFilter('default', 'all');
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
      { groupId: 'dates', filterId: 'month', label: 'This Month' },
      { groupId: 'dates', filterId: 'past-due', label: 'Past Due' },
      { groupId: 'priorities', filterId: 'very-high', label: 'Very High' },
      { groupId: 'priorities', filterId: 'high', label: 'High' },
      { groupId: 'priorities', filterId: 'medium', label: 'Medium' },
      { groupId: 'priorities', filterId: 'low', label: 'Low' },
      { groupId: 'priorities', filterId: 'very-low', label: 'Very Low' },
    ];

    filters.forEach(filter => {
      this._filterMenu.addFilter(filter.groupId, filter.filterId, filter.label);
    });

    this._filterMenu.addEventListener('select-filter',
      this._handleFilterChange.bind(this));
    this._filterMenu.addGroupIconButton('projects', 'add', {
      callback: () => this._showAddProjectModal(),
    });

    this._updateProjectFilters();
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

    this._taskDisplay = new TaskDisplay(content, this._tasks, this._projects);

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
   * Display the modal dialog for adding or editing a task. After the user
   * confirms the dialog, the task is added to the task list.
   * @param {Object} [options={}] An object holding options for creating the
   *   modal.
   * @param {string} [taskId] The identifier for the task to edit, if any.
   * @param {string} [projectId] The identifier for the default project that
   *   the task should be assigned to, if any. If a task id was given, then
   *   this option is ignored.
   */
  _showAddTaskModal(options = {}) {
    const modal = new AddTaskModal(this._tasks, this._projects, {
      taskId: options.taskId || null,
      projectId: options.projectId || null,
      dateFormat: this._settings.dateFormat,
      confirm: () => this._updateMainPanel({ resetScroll: false }),
      newProject: () => this._updateProjectFilters(),
    });
    this._modalStack.showModal(modal);
  }

  /**
   * Display the modal dialog for adding or editing a project. After the user
   * confirms the dialog, the project is added to the project list.
   * @param {Object} [options={}] An object holding options for creating the
   *   modal.
   * @param {string} [projectId] The identifier for the project to edit, if
   *   any. If not given, a new project is created.
   */
  _showAddProjectModal(options = {}) {
    let project = null;
    if (options.projectId)
      project = this._projects.getProject(options.projectId);

    const modal = new AddProjectModal({
      confirm: project => {
        let newId = null;
        if (options.projectId)
          this._projects.updateProject(options.projectId, project);
        else
          newId = this._projects.addProject(project);

        this._updateProjectFilters();
        if (newId)
          this._filterMenu.selectFilter('projects', newId);
      },
      project,
    });
    this._modalStack.showModal(modal);
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
    const activeElement = document.activeElement;
    if (activeElement)
      activeElement.blur();

    if (!e.groupId || !e.filterId)
      return;

    this._currentFilter.group = e.groupId;
    this._currentFilter.filter = e.filterId;

    this._updateMainPanel();
  }

  /**
   * Refresh the main panel.
   * @param {Object} [options={}] An object holding options for the main panel.
   * @param {boolean} [resetScroll=true] If set to true (the default), then the
   *   panel's scroll position will be reset back to the top. Otherwise the
   *   scroll position will not be changed.
   */
  _updateMainPanel(options = {}) {
    const { group, filter } = this._currentFilter;

    let heading = null;
    let subheading = null;
    const displayOptions = { groupBy: 'none' };
    let filterOptions;
    switch (group) {
      default:
      case 'default':
        filterOptions = this._settings.filters.default;
        heading = 'All Tasks';
        break;
      case 'dates': {
        filterOptions = this._settings.filters.dates;
        const today = startOfDay(new Date());
        const todayEnd = endOfDay(today);

        const duration = {};
        switch (filter) {
          case 'today':
            heading = 'Today';
            subheading = formatDate(today, 'eeee, MMMM d, yyyy');
            break;
          case 'week':
            heading = 'This Week';
            displayOptions.groupBy = 'due-date';
            duration.weeks = 1;
            duration.days = -1;
            break;
          case 'month':
            heading = 'This Month';
            displayOptions.groupBy = 'due-date';
            duration.months = 1;
            duration.days = -1;
            break;
          case 'past-due':
            heading = 'Past Due';
            duration.days = -1;
            displayOptions.requireDueDate = true;
            break;
        }
        displayOptions.endDate = addToDate(todayEnd, duration);

        if (filter !== 'today' && filter !== 'past-due') {
          const dateFormat = this._settings.dateFormat.internal;
          const startStr = formatDate(today, dateFormat);
          const endStr = formatDate(displayOptions.endDate, dateFormat);
          subheading = `${startStr} to ${endStr}`;
        }
        break;
      }
      case 'projects':
        filterOptions = this._settings.filters.projects;
        displayOptions.project = filter;
        if (filter === 'none')
          heading = 'Uncategorized';
        else
          heading = this._projects.getProject(filter).name;
        break;
      case 'priorities': {
        filterOptions = this._settings.filters.priorities;
        const priority = Task.convertStringToPriority(filter);
        displayOptions.priority = priority;
        heading = `Task.convertPriorityToPrettyString(priority) Priority`;
        break;
      }
    }

    // Override grouping if needed
    if (filterOptions.groupBy !== 'default')
      displayOptions.groupBy = filterOptions.groupBy;

    displayOptions.sortBy = filterOptions.sortBy;
    displayOptions.completed = filterOptions.showCompleted;
    displayOptions.sortDescending = filterOptions.sortDescending;

    this._updateMainHeading(heading, subheading);
    this._taskDisplay.update(displayOptions);

    // Reset the scroll position
    if (options.resetScroll !== false) {
      this._mainPanel.scrollTop = 0;
      this._mainPanel.scrollLeft = 0;
    }
  }

  /**
   * Update the heading in the main panel.
   * @param {string} heading The new heading to display.
   * @param {string} [subheading] The new subheading to display, if any.
   */
  _updateMainHeading(heading, subheading) {
    const headingElem = document.getElementById('main-panel-heading');
    const subheadingElem = document.getElementById('main-panel-subheading');
    headingElem.textContent = heading;
    if (subheading) {
      subheadingElem.textContent = subheading;
      subheadingElem.style.display = 'block';
    } else {
      subheadingElem.textContent = '';
      subheadingElem.style.display = 'none';
    }
  }

  /**
   * Refresh the list of projects in the filter menu.
   */
  _updateProjectFilters() {
    const selection = this._filterMenu.getSelection();

    this._filterMenu.removeAllFilters('projects');
    this._filterMenu.addFilter('projects', 'none', 'Uncategorized');
    this._projects.forEach(entry => {
      this._filterMenu.addFilter('projects', entry.id, entry.project.name);
    });

    // Restore selection
    if (selection.group === 'projects') {
      const filter = selection.filter;
      if (this._filterMenu.hasFilter('projects', filter))
        this._filterMenu.selectFilter('projects', filter);
    }
  }

  _addRandomData(taskCount, projCount) {
    const getRandom = (min, max) => {
      return Math.floor(Math.random() * (max - min + 1) + min);
    };
    const passCheck = probability => Math.random() < probability;

    const sentences = [
      'Call me Ishmael.',
      'It was the best of times, it was the worst of times, it was the age of \
      wisdom, it was the age of foolishness, it was the epoch of belief, it \
      was the epoch of incredulity, it was the season of Light, it was the \
      season of Darkness, it was the spring of hope, it was the winter of \
      despair.',
      'It is a truth universally acknowledged, that a single man in \
      possession of a good fortune, must be in want of a wife.',
      'In my younger and more vulnerable years my father gave me some advice \
      that I\'ve been turning over in my mind ever since.',
      'It was a bright cold day in April, and the clocks were striking \
      thirteen.',
      'It was a pleasure to burn.',
      'As Gregor Samsa awoke one morning from uneasy dreams he found himself \
      transformed in his bed into an enormous insect.',
      'Far out in the uncharted backwaters of the unfashionable end of the \
      western spiral arm of the Galaxy lies a small, unregarded yellow sun.',
      'All happy families are alike; each unhappy family is unhappy in its \
      own way',
      'Whether I shall turn out to be the hero of my own life, or whether \
      that station will be held by anybody else, these pages must show.',
    ];
    const randomSentence = () => sentences[getRandom(0, sentences.length - 1)];

    const randomDate = () => {
      const today = new Date();
      return addToDate(today, { days: getRandom(-5, 40) });
    };

    const randomRecurrence = () => {
      const random = Math.random();
      let unit;
      if (random < 0.25)
        unit = 'day';
      else if (random < 0.5)
        unit = 'week';
      else if (random < 0.75)
        unit = 'month';
      else
        unit = 'year';

      return new RecurringDate(unit, {
        intervalLength: passCheck(0.5) ? 1 : getRandom(2, 10),
        startDate: passCheck(0.5) ? randomDate() : null,
        allowPastOccurrence: passCheck(0.25),
      });
    };

    const projects = [];
    for (let i = 0; i < projCount; i++) {
      const project = new Project(`Project ${i + 1}`, {
        description: passCheck(0.5) ? randomSentence() : null,
      });
      projects.push(this._projects.addProject(project));
    }
    const randomProject = () => projects[getRandom(0, projects.length - 1)];

    for (let i = 0; i < taskCount; i++) {
      const task = new Task(`Task ${i + 1}`, {
        dueDate: passCheck(0.5) ? randomDate() : null,
        completionDate: passCheck(0.1) ? new Date() : null,
        priority: getRandom(-2, 2),
        description: passCheck(0.5) ? randomSentence() : null,
        recurringDate: passCheck(0.5) ? randomRecurrence() : null,
        project: passCheck(0.5) ? randomProject() : null,
      });
      this._tasks.addTask(task);
    }
  }
}

export default App;
