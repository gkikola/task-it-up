/**
 * Defines the [Modal]{@link module:modal~Modal} class.
 * @module modal
 */

import { createIconButton } from './utility';
import EventEmitter from 'events';

/**
 * A modal dialog box.
 */
class Modal {
  /**
   * Event that is fired when the user selects the okay button to confirm their
   * selections in the dialog.
   * @event module:modal~Modal~confirm
   */

  /**
   * Event that is fired when the user attempts to cancel the modal dialog.
   * This can occur when the user clicks the X icon in the corner, or selects
   * the cancel button.
   * @event module:modal~Modal~cancel
   */

  /**
   * Create the modal. It will be hidden by default.
   * @param {HTMLElement} parent The parent DOM node that will contain the
   *   modal.
   * @param {string} title The title for the modal, to be displayed in the
   *   title bar.
   * @param {string} [okayLabel=Okay] The label to use for the okay button.
   * @param {string} [cancelLabel=Cancel] The label to use for the cancel
   *   button.
   * @fires module:modal~Modal~confirm
   * @fires module:modal~Modal~cancel
   */
  constructor(parent, title, okayLabel = 'Okay', cancelLabel = 'Cancel') {
    const overlay = document.createElement('div');
    overlay.classList.add('modal-overlay', 'closed');

    const modal = document.createElement('div');
    modal.classList.add('modal', 'closed');
    overlay.appendChild(modal);

    const titleBar = document.createElement('div');
    titleBar.classList.add('modal-title-bar');
    modal.appendChild(titleBar);

    const titleText = document.createElement('div');
    titleText.classList.add('modal-title');
    titleText.textContent = title;
    titleBar.appendChild(titleText);
    const closeIcon = createIconButton('close');
    titleBar.appendChild(closeIcon);

    const content = document.createElement('div');
    content.classList.add('modal-content');
    modal.appendChild(content);

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('modal-button-container');
    modal.appendChild(buttonContainer);

    const cancelButton = document.createElement('button');
    cancelButton.classList.add('modal-button');
    cancelButton.textContent = cancelLabel;
    buttonContainer.appendChild(cancelButton);

    const okayButton = document.createElement('button');
    okayButton.classList.add('modal-button', 'modal-okay');
    okayButton.textContent = okayLabel;
    buttonContainer.appendChild(okayButton);

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
     * The event emitter, for dispatching events.
     * @type {EventEmitter}
     */
    this._eventEmitter = new EventEmitter();

    const fireEvent = type => {
      return () => this._eventEmitter.emit(type);
    }
    okayButton.addEventListener('click', fireEvent('confirm'));
    cancelButton.addEventListener('click', fireEvent('cancel'));
    closeIcon.addEventListener('click', fireEvent('cancel'));
  }

  /**
   * The content container element in the DOM.
   */
  get content() {
    return this._content;
  }

  /**
   * Display the modal.
   */
  show() {
    this._overlay.classList.remove('closed');
    this._modal.classList.remove('closed');
  }

  /**
   * Hide the modal.
   */
  hide() {
    this._overlay.classList.add('closed');
    this._modal.classList.add('closed');
  }

  /**
   * Add an event listener to the modal dialog.
   * @param {string} type The type of event to listen for.
   * @param {Function} listener The event listener to be called when the event
   *   is fired.
   */
  addEventListener(type, listener) {
    this._eventEmitter.on(type, listener);
  }
}

export default Modal;
