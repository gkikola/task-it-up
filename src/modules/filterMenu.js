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
    groupContainer.classList.add('expanded');
    groupContainer.dataset.groupId = id;

    if (label) {
      const heading = document.createElement('div');
      heading.classList.add('filter-group-heading');
      groupContainer.appendChild(heading);

      const toggle = document.createElement('button');
      toggle.classList.add('filter-group-toggle');
      heading.appendChild(toggle);

      const buttonContainer = document.createElement('div');
      buttonContainer.classList.add('filter-group-button-container');
      heading.appendChild(buttonContainer);

      const arrow = document.createElement('span');
      arrow.classList.add('icon');
      arrow.classList.add('material-icons');
      arrow.classList.add('filter-group-expand-icon');
      arrow.textContent = ICON_EXPANDED;
      toggle.appendChild(arrow);

      const text = document.createElement('span');
      text.classList.add('filter-group-label');
      text.textContent = label;
      toggle.appendChild(text);
    }

    const list = document.createElement('ul');
    list.classList.add('filter-list');
    groupContainer.appendChild(list);

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
    const selector = `.filter-group[data-group-id="${groupId}"] .filter-list`;
    const list = this._container.querySelector(selector);

    if (!list)
      throw new RangeError(`Could not locate filter group "${groupId}"`);

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

export default FilterMenu;
