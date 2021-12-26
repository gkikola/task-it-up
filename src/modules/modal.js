/**
 * Defines the [Modal]{@link module:modal~Modal} class.
 * @module modal
 */

import { createIconButton } from './utility';

const FOCUSABLE_ELEMS = [
  'a[href]',
  'input',
  'select',
  'textarea',
  'button',
];
const FOCUSABLE_SELECTOR = FOCUSABLE_ELEMS.join(', ');

/**
 * A modal dialog box.
 */
class Modal {
  /**
   * Holds configuration options that can be passed to the constructor.
   * @typedef {Object} module:modal~Modal~options
   * @property {HTMLElement} [parentNode=document.body] The parent DOM node
   *   that will contain the modal.
   * @property {HTMLElement} [backgroundContainer] The DOM node containing
   *   background elements that should be hidden from screen readers and made
   *   unfocusable while the modal is open.
   * @property {HTMLElement} [content] An element containing the contents of
   *   the modal dialog. This element will be inserted as a child of the
   *   modal's container element, and the 'modal-content' class will be applied
   *   to it. If this property is not set, then an empty container will be
   *   created. The content container can be later accessed through the
   *   [content]{@link module:modal~Modal~content} property.
   * @property {string} [title] The title of the modal, displayed at the top of
   *   the dialog.
   * @property {Object} [confirm] An object holding options for handling
   *   confirmation in the modal.
   * @property {string} [confirm.label=Okay] The label used for the confirm
   *   button, shown at the bottom of the modal.
   * @property {Function} [confirm.callback] A callback function that is
   *   invoked when the user selects the confirm button. The function is passed
   *   an [action]{@link module:modal~Modal~action} object.
   * @property {Object} [cancel] An object holding options for handling
   *   cancelling the modal.
   * @property {string} [cancel.label=Cancel] The label used for the cancel
   *   button, shown at the bottom of the modal.
   * @property {boolean} [cancel.hideButton=false] If set to true, the cancel
   *   button will be hidden.
   * @property {Function} [cancel.callback] A callback function that is invoked
   *   when the user cancels the modal. This occurs when the user selects the
   *   cancel button, or selects the close icon in the upper-right corner of
   *   the dialog. The function is passed an
   *   [action]{@link module:modal~Modal~action} object.
   */

  /**
   * Holds information about a modal action performed by the user.
   * @typedef {Object} module:modal~Modal~action
   * @property {string} type The type of action performed. This will be set to
   *   'confirm' if the modal was confirmed and 'cancel' if the modal was
   *   cancelled.
   * @property {module:modal~Modal} modal A reference to the modal in which the
   *   action was performed.
   */

  /**
   * Create and display the modal.
   * @param {module:modal~Modal~options} [options={}] An object containing
   *   configuration options for the modal.
   */
  constructor(options = {}) {
    const overlay = document.createElement('div');
    overlay.classList.add('modal-overlay');

    const modal = document.createElement('div');
    modal.classList.add('modal');
    overlay.appendChild(modal);

    const titleBar = document.createElement('div');
    titleBar.classList.add('modal-title-bar');
    modal.appendChild(titleBar);

    const titleText = document.createElement('div');
    titleText.classList.add('modal-title');
    titleText.textContent = options.title || '';
    titleBar.appendChild(titleText);
    const closeIcon = createIconButton('close');
    closeIcon.addEventListener('click', () => this.cancel());
    titleBar.appendChild(closeIcon);

    const content = options.content || document.createElement('div');
    content.classList.add('modal-content');
    modal.appendChild(content);

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('modal-button-container');
    modal.appendChild(buttonContainer);

    if (!options.cancel?.hideButton) {
      const cancelButton = document.createElement('button');
      cancelButton.classList.add('modal-button');
      cancelButton.textContent = options.cancel?.label || 'Cancel';
      cancelButton.addEventListener('click', () => this.cancel());
      buttonContainer.appendChild(cancelButton);
    }

    const okayButton = document.createElement('button');
    okayButton.classList.add('modal-button', 'modal-okay');
    okayButton.textContent = options.confirm?.label || 'Okay';
    okayButton.addEventListener('click', () => this.confirm());
    buttonContainer.appendChild(okayButton);

    const parent = options.parentNode || document.body;
    parent.appendChild(overlay);

    /**
     * The screen overlay element in the DOM.
     * @type {HTMLElement}
     */
    this._overlay = overlay;

    /**
     * The modal container element in the DOM.
     * @type {HTMLElement}
     */
    this._modal = modal;

    /**
     * The container element for the main contents of the modal.
     * @type {HTMLElement}
     */
    this._content = content;

    /**
     * A reference to the container for background elements that should be
     * disabled while the modal is open.
     * @type {?HTMLElement}
     */
    this._background = options.backgroundContainer || null;

    /**
     * The callback function to invoke when the modal is confirmed.
     * @type {?Function}
     */
    this._confirmCallback = options.confirm?.callback || null;

    /**
     * The callback function to invoke when the modal is cancelled.
     * @type {?Function}
     */
    this._cancelCallback = options.cancel?.callback || null;

    this._hideBackground();
  }

  /**
   * The content container element in the DOM.
   * @type {HTMLElement}
   */
  get content() {
    return this._content;
  }

  /**
   * Confirm the modal. This closes the modal and invokes the associated
   * callback, if any.
   */
  confirm() {
    if (this._confirmCallback)
      this._confirmCallback({ type: 'confirm', modal: this });

    this._close();
  }

  /**
   * Cancel the modal. This closes the modal and invokes the associated
   * callback, if any.
   */
  cancel() {
    if (this._cancelCallback)
      this._cancelCallback({ type: 'cancel', modal: this });

    this._close();
  }

  /**
   * Close the modal.
   */
  _close() {
    if (this._overlay.parentNode)
      this._overlay.parentNode.removeChild(this._overlay);

    this._restoreBackground();
  }

  /**
   * Hide background elements from screen readers and make them unfocusable.
   */
  _hideBackground() {
    if (this._background) {
      this._background.setAttribute('aria-hidden', 'true');
      this._background.querySelectorAll(FOCUSABLE_SELECTOR).forEach(elem => {
        elem.setAttribute('tabindex', '-1');
      });
    }
  }

  /**
   * Restore background element visibility and interactivity.
   */
  _restoreBackground() {
    if (this._background) {
      this._background.removeAttribute('aria-hidden');
      this._background.querySelectorAll(FOCUSABLE_SELECTOR).forEach(elem => {
        elem.removeAttribute('tabindex');
      });
    }
  }
}

export default Modal;
