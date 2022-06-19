/**
 * Defines the [App]{@link module:app~App} class.
 * @module app
 */

import {
  add as addToDate,
  endOfDay,
  startOfDay,
} from 'date-fns';
import semver from 'semver';

import '../styles/reset.css';
import '../styles/main.css';
import AddProjectModal from './modals/addProjectModal';
import AddTaskModal from './modals/addTaskModal';
import ConfirmModal from './modals/confirmModal';
import DataModal from './modals/dataModal';
import FilterMenu from './filterMenu';
import InfoModal from './modals/infoModal';
import ModalStack from './modalStack';
import PopupMenu from './popupMenu';
import Project from './project';
import ProjectList from './projectList';
import RecurringDate from './recurringDate';
import Settings from './settings';
import SettingsModal from './modals/settingsModal';
import Task from './task';
import TaskDisplay from './taskDisplay';
import TaskList from './taskList';
import { formatDate } from './utility/dates';
import { createIconButton } from './utility/dom';
import {
  clearData,
  forEachDataItem,
  generateFile,
  getFileExtension,
  parseCsv,
  removeData,
  retrieveData,
  storeData,
} from './utility/storage';

const APP_NAME = 'Task It Up';
const APP_AUTHOR = PACKAGE_AUTHOR_NAME;
const APP_AUTHOR_WEBSITE = PACKAGE_AUTHOR_WEBSITE;
const APP_COPYRIGHT_YEARS = '2021-2022';
const APP_VERSION = PACKAGE_VERSION;
const APP_STORAGE_PREFIX = PACKAGE_NAME;

const NARROW_LAYOUT_CUTOFF = 700;

/**
 * Object holding private members for the [App]{@link module:app~App} class.
 * @typedef {Object} module:app~App~privates
 * @property {module:taskList~TaskList} tasks Holds the task container.
 * @property {module:projectList~ProjectList} projects Holds the project
 *   container.
 * @property {module:modalStack~ModalStack} modalStack The stack of modal
 *   dialogs.
 * @property {module:filterMenu~FilterMenu} filterMenu The menu of task filters
 *   in the side panel.
 * @property {module:filterMenu~FilterMenu~filterInfo} currentFilter Holds the
 *   task filter that is currently being displayed in the main panel.
 * @property {module:taskDisplay~TaskDisplay} taskDisplay Holds the task
 *   display panel.
 * @property {module:settings~Settings} settings Holds user app settings.
 * @property {HTMLElement} appContainer Holds a reference to the DOM node
 *   holding the page elements for the app.
 * @property {HTMLElement} sidePanel Holds a reference to the side panel
 *   element in the DOM.
 * @property {HTMLElement} resizer Holds a reference to the resizing bar
 *   element for the side panel.
 * @property {HTMLElement} mainPanel Holds a reference to the main panel
 *   element in the DOM.
 * @property {module:popupMenu~PopupMenu} mainPanelMenu The popup menu that is
 *   shown when the user clicks the 'more' button in the main panel.
 * @property {boolean} narrowScreen Indicates whether the screen size is
 *   narrow. This should be true when the viewport width is less than or equal
 *   to NARROW_LAYOUT_CUTOFF.
 */

/**
 * Holds private data for the [App]{@link module:app~App} class.
 * @type {WeakMap}
 * @see module:app~App~privates
 */
const privateMembers = new WeakMap();

function addRandomData(instance, taskCount, projCount) {
  const getRandom = (min, max) => (
    Math.floor(Math.random() * (max - min + 1) + min)
  );
  const passCheck = (probability) => Math.random() < probability;

  const sentences = [
    'Call me Ishmael.',
    'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair.',
    'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
    'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.',
    'It was a bright cold day in April, and the clocks were striking thirteen.',
    'It was a pleasure to burn.',
    'As Gregor Samsa awoke one morning from uneasy dreams he found himself transformed in his bed into an enormous insect.',
    'Far out in the uncharted backwaters of the unfashionable end of the western spiral arm of the Galaxy lies a small, unregarded yellow sun.',
    'All happy families are alike; each unhappy family is unhappy in its own way',
    'Whether I shall turn out to be the hero of my own life, or whether that station will be held by anybody else, these pages must show.',
  ];
  const randomSentence = () => sentences[getRandom(0, sentences.length - 1)];

  const randomDate = () => {
    const today = new Date();
    return addToDate(today, { days: getRandom(-5, 40) });
  };

  const randomRecurrence = () => {
    const random = Math.random();
    let unit;
    if (random < 0.25) unit = 'day';
    else if (random < 0.5) unit = 'week';
    else if (random < 0.75) unit = 'month';
    else unit = 'year';

    return new RecurringDate(unit, {
      intervalLength: passCheck(0.5) ? 1 : getRandom(2, 10),
      startDate: passCheck(0.5) ? randomDate() : null,
      baseOnCompletion: passCheck(0.25),
    });
  };

  const privates = privateMembers.get(instance);
  const projects = [];
  for (let i = 0; i < projCount; i += 1) {
    const project = new Project(`Project ${i + 1}`, {
      description: passCheck(0.5) ? randomSentence() : null,
    });
    projects.push(privates.projects.addProject(project));
  }
  const randomProject = () => projects[getRandom(0, projects.length - 1)];

  for (let i = 0; i < taskCount; i += 1) {
    const task = new Task(`Task ${i + 1}`, {
      dueDate: passCheck(0.5) ? randomDate() : null,
      completionDate: passCheck(0.1) ? new Date() : null,
      priority: getRandom(-2, 2),
      description: passCheck(0.5) ? randomSentence() : null,
      recurringDate: passCheck(0.5) ? randomRecurrence() : null,
      project: passCheck(0.5) ? randomProject() : null,
    });
    privates.tasks.addTask(task);
  }
}

/**
 * Open the side panel, so that the filter menu is visible.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 */
function openSidePanel(instance) {
  const privates = privateMembers.get(instance);
  privates.sidePanel.classList.remove('closed');
  privates.resizer.classList.remove('closed');
}

/**
 * Close the side panel, so that the filter menu is hidden.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 */
function closeSidePanel(instance) {
  const privates = privateMembers.get(instance);
  privates.sidePanel.classList.add('closed');
  privates.resizer.classList.add('closed');
}

/**
 * Toggle the side panel's visibility.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 */
function toggleSidePanel(instance) {
  const privates = privateMembers.get(instance);
  const closed = privates.sidePanel.classList.toggle('closed');
  if (closed) privates.resizer.classList.add('closed');
  else privates.resizer.classList.remove('closed');
}

/**
 * Update the menu items in the popup menu for the main panel based on the
 * selected filter.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 */
function updateMainPanelMenu(instance) {
  const privates = privateMembers.get(instance);
  const { group, filter } = privates.currentFilter;
  const filterOptions = privates.settings.getFilterOptions(group);

  const GROUP_ICON = 'category';
  const SORT_ICON = 'sort';

  const {
    groupBy, sortBy, sortDescending, showCompleted,
  } = filterOptions;
  const optionItems = [
    { label: 'Add Task...', id: 'add-task', iconType: 'add' },
    { label: 'Add Project...', id: 'add-project', iconType: 'add' },
  ];
  const groupByItems = [];
  const sortByItems = [];

  if (group === 'projects' && filter !== 'none') {
    optionItems.push({
      label: 'Edit Project...',
      id: 'edit-project',
      iconType: 'edit',
    });
    optionItems.push({
      label: 'Delete Project...',
      id: 'delete-project',
      iconType: 'delete',
    });
  }

  optionItems.push(
    {
      label: showCompleted ? 'Hide Completed Tasks' : 'Show Completed Tasks',
      id: showCompleted ? 'hide-completed' : 'show-completed',
      iconType: 'done',
    },
    {
      label: sortDescending ? 'Sort Ascending' : 'Sort Descending',
      id: sortDescending ? 'sort-ascending' : 'sort-descending',
      iconType: 'swap_vert',
    },
  );

  if (groupBy !== 'default') {
    groupByItems.push({
      label: 'Use Default Grouping',
      id: 'group-by-default',
      iconType: GROUP_ICON,
    });
  }

  if (groupBy !== 'none') {
    groupByItems.push({
      label: 'Do Not Group Tasks',
      id: 'group-by-none',
      iconType: GROUP_ICON,
    });
  }

  if (sortBy !== 'create-date') {
    sortByItems.push({
      label: 'Sort by Date Added',
      id: 'sort-by-create-date',
      iconType: SORT_ICON,
    });
  }

  if ((group !== 'dates' || filter !== 'past-due') && groupBy !== 'due-date') {
    groupByItems.push({
      label: 'Group by Due Date',
      id: 'group-by-due-date',
      iconType: GROUP_ICON,
    });
    if (sortBy !== 'due-date') {
      sortByItems.push({
        label: 'Sort by Due Date',
        id: 'sort-by-due-date',
        iconType: SORT_ICON,
      });
    }
  }

  if (group !== 'projects' && groupBy !== 'project') {
    groupByItems.push({
      label: 'Group by Project',
      id: 'group-by-project',
      iconType: GROUP_ICON,
    });
    if (sortBy !== 'project') {
      sortByItems.push({
        label: 'Sort by Project',
        id: 'sort-by-project',
        iconType: SORT_ICON,
      });
    }
  }

  if (group !== 'priorities' && groupBy !== 'priority') {
    groupByItems.push({
      label: 'Group by Priority',
      id: 'group-by-priority',
      iconType: GROUP_ICON,
    });
    if (sortBy !== 'priority') {
      sortByItems.push({
        label: 'Sort by Priority',
        id: 'sort-by-priority',
        iconType: SORT_ICON,
      });
    }
  }

  const menuItems = [...optionItems, ...groupByItems, ...sortByItems];
  privates.mainPanelMenu.setMenuItems(menuItems);
}

/**
 * Update the heading in the main panel.
 * @param {string} heading The new heading to display.
 * @param {string} [subheading] The new subheading to display, if any.
 */
function updateMainHeading(heading, subheading) {
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
 * Refresh the main panel.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 * @param {Object} [options={}] An object holding options for the main panel.
 * @param {boolean} [options.resetScroll=true] If set to true (the default),
 *   then the panel's scroll position will be reset back to the top. Otherwise
 *   the scroll position will not be changed.
 */
function updateMainPanel(instance, options = {}) {
  const privates = privateMembers.get(instance);
  const { group, filter } = privates.currentFilter;

  let heading = null;
  let subheading = null;
  const displayOptions = {
    groupBy: 'none',
    resetScroll: options.resetScroll ?? true,
    dateFormat: privates.settings.dateFormat,
  };
  let filterOptions;
  switch (group) {
    case 'dates': {
      filterOptions = privates.settings.getFilterOptions('dates');
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
        default:
          break;
      }
      displayOptions.endDate = addToDate(todayEnd, duration);

      if (filter !== 'today' && filter !== 'past-due') {
        const dateFormat = privates.settings.dateFormat.outputPattern;
        const startStr = formatDate(today, dateFormat);
        const endStr = formatDate(displayOptions.endDate, dateFormat);
        subheading = `${startStr} to ${endStr}`;
      }
      break;
    }
    case 'projects':
      filterOptions = privates.settings.getFilterOptions('projects');
      displayOptions.project = filter;
      if (filter === 'none') {
        heading = 'Uncategorized';
      } else {
        const project = privates.projects.getProject(filter);
        heading = project.name;
        subheading = project.description || null;
      }
      break;
    case 'priorities': {
      filterOptions = privates.settings.getFilterOptions('priorities');
      const priority = Task.convertStringToPriority(filter);
      displayOptions.priority = priority;
      heading = `${Task.convertPriorityToPrettyString(priority)} Priority`;
      break;
    }
    case 'default':
    default:
      filterOptions = privates.settings.getFilterOptions('default');
      heading = 'All Tasks';
      break;
  }

  // Override grouping if needed
  if (filterOptions.groupBy !== 'default') {
    displayOptions.groupBy = filterOptions.groupBy;
  }

  displayOptions.sortBy = filterOptions.sortBy;
  displayOptions.completed = filterOptions.showCompleted;
  displayOptions.sortDescending = filterOptions.sortDescending;

  updateMainHeading(heading, subheading);
  privates.taskDisplay.update(displayOptions);

  updateMainPanelMenu(instance);
}

/**
 * Refresh the list of projects in the filter menu.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 */
function updateProjectFilters(instance) {
  const privates = privateMembers.get(instance);
  const selection = privates.filterMenu.getSelection();

  privates.filterMenu.removeAllFilters('projects');
  privates.filterMenu.addFilter('projects', 'none', 'Uncategorized');
  privates.projects.forEach((entry) => {
    privates.filterMenu.addFilter('projects', entry.id, entry.project.name);
  });

  // Restore selection
  if (selection.group === 'projects') {
    const { filter } = selection;
    if (privates.filterMenu.hasFilter('projects', filter)) {
      privates.filterMenu.selectFilter('projects', filter);
    } else {
      privates.filterMenu.selectFilter('projects', 'none');
    }
  }
}

/**
 * Export app data to a JSON file.
 * @param {module:app~App} instance The [App]{@link module:app~App} instance
 *   whose data is to be exported.
 * @param {Object} [options={}] An object holding additional file options.
 * @param {string} [options.newlineSequence] The character sequence to use for
 *   newlines.
 */
function exportToJson(instance, options = {}) {
  let output = `${JSON.stringify(instance, null, 2)}\n`;

  if (options.newlineSequence) {
    output = output.replace(/\n/g, options.newlineSequence);
  }

  generateFile(
    output,
    'tasks.json',
    'application/json',
  );
}

/**
 * Export app data to a CSV file.
 * @param {module:app~App} instance The [App]{@link module:app~App} instance
 *   whose data is to be exported.
 * @param {Object} [options={}] An object holding additional file options.
 * @param {string} [options.newlineSequence] The character sequence to use for
 *   newlines.
 */
function exportToCsv(instance, options = {}) {
  const { tasks, projects } = privateMembers.get(instance);
  const output = tasks.toCsv({
    newlineSequence: options.newlineSequence ?? '\r\n',
    projectList: projects,
  });

  generateFile(
    output,
    'tasks.csv',
    'text/csv',
  );
}

/**
 * Import app data from a string in JSON format.
 * @param {module:app~App} instance The [App]{@link module:app~App} instance in
 *   which to import the data.
 * @param {string} data The app data in JSON format.
 * @returns {module:app~App~importStatus} An object holding information about
 *   the status of the import.
 */
function importFromJson(instance, data) {
  const privates = privateMembers.get(instance);
  const taskCounts = {
    added: 0,
    updated: 0,
    failed: 0,
    total: 0,
  };
  const projectCounts = { ...taskCounts };
  const errors = [];

  try {
    const {
      app,
      settings,
      tasks,
      projects,
    } = JSON.parse(data);

    if (app?.name !== APP_NAME || !semver.valid(app?.version)) {
      errors.push('Warning: Imported data does not follow the expected schema. The data may have been created by a different application, or may have been altered.');
    } else if (semver.gt(app.version, APP_VERSION)) {
      errors.push('Warning: Imported data seems to have been created by a newer version of the application. Some information might not be imported or might be imported incorrectly.');
    }

    if (settings != null) {
      const result = privates.settings.importFromJson(settings);
      errors.push(...result.errors);
    }

    if (projects != null) {
      const result = privates.projects.importFromJson(projects);
      Object.assign(projectCounts, result.projects);
      errors.push(...result.errors);
    }

    if (tasks != null) {
      const result = privates.tasks.importFromJson(tasks, {
        projectList: privates.projects,
      });
      Object.assign(taskCounts, result.tasks);
      errors.push(...result.errors);
    }

    return {
      successful: true,
      format: 'json',
      tasks: taskCounts,
      projects: projectCounts,
      errors,
    };
  } catch (e) {
    if (e instanceof SyntaxError) {
      return {
        successful: false,
        format: 'json',
        tasks: taskCounts,
        projects: projectCounts,
        errors: [`Fatal Error: ${e.message}`],
      };
    }
    throw e;
  }
}

/**
 * Import app data from a CSV string.
 * @param {module:app~App} instance The [App]{@link module:app~App} instance in
 *   which to import the data.
 * @param {string} data The app data in CSV format.
 * @returns {module:app~App~importStatus} An object holding information about
 *   the status of the import.
 */
function importFromCsv(instance, data) {
  const privates = privateMembers.get(instance);
  const taskCounts = {
    added: 0,
    updated: 0,
    failed: 0,
    total: 0,
  };
  const projectCounts = { ...taskCounts };
  const errors = [];

  const parsedData = parseCsv(data);
  let result;

  result = privates.projects.importFromCsv(parsedData);
  Object.assign(projectCounts, result.projects);
  errors.push(...result.errors);

  result = privates.tasks.importFromCsv(
    parsedData,
    { projectList: privates.projects },
  );
  Object.assign(taskCounts, result.tasks);
  errors.push(...result.errors);

  return {
    successful: true,
    format: 'csv',
    tasks: taskCounts,
    projects: projectCounts,
    errors,
  };
}

/**
 * Import app data from a file. This function will attempt to determine whether
 * the file is in JSON or CSV format, first using the file extension and,
 * failing that, by examining the contents.
 * @param {module:app~App} instance The [App]{@link module:app~App} instance in
 *   which to import the data.
 * @param {string} content The contents of the file being imported.
 * @param {string} [name] The name of the file being imported.
 * @returns {module:app~App~importStatus} An object holding information about
 *   the status of the import.
 */
function importFromFile(instance, content, name) {
  const fileExt = name ? getFileExtension(name).toLowerCase() : '';
  switch (fileExt) {
    case '.json': return importFromJson(instance, content);
    case '.csv': return importFromCsv(instance, content);
    default: {
      let result = importFromJson(instance, content);
      if (!result.successful) {
        result = importFromCsv(instance, content);
        if (!result.successful) {
          const counts = {
            added: 0,
            updated: 0,
            failed: 0,
            total: 0,
          };
          return {
            successful: false,
            format: 'unknown',
            tasks: { ...counts },
            projects: { ...counts },
            errors: ['Fatal Error: Unable to determine file format. Imported data must be in either JSON or CSV format.'],
          };
        }
      }
      return result;
    }
  }
}

/**
 * Delete all user data.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 */
function deleteAllData(instance) {
  const privates = privateMembers.get(instance);
  privates.settings.resetToDefault();
  privates.tasks.deleteAll();
  privates.projects.deleteAll();
  updateProjectFilters(instance);
  updateMainPanel(instance);
}

/**
 * Display a modal confirmation dialog.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 * @param {string} message The message to display to the user.
 * @param {Function} [onConfirm] A callback function to be invoked when the
 *   user confirms the modal.
 * @param {Function} [onCancel] A callback function to be invoked when the user
 *   cancels the modal.
 */
function showConfirmation(instance, message, onConfirm, onCancel) {
  const privates = privateMembers.get(instance);
  const modal = new ConfirmModal(message, {
    confirm: onConfirm || null,
    cancel: onCancel || null,
  });
  privates.modalStack.showModal(modal);
}

/**
 * Display the modal dialog for adding or editing a task. After the user
 * confirms the dialog, the task is added to the task list.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 * @param {Object} [options={}] An object holding options for creating the
 *   modal.
 * @param {string} [options.taskId] The identifier for the task to edit, if
 *   any.
 * @param {string} [options.projectId] The identifier for the default project
 *   that the task should be assigned to, if any. If a task id was given,
 *   then this option is ignored.
 * @param {number} [options.priority=0] The default priority for the task. If
 *   a task id was given, then this option is ignored.
 */
function showAddTaskModal(instance, options = {}) {
  const privates = privateMembers.get(instance);
  const modal = new AddTaskModal(privates.tasks, privates.projects, {
    taskId: options.taskId || null,
    projectId: options.projectId || null,
    priority: options.priority ?? 0,
    dateFormat: privates.settings.dateFormat,
    confirm: () => updateMainPanel(instance, { resetScroll: false }),
    newProject: () => updateProjectFilters(instance),
  });
  privates.modalStack.showModal(modal);
}

/**
 * Display the modal dialog for adding or editing a project. After the user
 * confirms the dialog, the project is added to the project list.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 * @param {Object} [options={}] An object holding options for creating the
 *   modal.
 * @param {string} [options.projectId] The identifier for the project to
 *   edit, if any. If not given, a new project is created.
 */
function showAddProjectModal(instance, options = {}) {
  const privates = privateMembers.get(instance);

  let projectToUpdate = null;
  if (options.projectId) {
    projectToUpdate = privates.projects.getProject(options.projectId);
  }

  const modal = new AddProjectModal({
    confirm: (project) => {
      let newId = null;
      if (options.projectId) {
        privates.projects.updateProject(options.projectId, project);
      } else {
        newId = privates.projects.addProject(project);
      }

      updateProjectFilters(instance);
      if (newId) privates.filterMenu.selectFilter('projects', newId);
    },
    project: projectToUpdate,
  });
  privates.modalStack.showModal(modal);
}

/**
 * Display the modal dialog for modifying user settings.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 */
function showSettingsModal(instance) {
  const privates = privateMembers.get(instance);
  const modal = new SettingsModal(privates.settings, {
    confirm: () => updateMainPanel(instance, { resetScroll: false }),
  });
  privates.modalStack.showModal(modal);
}

/**
 * Display the modal dialog for managing user data.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 */
function showDataModal(instance) {
  const privates = privateMembers.get(instance);
  const modal = new DataModal({
    importData: (content, { name }) => {
      const result = importFromFile(instance, content, name);
      if (result.projects.total > 0) updateProjectFilters(instance);
      if (result.tasks.total > 0) {
        updateMainPanel(instance, { resetScroll: false });
      }
      const container = document.createElement('div');
      const statusMsg = document.createElement('div');
      statusMsg.classList.add('data-import-results');
      container.appendChild(statusMsg);
      if (result.successful) {
        statusMsg.textContent = [
          'Data import succeeded.',
          `Processed ${result.tasks.total} ${result.tasks.total !== 1 ? 'tasks' : 'task'}: ${result.tasks.added} added, ${result.tasks.updated} updated, ${result.tasks.failed} failed.`,
          `Processed ${result.projects.total} ${result.projects.total !== 1 ? 'projects' : 'project'}: ${result.projects.added} added, ${result.projects.updated} updated, ${result.projects.failed} failed.`,
        ].join('\n');
      } else {
        statusMsg.textContent = 'Data import failed.';
      }
      if (result.errors.length > 0) {
        const errorList = document.createElement('ul');
        errorList.classList.add('data-import-error-list');
        result.errors.forEach((error) => {
          const listItem = document.createElement('li');
          listItem.classList.add('data-import-results');
          listItem.textContent = error;
          errorList.appendChild(listItem);
        });
        container.appendChild(errorList);
      }
      const infoModal = new InfoModal(container, { title: 'Import Status' });
      privates.modalStack.showModal(infoModal);
    },
    exportData: (fileType, fileOptions) => {
      if (fileType === 'csv') exportToCsv(instance, fileOptions);
      else exportToJson(instance, fileOptions);
    },
    deleteAll: () => deleteAllData(instance),
  });
  privates.modalStack.showModal(modal);
}

/**
 * Respond to a selection in the main panel menu.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 * @param {string} itemId The identifier for the menu item that was selected.
 */
function handleMainPanelMenuSelection(instance, itemId) {
  const privates = privateMembers.get(instance);
  const { group, filter } = privates.currentFilter;
  const filterOptions = privates.settings.getFilterOptions(group);

  let needPanelUpdate = true;
  let needFilterOptionUpdate = true;
  switch (itemId) {
    case 'add-task': {
      const modalOptions = {};
      if (group === 'projects' && filter !== 'none') {
        modalOptions.projectId = filter;
      } else if (group === 'priorities') {
        modalOptions.priority = Task.convertStringToPriority(filter);
      }
      showAddTaskModal(instance, modalOptions);
      needPanelUpdate = false;
      needFilterOptionUpdate = false;
      break;
    }
    case 'add-project':
      showAddProjectModal(instance);
      needPanelUpdate = false;
      needFilterOptionUpdate = false;
      break;
    case 'edit-project':
      showAddProjectModal(instance, { projectId: filter });
      needFilterOptionUpdate = false;
      break;
    case 'delete-project': {
      const project = privates.projects.getProject(filter);
      if (!project) break;
      showConfirmation(
        instance,
        `Are you sure you want to delete the project '${project.name}'?`,
        () => {
          privates.tasks.clearProject(filter);
          privates.projects.deleteProject(filter);
          updateProjectFilters(instance);
        },
      );
      needPanelUpdate = false;
      needFilterOptionUpdate = false;
      break;
    }
    case 'show-completed':
      filterOptions.showCompleted = true;
      break;
    case 'hide-completed':
      filterOptions.showCompleted = false;
      break;
    case 'sort-ascending':
      filterOptions.sortDescending = false;
      break;
    case 'sort-descending':
      filterOptions.sortDescending = true;
      break;
    case 'group-by-default':
      filterOptions.groupBy = 'default';
      break;
    case 'group-by-none':
      filterOptions.groupBy = 'none';
      break;
    case 'group-by-due-date':
      filterOptions.groupBy = 'due-date';
      break;
    case 'group-by-project':
      filterOptions.groupBy = 'project';
      break;
    case 'group-by-priority':
      filterOptions.groupBy = 'priority';
      break;
    case 'sort-by-create-date':
      filterOptions.sortBy = 'create-date';
      break;
    case 'sort-by-due-date':
      filterOptions.sortBy = 'due-date';
      break;
    case 'sort-by-project':
      filterOptions.sortBy = 'project';
      break;
    case 'sort-by-priority':
      filterOptions.sortBy = 'priority';
      break;
    default:
      break;
  }

  if (needFilterOptionUpdate) {
    privates.settings.setFilterOptions(group, filterOptions);
  }
  if (needPanelUpdate) updateMainPanel(instance, { resetScroll: false });
}

/**
 * Complete a task in the task list.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 * @param {string} id The unique identifier of the task to complete.
 */
function completeTask(instance, id) {
  const { tasks: taskList } = privateMembers.get(instance);
  const task = taskList.getTask(id);
  const now = new Date();

  if (task.recurringDate) {
    let baseDate = now;
    if (task.dueDate && !task.recurringDate.baseOnCompletion) {
      baseDate = task.dueDate;
    }
    const newDueDate = task.recurringDate.getNextOccurrence(baseDate);
    if (!newDueDate) {
      task.markComplete();
      task.recurringDate = null;
    } else {
      task.markIncomplete();
      task.recurringDate.advance();
      task.dueDate = newDueDate;
    }
  } else {
    task.markComplete();
  }

  taskList.updateTask(id, task);
}

/**
 * Respond to an action that the user performed on a task.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 * @param {string} type The type of action being performed: 'mark-complete',
 *   'mark-incomplete', 'edit', or 'delete'.
 * @param {string} id The unique identifier of the task being updated.
 * @param {module:task~Task} task The task being updated.
 */
function handleTaskUpdate(instance, type, id, task) {
  const privates = privateMembers.get(instance);
  let needUpdate = true;
  switch (type) {
    case 'mark-complete':
      completeTask(instance, id);
      break;
    case 'mark-incomplete':
      task.markIncomplete();
      privates.tasks.updateTask(id, task);
      break;
    case 'edit':
      showAddTaskModal(instance, { taskId: id });
      needUpdate = false;
      break;
    case 'clone':
      privates.tasks.addTask(task);
      break;
    case 'delete':
      showConfirmation(
        instance,
        `Are you sure you want to delete the task '${task.name}'?`,
        () => {
          privates.tasks.deleteTask(id);
          updateMainPanel(instance, { resetScroll: false });
        },
      );
      needUpdate = false;
      break;
    case 'go-to-project':
      privates.filterMenu.selectFilter('projects', task.project || 'none');
      needUpdate = false;
      break;
    default:
      needUpdate = false;
      break;
  }

  if (needUpdate) updateMainPanel(instance, { resetScroll: false });
}

/**
 * Respond to a change in the filter menu selection.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 * @param {Object} event The event object.
 * @param {string} [event.groupId] The identifier for the group containing the
 *   filter that was selected, if any.
 * @param {string} [event.filterId] The identifier for the filter that was
 *   selected, if any.
 * @param {string} [event.filterLabel] The displayed label for the selected
 *   filter, if any.
 */
function handleFilterChange(instance, event) {
  if (!event.groupId || !event.filterId) return;

  const privates = privateMembers.get(instance);
  privates.currentFilter.group = event.groupId;
  privates.currentFilter.filter = event.filterId;

  updateMainPanel(instance);
}

/**
 * Respond to a selection in the User menu.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 * @param {string} itemId The identifier of the menu item that was selected.
 */
function handleUserMenuSelection(instance, itemId) {
  switch (itemId) {
    case 'settings':
      showSettingsModal(instance);
      break;
    case 'data':
      showDataModal(instance);
      break;
    case 'about':
      break;
    default:
      break;
  }
}

/**
 * Make sure app information and settings are stored in local storage if
 * needed.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 */
function initializeStorage(instance) {
  storeData(APP_STORAGE_PREFIX, 'app.version', APP_VERSION);

  const storageMethod = retrieveData(
    APP_STORAGE_PREFIX,
    'setting.storageMethod',
  );
  if (storageMethod && storageMethod !== 'local') return;

  // Store any settings that are not already in local storage
  privateMembers.get(instance).settings.forEach((name, value) => {
    const key = `setting.${name}`;
    if (!retrieveData(APP_STORAGE_PREFIX, key)) {
      storeData(APP_STORAGE_PREFIX, key, value);
    }
  });
}

/**
 * Load all items from local storage into the app.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 */
function loadAllStorageData(instance) {
  const privates = privateMembers.get(instance);

  forEachDataItem(APP_STORAGE_PREFIX, (key, value) => {
    const dotIndex = key.indexOf('.');
    const type = key.substring(0, dotIndex);
    const id = key.substring(dotIndex + 1);

    switch (type) {
      case 'task':
        privates.tasks.addOrUpdateTask(id, Task.fromJson(value));
        break;
      case 'project':
        privates.projects.addOrUpdateProject(id, Project.fromJson(value));
        break;
      case 'setting':
        privates.settings.setSetting(id, value);
        break;
      default:
        break;
    }
  });
}

/**
 * Store all user data in local storage.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 */
function storeAllData(instance) {
  const privates = privateMembers.get(instance);

  storeData(APP_STORAGE_PREFIX, 'app.version', APP_VERSION);

  if (privates.settings.storageMethod === 'local') {
    privates.tasks.forEach(({ id, task }) => {
      storeData(APP_STORAGE_PREFIX, `task.${id}`, task);
    });

    privates.projects.forEach(({ id, project }) => {
      storeData(APP_STORAGE_PREFIX, `project.${id}`, project);
    });

    privates.settings.forEach((name, value) => {
      storeData(APP_STORAGE_PREFIX, `setting.${name}`, value);
    });
  } else {
    storeData(APP_STORAGE_PREFIX, 'setting.storageMethod', 'none');
  }
}

/**
 * Update local storage after data has been changed.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 * @param {string} type The type of data that was changed: 'setting', 'task',
 *   or 'project'.
 * @param {Object} eventData The event object specifying the data that was
 *   changed.
 */
function updateStorage(instance, type, eventData) {
  const privates = privateMembers.get(instance);

  // If storage method is changing, we need to delete or restore everything
  if (type === 'setting' && eventData.name === 'storageMethod') {
    if (eventData.value !== 'local') clearData(APP_STORAGE_PREFIX);
    storeAllData(instance);
    return;
  }

  if (privates.settings.storageMethod !== 'local') return;

  switch (type) {
    case 'task': {
      const { type: eventType, id, task } = eventData;
      const key = `task.${id}`;
      switch (eventType) {
        case 'add-task':
        case 'update-task':
          storeData(APP_STORAGE_PREFIX, key, task);
          break;
        case 'delete-task':
          removeData(APP_STORAGE_PREFIX, key);
          break;
        default:
          break;
      }
      break;
    }
    case 'project': {
      const { type: eventType, id, project } = eventData;
      const key = `project.${id}`;
      switch (eventType) {
        case 'add-project':
        case 'update-project':
          storeData(APP_STORAGE_PREFIX, key, project);
          break;
        case 'delete-project':
          removeData(APP_STORAGE_PREFIX, key);
          break;
        default:
          break;
      }
      break;
    }
    case 'setting': {
      const { name, value } = eventData;
      storeData(APP_STORAGE_PREFIX, `setting.${name}`, value);
      break;
    }
    default:
      break;
  }
}

/**
 * Create the app's task filter menu.
 * @param {module:app~App} instance The class instances on which to apply the
 *   function.
 */
function createFilterMenu(instance) {
  const privates = privateMembers.get(instance);

  const filterGroups = [
    { id: 'default', label: null },
    { id: 'dates', label: 'Dates' },
    { id: 'projects', label: 'Projects' },
    { id: 'priorities', label: 'Priorities' },
  ];

  const filterMenu = new FilterMenu(privates.sidePanel, filterGroups);

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

  filters.forEach((filter) => {
    filterMenu.addFilter(filter.groupId, filter.filterId, filter.label);
  });

  filterMenu.addEventListener('select-filter', (e) => {
    handleFilterChange(instance, e);
  });
  filterMenu.addGroupIconButton('projects', 'add', {
    callback: () => showAddProjectModal(instance),
  });

  privates.filterMenu = filterMenu;
  updateProjectFilters(instance);
}

/**
 * Create the app's header.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 * @param {HTMLElement} parent The parent element under which the header
 *   should be inserted.
 */
function createHeader(instance, parent) {
  // const privates = privateMembers.get(instance);

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
  toolContainer.appendChild(createIconButton('account_circle'));
  header.appendChild(toolContainer);

  parent.appendChild(header);
}

/**
 * Create the app's side panel.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 * @param {HTMLElement} parent The parent element under which the side panel
 *   should be inserted.
 */
function createSidePanel(instance, parent) {
  const privates = privateMembers.get(instance);

  privates.sidePanel = document.createElement('aside');
  privates.sidePanel.id = 'side-panel';
  createFilterMenu(instance);
  parent.appendChild(privates.sidePanel);
}

/**
 * Create the resizing bar for the side panel.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 * @param {HTMLElement} parent The parent element under which the resizer is
 *   to be inserted.
 */
function createResizer(instance, parent) {
  const privates = privateMembers.get(instance);

  privates.resizer = document.createElement('div');
  privates.resizer.classList.add('resizer');

  const handler = (e) => {
    const size = `${e.x}px`;
    privates.sidePanel.style.width = size;
    e.preventDefault();
  };

  privates.resizer.addEventListener('mousedown', (e) => {
    // Check for left-click
    if (e.button === 0) {
      document.addEventListener('mousemove', handler);
      e.target.classList.add('dragging');
      e.preventDefault();
    }
  });

  document.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
      document.removeEventListener('mousemove', handler);
      privates.resizer.classList.remove('dragging');
    }
  });

  parent.appendChild(privates.resizer);
}

/**
 * Create the app's main panel.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 * @param {HTMLElement} parent The parent element under which the main panel
 *   is to be inserted.
 */
function createMainPanel(instance, parent) {
  const privates = privateMembers.get(instance);

  privates.mainPanel = document.createElement('div');
  privates.mainPanel.id = 'main-panel';

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

  const menu = new PopupMenu({ closeIfScrolled: privates.mainPanel });
  privates.mainPanelMenu = menu;

  const iconContainer = document.createElement('div');
  iconContainer.classList.add('icon-container');
  iconContainer.appendChild(createIconButton('add'));
  iconContainer.appendChild(createIconButton('more_horiz'));
  header.appendChild(iconContainer);

  privates.mainPanel.appendChild(header);

  const taskDisplayOptions = {
    taskCallback: (type, id, task) => {
      handleTaskUpdate(instance, type, id, task);
    },
  };
  privates.taskDisplay = new TaskDisplay(
    privates.mainPanel,
    privates.tasks,
    privates.projects,
    taskDisplayOptions,
  );

  parent.appendChild(privates.mainPanel);
}

/**
 * Create the app's footer.
 * @param {HTMLElement} parent The parent element under which the footer is
 *   to be inserted.
 */
function createFooter(parent) {
  const footer = document.createElement('footer');
  footer.id = 'footer';

  const copyright = document.createElement('div');
  copyright.classList.add('copyright');
  copyright.innerHTML = `Copyright &copy; ${APP_COPYRIGHT_YEARS} `
    + `<a href="${APP_AUTHOR_WEBSITE}" target="_blank">`
    + `${APP_AUTHOR}</a>`;
  footer.appendChild(copyright);

  parent.appendChild(footer);
}

/**
 * Create the DOM elements for the page content.
 * @param {module:app~App} instance The class instance on which to apply the
 *   function.
 * @param {HTMLElement} parent The container element under which the page
 *   elements should be inserted.
 */
function createPageElements(instance, parent) {
  const privates = privateMembers.get(instance);

  const container = document.createElement('div');
  container.id = 'app';
  privates.appContainer = container;

  createHeader(instance, container);

  const middleContainer = document.createElement('div');
  middleContainer.id = 'middle-container';
  createSidePanel(instance, middleContainer);
  createResizer(instance, middleContainer);
  createMainPanel(instance, middleContainer);
  container.appendChild(middleContainer);

  createFooter(container);

  parent.appendChild(container);

  privates.modalStack = new ModalStack(parent, container);
}

/**
 * Class responsible for creating the DOM elements for the app and running the
 * event-driven logic.
 */
class App {
  /**
   * An object holding information about the status of a data import, including
   * whether or not the import was successful and any errors that were
   * encountered.
   * @typedef {Object} module:app~App~importStatus
   * @property {boolean} successful Will be true if data was imported, or false
   *   if data could not be imported due to a fatal error.
   * @property {string} format The format of the data string that was imported.
   *   Will be 'json', 'csv', or 'unknown'. A value of 'unknown' indicates that
   *   the format could not be automatically determined.
   * @property {Object} tasks An object holding information about the number of
   *   tasks that were imported.
   * @property {number} tasks.added The number of new tasks that were added to
   *   the task list.
   * @property {number} tasks.updated The number of existing tasks in the task
   *   list that were updated.
   * @property {number} tasks.failed The number of tasks that failed to import.
   * @property {number} tasks.total The total number of tasks that were
   *   processed.
   * @property {Object} projects An object holding information about the number
   *   of projects that were imported.
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
   * Append the DOM elements for the app to the given parent node.
   * @param {HTMLElement} parent The DOM node where the app elements should be
   *   appended.
   */
  constructor(parent) {
    const privates = {
      tasks: new TaskList(),
      projects: new ProjectList(),
      modalStack: null,
      filterMenu: null,
      currentFilter: { group: null, filter: null },
      taskDisplay: null,
      settings: new Settings(),
      appContainer: null,
      sidePanel: null,
      resizer: null,
      mainPanel: null,
      mainPanelMenu: null,
      narrowScreen: false,
    };
    privateMembers.set(this, privates);

    createPageElements(this, parent);
  }

  /**
   * Run the app. This method sets up the event handlers and performs
   * high-level logic. This should not be called until the page elements have
   * been added to the DOM.
   */
  run() {
    const privates = privateMembers.get(this);

    window.addEventListener('resize', () => {
      const width = document.documentElement.clientWidth;
      const narrow = width <= NARROW_LAYOUT_CUTOFF;

      // Adjust side panel if screen changes from narrow to wide or vice versa
      if (narrow && !privates.narrowScreen) {
        closeSidePanel(this);
      } else if (!narrow && privates.narrowScreen) {
        openSidePanel(this);
      }

      privates.narrowScreen = narrow;
    });

    privates.filterMenu.expandGroup('dates');
    privates.filterMenu.expandGroup('projects');
    privates.filterMenu.selectFilter('dates', 'today');

    const menuSelector = '.title-container .icon[data-icon-type="menu"]';
    const menuIcon = document.querySelector(menuSelector);
    menuIcon.addEventListener('click', () => toggleSidePanel(this));

    const userMenu = new PopupMenu({
      menuItems: [
        { label: 'Settings...', id: 'settings', iconType: 'settings' },
        { label: 'Data Management...', id: 'data', iconType: 'save' },
        { label: 'About...', id: 'about', iconType: 'info' },
      ],
    });
    const userIcon = document.querySelector(
      '#header .icon[data-icon-type="account_circle"]',
    );
    userIcon.addEventListener('click', () => {
      userMenu.open(
        (itemId) => handleUserMenuSelection(this, itemId),
        { referenceElement: userIcon },
      );
    });

    const mainPanelHeader = document.getElementById('main-panel-header');
    const addTaskIcon = mainPanelHeader.querySelector(
      '.icon[data-icon-type="add"]',
    );
    addTaskIcon.addEventListener('click', () => {
      handleMainPanelMenuSelection(this, 'add-task');
    });

    const moreIcon = mainPanelHeader.querySelector(
      '.icon[data-icon-type="more_horiz"]',
    );
    moreIcon.addEventListener('click', () => {
      privates.mainPanelMenu.open(
        (item) => handleMainPanelMenuSelection(this, item),
        { referenceElement: moreIcon },
      );
    });

    initializeStorage(this);
    loadAllStorageData(this);

    const taskCallback = (event) => updateStorage(this, 'task', event);
    privates.tasks.addEventListener('add-task', taskCallback);
    privates.tasks.addEventListener('update-task', taskCallback);
    privates.tasks.addEventListener('delete-task', taskCallback);

    const projCallback = (event) => updateStorage(this, 'project', event);
    privates.projects.addEventListener('add-project', projCallback);
    privates.projects.addEventListener('update-project', projCallback);
    privates.projects.addEventListener('delete-project', projCallback);

    const settingsCallback = (event) => updateStorage(this, 'setting', event);
    privates.settings.addEventListener('update-setting', settingsCallback);

    /* Add random task and project data for testing */
    // TODO: remove
    addRandomData(this, 0, 0);

    updateProjectFilters(this);
    privates.filterMenu.selectFilter('default', 'all');
  }

  /**
   * Convert data to an object suitable for serialization.
   * @returns {Object} An object representing serializable data for the class.
   */
  toJSON() {
    const privates = privateMembers.get(this);

    return {
      app: {
        name: APP_NAME,
        version: APP_VERSION,
      },
      settings: privates.settings,
      tasks: privates.tasks,
      projects: privates.projects,
    };
  }
}

export default App;
