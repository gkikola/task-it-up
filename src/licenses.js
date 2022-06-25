import './styles/reset.css';
import './styles/licenses.css';

function createPage(parent) {
  const content = document.createElement('div');
  content.classList.add('content');
  parent.appendChild(content);

  const header = document.createElement('h1');
  header.textContent = 'Licenses';
  content.appendChild(header);
}

createPage(document.body);
