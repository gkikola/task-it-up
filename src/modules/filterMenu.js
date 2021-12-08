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

    /**
     * Holds references to DOM elements related to a particular filter group in
     * the filter menu.
     * @typedef {Object} module:filterMenu~FilterMenu~groupElements
     * @property {HTMLElement} container The container element for the group.
     * @property {HTMLElement} [expandIcon] The expand/collapse icon element in
     *   the group heading (if any).
     * @property {HTMLElement} collapsible The collapsible container for the
     *   group's filter list.
     * @property {HTMLElement} filterList The list element containing the
     *   filter items belonging to the group.
     * @property {Map} filterItems A map associating filter identifiers to the
     *   list item elements in the DOM belonging to each filter item in the
     *   group.
     */

    /**
     * A map associating filter group identifiers to
     * [groupElements]{@link module:filterMenu~FilterMenu~groupElements}
     * objects.
     * @type {Map}
     */
    this._groupElements = new Map();

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

    this._groupElements.set(id, {
      container: groupContainer,
      expandIcon: arrow,
      collapsible,
      filterList: list,
      filterItems: new Map(),
    });

    if (toggle) {
      toggle.addEventListener('click', e => {
        const collapsed = collapsible.classList.toggle('collapsed');
        this._recalcCollapsibleHeight(id);
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
   * @throws {RangeError} If the group identifier is invalid.
   */
  addFilter(groupId, filterId, label, count = 0) {
    const groupElements = this._getGroupElements(groupId);

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

    groupElements.filterList.appendChild(item);
    groupElements.filterItems.set(filterId, item);

    this._recalcCollapsibleHeight(groupId);
  }

  /**
   * Remove a filter from the menu.
   * @param {string} groupId The identifier of the group containing the filter.
   * @param {string} filterId The identifier of the filter to remove.
   * @throws {RangeError} If either the group or filter identifiers are
   *   invalid.
   */
  removeFilter(groupId, filterId) {
    const groupElements = this._getGroupElements(groupId);
    const item = this._getFilterItemElement(groupId, filterId);
    groupElements.filterList.removeChild(item);
    groupElements.filterItems.delete(filterId);
  }

  /**
   * Get the [groupElements]{@link module:filterMenu~FilterMenu~groupElements}
   * object associated with a filter group.
   * @param {string} groupId The identifier for the group whose elements are to
   *   be retrieved.
   * @return {module:filterMenu~FilterMenu~groupElements} The object containing
   *   the group's DOM elements.
   * @throws {RangeError} If the given group identifier is invalid.
   */
  _getGroupElements(groupId) {
    const elements = this._groupElements.get(groupId);
    if (!elements)
      throw new RangeError(`Cannot locate filter group "${groupId}"`);
    return elements;
  }

  /**
   * Get the list item element in the DOM belonging to a particular filter.
   * @param {string} groupId The identifier for the group containing the
   *   filter.
   * @param {string} filterId The identifier for the filter.
   * @returns {HTMLElement} The list item element for the filter.
   * @throws {RangeError} If either the group or filter identifiers are
   *   invalid.
   */
  _getFilterItemElement(groupId, filterId) {
    const item = this._getGroupElements(groupId).filterItems.get(filterId);
    if (!item)
      throw new RangeError(`Cannot locate filter "${filterId}" in group `
        + `"${groupId}"`);
    return item;
  }

  /**
   * Set the height of a filter group's collapsible container according to the
   * collapsed state and list height.
   * @param {string} groupId The identifier for the group to which the
   *   collapsible container is associated.
   * @throws {RangeError} If the group identifier is invalid.
   */
  _recalcCollapsibleHeight(groupId) {
    const elements = this._getGroupElements(groupId);
    const collapsible = elements.collapsible;
    const list = elements.filterList;

    const collapsed = collapsible.classList.contains('collapsed');
    collapsible.style.height = collapsed ? '0' : `${list.offsetHeight}px`;
  }
}

export default FilterMenu;
