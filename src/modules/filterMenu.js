/**
 * Defines the [FilterMenu]{@link module:filterMenu~FilterMenu} class.
 * @module filterMenu
 */

const ICON_EXPANDED = 'expand_more';
const ICON_COLLAPSED = 'chevron_right';

/**
 * A customizable menu of task filters.
 */
class FilterMenu {
  /**
   * Create a filter menu and add it to the DOM.
   * @param {HTMLElement} parent The parent DOM node that will contain the
   *   menu.
   * @param {Object[]} [groups] An array of filter groups to add to the menu.
   * @param {string} groups[].id The identifier of the filter group.
   * @param {string} [groups[].label] The displayed label for the filter group.
   *   If not given, the group will have no heading and will not be
   *   collapsible.
   */
  constructor(parent, groups) {
    /**
     * The DOM element that contains the menu.
     * @type {HTMLElement}
     */
    this._container = document.createElement('div');
    this._container.classList.add('filter-menu');

    if (groups)
      groups.forEach(group => this.addGroup(group.id, group.label));

    parent.appendChild(this._container);
  }

  /**
   * Add a filter group to the menu.
   * @param {string} id The unique identifier of the group.
   * @param {string} [label] The displayed label for the group. If not given,
   *   the group will have no heading and will not be collapsible.
   */
  addGroup(id, label) {
    const groupContainer = document.createElement('div');
    groupContainer.classList.add('filter-group');
    groupContainer.dataset.groupId = id;

    let toggle = null;
    let arrow = null;
    if (label) {
      const heading = document.createElement('div');
      heading.classList.add('filter-group-heading');
      groupContainer.appendChild(heading);

      toggle = document.createElement('button');
      toggle.classList.add('filter-group-toggle');
      heading.appendChild(toggle);

      const buttonContainer = document.createElement('div');
      buttonContainer.classList.add('filter-group-button-container');
      heading.appendChild(buttonContainer);

      arrow = document.createElement('span');
      arrow.classList.add('icon', 'material-icons', 'filter-group-expand-icon');
      arrow.textContent = ICON_COLLAPSED;
      toggle.appendChild(arrow);

      const text = document.createElement('span');
      text.classList.add('filter-group-label');
      text.textContent = label;
      toggle.appendChild(text);
    }

    const collapsible = document.createElement('div');
    collapsible.classList.add('collapsible', 'collapsed');
    groupContainer.appendChild(collapsible);

    const list = document.createElement('ul');
    list.classList.add('filter-list');
    collapsible.appendChild(list);

    if (toggle) {
      toggle.addEventListener('click', e => {
        const collapsed = collapsible.classList.toggle('collapsed');
        recalcCollapsibleHeight(collapsible);
        arrow.textContent = collapsed ? ICON_COLLAPSED : ICON_EXPANDED;
      });
    }

    this._container.appendChild(groupContainer);
  }

  /**
   * Add a filter to the menu.
   * @param {string} groupId The identifier of the group in which to insert the
   *   filter.
   * @param {string} filterId The identifier for the filter.
   * @param {string} label The displayed label for the filter.
   * @param {number} [count=0] The number of tasks matching the filter.
   */
  addFilter(groupId, filterId, label, count = 0) {
    const selector = `.filter-group[data-group-id="${groupId}"] .collapsible`;
    const collapsible = this._container.querySelector(selector);
    if (!collapsible)
      throw new RangeError(`Could not locate filter group "${groupId}"`);

    const list = collapsible.firstChild;
    if (!list)
      throw new RangeError('No list element found for filter group '
        + `"${groupId}"`);

    const item = document.createElement('li');
    item.classList.add('filter-item');
    item.dataset.filterId = filterId;

    const labelElem = document.createElement('div');
    labelElem.classList.add('filter-item-label');
    labelElem.textContent = label;
    item.appendChild(labelElem);

    const countElem = document.createElement('div');
    countElem.classList.add('filter-item-count');
    countElem.textContent = (count > 0) ? count : '';
    item.appendChild(countElem);

    list.appendChild(item);

    recalcCollapsibleHeight(collapsible);
  }

  /**
   * Remove a filter from the menu.
   * @param {string} groupId The identifier of the group containing the filter.
   * @param {string} filterId The identifier of the filter to remove.
   */
  removeFilter(groupId, filterId) {
    const item = this._getFilterElement(groupId, filterId);
    item.parentNode.removeChild(item);
  }

  /**
   * Retrieve the list item element for a given filter.
   * @param {string} groupId The identifier of the group containing the filter.
   * @param {string} filterId The identifier of the filter.
   * @returns {HTMLElement} The filter list item.
   */
  _getFilterElement(groupId, filterId) {
    const selector = `.filter-group[data-group-id="${groupId}"] `
      + `.filter-item[data-filter-id="${filterId}"]`;
    const element = this._container.querySelector(selector);

    if (!element)
      throw new RangeError(`Could not locate filter "${filterId}" `
        + `in group "${groupId}"`);

    return element;
  }
}

/**
 * Sets the height of a collapsible container according to its collapsed
 * state and child height.
 * @param {HTMLElement} collapsible The collapsible container element.
 */
function recalcCollapsibleHeight(collapsible) {
  const child = collapsible.firstChild;

  if (child) {
    const collapsed = collapsible.classList.contains('collapsed');
    collapsible.style.height = collapsed ? '0' : `${child.offsetHeight}px`;
  } else {
    collapsible.style.height = '0';
  }
}

export default FilterMenu;
