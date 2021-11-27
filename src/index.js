import './styles/reset.css';
import './styles/main.css';
import { createFilterList } from './modules/filterList';

const APP_NAME = 'Task It Up';
const APP_AUTHOR = 'Greg Kikola';
const APP_AUTHOR_WEBSITE = 'https://www.gregkikola.com/';
const APP_COPYRIGHT_YEARS = '2021';

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

function createSidePanel() {
  const panel = document.createElement('aside');
  panel.id = 'side-panel';

  const listContainer = document.createElement('div');
  listContainer.classList.add('list-container');
  listContainer.appendChild(createFilterList('Dates', 'date-filter-list'));
  listContainer.appendChild(createFilterList('Projects',
                                             'project-filter-list'));

  panel.appendChild(listContainer);

  return panel;
}

function createMainPanel() {
  const panel = document.createElement('main');
  panel.id = 'main-panel';

  return panel;
}

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

function createApp() {
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

document.body.appendChild(createApp());
