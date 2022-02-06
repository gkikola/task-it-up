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
 * @property {Object} buttons An object holding the form buttons in the modal
 *   content.
 * @property {HTMLElement} importButton The import button.
 * @property {HTMLElement} exportButton The export button.
 * @property {HTMLElement} deleteButton The delete button.
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
      buttons: {
        importButton: null,
        exportButton: null,
        deleteButton: null,
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

  get confirmLabel() {
    return 'Close';
  }

  get noCancelButton() {
    return true;
  }

  get initFocus() {
    return 'confirm';
  }

  /* eslint-enable class-methods-use-this */

  addContent(parent) {
    const addContainer = () => {
      const container = document.createElement('div');
      container.classList.add('form-input-container');
      parent.appendChild(container);
      return container;
    };
    const addHeading = (label, container) => {
      const labelElem = document.createElement('div');
      labelElem.classList.add('form-input-label');
      labelElem.textContent = label;
      container.appendChild(labelElem);
    };
    const addButton = (label, container) => {
      const button = document.createElement('button');
      button.classList.add('form-button');
      button.textContent = label;
      container.appendChild(button);
      return button;
    };

    const { buttons } = privateMembers.get(this);
    let container = addContainer();
    addHeading('Import/Export', container);
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('form-button-container');
    container.appendChild(buttonContainer);
    buttons.importButton = addButton('Import from File...', buttonContainer);
    buttons.exportButton = addButton('Export to File...', buttonContainer);

    container = addContainer();
    addHeading('Delete Data', container);
    buttons.deleteButton = addButton('Erase All Data...', container);
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
