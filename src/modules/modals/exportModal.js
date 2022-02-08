/**
 * Defines the [ExportModal]{@link module:exportModal~ExportModal} class.
 * @module exportModal
 */

/**
 * Object holding private members for the
 * [ExportModal]{@link module:exportModal~ExportModal} class.
 * @typedef {Object} module:exportModal~ExportModal~privates
 * @property {Object} callbacks An object holding callback functions.
 * @property {Function} [callbacks.confirm] A callback function that will be
 *   invoked when the user successfully confirms the modal.
 * @property {Function} [callbacks.cancel] A callback function that will be
 *   invoked when the user cancels the modal.
 */

/**
 * Holds private data for the
 * [ExportModal]{@link module:exportModal~ExportModal} class.
 * @type {WeakMap}
 * @see module:exportModal~ExportModal~privates
 */
const privateMembers = new WeakMap();

/**
 * A modal dialog for exporting data to a file.
 * @implements {module:modalStack~Modal}
 */
class ExportModal {
  /**
   * A callback function that will be invoked when the user chooses to export
   * data to a file.
   * @callback module:exportModal~ExportModal~exportCallback
   * @param {string} fileType A string specifying the file format to use for
   *   export. This can be either 'json' or 'csv'.
   */

  /**
   * Specifies options for the modal.
   * @typedef {Object} module:exportModal~ExportModal~options
   * @property {module:exportModal~ExportModal~exportCallback} [confirm] A
   *   callback function that will be invoked when the user successfully
   *   confirms the modal.
   * @property {Function} [cancel] A callback function that will be invoked
   *   when the user cancels the modal.
   */

  /**
   * Initialize the modal.
   * @param {module:exportModal~ExportModal~options} [options={}] Holds
   *   configuration options for the modal.
   */
  constructor(options = {}) {
    const privates = {
      callbacks: {
        confirm: options.confirm || null,
        cancel: options.cancel || null,
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
    return 'Export Data';
  }

  get confirmLabel() {
    return 'Export...';
  }

  /* eslint-enable class-methods-use-this */

  addContent(parent) {
    const message = document.createElement('p');
    message.textContent = 'TODO: Add modal content.';
    parent.appendChild(message);
  }

  confirm() {
  }

  cancel() {
  }

  /* eslint-disable-next-line class-methods-use-this --
   * Necessary since modal must have validate function in order to satisfy
   * Modal interface.
   */
  validate() {
  }
}

export default ExportModal;
