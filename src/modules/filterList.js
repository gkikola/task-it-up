function createFilterList(label, id, type, filters = null) {
  const container = document.createElement('div');

  const heading = document.createElement('h2');
  heading.classList.add('filter-list-heading');
  heading.textContent = label;
  container.appendChild(heading);

  const list = document.createElement('ul');
  list.id = id;
  list.classList.add('filter-list');
  list.dataset.type = type;
  container.appendChild(list);

  if (filters) {
    filters.forEach(filter => {
      addFilter(list, filter.id, filter.label);
    });
  }

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

export { createFilterList, addFilter, updateFilter };
