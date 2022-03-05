/**
 * Defines the [InfoModal]{@link module:infoModal~InfoModal} class.
 * @module infoModal
 */

/**
 * Object holding the private members for the
 * [InfoModal]{@link module:infoModal~InfoModal} class.
 * @typedef {Object} module:infoModal~InfoModal~privates
 * @property {string} title The title for the modal.
 * @property {string} confirmLabel The label to be used for the confirm button.
 * @property {HTMLElement} content The custom content to display in the modal.
 * @property {Object} callbacks An object holding callback functions.
 * @property {Function} [callbacks.close] A callback function that will be
 *   invoked when the user closes the modal.
 */

/**
 * Holds private data for the [InfoModal]{@link module:infoModal~InfoModal}
 * class.
 * @type {WeakMap}
 * @see module:infoModal~InfoModal~privates
 */
const privateMembers = new WeakMap();

/**
 * A modal dialog displaying custom informational content.
 * @implements {module:modalStack~Modal}
 */
class InfoModal {
  /**
   * Specifies options for the modal.
   * @typedef {Object} module:infoModal~InfoModal~options
   * @property {string} [title=Alert] The title for the modal.
   * @property {string} [confirmLabel=Okay] The label to be used for the
   *   confirm button.
   * @property {Function} [close] A callback function that will be invoked when
   *   the user closes the modal.
   */

  /**
   * Initialize the modal.
   * @param {string|string[]|HTMLElement} content The content that will be
   *   displayed in the modal. This can either be a string specifying a
   *   message, an array of strings each specifying a paragraph of text, or a
   *   custom element that will be inserted into the modal content area.
   * @param {module:infoModal~InfoModal~options} [options={}] Holds
   *   configuration options for the modal.
   */
  constructor(content, options = {}) {
    const privates = {
      title: options.title ?? 'Alert',
      confirmLabel: options.confirmLabel || 'Okay',
      content: null,
      callbacks: {
        close: options.close || null,
      },
    };

    if (content instanceof Node) {
      privates.content = content;
    } else {
      const container = document.createElement('div');
      container.classList.add('info-modal-content-container');
      const paragraphs = Array.isArray(content) ? content : [content];
      paragraphs.forEach((paragraph) => {
        const pElem = document.createElement('p');
        pElem.classList.add('info-modal-content-paragraph');
        pElem.textContent = paragraph;
        container.appendChild(pElem);
      });
      privates.content = container;
    }

    privateMembers.set(this, privates);
  }

  get title() {
    return privateMembers.get(this).title;
  }

  get confirmLabel() {
    return privateMembers.get(this).confirmLabel;
  }

  /* eslint-disable class-methods-use-this --
   * We need to set these properties to conform to the Modal interface, but
   * setting them directly in the constructor would allow external
   * modification.
   */

  get noCancelButton() {
    return true;
  }

  get initFocus() {
    return 'confirm';
  }

  /* eslint-enable class-methods-use-this */

  addContent(parent) {
    parent.appendChild(privateMembers.get(this).content);
  }

  confirm() {
    const callback = privateMembers.get(this).callbacks.close;
    if (callback) callback();
  }

  cancel() {
    this.confirm();
  }

  /* eslint-disable-next-line class-methods-use-this --
   * Necessary since modal must have validate function in order to satisfy
   * Modal interface.
   */
  validate() {
    return true;
  }
}

export default InfoModal;
