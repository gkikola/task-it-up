/**
 * Defines the [Modal]{@link module:modal~Modal} class.
 * @module modal
 */

/**
 * A modal dialog box.
 */
class Modal {
  /**
   * Create the modal. It will be hidden by default.
   * @param {HTMLElement} parent The parent DOM node that will contain the
   *   modal.
   * @param {string} title The title for the modal, to be displayed in the
   *   title bar.
   */
  constructor(parent, title) {
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

    const content = document.createElement('div');
    content.classList.add('modal-content');
    modal.appendChild(content);

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
}

export default Modal;
