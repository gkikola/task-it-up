/**
 * Defines the [PopupMenu]{@link module:popupMenu~PopupMenu} class.
 * @module popupMenu
 */

/**
 * Object holding private members for the
 * [PopupMenu]{@link module:popupMenu~PopupMenu} class.
 * @typedef {Object} module:popupMenu~PopupMenu~privates
 * @property {HTMLElement} parent The parent element in the DOM under which the
 *   popup menu should be inserted.
 * @property {module:popupMenu~PopupMenu~menuItem[]} menuItems An array of
 *   objects specifying the items in the menu.
 * @property {number} [activeItem] Holds the index of the active (focused) menu
 *   item, if any.
 * @property {HTMLElement} [container] The container element holding the menu.
 *   Will be null when the menu is hidden.
 * @property {HTMLElement} [overlay] The element that will overlay the
 *   background of the menu. Will be null when the menu is hidden.
 * @property {module:popupMenu~PopupMenu~selectionCallback} [callback] Holds
 *   the function to be invoked when the user selects a menu item. This will be
 *   null when the menu is closed.
 * @property {Function} eventListener An event listener to monitor
 *   document-wide mouse and keyboard events. Needs to be stored so that it can
 *   be later removed.
 * @property {number} [scrollTimeout] An identifier for a timeout used to
 *   debounce scroll events for better performance.
 * @property {HTMLElement} [scrollTarget] An element to monitor for scroll
 *   events. If the element is scrolled, then the popup menu will be closed.
 */

/**
 * Holds private data for the [PopupMenu]{@link module:popupMenu~PopupMenu}
 * class.
 * @type {WeakMap}
 * @see module:popupMenu~PopupMenu~privates
 */
const privateMembers = new WeakMap();

/**
 * Position the popup menu at a particular location.
 * @param {module:popupMenu~PopupMenu} instance The class instance on which to
 *   apply the function.
 * @param {module:popupMenu~PopupMenu~position} [position={}] An object
 *   specifying the position in the document at which to place the menu.
 */
function positionMenu(instance, position = {}) {
  const { container } = privateMembers.get(instance);
  const width = container.offsetWidth;
  const height = container.offsetHeight;

  let left = 0;
  let top = 0;
  if (position.referenceElement) {
    const rect = position.referenceElement.getBoundingClientRect();
    left = rect.left;
    top = rect.top + rect.height;
  } else {
    if ('left' in position) left = position.left;
    if ('top' in position) top = position.top;
  }

  const MARGIN = 4;
  const bodyWidth = document.body.offsetWidth;
  const bodyHeight = document.body.offsetHeight;

  if (left + width + MARGIN > bodyWidth) left = bodyWidth - (width + MARGIN);
  if (top + height + MARGIN > bodyHeight) top = bodyHeight - (height + MARGIN);

  if (left < 0) left = 0;
  if (top < 0) top = 0;

  container.style.left = `${left}px`;
  container.style.top = `${top}px`;
}

/**
 * Select an item in the menu.
 * @param {module:popupMenu~PopupMenu} instance The class instance on which to
 *   apply the function.
 * @param {number} index The index of the menu item.
 */
function selectItem(instance, index) {
  const privates = privateMembers.get(instance);
  privates.callback(privates.menuItems[index].id, index);
  instance.close();
}

/**
 * Get the list item HTML element for a menu item.
 * @param {module:popupMenu~PopupMenu} instance The class instance on which to
 *   apply the function.
 * @param {number} index The index of the menu item to find.
 * @returns {?HTMLElement} The list item element if it exists, or null if it
 *   does not.
 */
function getItem(instance, index) {
  const selector = `.popup-menu-item[data-index="${index}"]`;
  return privateMembers.get(instance).container.querySelector(selector);
}

/**
 * Focus an item in the menu.
 * @param {module:popupMenu~PopupMenu} instance The class instance on which to
 *   apply the function.
 * @param {?number} index The index of the menu item to focus. If set to null,
 *   then no focus will be set and any existing focus is cleared.
 */
function focusItem(instance, index) {
  const privates = privateMembers.get(instance);
  if (index === privates.activeItem) return;

  if (privates.activeItem !== null) {
    const item = getItem(instance, privates.activeItem);
    if (item) item.classList.remove('active');
    privates.activeItem = null;
  }

  if (typeof index === 'number') {
    const item = getItem(instance, index);
    if (item) {
      privates.activeItem = index;
      item.classList.add('active');
    }
  }
}

/**
 * Change the focused menu item to the next or previous item in the list. If no
 * item is currently focused, then either the first or last item will be
 * focused depending on the specified direction. Separators are ignored.
 * @param {module:popupMenu~PopupMenu} instance The class instance on which to
 *   apply the function.
 * @param {number} delta Indicates which direction to iterate through the menu:
 *   -1 will move the focus to the previous item and 1 will move the focus to
 *   the next item.
 */
function shiftFocus(instance, delta) {
  const privates = privateMembers.get(instance);
  const active = privates.activeItem;
  const items = privates.menuItems;

  let index = active;

  if (index === null) {
    // Start one before or one past the end so that the starting or ending item
    // will be the first item in the iteration
    index = (delta > 0) ? -1 : items.length;
  }

  // Travel through the menu items until we find the next non-separator
  for (let count = 0; count < items.length; count += 1) {
    index += delta;
    if (index < 0) index = items.length - 1;
    if (index >= items.length) index = 0;

    if (items[index] !== 'separator') break;
  }

  if (items.length > 0) {
    focusItem(instance, index);
  }
}

/**
 * Handle a mouse or keyboard event.
 * @param {module:popupMenu~PopupMenu} instance The class instance on which to
 *   apply the function.
 * @param {Event} event An object describing the event that occurred.
 */
function handleEvent(instance, event) {
  const privates = privateMembers.get(instance);
  switch (event.type) {
    case 'mousedown':
      // Close popup if mouse was clicked outside
      if (!privates.container.contains(event.target)) instance.close();
      break;
    case 'keydown': {
      let preventDefault = true;
      switch (event.key) {
        case 'Escape':
        case 'Esc':
        case 'Tab':
          instance.close();
          break;
        case 'Enter':
        case ' ':
        case 'Spacebar':
          if (privates.activeItem !== null) {
            selectItem(instance, privates.activeItem);
          }
          break;
        case 'ArrowUp':
        case 'Up': {
          shiftFocus(instance, -1);
          break;
        }
        case 'ArrowDown':
        case 'Down': {
          shiftFocus(instance, 1);
          break;
        }
        default:
          preventDefault = false;
          break;
      }
      if (preventDefault) event.preventDefault();
      break;
    }
    case 'scroll': {
      if (privates.scrollTimeout) clearTimeout(privates.scrollTimeout);

      privates.scrollTimeout = setTimeout(() => {
        privates.scrollTimeout = null;
        if (event.target.contains(privates.scrollTarget)) instance.close();
      }, 100);
      break;
    }
    default:
      break;
  }
}

/**
 * A popup menu.
 */
class PopupMenu {
  /**
   * An object holding configuration options for the popup menu.
   * @typedef {Object} module:popupMenu~PopupMenu~options
   * @property {HTMLElement} [parent=document.body] The parent element in the
   *   DOM under which the popup should be inserted.
   * @property {module:popupMenu~PopupMenu~menuItem[]} [menuItems] An array of
   *   objects specifying the items in the menu.
   * @property {HTMLElement} [closeIfScrolled] If provided, the popup menu will
   *   be closed when the given element or one of its ancestors is scrolled.
   */

  /**
   * A menu item in the popup.
   * @typedef {Object} module:popupMenu~PopupMenu~menuItem
   * @property {string} [label] The text label that will be displayed in the
   *   menu. This should be provided unless the item is a separator.
   * @property {string} [id] An identifier for the menu item. This will be
   *   passed to callbacks.
   * @property {string} [type=entry] The type of menu item: 'entry' indicates
   *   that the item is a standard menu item, and 'separator' indicates that
   *   the item is a visual separator.
   * @property {boolean} [checked=false] Indicates whether the menu item should
   *   be visually marked as checked or turned on (such as for items that can
   *   be toggled on or off).
   * @property {Object} [icon] An object specifying information about an icon
   *   to display next to the menu item.
   * @property {string} icon.source The source URL for the icon.
   * @property {number} [icon.width] The width of the icon in pixels.
   * @property {number} [icon.height] The height of the icon in pixels.
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
   * @param {module:popupMenu~PopupMenu~options} [options={}] An object holding
   *   additional options for the popup menu.
   */
  constructor(options = {}) {
    const privates = {
      parent: options.parent || document.body,
      menuItems: options.menuItems || [],
      activeItem: null,
      container: null,
      overlay: null,
      callback: null,
      eventListener: (e) => handleEvent(this, e),
      scrollTimeout: null,
      scrollTarget: options.closeIfScrolled || null,
    };
    privateMembers.set(this, privates);
  }

  /**
   * Determine whether or not the popup menu is currently open.
   * @returns {boolean} True if the popup menu is open, or false if it is
   *   closed.
   */
  isOpen() {
    return privateMembers.get(this).container !== null;
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
    const privates = privateMembers.get(this);
    if (privates.container) this.close();
    if (privates.menuItems.length === 0) return;

    const overlay = document.createElement('div');
    overlay.classList.add('popup-menu-overlay');
    privates.parent.appendChild(overlay);
    privates.overlay = overlay;

    const menu = document.createElement('div');
    menu.classList.add('popup-menu');

    const list = document.createElement('ul');
    menu.appendChild(list);
    privates.menuItems.forEach((item, index) => {
      const listItem = document.createElement('li');
      listItem.dataset.index = index.toString();
      list.appendChild(listItem);

      switch (item.type) {
        case 'separator':
          listItem.classList.add('popup-menu-separator');
          break;
        case 'entry':
        default:
          listItem.classList.add('popup-menu-item');
          break;
      }

      if (item.type !== 'separator') {
        if (item.icon) {
          const icon = new Image();
          icon.src = item.icon.source;
          icon.alt = '';
          icon.classList.add('popup-menu-item-icon');
          if (item.icon.width != null) icon.width = item.icon.width;
          if (item.icon.height != null) icon.height = item.icon.height;
          listItem.appendChild(icon);
        }

        const label = document.createElement('div');
        label.classList.add('popup-menu-item-label');
        label.textContent = item.label;
        listItem.appendChild(label);

        if (item.checked) {
          listItem.classList.add('checked');
        }

        listItem.addEventListener('click', () => selectItem(this, index));
        listItem.addEventListener('mousemove', () => focusItem(this, index));
      }
    });

    menu.addEventListener('mouseleave', () => focusItem(this, null));

    privates.container = menu;
    privates.parent.appendChild(menu);
    privates.callback = callback;

    positionMenu(this, position);

    document.addEventListener('mousedown', privates.eventListener);
    document.addEventListener('keydown', privates.eventListener);
    if (privates.scrollTarget) {
      document.addEventListener('scroll', privates.eventListener, true);
    }
  }

  /**
   * Close the popup menu if it is open.
   */
  close() {
    const privates = privateMembers.get(this);
    if (privates.container) {
      privates.parent.removeChild(privates.container);
      privates.parent.removeChild(privates.overlay);
      privates.activeItem = null;
      privates.container = null;
      privates.overlay = null;
      privates.callback = null;
      document.removeEventListener('mousedown', privates.eventListener);
      document.removeEventListener('keydown', privates.eventListener);
      if (privates.scrollTarget) {
        document.removeEventListener('scroll', privates.eventListener, true);
      }
    }
  }

  /**
   * Toggle the state of the popup: if the menu is closed, it will be opened.
   * If the menu is open, it will be closed.
   * @param {module:popupMenu~PopupMenu~selectionCallback} callback A callback
   *   function that will be invoked when the user chooses a menu item.
   * @param {module:popupMenu~PopupMenu~position} [position] An object
   *   specifying the position in the document at which to place the menu. If
   *   not given, the upper-left corner of the document will be used.
   */
  toggle(callback, position) {
    if (this.isOpen()) this.close();
    else this.open(callback, position);
  }

  /**
   * Set the menu items that will be shown the next time the popup menu is
   * opened. If the popup menu is currently open, the displayed items will not
   * be altered until the menu is reopened.
   * @param {module:popupMenu~PopupMenu~menuItem[]} menuItems The array of menu
   *   items.
   */
  setMenuItems(menuItems) {
    privateMembers.get(this).menuItems = menuItems;
  }
}

export default PopupMenu;
