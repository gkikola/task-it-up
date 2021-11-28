function createFilterList(id, type) {
  const list = document.createElement('ul');
  list.id = id;
  list.classList.add('filter-list');
  list.dataset.type = type;

  return list;
}

function createFilterListHeading(label, buttons = null) {
  const container = document.createElement('div');
  container.classList.add('filter-list-heading-container');

  const heading = document.createElement('h2');
  heading.classList.add('filter-list-heading');
  heading.textContent = label;
  container.appendChild(heading);

  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('filter-list-button-container');

  if (buttons) {
    buttons.forEach(button => {
      const icon = document.createElement('div');
      icon.classList.add('icon');
      icon.classList.add('material-icons');
      icon.textContent = button.label;
      buttonContainer.appendChild(icon);
    });
  }

  container.appendChild(buttonContainer);
  return container;
}

function addFilter(list, id, label) {
  const listItem = document.createElement('li');
  listItem.classList.add('filter-list-item');
  listItem.dataset.id = id;
  listItem.dataset.type = list.dataset.type;
  listItem.textContent = label;
  list.appendChild(listItem);
}

function updateFilter(list, id, label) {
  for (let listItem of list.children) {
    if (listItem.dataset.id === id) {
      listItem.textContent = label;
      break;
    }
  }
}

export { createFilterList, createFilterListHeading, addFilter, updateFilter };
