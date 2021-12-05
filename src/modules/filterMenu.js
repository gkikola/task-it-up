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
   * @param {string} groups[].label The displayed label for the filter group.
   */
  constructor(parent, groups) {
    /**
     * The DOM element that contains the menu.
     * @type {HTMLElement}
     */
    this._container = document.createElement('div');
    this._container.classList.add('filter-menu');

    /**
     * A task filter.
     * @typedef {Object} module:filterMenu~FilterMenu~filter
     * @property {string} id The identifier of the filter. This ID should be
     *   unique among filters belonging to the same group, but not necessarily
     *   among all filters.
     * @property {string} label The displayed label for the filter.
     */

    /**
     * A group of task filters.
     * @typedef {Object} module:filterMenu~FilterMenu~filterGroup
     * @property {string} id The unique identifier of the group.
     * @property {string} label The displayed label for the group.
     * @property {filter[]} filters The array of task filters.
     * @property {boolean} expanded Indicates whether the group is expanded
     *   (its filters visible) or collapsed (its filters hidden).
     */

    /**
     * A list of filter groups.
     * @type {module:filterMenu~FilterMenu~filterGroup[]}
     */
    this._groups = [];

    parent.appendChild(this._container);
  }

  /**
   * Add a filter group to the menu.
   * @param {string} id The unique identifier of the group.
   * @param {string} [label] The displayed label for the group. If not given,
   *   the group will have no heading and will not be collapsible.
   */
  addGroup(id, label) {
    this._groups.push({ id, label, filters: [] });

    const groupContainer = document.createElement('div');
    groupContainer.classList.add('filter-group');
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
}

export default FilterMenu;
