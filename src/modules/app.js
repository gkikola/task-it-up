/**
 * Defines the [App]{@link module:app~App} class.
 * @module app
 */

import '../styles/reset.css';
import '../styles/main.css';
import FilterMenu from './filterMenu';
import ModalStack from './modalStack';
import ProjectList from './projectList';
import TaskList from './taskList';

import AddTaskModal from './modals/addTaskModal';

import { createIconButton } from './utility';

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
   * Display the modal dialog for adding a new task. After the user confirms
   * the dialog, the task is added to the task list. If the user cancels, the
   * modal is closed and nothing happens.
   */
  _showAddTaskModal() {
    const modal = new AddTaskModal(this._tasks, this._projects);
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
