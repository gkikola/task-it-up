/**
 * Defines the [ImportModal]{@link module:importModal~ImportModal} class.
 * @module importModal
 */

/**
 * Object holding private members for the
 * [ImportModal]{@link module:importModal~ImportModal} class.
 * @typedef {Object} module:importModal~ImportModal~privates
 * @property {Object} callbacks An object holding callback functions.
 * @property {Function} [callbacks.confirm] A callback function that will be
 *   invoked when the user successfully confirms the modal.
 * @property {Function} [callbacks.cancel] A callback function that will be
 *   invoked when the user cancels the modal.
 */

/**
 * Holds private data for the
 * [ImportModal]{@link module:importModal~ImportModal} class.
 * @type {WeakMap}
 * @see module:importModal~ImportModal~privates
 */
const privateMembers = new WeakMap();

/**
 * A modal dialog for importing data from a file.
 * @implements {module:modalStack~Modal}
 */
class ImportModal {
  /**
   * A callback function that will be invoked when the user chooses to import
   * data from a file.
   * @callback module:importModal~ImportModal~importCallback
   * @param {string} fileType A string specifying the file format to use when
   *   interpreting the file. This can be 'json', 'csv', or 'auto'. If 'auto'
   *   is given, then an attempt should be made to detect the format
   *   automatically based on the contents.
   */

  /**
   * Specifies options for the modal.
   * @typedef {Object} module:importModal~ImportModal~options
   * @property {module:importModal~ImportModal~importCallback} [confirm] A
   *   callback function that will be invoked when the user successfully
   *   confirms the modal.
   * @property {Function} [cancel] A callback function that will be invoked
   *   when the user cancels the modal.
   */

  /**
   * Initialize the modal.
   * @param {module:importModal~ImportModal~options} [options={}] Holds
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
    return 'Import Data';
  }

  get confirmLabel() {
    return 'Import...';
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

export default ImportModal;
