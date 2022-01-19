/**
 * Defines the [ModalStack]{@link module:modalStack~ModalStack} class.
 * @module modalStack
 */

import { createIconButton } from './utility';

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
 * Manages and displays a stack of modal dialog windows.
 */
class ModalStack {
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
  constructor(parent = document.body, background) {
    const overlay = document.createElement('div');
    overlay.classList.add('modal-overlay', 'closed');
    parent.appendChild(overlay);

    /**
     * The screen overlay element in the DOM.
     * @type {HTMLElement}
     */
    this._overlay = overlay;

    /**
     * The parent element under which modals should be inserted.
     * @type {HTMLElement}
     */
    this._parent = parent;

    /**
     * Container holding background elements that should be hidden when a modal
     * is open.
     * @type {HTMLElement}
     */
    this._background = background || null;

    /**
     * The stack of modal dialogs.
     * @type {module:modalStack~ModalStack~modalInfo[]}
     */
    this._modals = [];

    document.addEventListener('keydown', e => {
      if (this._modals.length > 0 && (e.key === 'Escape' || e.key === 'Esc')) {
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
    const oldActive = document.activeElement;
    if (oldActive)
      oldActive.blur();

    const wrapper = document.createElement('div');
    wrapper.classList.add('modal-wrapper');
    wrapper.style.zIndex = this._getZIndex(this._modals.length + 1);

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
    };

    this._modals.push(modalInfo);
    this._parent.appendChild(wrapper);
    this._hideBackground();

    if (typeof modal.initFocus === 'string') {
      switch (modal.initFocus) {
        case 'confirm':
          okayButton.focus();
          break;
        case 'cancel':
          if (cancelButton)
            cancelButton.focus();
          break;
        default:
        case 'none':
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
    const modalInfo = this._modals.pop();
    if (modalInfo) {
      this._parent.removeChild(modalInfo.wrapper);
      this._restoreBackground();
      if (modalInfo.oldActive)
        modalInfo.oldActive.focus();
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
    if (this._modals.length === 0)
      return false;

    const modal = this._modals[this._modals.length - 1].modal;
    if (!modal.validate())
      return false;

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
    if (this._modals.length === 0)
      return false;

    this._modals[this._modals.length - 1].modal.cancel();
    this.closeModal();
    return true;
  }

  /**
   * Show the modal overlay and hide any background elements.
   */
  _hideBackground() {
    let toHide = null;

    // If this is the first modal, hide page background
    if (this._modals.length <= 1)
      toHide = this._background;
    else // Otherwise, hide the modal below the topmost one
      toHide = this._modals[this._modals.length - 2].wrapper;

    if (toHide) {
      toHide.setAttribute('aria-hidden', 'true');
      toHide.querySelectorAll(FOCUSABLE_SELECTOR).forEach(elem => {
        elem.setAttribute('tabindex', '-1');
      });
    }

    this._updateOverlay();
  }

  /**
   * Restore background element visibility. If there are still modals open,
   * only the topmost modal's elements will become visible. If all modals are
   * closed, then the overlay will be hidden.
   */
  _restoreBackground() {
    let toRestore = null;

    // If no modals remain open, restore the page background
    if (this._modals.length === 0)
      toRestore = this._background;
    else
      toRestore = this._modals[this._modals.length - 1].wrapper;

    if (toRestore) {
      toRestore.removeAttribute('aria-hidden');
      toRestore.querySelectorAll(FOCUSABLE_SELECTOR).forEach(elem => {
        elem.removeAttribute('tabindex');
      });
    }

    this._updateOverlay();
  }

  /**
   * Update the modal overlay. The overlay will be shown or hidden depending on
   * whether any modals are open, and its z-index will be adjusted to sit below
   * the topmost modal.
   */
  _updateOverlay() {
    const count = this._modals.length;
    if (count > 0) {
      const zIndex = this._getZIndex(count) - Z_INDEX_OVERLAY_STEP;
      this._overlay.style.zIndex = zIndex.toString();
      this._overlay.classList.remove('closed');
    } else {
      this._overlay.classList.add('closed');
    }
  }

  /**
   * Calculate the z-index for a modal dialog.
   * @param {number} index The index of the dialog in the stack.
   * @returns {number} The z-index that the modal should be set to.
   */
  _getZIndex(index) {
    return Z_INDEX_START + (index - 1) * Z_INDEX_STEP;
  }
}

export default ModalStack;
