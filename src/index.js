import './styles/reset.css';
import './styles/main.css';

function createHeader() {
  const header = document.createElement('header');
  header.id = 'header';

  return header;
}

function createSidePanel() {
  const panel = document.createElement('aside');
  panel.id = 'side-panel';

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
