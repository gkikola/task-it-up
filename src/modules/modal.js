/**
 * Defines the [Modal]{@link module:modal~Modal} class.
 * @module modal
 */

import { createIconButton } from './utility';
import EventEmitter from 'events';

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
   * Event that is fired when the user selects the okay button to confirm their
   * selections in the dialog.
   * @event module:modal~Modal~confirm
   * @type {Object}
   * @property {string} type The event type: confirm.
   * @property {module:modal~Modal} target The modal that fired the event.
   */

  /**
   * Event that is fired when the user attempts to cancel the modal dialog.
   * This can occur when the user clicks the X icon in the corner, or selects
   * the cancel button.
   * @event module:modal~Modal~cancel
   * @type {Object}
   * @property {string} type The event type: cancel.
   * @property {module:modal~Modal} target The modal that fired the event.
   */

  /**
   * Event that is fired when the modal is shown.
   * @event module:modal~Modal~show
   * @type {Object}
   * @property {string} type The event type: show.
   * @property {module:modal~Modal} target The modal that fired the event.
   */

  /**
   * Event that is fired when the modal is hidden.
   * @event module:modal~Modal~hide
   * @type {Object}
   * @property {string} type The event type: hide.
   * @property {module:modal~Modal} target The modal that fired the event.
   */

  /**
   * Create the modal. It will be hidden by default.
   * @param {HTMLElement} parent The parent DOM node that will contain the
   *   modal.
   * @param {HTMLElement} [background] The DOM node containing background
   *   elements that should be hidden from screen readers and made unfocusable
   *   while the modal is open.
   * @fires module:modal~Modal~confirm
   * @fires module:modal~Modal~cancel
   */
  constructor(parent, background) {
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
    titleText.textContent = '';
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
    cancelButton.textContent = 'Cancel';
    buttonContainer.appendChild(cancelButton);

    const okayButton = document.createElement('button');
    okayButton.classList.add('modal-button', 'modal-okay');
    okayButton.textContent = 'Okay';
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
     * A reference to the container for background elements that should be
     * disabled while the modal is open.
     * @type {?HTMLElement}
     */
    this._background = background;

    /**
     * The event emitter, for dispatching events.
     * @type {EventEmitter}
     */
    this._eventEmitter = new EventEmitter();

    const fireEvent = type => {
      return () => this._eventEmitter.emit(type, {
        type,
        target: this,
      });
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
   * @fires module:modal~Modal~show
   */
  show() {
    this._overlay.classList.remove('closed');
    this._modal.classList.remove('closed');

    if (this._background) {
      this._background.setAttribute('aria-hidden', 'true');
      this._background.querySelectorAll(FOCUSABLE_SELECTOR).forEach(elem => {
        elem.setAttribute('tabindex', '-1');
      });
    }

    this._eventEmitter.emit('show', { type: 'show', target: this });
  }

  /**
   * Hide the modal.
   * @fires module:modal~Modal~hide
   */
  hide() {
    this._overlay.classList.add('closed');
    this._modal.classList.add('closed');

    if (this._background) {
      this._background.removeAttribute('aria-hidden');
      this._background.querySelectorAll(FOCUSABLE_SELECTOR).forEach(elem => {
        elem.removeAttribute('tabindex');
      });
    }

    this._eventEmitter.emit('hide', { type: 'hide', target: this });
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
