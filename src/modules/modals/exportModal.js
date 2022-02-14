/**
 * Defines the [ExportModal]{@link module:exportModal~ExportModal} class.
 * @module exportModal
 */

import { createFormControl } from '../utility';

/**
 * Object holding private members for the
 * [ExportModal]{@link module:exportModal~ExportModal} class.
 * @typedef {Object} module:exportModal~ExportModal~privates
 * @property {Object} callbacks An object holding callback functions.
 * @property {Function} [callbacks.confirm] A callback function that will be
 *   invoked when the user successfully confirms the modal.
 * @property {Function} [callbacks.cancel] A callback function that will be
 *   invoked when the user cancels the modal.
 * @property {Object} controls An object holding the form input elements for
 *   the modal.
 * @property {HTMLElement} controls.exportJson The radio button for selecting
 *   the JSON file format.
 * @property {HTMLElement} controls.exportCsv The radio button for selecting
 *   the CSV file format.
 * @property {HTMLElement} controls.newlineSequence The select box for choosing
 *   the newline style.
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
   * @param {Object} [options] An object specifying additional file options.
   * @param {string} [options.newlineSequence] The character sequence to use
   *   for newlines.
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
      controls: {
        exportJson: null,
        exportCsv: null,
        newlineSequence: null,
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
    const radioLabel = (value) => (
      { value, classList: ['form-input-label-inline'] }
    );

    const container = document.createElement('div');
    container.classList.add('form-input-container');

    const label = document.createElement('div');
    label.classList.add('form-input-label');
    label.textContent = 'File Format';
    container.appendChild(label);

    container.appendChild(createFormControl({
      type: 'radio',
      id: 'export-format-json',
      name: 'export-format',
      value: 'json',
      checked: true,
      label: radioLabel('Export all data to JSON format'),
      container: { classList: ['form-input-item-container'] },
    }));
    container.appendChild(createFormControl({
      type: 'radio',
      id: 'export-format-csv',
      name: 'export-format',
      value: 'csv',
      label: radioLabel('Export tasks to CSV format'),
      container: { classList: ['form-input-item-container'] },
    }));

    parent.appendChild(container);

    parent.appendChild(createFormControl({
      type: 'select',
      id: 'export-line-ending',
      name: 'export-line-ending',
      classList: ['form-select'],
      label: { value: 'Line Ending Style', classList: ['form-input-label'] },
      container: { classList: ['form-input-container'] },
      menuItems: [
        {
          value: 'crlf',
          label: 'Windows Standard: CRLF',
          selected: true,
        },
        {
          value: 'lf',
          label: 'Unix Standard: LF',
        },
        {
          value: 'cr',
          label: 'Classic Mac OS Standard (Before OS X): CR',
        },
      ],
    }));

    const { controls } = privateMembers.get(this);
    controls.exportJson = parent.querySelector('#export-format-json');
    controls.exportCsv = parent.querySelector('#export-format-csv');
    controls.newlineSequence = parent.querySelector('#export-line-ending');
  }

  confirm() {
    const { callbacks, controls } = privateMembers.get(this);

    if (callbacks.confirm) {
      const fileType = controls.exportJson.checked ? 'json' : 'csv';
      let newlineSequence;
      switch (controls.newlineSequence.value) {
        case 'lf':
          newlineSequence = '\n';
          break;
        case 'cr':
          newlineSequence = '\r';
          break;
        case 'crlf':
        default:
          newlineSequence = '\r\n';
          break;
      }
      callbacks.confirm(fileType, { newlineSequence });
    }
  }

  cancel() {
    const callback = privateMembers.get(this).callbacks.cancel;
    if (callback) callback();
  }

  /* eslint-disable-next-line class-methods-use-this --
   * Necessary since modal must have validate function in order to satisfy
   * Modal interface.
   */
  validate() {
    return true;
  }
}

export default ExportModal;
