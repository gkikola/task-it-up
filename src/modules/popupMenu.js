/**
 * Defines the [PopupMenu]{@link module:popupMenu~PopupMenu} class.
 * @module popupMenu
 */

/**
 * A popup menu.
 */
class PopupMenu {
  /**
   * An object holding configuration options for the popup menu.
   * @typedef {Object} module:popupMenu~PopupMenu~options
   * @property {HTMLElement} [parent=document.body] The parent element in the
   *   DOM under which the popup should be inserted.
   * @property {HTMLElement} [closeIfScrolled] If provided, the popup menu will
   *   be closed when the given element or one of its ancestors is scrolled.
   */

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
   * @property {number} [left=0] The position of the left side of the popup, in
   *   pixels, relative to the left edge of the document. This property is
   *   ignored if the referenceElement property is set.
   * @property {number} [top=0] The position of the top of the popup, in
   *   pixels, relative to the top of the document. This property is ignored if
   *   the referenceElement property is set.
   * @property {HTMLElement} [referenceElement] An element in the DOM whose
   *   position is to be used for determining the position of the popup. If
   *   given, the popup will be positioned just underneath the element.
   */

  /**
   * A callback function that will be invoked when the user selects a menu
   * item.
   * @callback module:popupMenu~PopupMenu~selectionCallback
   * @param itemId The identifier of the menu item that was selected.
   * @param index The index of the menu item that was selected.
   */

  /**
   * Create a popup menu.
   * @param {module:popupMenu~PopupMenu~menuItem[]} menuItems An array of
   *   objects specifying the items in the menu.
   * @param {module:popupMenu~PopupMenu~options} [options={}] An object holding
   *   additional options for the popup menu.
   */
  constructor(menuItems, options = {}) {
    /**
     * The parent element in the DOM under which the popup menu should be
     * inserted.
     * @type {HTMLElement}
     */
    this._parent = options.parent || document.body;

    /**
     * An array of objects specifying the items in the menu.
     * @type {module:popupMenu~PopupMenu~menuItem[]}
     */
    this._menuItems = menuItems;

    /**
     * Holds the index of the active (focused) menu item, if any.
     * @type {?number}
     */
    this._activeItem = null;

    /**
     * The container element holding the menu. Will be null when the menu is
     * hidden.
     * @type {?HTMLElement}
     */
    this._container = null;

    /**
     * Holds the function to be invoked when the user selects a menu item. This
     * will be null when the menu is closed.
     * @type {?module:popupMenu~PopupMenu~selectionCallback}
     */
    this._callback = null;

    /**
     * An event listener to monitor document-wide mouse and keyboard events.
     * Needs to be stored so that it can be later removed.
     * @type {Function}
     * @param {Event} e An object describing the event that has occurred.
     */
    this._eventListener = e => this._handleEvent(e);

    /**
     * An identifier for a timeout used to debounce scroll events for better
     * performance.
     * @type {?number}
     */
    this._scrollTimeout = null;

    /**
     * An element to monitor for scroll events. If the element is scroll, then
     * the popup menu will be closed.
     * @type {?HTMLElement}
     */
    this._scrollTarget = options.closeIfScrolled || null;
  }

  /**
   * Open the popup menu at a particular position.
   * @param {module:popupMenu~PopupMenu~selectionCallback} callback A callback
   *   function that will be invoked when the user chooses a menu item.
   * @param {module:popupMenu~PopupMenu~position} [position] An object
   *   specifying the position in the document at which to place the menu. If
   *   not given, the upper-left corner of the document will be used.
   */
  open(callback, position) {
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

      listItem.addEventListener('click', () => {
        this._selectItem(index);
      });
      listItem.addEventListener('mousemove', () => this._focusItem(index));
    });

    menu.addEventListener('mouseleave', () => this._focusItem(null));

    this._container = menu;
    this._parent.appendChild(menu);
    this._callback = callback;

    this._positionMenu(position);

    document.addEventListener('mousedown', this._eventListener);
    document.addEventListener('keydown', this._eventListener);
    if (this._scrollTarget)
      document.addEventListener('scroll', this._eventListener, true);
  }

  /**
   * Close the popup menu if it is open.
   */
  close() {
    if (this._container) {
      this._parent.removeChild(this._container);
      this._container = null;
      this._callback = null;
      document.removeEventListener('mousedown', this._eventListener);
      document.removeEventListener('keydown', this._eventListener);
      if (this._scrollTarget)
        document.removeEventListener('scroll', this._eventListener, true);
    }
  }

  /**
   * Select an item in the menu.
   * @param {number} index The index of the menu item.
   */
  _selectItem(index) {
    this._callback(this._menuItems[index].id, index);
    this.close();
  }

  /**
   * Get the list item HTML element for a menu item.
   * @param {number} index The index of the menu item to find.
   * @returns {?HTMLElement} The list item element if it exists, or null if it
   *   does not.
   */
  _getItem(index) {
    const selector = `.popup-menu-item[data-index="${index}"]`;
    return this._container.querySelector(selector);
  }

  /**
   * Focus an item in the menu.
   * @param {?number} index The index of the menu item to focus. If set to
   *   null, then no focus will be set and any existing focus is cleared.
   */
  _focusItem(index) {
    if (index === this._activeItem)
      return;

    if (this._activeItem !== null) {
      const item = this._getItem(this._activeItem);
      if (item)
        item.classList.remove('active');
      this._activeItem = null;
    }

    if (typeof index === 'number') {
      const item = this._getItem(index);
      if (item) {
        this._activeItem = index;
        item.classList.add('active');
      }
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
      case 'keydown': {
        let preventDefault = true;
        switch (e.key) {
          case 'Escape':
          case 'Esc':
          case 'Tab':
            this.close();
            break;
          case 'Enter':
          case ' ':
          case 'Spacebar':
            if (this._activeItem !== null)
              this._selectItem(this._activeItem);
            break;
          case 'ArrowUp':
          case 'Up': {
            const active = this._activeItem;
            const itemCount = this._menuItems.length;
            let index = null;
            if (active !== null)
              index = active > 0 ? active - 1 : itemCount - 1;
            else if (itemCount > 0)
              index = itemCount - 1;
            this._focusItem(index);
            break;
          }
          case 'ArrowDown':
          case 'Down': {
            const active = this._activeItem;
            const itemCount = this._menuItems.length;
            let index = null;
            if (active !== null)
              index = active < itemCount - 1 ? active + 1 : 0;
            else if (itemCount > 0)
              index = 0;
            this._focusItem(index);
            break;
          }
          default:
            preventDefault = false;
            break;
        }
        if (preventDefault)
          e.preventDefault();
        break;
      }
      case 'scroll': {
        if (this._scrollTimeout)
          clearTimeout(this._scrollTimeout);

        this._scrollTimeout = setTimeout(() => {
          this._scrollTimeout = null;
          if (e.target.contains(this._scrollTarget))
            this.close();
        }, 100);
        break;
      }
    }
  }

  /**
   * Position the popup menu at a particular location.
   * @param {module:popupMenu~PopupMenu~position} [position={}] An object
   *   specifying the position in the document at which to place the menu.
   */
  _positionMenu(position = {}) {
    const width = this._container.offsetWidth;
    const height = this._container.offsetHeight;

    let left = 0, top = 0;
    if (position.referenceElement) {
      const rect = position.referenceElement.getBoundingClientRect();
      left = rect.left;
      top = rect.top + rect.height;
    } else {
      if (typeof position.left === 'number')
        left = position.left;
      if (typeof position.top === 'number')
        top = position.top;
    }

    const MARGIN = 4;
    const bodyWidth = document.body.offsetWidth;
    const bodyHeight = document.body.offsetHeight;

    if (left + width + MARGIN > bodyWidth)
      left = bodyWidth - (width + MARGIN);
    if (top + height + MARGIN > bodyHeight)
      top = bodyHeight - (height + MARGIN);

    if (left < 0)
      left = 0;
    if (height < 0)
      height = 0;

    this._container.style.left = `${left}px`;
    this._container.style.top = `${top}px`;
  }
}

export default PopupMenu;
