/**
 * Defines the [FilterMenu]{@link module:filterMenu~FilterMenu} class.
 * @module filterMenu
 */

import Collapsible from './collapsible';

import _ from 'lodash';
import EventEmitter from 'events';

const ICON_EXPANDED = 'expand_more';
const ICON_COLLAPSED = 'chevron_right';

/**
 * A customizable menu of task filters.
 */
class FilterMenu {
  /**
   * Event that is fired when a filter item is selected, or when the selection
   * is cleared.
   * @event module:filterMenu~FilterMenu~selectFilter
   * @type {Object}
   * @property {string} type The event type: select-filter.
   * @property {module:filterMenu~FilterMenu} target The filter menu that fired
   *   the event.
   * @property {string} [groupId] The identifier for the filter group
   *   containing the selected filter, if any.
   * @property {string} [filterId] The identifier for the filter that was
   *   selected, if any.
   * @property {string} [filterLabel] The displayed label for the filter that
   *   was selected, if any.
   */

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
     * Identifies a task filter in the menu.
     * @typedef {Object} module:filterMenu~FilterMenu~filterInfo
     * @property {string} [group] The identifier for the filter group
     *   containing the filter.
     * @property {string} [filter] The identifier for the filter.
     */

    /**
     * Describes the currently selected task filter, if any.
     * @type {module:filterMenu~FilterMenu~filterInfo}
     */
    this._selectedFilter = { group: null, filter: null };

    /**
     * Holds references to DOM elements related to a particular filter group in
     * the filter menu.
     * @typedef {Object} module:filterMenu~FilterMenu~groupElements
     * @property {HTMLElement} container The container element for the group.
     * @property {HTMLElement} [expandIcon] The expand/collapse icon element in
     *   the group heading (if any).
     * @property {module:collapsible~Collapsible} [collapsible] The collapsible
     *   panel containing the group's filter list. If the group cannot be
     *   collapsed, this should be null.
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

    /**
     * Holds the event emitter. The event emitter dispatches events to any
     * attached event listeners.
     * @type {EventEmitter}
     */
    this._eventEmitter = new EventEmitter();

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

      const iconContainer = document.createElement('div');
      iconContainer.classList.add('icon-container');
      heading.appendChild(iconContainer);

      arrow = document.createElement('span');
      arrow.classList.add('icon', 'material-icons', 'filter-group-expand-icon');
      arrow.textContent = ICON_COLLAPSED;
      toggle.appendChild(arrow);

      const text = document.createElement('span');
      text.classList.add('filter-group-label');
      text.textContent = label;
      toggle.appendChild(text);
    }

    let collapsible;
    let listContainer;
    if (label) {
      collapsible = new Collapsible(groupContainer, null, { collapsed: true });
      listContainer = collapsible.content;
    } else {
      collapsible = null;
      listContainer = groupContainer;
    }

    const list = document.createElement('ul');
    list.classList.add('filter-list');
    listContainer.appendChild(list);

    this._groupElements.set(id, {
      container: groupContainer,
      expandIcon: arrow,
      collapsible,
      filterList: list,
      filterItems: new Map(),
    });

    if (toggle)
      toggle.addEventListener('click', () => this.toggleGroup(id));

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
    item.dataset.filterLabel = label;

    const button = document.createElement('button');
    button.classList.add('filter-item-selector');
    item.appendChild(button);

    const labelElem = document.createElement('span');
    labelElem.classList.add('filter-item-label');
    labelElem.textContent = label;
    button.appendChild(labelElem);

    const countElem = document.createElement('span');
    countElem.classList.add('filter-item-count');
    countElem.textContent = (count > 0) ? count : '';
    button.appendChild(countElem);

    groupElements.filterList.appendChild(item);
    groupElements.filterItems.set(filterId, item);

    groupElements.collapsible?.update();

    button.addEventListener('click', () => {
      this.selectFilter(groupId, filterId);
    });
  }

  /**
   * Remove a filter from the menu.
   * @param {string} groupId The identifier of the group containing the filter.
   * @param {string} filterId The identifier of the filter to remove.
   * @throws {RangeError} If either the group or filter identifiers are
   *   invalid.
   */
  removeFilter(groupId, filterId) {
    // If filter is selected, clear selection
    if (this._selectedFilter.group === groupId
      && this._selectedFilter.filter === filterId)
      this.clearSelection();

    const groupElements = this._getGroupElements(groupId);
    const item = this._getFilterItemElement(groupId, filterId);
    groupElements.filterList.removeChild(item);
    groupElements.filterItems.delete(filterId);
    groupElements.collapsible?.update();
  }

  /**
   * Expand a filter group, so that its filter items are visible.
   * @param {string} id The identifier for the group to be expanded.
   * @throws {RangeError} If the group identifier is invalid.
   */
  expandGroup(id) {
    const elements = this._getGroupElements(id);
    const collapsible = elements.collapsible;
    if (collapsible) {
      collapsible.expand();
      elements.expandIcon.textContent = ICON_EXPANDED;
    }
  }

  /**
   * Collapse a filter group, so that its filter items are hidden.
   * @param {string} id The identifier for the group to be collapsed.
   * @throws {RangeError} If the group identifier is invalid.
   */
  collapseGroup(id) {
    const elements = this._getGroupElements(id);
    const collapsible = elements.collapsible;
    if (collapsible) {
      collapsible.collapse();
      elements.expandIcon.textContent = ICON_COLLAPSED;
    }
  }

  /**
   * Toggle the collapsed state of a filter group. If the group is collapsed,
   * it will be expanded and vice versa.
   * @param {string} id The identifier for the group to expand or collapse.
   * @throws {RangeError} If the group identifier is invalid.
   */
  toggleGroup(id) {
    const elements = this._getGroupElements(id);
    const collapsible = elements.collapsible;
    if (collapsible) {
      if (collapsible.collapsed)
        this.expandGroup(id);
      else
        this.collapseGroup(id);
    }
  }

  /**
   * Select a filter in the menu.
   * @param {string} groupId The identifier for the group containing the filter
   *   to be selected.
   * @param {string} filterId The identifier for the filter to be selected.
   * @fires module:filterMenu~FilterMenu~selectFilter
   */
  selectFilter(groupId, filterId) {
    this._silentClearSelection();

    const listItem = this._getFilterItemElement(groupId, filterId);
    listItem.classList.add('selected');
    this._selectedFilter.group = groupId;
    this._selectedFilter.filter = filterId;
    const filterLabel = listItem.dataset.filterLabel;
    this._eventEmitter.emit('select-filter', {
      type: 'select-filter',
      target: this,
      groupId,
      filterId,
      filterLabel,
    });
  }

  /**
   * Clear the filter selection, so that none of the filters in the menu are
   * selected.
   * @fires module:filterMenu~FilterMenu~selectFilter
   */
  clearSelection() {
    this._silentClearSelection();
    this._eventEmitter.emit('select-filter', {
      type: 'select-filter',
      target: this,
      groupId: null,
      filterId: null,
      filterLabel: null,
    });
  }

  /**
   * Retrieve the task filter that is currently selected in the menu, if any.
   * @returns {module:filterMenu~FilterMenu~filterInfo} An object describing
   *   the selected filter.
   */
  getSelection() {
    return _.cloneDeep(this._selectedFilter);
  }

  /**
   * Add an event listener to the menu.
   * @param {string} type The type of event to listen for.
   * @param {Function} listener The event listener to be called when the event
   *   is fired.
   */
  addEventListener(type, listener) {
    this._eventEmitter.on(type, listener);
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
   * Clear the filter selection, but do so without firing any events.
   */
   _silentClearSelection() {
    if (this._selectedFilter.group && this._selectedFilter.filter) {
      const listItem = this._getFilterItemElement(this._selectedFilter.group,
        this._selectedFilter.filter);
      listItem.classList.remove('selected');
    }

    this._selectedFilter.group = null;
    this._selectedFilter.filter = null;
  }
}

export default FilterMenu;
