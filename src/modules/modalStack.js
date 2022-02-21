/**
 * Defines the [ModalStack]{@link module:modalStack~ModalStack} class.
 * @module modalStack
 */

import { createIconButton } from './utility/dom';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'input',
  'select',
  'textarea',
  'button',
].join(', ');
const Z_INDEX_START = 500;
const Z_INDEX_STEP = 100;
const Z_INDEX_OVERLAY_STEP = 50;

/**
 * Interface for classes that represent a modal dialog.
 * @interface Modal
 */

/**
 * The title of the modal.
 * @member {string} module:modalStack~Modal#title
 */

/**
 * The label that should be used for the confirm button, shown at the bottom of
 * the modal.
 * @member {string} module:modalStack~Modal#confirmLabel
 * @default Okay
 */

/**
 * The label that should be used for the cancel button, shown at the bottom of
 * the modal.
 * @member {string} module:modalStack~Modal#cancelLabel
 * @default Cancel
 */

/**
 * Indicates whether to show the cancel button in the modal window. If set to
 * true, then the button should not be displayed.
 * @member {boolean} module:modalStack~Modal#noCancelButton
 * @default false
 */

/**
 * Indicates which element to focus after the modal has been opened. This
 * property can either give the element itself, or can be a string with one of
 * the following options: 'confirm' will focus the Confirm button in the modal,
 * 'cancel' will focus the Cancel button, and 'none' will focus nothing.
 * @member {HTMLElement|string} module:modalStack~Modal#initFocus
 * @default confirm
 */

/**
 * Create and display the modal's main content.
 * @function module:modalStack~Modal#addContent
 * @param {HTMLElement} parent The parent DOM node under which the modal's main
 *   content will be inserted.
 * @param {module:modalStack~ModalStack} modalStack The modal stack in which
 *   the modal is being inserted.
 */

/**
 * Confirm the modal. This method should be invoked when the modal is
 * succesfully confirmed by the user.
 * @function module:modalStack~Modal#confirm
 */

/**
 * Cancel the modal. This method should be invoked when the modal is canceled
 * by the user.
 * @function module:modalStack~Modal#cancel
 */

/**
 * Validate the modal. This method should be invoked when the user attempts to
 * confirm the modal.
 * @function module:modalStack~Modal#validate
 * @returns {boolean} True if the user's selections have passed validation, and
 *   false otherwise.
 */

/**
 * Object holding private members for the
 * [ModalStack]{@link module:modalStack~ModalStack} class.
 * @typedef {Object} module:modalStack~ModalStack~privates
 * @property {HTMLElement} overlay The screen overlay element in the DOM.
 * @property {HTMLElement} parent The parent element under which modals should
 *   be inserted.
 * @property {HTMLElement} [background] Container holding background elements
 *   that should be hidden when a modal is open.
 * @property {module:modalStack~ModalStack~modalInfo[]} modals The stack of
 *   modal dialogs.
 */

/**
 * Holds private data for the [ModalStack]{@link module:modalStack~ModalStack}
 * class.
 * @type {WeakMap}
 * @see module:modalStack~ModalStack~privates
 */
const privateMembers = new WeakMap();

/**
 * Calculate the z-index for a modal dialog.
 * @param {number} index The index of the dialog in the stack.
 * @returns {number} The z-index that the modal should be set to.
 */
function getZIndex(index) {
  return Z_INDEX_START + (index - 1) * Z_INDEX_STEP;
}

/**
 * Update the modal overlay. The overlay will be shown or hidden depending on
 * whether any modals are open, and its z-index will be adjusted to sit below
 * the topmost modal.
 * @param {module:modalStack~ModalStack} instance The class instance on which
 *   to apply the function.
 */
function updateOverlay(instance) {
  const privates = privateMembers.get(instance);
  const count = privates.modals.length;
  if (count > 0) {
    const zIndex = getZIndex(count) - Z_INDEX_OVERLAY_STEP;
    privates.overlay.style.zIndex = zIndex.toString();
    privates.overlay.classList.remove('closed');
  } else {
    privates.overlay.classList.add('closed');
  }
}

/**
 * Show the modal overlay and hide any background elements.
 * @param {module:modalStack~ModalStack} instance The class instance on which
 *   to apply the function.
 */
function hideBackground(instance) {
  const privates = privateMembers.get(instance);
  let toHide = null;

  // If this is the first modal, hide page background
  if (privates.modals.length <= 1) {
    toHide = privates.background;
  } else { // Otherwise, hide the modal below the topmost one
    toHide = privates.modals[privates.modals.length - 2].wrapper;
  }

  if (toHide) {
    toHide.setAttribute('aria-hidden', 'true');

    const { oldTabIndex } = privates.modals[privates.modals.length - 1];
    toHide.querySelectorAll(FOCUSABLE_SELECTOR).forEach((elem) => {
      const tabIndex = elem.hasAttribute('tabindex') ? elem.tabIndex : null;
      oldTabIndex.push({ element: elem, tabIndex });
      elem.setAttribute('tabindex', '-1');
    });
  }

  updateOverlay(instance);
}

/**
 * Restore background element visibility. If there are still modals open,
 * only the topmost modal's elements will become visible. If all modals are
 * closed, then the overlay will be hidden.
 * @param {module:modalStack~ModalStack} instance The class instance on which
 *   to apply the function.
 * @param {module:modalStack~ModalStack~elemTabIndex[]} oldTabIndex An array of
 *   objects specifying elements whose tabindex attributes need to be restored.
 */
function restoreBackground(instance, oldTabIndex) {
  const privates = privateMembers.get(instance);
  let toRestore = null;

  // If no modals remain open, restore the page background
  if (privates.modals.length === 0) {
    toRestore = privates.background;
  } else {
    toRestore = privates.modals[privates.modals.length - 1].wrapper;
  }

  if (toRestore) {
    toRestore.removeAttribute('aria-hidden');
    oldTabIndex.forEach((entry) => {
      const { element, tabIndex } = entry;
      if (tabIndex !== null) element.tabIndex = tabIndex;
      else element.removeAttribute('tabindex');
    });
  }

  updateOverlay(instance);
}

/**
 * Manages and displays a stack of modal dialog windows.
 */
class ModalStack {
  /**
   * Holds information about an element's tab index, used for changing and
   * restoring tab order when modals are opened or closed.
   * @typedef {Object} module:modalStack~ModalStack~elemTabIndex
   * @property {HTMLElement} element An element in the DOM.
   * @property {number} [tabIndex] The tab index of the element, or null if it
   *   is not set.
   */

  /**
   * Holds information about a modal dialog in the stack.
   * @typedef {Object} module:modalStack~ModalStack~modalInfo
   * @property {module:modalStack~Modal} modal The modal instance.
   * @property {HTMLElement} wrapper The outer wrapper node which contains the
   *   modal window container.
   * @property {HTMLElement} container The container node holding the modal
   *   dialog.
   * @property {HTMLElement} content The DOM node holding the main contents of
   *   the modal dialog.
   * @property {HTMLElement} [oldActive] The element that had keyboard focus
   *   before the modal was opened, if any.
   * @property {module:modalStack~ModalStack~elemTabIndex[]} oldTabIndex An
   *   array of objects specifying elements whose tabindex attributes need to
   *   be restored after the modal is closed.
   */

  /**
   * Initialize the modal stack. A hidden overlay will be inserted into the
   * DOM.
   * @param {HTMLElement} [parent=document.body] The parent node under which
   *   the modal overlay is to be inserted.
   * @param {HTMLElement} [background] A DOM node containing elements that
   *   should be hidden from screen readers and made unfocusable while a modal
   *   is open.
   */
  constructor(parent = document.body, background = null) {
    const overlay = document.createElement('div');
    overlay.classList.add('modal-overlay', 'closed');
    parent.appendChild(overlay);

    const privates = {
      overlay,
      parent,
      background: background || null,
      modals: [],
    };
    privateMembers.set(this, privates);

    document.addEventListener('keydown', (e) => {
      if (privates.modals.length > 0
        && (e.key === 'Escape' || e.key === 'Esc')) {
        this.cancelModal();
        e.preventDefault();
      }
    });
  }

  /**
   * Display a modal dialog.
   * @param {module:modalStack~Modal} modal The modal dialog to show.
   */
  showModal(modal) {
    const privates = privateMembers.get(this);

    const oldActive = document.activeElement;
    if (oldActive) oldActive.blur();

    const wrapper = document.createElement('div');
    wrapper.classList.add('modal-wrapper');
    wrapper.style.zIndex = getZIndex(privates.modals.length + 1);

    const container = document.createElement('div');
    container.classList.add('modal');
    wrapper.appendChild(container);

    const titleBar = document.createElement('div');
    titleBar.classList.add('modal-title-bar');
    container.appendChild(titleBar);

    const titleText = document.createElement('div');
    titleText.classList.add('modal-title');
    titleText.textContent = modal.title;
    titleBar.appendChild(titleText);
    const closeIcon = createIconButton('close');
    closeIcon.addEventListener('click', () => this.cancelModal());
    titleBar.appendChild(closeIcon);

    const content = document.createElement('div');
    content.classList.add('modal-content');
    modal.addContent(content, this);
    container.appendChild(content);

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('modal-button-container');
    container.appendChild(buttonContainer);

    let cancelButton = null;
    if (!modal.noCancelButton) {
      cancelButton = document.createElement('button');
      cancelButton.classList.add('modal-button');
      cancelButton.textContent = modal.cancelLabel || 'Cancel';
      cancelButton.addEventListener('click', () => this.cancelModal());
      buttonContainer.appendChild(cancelButton);
    }

    const okayButton = document.createElement('button');
    okayButton.classList.add('modal-button', 'modal-okay');
    okayButton.textContent = modal.confirmLabel || 'Okay';
    okayButton.addEventListener('click', () => this.confirmModal());
    buttonContainer.appendChild(okayButton);

    const modalInfo = {
      modal,
      wrapper,
      container,
      content,
      oldActive,
      oldTabIndex: [],
    };

    privates.modals.push(modalInfo);
    privates.parent.appendChild(wrapper);
    hideBackground(this);

    if (typeof modal.initFocus === 'string') {
      switch (modal.initFocus) {
        case 'confirm':
          okayButton.focus();
          break;
        case 'cancel':
          if (cancelButton) cancelButton.focus();
          break;
        case 'none':
        default:
          break;
      }
    } else if (modal.initFocus) {
      modal.initFocus.focus();
    } else {
      okayButton.focus();
    }
  }

  /**
   * Close the topmost modal dialog. This will not invoke the associated
   * callback function.
   */
  closeModal() {
    const privates = privateMembers.get(this);
    const modalInfo = privates.modals.pop();
    if (modalInfo) {
      privates.parent.removeChild(modalInfo.wrapper);
      restoreBackground(this, modalInfo.oldTabIndex);
      if (modalInfo.oldActive) modalInfo.oldActive.focus();
    }
  }

  /**
   * Attempt to confirm the topmost modal dialog. The modal's
   * [validate]{@link module:modalStack~Modal#validate} method will first be
   * invoked. If the modal passes validation, then its
   * [confirm]{@link module:modalStack~Modal#confirm} method is invoked, and
   * then the modal is closed.
   * @returns {boolean} True if the modal was successfully confirmed, and false
   *   if the modal failed validation.
   */
  confirmModal() {
    const privates = privateMembers.get(this);
    if (privates.modals.length === 0) return false;

    const { modal } = privates.modals[privates.modals.length - 1];
    if (!modal.validate()) return false;

    modal.confirm();
    this.closeModal();
    return true;
  }

  /**
   * Cancel the topmost modal dialog. This will invoke the modal's
   * [cancel]{@link module:modalStack~Modal#cancel} method, and then the modal
   * will be closed.
   * @returns {boolean} This method will return false if it is called when
   *   there are no modals in the stack. Otherwise it returns true.
   */
  cancelModal() {
    const privates = privateMembers.get(this);
    if (privates.modals.length === 0) return false;

    privates.modals[privates.modals.length - 1].modal.cancel();
    this.closeModal();
    return true;
  }
}

export default ModalStack;
