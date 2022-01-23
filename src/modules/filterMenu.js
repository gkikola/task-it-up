/**
 * Defines the [FilterMenu]{@link module:filterMenu~FilterMenu} class.
 * @module filterMenu
 */

import _ from 'lodash';
import EventEmitter from 'events';

import Collapsible from './collapsible';
import { createIconButton } from './utility';

const ICON_EXPANDED = 'expand_more';
const ICON_COLLAPSED = 'chevron_right';

/**
 * Object holding private members for the
 * [FilterMenu]{@link module:filterMenu~FilterMenu} class.
 * @typedef {Object} module:filterMenu~FilterMenu~privates
 * @property {HTMLElement} container The DOM element that contains the menu.
 * @property {module:filterMenu~FilterMenu~filterInfo} selectedFilter Describes
 *   the currently selected task filter, if any.
 * @property {Map} groupElements A map associating filter group identifiers to
 *   [groupElements]{@link module:filterMenu~FilterMenu~groupElements} objects.
 * @property {EventEmitter} eventEmitter Holds the event emitter. The event
 *   emitter dispatches events to any attached event listeners.
 */

/**
 * Holds privates data for the [FilterMenu]{@link module:filterMenu~FilterMenu}
 * class.
 * @type {WeakMap}
 * @see module:filterMenu~FilterMenu~privates
 */
const privateMembers = new WeakMap();

/**
 * Get the [groupElements]{@link module:filterMenu~FilterMenu~groupElements}
 * object associated with a filter group.
 * @param {module:filterMenu~FilterMenu} instance The class instance on which
 *   to apply the function.
 * @param {string} groupId The identifier for the group whose elements are to
 *   be retrieved.
 * @return {module:filterMenu~FilterMenu~groupElements} The object containing
 *   the group's DOM elements.
 * @throws {RangeError} If the given group identifier is invalid.
 */
function getGroupElements(instance, groupId) {
  const elements = privateMembers.get(instance).groupElements.get(groupId);
  if (!elements) {
    throw new RangeError(`Cannot locate filter group "${groupId}"`);
  }
  return elements;
}

/**
 * Get the list item element in the DOM belonging to a particular filter.
 * @param {module:filterMenu~FilterMenu} instance The class instance on which
 *   to apply the function.
 * @param {string} groupId The identifier for the group containing the
 *   filter.
 * @param {string} filterId The identifier for the filter.
 * @returns {HTMLElement} The list item element for the filter.
 * @throws {RangeError} If either the group or filter identifiers are
 *   invalid.
 */
function getFilterItemElement(instance, groupId, filterId) {
  const item = getGroupElements(instance, groupId).filterItems.get(filterId);
  if (!item) {
    throw new RangeError(`Cannot locate filter "${filterId}" in group `
      + `"${groupId}"`);
  }
  return item;
}

/**
 * Clear the filter selection, but do so without firing any events.
 * @param {module:filterMenu~FilterMenu} instance The class instance on which
 *   to apply the function.
 */
function silentClearSelection(instance) {
  const privates = privateMembers.get(instance);
  if (privates.selectedFilter.group && privates.selectedFilter.filter) {
    const listItem = getFilterItemElement(
      instance,
      privates.selectedFilter.group,
      privates.selectedFilter.filter,
    );
    listItem.classList.remove('selected');
  }

  privates.selectedFilter.group = null;
  privates.selectedFilter.filter = null;
}

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
   * Identifies a task filter in the menu.
   * @typedef {Object} module:filterMenu~FilterMenu~filterInfo
   * @property {string} [group] The identifier for the filter group
   *   containing the filter.
   * @property {string} [filter] The identifier for the filter.
   */

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
    const privates = {
      container: null,
      selectedFilter: { group: null, filter: null },
      groupElements: new Map(),
      eventEmitter: new EventEmitter(),
    };
    privateMembers.set(this, privates);

    privates.container = document.createElement('div');
    privates.container.classList.add('filter-menu');

    if (groups) {
      groups.forEach((group) => this.addGroup(group.id, group.label));
    }

    parent.appendChild(privates.container);
  }

  /**
   * Add a filter group to the menu.
   * @param {string} id The unique identifier of the group.
   * @param {string} [label] The displayed label for the group. If not given,
   *   the group will have no heading and will not be collapsible.
   */
  addGroup(id, label) {
    const privates = privateMembers.get(this);

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

    privates.groupElements.set(id, {
      container: groupContainer,
      expandIcon: arrow,
      collapsible,
      filterList: list,
      filterItems: new Map(),
    });

    if (toggle) toggle.addEventListener('click', () => this.toggleGroup(id));

    privates.container.appendChild(groupContainer);
  }

  /**
   * Add a filter to the menu.
   * @param {string} groupId The identifier of the group in which to insert the
   *   filter.
   * @param {string} filterId The identifier for the filter.
   * @param {string} label The displayed label for the filter.
   * @param {Object} [options={}] An object holding options controlling the
   *   filter insertion.
   * @param {number} [options.count=0] The number of tasks matching the filter.
   * @param {string} [options.insertBefore] The identifier for the filter
   *   before which the new filter should be inserted. If not given, then the
   *   filter will be inserted at the end of the list.
   * @throws {RangeError} If the group identifier is invalid.
   */
  addFilter(groupId, filterId, label, options = {}) {
    const groupElements = getGroupElements(this, groupId);

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
    countElem.textContent = options.count || '';
    button.appendChild(countElem);

    let referenceNode = null;
    if (options.insertBefore) {
      referenceNode = getFilterItemElement(this, groupId, options.insertBefore);
    }

    groupElements.filterList.insertBefore(item, referenceNode);
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
    const privates = privateMembers.get(this);

    // If filter is selected, clear selection
    if (privates.selectedFilter.group === groupId
      && privates.selectedFilter.filter === filterId) {
      this.clearSelection();
    }

    const groupElements = getGroupElements(this, groupId);
    const item = getFilterItemElement(this, groupId, filterId);
    groupElements.filterList.removeChild(item);
    groupElements.filterItems.delete(filterId);
    groupElements.collapsible?.update();
  }

  /**
   * Remove all the filters in a filter group.
   * @param {string} id The identifier for the group to empty.
   * @throws {RangeError} If the group identifier is invalid.
   */
  removeAllFilters(id) {
    // If a filter in the group is selected, clear selection
    if (privateMembers.get(this).selectedFilter.group === id) {
      this.clearSelection();
    }

    const groupElements = getGroupElements(this, id);
    const list = groupElements.filterList;
    groupElements.filterItems.forEach((item) => list.removeChild(item));
    groupElements.filterItems.clear();
    groupElements.collapsible?.update();
  }

  /**
   * Determine whether or not a filter exists in a filter group. This method
   * will return false if either the group does not exist, or if the filter
   * does not exist within the group.
   * @param {string} groupId The identifier of the group containing the filter.
   * @param {string} filterId The identifier of the filter to test.
   * @returns {boolean} True if the given group and filter exist in the filter
   *   menu.
   */
  hasFilter(groupId, filterId) {
    const groupElements = privateMembers.get(this).groupElements.get(groupId);
    return groupElements ? groupElements.filterItems.has(filterId) : false;
  }

  /**
   * Expand a filter group, so that its filter items are visible.
   * @param {string} id The identifier for the group to be expanded.
   * @throws {RangeError} If the group identifier is invalid.
   */
  expandGroup(id) {
    const elements = getGroupElements(this, id);
    const { collapsible } = elements;
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
    const elements = getGroupElements(this, id);
    const { collapsible } = elements;
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
    const elements = getGroupElements(this, id);
    const { collapsible } = elements;
    if (collapsible) {
      if (collapsible.collapsed) this.expandGroup(id);
      else this.collapseGroup(id);
    }
  }

  /**
   * Add an icon button to a group heading.
   * @param {string} groupId The identifier of the group in which to insert the
   *   icon button.
   * @param {string} iconType The type of icon to display.
   * @param {Object} [options={}] An object holding configuration options for
   *   the button.
   * @param {string} [id] The identifier for the button.
   * @param {string} [title] The title of the button, usually displayed by the
   *   browser as a tooltip.
   * @param {Function} [callback] A callback function that will be invoked when
   *   the button is clicked. The function will receive the standard Event
   *   object as an argument when invoked.
   * @throws {RangeError} If the group identifier is invalid.
   */
  addGroupIconButton(groupId, iconType, options = {}) {
    const { container } = getGroupElements(this, groupId);
    const iconContainer = container.querySelector('.icon-container');
    const button = createIconButton(iconType, {
      id: options.id || null,
      title: options.title || null,
    });
    if (options.callback) button.addEventListener('click', options.callback);

    iconContainer.appendChild(button);
  }

  /**
   * Select a filter in the menu.
   * @param {string} groupId The identifier for the group containing the filter
   *   to be selected.
   * @param {string} filterId The identifier for the filter to be selected.
   * @fires module:filterMenu~FilterMenu~selectFilter
   */
  selectFilter(groupId, filterId) {
    const privates = privateMembers.get(this);
    silentClearSelection(this);

    const listItem = getFilterItemElement(this, groupId, filterId);
    listItem.classList.add('selected');
    privates.selectedFilter.group = groupId;
    privates.selectedFilter.filter = filterId;
    const { filterLabel } = listItem.dataset;
    privates.eventEmitter.emit('select-filter', {
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
    silentClearSelection(this);
    privateMembers.get(this).eventEmitter.emit('select-filter', {
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
    return _.cloneDeep(privateMembers.get(this).selectedFilter);
  }

  /**
   * Add an event listener to the menu.
   * @param {string} type The type of event to listen for.
   * @param {Function} listener The event listener to be called when the event
   *   is fired.
   */
  addEventListener(type, listener) {
    privateMembers.get(this).eventEmitter.on(type, listener);
  }
}

export default FilterMenu;
