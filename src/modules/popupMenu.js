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
          const active = privates.activeItem;
          const itemCount = privates.menuItems.length;
          let index = null;
          if (active !== null) index = active > 0 ? active - 1 : itemCount - 1;
          else if (itemCount > 0) index = itemCount - 1;
          focusItem(instance, index);
          break;
        }
        case 'ArrowDown':
        case 'Down': {
          const active = privates.activeItem;
          const itemCount = privates.menuItems.length;
          let index = null;
          if (active !== null) index = active < itemCount - 1 ? active + 1 : 0;
          else if (itemCount > 0) index = 0;
          focusItem(instance, index);
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
   * @param {module:popupMenu~PopupMenu~options} [options={}] An object holding
   *   additional options for the popup menu.
   */
  constructor(options = {}) {
    const privates = {
      parent: options.parent || document.body,
      menuItems: options.menuItems || [],
      activeItem: null,
      container: null,
      callback: null,
      eventListener: (e) => handleEvent(this, e),
      scrollTimeout: null,
      scrollTarget: options.closeIfScrolled || null,
    };
    privateMembers.set(this, privates);
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

    const menu = document.createElement('div');
    menu.classList.add('popup-menu');

    const list = document.createElement('ul');
    menu.appendChild(list);
    privates.menuItems.forEach((item, index) => {
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

      listItem.addEventListener('click', () => selectItem(this, index));
      listItem.addEventListener('mousemove', () => focusItem(this, index));
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
      privates.activeItem = null;
      privates.container = null;
      privates.callback = null;
      document.removeEventListener('mousedown', privates.eventListener);
      document.removeEventListener('keydown', privates.eventListener);
      if (privates.scrollTarget) {
        document.removeEventListener('scroll', privates.eventListener, true);
      }
    }
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
