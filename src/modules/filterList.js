function createFilterList(label, id) {
  const container = document.createElement('div');

  const heading = document.createElement('h2');
  heading.classList.add('filter-list-heading');
  heading.textContent = label;
  container.appendChild(heading);

  const list = document.createElement('ul');
  list.id = id;
  list.classList.add('filter-list');
  container.appendChild(list);

  return container;
}

export { createFilterList };
