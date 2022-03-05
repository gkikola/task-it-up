/**
 * Defines the [DataModal]{@link module:dataModal~dataModal} class.
 * @module dataModal
 */

import ConfirmModal from './confirmModal';
import ExportModal from './exportModal';

import { createFormControl } from '../utility/dom';
import { readFile } from '../utility/storage';

/**
 * Object holding the private members for the
 * [DataModal]{@link module:dataModal~dataModal} class.
 * @typedef {Object} module:dataModal~DataModal~privates
 * @property {Object} callbacks An object holding callback functions.
 * @property {module:dataModal~DataModal~importData} [callbacks.importData] A
 *   callback function that will be invoked if the user chooses to import data
 *   from a file.
 * @property {module:dataModal~DataModal~exportData} [callbacks.exportData] A
 *   callback function that will be invoked if the user chooses to export data
 *   to a file.
 * @property {Function} [callbacks.deleteAll] A callback function that will be
 *   invoked if the user chooses to delete all data.
 * @property {Function} [callbacks.close] A callback function that will be
 *   invoked when the user closes the modal.
 * @property {Object} controls An object holding the form controls in the modal
 *   content.
 * @property {HTMLElement} controls.fileSelector The file input control.
 * @property {HTMLElement} controls.importButton The import button.
 * @property {HTMLElement} controls.exportButton The export button.
 * @property {HTMLElement} controls.deleteButton The delete button.
 */

/**
 * Holds private data for the [DataModal]{@link module:dataModal~dataModal}
 * class.
 * @type {WeakMap}
 * @see module:dataModal~DataModal~privates
 */
const privateMembers = new WeakMap();

/**
 * Perform a data import that was requested by the user.
 * @param {module:dataModal~DataModal} instance The class instance on which to
 *   apply the function.
 * @param {module:modalStack~ModalStack} modalStack The modal stack in which
 *   the modal is being inserted.
 * @param {Blob} file The file that the user selected for import.
 */
function doImport(instance, modalStack, file) {
  readFile(file, (content) => {
    if (content) {
      modalStack.closeModal();
      const callback = privateMembers.get(instance).callbacks.importData;
      if (callback) {
        const fileInfo = {
          name: file.name,
          size: file.size,
          type: file.type || null,
        };
        callback(content, fileInfo);
      }
    }
  });
}

/**
 * Perform a data export that was requested by the user.
 * @param {module:dataModal~DataModal} instance The class instance on which to
 *   apply the function.
 * @param {module:modalStack~ModalStack} modalStack The modal stack in which
 *   the modal is being inserted.
 * @param {string} fileType A string specifying the file format to use for
 *   export: 'json' or 'csv'.
 * @param {Object} fileOptions An object specifying additional file options.
 */
function doExport(instance, modalStack, fileType, fileOptions) {
  // Use setTimeout to wait for export modal to finish
  setTimeout(() => {
    modalStack.closeModal();
    const callback = privateMembers.get(instance).callbacks.exportData;
    if (callback) callback(fileType, fileOptions);
  });
}

/**
 * Perform a data deletion operation that was requested by the user.
 * @param {module:dataModal~DataModal} instance The class instance on which to
 *   apply the function.
 * @param {module:modalStack~ModalStack} modalStack The modal stack in which
 *   the modal is being inserted.
 */
function doDelete(instance, modalStack) {
  const callback = privateMembers.get(instance).callbacks.deleteAll;
  if (callback) callback();

  // Close the data modal (using setTimeout to wait for confirm modal to close)
  setTimeout(() => modalStack.closeModal());
}

/**
 * Add the event listeners to the buttons in the modal.
 * @param {module:dataModal~DataModal} instance The class instance on which to
 *   apply the function.
 * @param {module:modalStack~ModalStack} modalStack The modal stack in which
 *   the modal is being inserted.
 */
function addListeners(instance, modalStack) {
  const { controls } = privateMembers.get(instance);

  controls.importButton.addEventListener('click', () => {
    controls.fileSelector.click();
  });

  controls.exportButton.addEventListener('click', () => {
    const modal = new ExportModal({
      confirm: (fileType, options) => {
        doExport(instance, modalStack, fileType, options);
      },
    });
    modalStack.showModal(modal);
  });

  controls.deleteButton.addEventListener('click', () => {
    const modal = new ConfirmModal(
      'Are you sure you want to delete all tasks and projects?',
      {
        initFocus: 'confirm-box',
        confirmBox: {
          value: 'delete',
          label: 'This action cannot be undone. Please confirm your intention by typing the word \'delete\' (without quotes) in the box:',
          errorMessage: 'Please enter the word \'delete\'.',
        },
        confirm: () => doDelete(instance, modalStack),
      },
    );
    modalStack.showModal(modal);
  });

  controls.fileSelector.addEventListener('change', (e) => {
    const { files } = e.target;
    if (files.length > 0) doImport(instance, modalStack, files[0]);
  });
}

/**
 * A modal dialog for managing user data.
 * @implements {module:modalStack~Modal}
 */
class DataModal {
  /**
   * A callback function that will be invoked when the user chooses to import
   * data from a file and the file is read successfully.
   * @callback module:dataModal~DataModal~importData
   * @param {string} content The contents of the file.
   * @param {Object} [info] An object specifying additional file information.
   * @param {string} [info.name] The name of the file.
   * @param {number} [info.size] The size of the file in bytes.
   * @param {string} [info.type] The media type of the file, or null if the
   *   browser could not determine a media type.
   */

  /**
   * A callback function that will be invoked when the user chooses to export
   * data to a file.
   * @callback module:dataModal~DataModal~exportData
   * @param {string} fileType A string specifying the file format to use for
   *   export. This can be either 'json' or 'csv'.
   * @param {Object} [options] An object specifying additional file options.
   * @param {string} [options.newlineSequence] The character sequence to use
   *   for newlines.
   */

  /**
   * Specifies options for the modal.
   * @typedef {Object} module:dataModal~DataModal~options
   * @property {module:dataModal~DataModal~importData} [importData] A callback
   *   function that will be invoked when the user chooses to import data from
   *   a file and the file is read successfully.
   * @property {module:dataModal~DataModal~exportData} [exportData] A callback
   *   function that will be invoked when the user chooses to export data to a
   *   file.
   * @property {Function} [deleteAll] A callback function that will be invoked
   *   when the user chooses (and confirms the choice) to delete all data.
   * @property {Function} [close] A callback function that will be invoked when
   *   the user closes the modal. This will not be invoked if the modal is
   *   automatically closed following a data management operation.
   */

  /**
   * Initialize the modal.
   * @param {module:dataModal~DataModal~options} [options={}] Holds
   *   configuration options for the modal.
   */
  constructor(options = {}) {
    const privates = {
      callbacks: {
        importData: options.importData || null,
        exportData: options.exportData || null,
        deleteAll: options.deleteAll || null,
        close: options.close || null,
      },
      controls: {
        fileSelector: null,
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

  addContent(parent, modalStack) {
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

    const { controls } = privateMembers.get(this);
    let container = addContainer();
    addHeading('Import/Export', container);
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('form-button-container');
    container.appendChild(buttonContainer);
    controls.importButton = addButton('Import from File...', buttonContainer);
    controls.exportButton = addButton('Export to File...', buttonContainer);

    container = addContainer();
    addHeading('Delete Data', container);
    controls.deleteButton = addButton('Erase All Data...', container);

    controls.fileSelector = createFormControl({
      type: 'file',
      id: 'data-import-file-select',
      name: 'data-import-file-select',
      classList: ['form-input-hidden'],
      accept: [
        '.json',
        '.csv',
        'application/json',
        'text/csv',
      ],
    });

    addListeners(this, modalStack);
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
