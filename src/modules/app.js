/**
 * Defines the [App]{@link module:app~App} class.
 * @module app
 */

import '../styles/reset.css';
import '../styles/main.css';
import FilterMenu from './filterMenu';
import TaskList from './taskList';

const APP_NAME = 'Task It Up';
const APP_AUTHOR = 'Greg Kikola';
const APP_AUTHOR_WEBSITE = 'https://www.gregkikola.com/';
const APP_COPYRIGHT_YEARS = '2021';

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
     * Information about the currently selected filter.
     * @type {Object}
     * @property {string} type The type of filter that is currently selected.
     * @property {string} id The identifier for the currently selected filter.
     */
    this._selectedFilter = {
      type: null,
      id: null,
    };

    const elements = createPageElements();
    const sidePanel = elements.querySelector('#side-panel');

    /**
     * Holds the menu of task filters in the side panel.
     * @type {module:filterMenu~FilterMenu}
     */
    this._filterMenu = this._createFilterMenu(sidePanel);

    parent.appendChild(elements);
  }

  /**
   * Run the app. This method sets up the event handlers and performs
   * high-level logic. This should not be called until the page elements have
   * been added to the DOM.
   */
  run() {
  }

  _createFilterMenu(parent) {
    const filterGroups = [
      { id: 'default', label: null },
      { id: 'dates', label: 'Dates' },
      { id: 'projects', label: 'Projects' },
      { id: 'priorities', label: 'Priorities' },
    ];

    const menu = new FilterMenu(parent, filterGroups);

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
      menu.addFilter(filter.groupId, filter.filterId, filter.label);
    });

    return menu;
  }
};

/**
 * Create the DOM elements for the page content.
 * @returns {HTMLElement} The container element that holds the app's DOM
 *   content.
 */
function createPageElements() {
  const container = document.createElement('div');
  container.id = 'app';

  container.appendChild(createHeader());

  const middleContainer = document.createElement('div');
  middleContainer.id = 'middle-container';
  middleContainer.appendChild(createSidePanel());
  middleContainer.appendChild(createMainPanel());
  container.appendChild(middleContainer);

  container.appendChild(createFooter());

  return container;
}

/**
 * Create the app's header.
 * @returns {HTMLElement} The header element.
 */
function createHeader() {
  const header = document.createElement('header');
  header.id = 'header';

  const titleContainer = document.createElement('div');
  titleContainer.classList.add('title-container');
  const title = document.createElement('p');
  title.classList.add('title');
  title.textContent = APP_NAME;
  titleContainer.appendChild(title);
  header.appendChild(titleContainer);

  const toolContainer = document.createElement('div');
  toolContainer.classList.add('tools');
  const settingsIcon = document.createElement('div');
  settingsIcon.classList.add('icon');
  settingsIcon.classList.add('material-icons');
  settingsIcon.textContent = 'settings';
  toolContainer.appendChild(settingsIcon);
  header.appendChild(toolContainer);

  return header;
}

/**
 * Create the app's side panel.
 * @returns {HTMLElement} The side panel container element.
 */
function createSidePanel() {
  const panel = document.createElement('aside');
  panel.id = 'side-panel';

  // const dateContainer = document.createElement('div');
  // dateContainer.appendChild(fl.createFilterListHeading('Dates'));
  // const dateFilters = [
  //   { id: 'today', label: 'Today' },
  //   { id: 'week', label: 'Next Seven Days' },
  //   { id: 'past-due', label: 'Past Due' },
  //   { id: 'all', label: 'All' },
  // ];
  // const dateList = fl.createFilterList('date-filter-list', 'date');
  // dateFilters.forEach(filter => {
  //   fl.addFilter(dateList, filter.id, filter.label);
  // });
  // dateContainer.appendChild(dateList);

  // const projContainer = document.createElement('div');
  // const projButtons = [
  //   { label: 'add' },
  // ];
  // projContainer.appendChild(fl.createFilterListHeading('Projects',
  //   projButtons));
  // projContainer.appendChild(fl.createFilterList('project-filter-list',
  //   'project'));

  // const listContainer = document.createElement('div');
  // listContainer.classList.add('list-container');
  // listContainer.appendChild(dateContainer);
  // listContainer.appendChild(projContainer);

  // panel.appendChild(listContainer);

  return panel;
}

/**
 * Create the app's main panel.
 * @returns {HTMLElement} The main panel container element.
 */
function createMainPanel() {
  const panel = document.createElement('div');
  panel.id = 'main-panel';

  const content = document.createElement('main');
  content.id = 'main-panel-content';

  const headingContainer = document.createElement('div');
  headingContainer.id = 'main-panel-header';
  const heading = document.createElement('h2');
  heading.classList.add('main-panel-heading');
  heading.textContent = 'Today';
  headingContainer.appendChild(heading);

  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('main-panel-button-container');
  headingContainer.appendChild(buttonContainer);

  content.appendChild(headingContainer);

  panel.appendChild(content);
  return panel;
}

/**
 * Create the app's footer.
 * @returns {HTMLElement} The footer element.
 */
function createFooter() {
  const footer = document.createElement('footer');
  footer.id = 'footer';

  const copyright = document.createElement('div');
  copyright.classList.add('copyright');
  copyright.innerHTML = `Copyright &copy; ${APP_COPYRIGHT_YEARS} ` +
    `<a href="${APP_AUTHOR_WEBSITE}" target="_blank">` +
    `${APP_AUTHOR}</a>`;
  footer.appendChild(copyright);

  return footer;
}

export default App;
