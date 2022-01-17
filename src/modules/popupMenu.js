/**
 * Defines the [PopupMenu]{@link module:popupMenu~PopupMenu} class.
 * @module popupMenu
 */

/**
 * A popup menu.
 */
class PopupMenu {
  /**
   * A menu item in the popup.
   * @typedef {Object} module:popupMenu~PopupMenu~menuItem
   * @property {string} label The text label that will be displayed in the
   *   menu.
   * @property {string} id An identifier for the menu item. This will be passed
   *   to callbacks.
   * @property {string} [iconType] The type of icon to display. This indicates
   *   the icon to use from the Google Material Icons font.
   */

  /**
   * Create a popup menu.
   * @param {HTMLElement} [parent=document.body] The parent element in the DOM
   *   under which the popup menu should be inserted.
   * @param {module:popupMenu~PopupMenu~menuItem[]} menuItems An array of
   *   objects specifying the items in the menu.
   */
  constructor(parent = document.body, menuItems) {
    /**
     * The parent element in the DOM under which the popup menu should be
     * inserted.
     * @type {HTMLElement}
     */
    this._parent = parent;

    /**
     * An array of objects specifying the items in the menu.
     * @type {module:popupMenu~PopupMenu~menuItem[]}
     */
    this._menuItems = menuItems;

    /**
     * The container element holding the menu. Will be null when the menu is
     * hidden.
     * @type {?HTMLElement}
     */
    this._container = null;
  }
}

export default PopupMenu;
