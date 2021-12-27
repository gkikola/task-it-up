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
 * Manages and displays a stack of modal dialog windows.
 */
class ModalStack {
  /**
   * Holds configuration options for modal dialog creation.
   * @typedef {Object} module:modalStack~ModalStack~modalOptions
   * @property {string} [title] The title of the modal, displayed at the top of
   *   the dialog.
   * @property {string} [id] An identifier for the modal. This is set as the
   *   id of the modal container and is passed to the provided callback
   *   function, if any, when the modal is closed.
   * @property {Function} [callback] A callback function that is invoked when
   *   the user performs an action that closes the modal. The function is
   *   passed a [modalAction]{@link module:modalStack~ModalStack~modalAction}
   *   object.
   * @property {string} [confirmLabel=Okay] The label used for the confirm
   *   button, shown at the bottom of the modal.
   * @property {string} [cancelLabel=Cancel] The label used for the cancel
   *   button, shown at the bottom of the modal. If set to an empty string, the
   *   button will not be shown.
   */

  /**
   * Information that is passed to callbacks when the user performs an action
   * in a modal dialog.
   * @typedef {Object} module:modalStack~ModalStack~modalAction
   * @property {string} type The type of action performed. This is set to
   *   'confirm' if the user confirmed the modal, and 'cancel' if the user
   *   canceled the modal.
   * @property {string} id The identifier for the modal in which the action was
   *   performed.
   * @property {HTMLElement} content A reference to the container element that
   *   holds the modal's contents.
   */

  /**
   * A modal dialog box instance.
   * @typedef {Object} module:modalStack~ModalStack~modal
   * @property {HTMLElement} wrapper The outer wrapper node which contains the
   *   modal window container.
   * @property {HTMLElement} container The container node holding the modal
   *   dialog.
   * @property {HTMLElement} content The DOM node holding the main contents of
   *   the modal dialog.
   * @property {string} [id] An identifier for the modal.
   * @property {Function} [callback] A callback function that is invoked when
   *   the user performs an action that closes the modal. The function is
   *   passed a [modalAction]{@link module:modalStack~ModalStack~modalAction}
   *   object.
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
     * The stack of modal instances.
     * @type {module:modalStack~ModalStack~modal[]}
     */
    this._modals = [];
  }

  /**
   * Create and display a modal dialog.
   * @param {HTMLElement} content An element containing the contents of the
   *   modal. This will be inserted as a child of the modal dialog container.
   *   The 'modal-content' class will also be applied to the element.
   * @param {module:modalStack~ModalStack~modalOptions} [options={}] An object
   *   containing options for controlling creation of the modal dialog.
   */
  showModal(content, options = {}) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('modal-wrapper');
    wrapper.style.zIndex = this._getZIndex(this._modals.length + 1);

    const container = document.createElement('div');
    if (options.id)
      container.id = options.id;
    container.classList.add('modal');
    wrapper.appendChild(container);

    const titleBar = document.createElement('div');
    titleBar.classList.add('modal-title-bar');
    container.appendChild(titleBar);

    const titleText = document.createElement('div');
    titleText.classList.add('modal-title');
    titleText.textContent = options.title || '';
    titleBar.appendChild(titleText);
    const closeIcon = createIconButton('close');
    closeIcon.addEventListener('click', () => this.cancelModal());
    titleBar.appendChild(closeIcon);

    content.classList.add('modal-content');
    container.appendChild(content);

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('modal-button-container');
    container.appendChild(buttonContainer);

    if (!options.cancelLabel || options.cancelLabel !== '') {
      const cancelButton = document.createElement('button');
      cancelButton.classList.add('modal-button');
      cancelButton.textContent = options.cancelLabel || 'Cancel';
      cancelButton.addEventListener('click', () => this.cancelModal());
      buttonContainer.appendChild(cancelButton);
    }

    const okayButton = document.createElement('button');
    okayButton.classList.add('modal-button', 'modal-okay');
    okayButton.textContent = options.confirmLabel || 'Okay';
    okayButton.addEventListener('click', () => this.confirmModal());
    buttonContainer.appendChild(okayButton);

    const modal = {
      wrapper,
      container,
      content,
      id: options.id || null,
      callback: options.callback || null,
    };

    this._modals.push(modal);
    this._parent.appendChild(wrapper);
    this._hideBackground();
  }

  /**
   * Close a modal dialog. This will not invoke the associated callback
   * function.
   * @param {string} [id] The identifier for the modal to be closed. If not
   *   given, then the topmost modal will be closed.
   */
  closeModal(id) {
    const index = this._getModalIndex(id);

    if (index >= 0) {
      const modal = this._modals[index];
      this._parent.removeChild(modal.wrapper);
      this._modals.splice(index, 1);
      this._restoreBackground();
    }
  }

  /**
   * Confirm a modal dialog. If a callback function was provided for the modal,
   * it will be invoked.
   * @param {string} [id] The identifier for the modal to confirm. If not
   *   given, then the topmost modal will be confirmed.
   */
  confirmModal(id) {
    const modal = this._getModal(id);
    if (modal?.callback) {
      modal.callback({
        type: 'confirm',
        id: modal.id,
        content: modal.content,
      });
    }

    this.closeModal(id);
  }

  /**
   * Cancel a modal dialog. If a callback function was provided for the modal,
   * it will be invoked.
   * @param {string} [id] The identifier for the modal to cancel. If not given,
   *   then the topmost modal will be canceled.
   */
  cancelModal(id) {
    const modal = this._getModal(id);
    if (modal?.callback) {
      modal.callback({
        type: 'cancel',
        id: modal.id,
        content: modal.content,
      });
    }

    this.closeModal(id);
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
   * Find a modal in the stack.
   * @param {string} [id] The identifier of the modal to find. If not given,
   *   then the topmost modal is returned.
   * @returns {?module:modalStack~ModalStack~modal} The
   *   [modal]{@link module:modalStack~ModalStack~modal} instance. If an
   *   invalid identifier is given, or if the stack is empty, then null is
   *   returned.
   */
  _getModal(id) {
    const index = this._getModalIndex(id);

    return (index >= 0) ? this._modals[index] : null;
  }

  /**
   * Find the index of a modal in the stack.
   * @param {string} [id] The identifier of the modal whose index is to be
   *   found. If not given, then the index of the topmost modal is returned.
   * @returns {number} The index of the specified modal, or -1 if not found.
   */
  _getModalIndex(id) {
    if (id)
      return this._modals.findIndex(modal => modal.id === id);
    else
      return this._modals.length - 1;
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
