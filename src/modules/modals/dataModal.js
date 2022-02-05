/**
 * Defines the [DataModal]{@link module:dataModal~dataModal} class.
 * @module dataModal
 */

/**
 * Object holding the private members for the
 * [DataModal]{@link module:dataModal~dataModal} class.
 * @typedef {Object} module:dataModal~DataModal~privates
 * @property {Object} callbacks An object holding callback functions.
 * @property {Function} [callbacks.close] A callback function that will be
 *   invoked when the user closes the modal.
 */

/**
 * Holds private data for the [DataModal]{@link module:dataModal~dataModal}
 * class.
 * @type {WeakMap}
 * @see module:dataModal~DataModal~privates
 */
const privateMembers = new WeakMap();

/**
 * A modal dialog for managing user data.
 * @implements {module:modalStack~Modal}
 */
class DataModal {
  /**
   * Specifies options for the modal.
   * @typedef {Object} module:dataModal~DataModal~options
   * @property {Function} [close] A callback function that will be invoked when
   *   the user closes the modal.
   */

  /**
   * Initialize the modal.
   * @param {module:dataModal~DataModal~options} [options={}] Holds
   *   configuration options for the modal.
   */
  constructor(options = {}) {
    const privates = {
      callbacks: {
        close: options.close || null,
      },
    };
    privateMembers.set(this, privates);
  }

  /* eslint-disable class-methods-use-this --
   * We need to set these properties to conform to the Modal interface, but
   * setting them directly in the constructor would allow external
   * modification.
   */

  get title() {
    return 'Manage Data';
  }

  get noCancelButton() {
    return true;
  }

  get initFocus() {
    return 'confirm';
  }

  /* eslint-enable class-methods-use-this */

  addContent(parent) {
    const message = document.createElement('p');
    message.textContent = 'TODO: Add modal content here';
    parent.appendChild(message);
  }

  confirm() {
    this.cancel();
  }

  cancel() {
    const { close } = privateMembers.get(this).callbacks;
    if (close) close();
  }

  /* eslint-disable-next-line class-methods-use-this --
   * Necessary since modal must have validate function in order to satisfy
   * Modal interface.
   */
  validate() {
    return true;
  }
}

export default DataModal;
