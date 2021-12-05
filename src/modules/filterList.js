/**
 * Defines functions for managing lists of task filters in the DOM.
 * @module filterList
 */

/**
 * Create an empty filter list.
 * @param {string} id The unique identifier of the list.
 * @param {string} type The type of the list. This string is stored in the
 *   "data-type" attribute of the list element and in its list item elements.
 * @returns {HTMLElement} The newly-created list element.
 */
export function createFilterList(id, type) {
  const list = document.createElement('ul');
  list.id = id;
  list.classList.add('filter-list');
  list.dataset.type = type;

  return list;
}

/**
 * Create a heading label for a filter list, with optional buttons to control
 * the list.
 * @param {string} label The text label used for the heading.
 * @param {Object[]} [buttons] An array of buttons to add next the heading.
 * @param {string} buttons[].label The label for the button.
 * @returns {HTMLElement} The heading element.
 */
export function createFilterListHeading(label, buttons) {
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

/**
 * Add a filter item to a filter list.
 * @param {HTMLElement} list The DOM list element where the item is to be
 *   added.
 * @param {string} id The identifier of the list item, stored as a custom data
 *   attribute.
 * @param {string} label The filter's displayed name, used as the item label.
 */
export function addFilter(list, id, label) {
  const listItem = document.createElement('li');
  listItem.classList.add('filter-list-item');
  listItem.dataset.id = id;
  listItem.dataset.type = list.dataset.type;
  listItem.textContent = label;
  list.appendChild(listItem);
}

/**
 * Update the label for a filter in a filter list.
 * @param {HTMLElement} list The list element containing the filter item.
 * @param {string} id The identifier of the list item to update.
 * @param {string} label The new label to use for the filter.
 */
export function updateFilter(list, id, label) {
  for (let listItem of list.children) {
    if (listItem.dataset.id === id) {
      listItem.textContent = label;
      break;
    }
  }
}

/**
 * Select a filter in a filter list. The 'selected' class is applied to the
 * list item, and any previously selected filter in the list is unselected. If
 * the given ID is null or undefined, then the selection is cleared and no
 * filter is selected.
 * @param {HTMLElement} list The list element where the selection is to be
 *   made.
 * @param {string} [id] The identifier of the filter to select. If not given,
 *   then the selection is cleared.
 */
export function selectFilter(list, id) {
  for (let listItem of list.children) {
    if (listItem.dataset.id === id)
      listItem.classList.add('selected');
    else if (listItem.classList.contains('selected'))
      listItem.classList.remove('selected');
  }
}
