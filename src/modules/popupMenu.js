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
   * An object describing how the popup should be positioned.
   * @typedef {Object} module:popupMenu~PopupMenu~position
   * @property {number|string} [left=0] The position of the left side of the
   *   popup, relative to the left edge of the document. This can be a number,
   *   representing a distance in pixels, or a string holding a CSS length or
   *   percentage. This property is ignored if the referenceElement property is
   *   set.
   * @property {number|string} [top=0] The position of the top of the popup,
   *   relative to the top of the document. This can be a number, representing
   *   a distance in pixels, or a string holding a CSS length or percentage.
   *   This property is ignored if the referenceElement property is set.
   * @property {HTMLElement} [referenceElement] An element in the DOM whose
   *   position is to be used for determining the position of the popup. If
   *   given, the popup will be positioned just underneath the element.
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
    this._parent = parent || document.body;

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

    /**
     * An event listener to monitor document-wide mouse and keyboard events.
     * Needs to be stored so that it can be later removed.
     * @type {Function}
     * @param {Event} e An object describing the event that has occurred.
     */
    this._eventListener = e => this._handleEvent(e);
  }

  /**
   * Open the popup menu at a particular position.
   * @param {module:popupMenu~PopupMenu~position} position An object specifying
   *   the position in the document at which to place the menu.
   */
  open(position) {
    if (this._container)
      this.close();

    const menu = document.createElement('div');
    menu.classList.add('popup-menu');

    const list = document.createElement('ul');
    menu.appendChild(list);
    this._menuItems.forEach((item, index) => {
      const listItem = document.createElement('li');
      listItem.classList.add('popup-menu-item');
      listItem.dataset.index = index.toString();
      list.appendChild(listItem);

      const icon = document.createElement('div');
      icon.classList.add('icon', 'material-icons', 'popup-menu-item-icon');
      icon.textContent = item.iconType;
      listItem.appendChild(icon);

      const label = document.createElement('div');
      label.classList.add('popup-menu-item-label');
      label.textContent = item.label;
      listItem.appendChild(label);
    });

    this._container = menu;
    this._parent.appendChild(menu);

    document.addEventListener('mousedown', this._eventListener);
    document.addEventListener('keydown', this._eventListener);
  }

  /**
   * Close the popup menu if it is open.
   */
  close() {
    if (this._container) {
      this._parent.removeChild(this._container);
      this._container = null;
      document.removeEventListener('keydown', this._eventListener);
      document.removeEventListener('mousedown', this._eventListener);
    }
  }

  /**
   * Handle a mouse or keyboard event.
   * @param {Event} e An object describing the event that occurred.
   */
  _handleEvent(e) {
    switch (e.type) {
      case 'mousedown':
        // Close popup if mouse was clicked outside
        if (!this._container.contains(e.target))
          this.close();
        break;
      case 'keydown':
        if (e.key === 'Escape' || e.key === 'Esc' || e.key === 'Tab')
          this.close();
        break;
    }
  }
}

export default PopupMenu;
