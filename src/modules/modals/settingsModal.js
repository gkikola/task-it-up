/**
 * Defines the [SettingsModal]{@link module:settingsModal~SettingsModal} class.
 * @module settingsModal
 */

import Settings from '../settings';
import { isLocalStorageSupported } from '../storage';
import { createFormControl } from '../utility/dom';

/**
 * Object holding private members for the
 * [SettingsModal]{@link module:settingsModal~SettingsModal} class.
 * @typedef {Object} module:settingsModal~SettingsModal~privates
 * @property {module:settings~Settings} settings The app settings being
 *   modified.
 * @property {Object} callbacks An object holding callback functions.
 * @property {Function} [callbacks.confirm] A callback function that will be
 *   invoked when the user successfully confirms the modal.
 * @property {Function} [callbacks.cancel] A callback function that will be
 *   invoked when the user cancels the modal.
 * @property {Object} [controls] An object holding the form input elements for
 *   the modal.
 * @property {HTMLElement} controls.saveLocal The radio button element for
 *   indicating that data should be saved to local storage.
 * @property {HTMLElement} controls.saveNever The radio button element for
 *   indicating that data should not be saved.
 * @property {HTMLElement} controls.dateFormat The select element for the date
 *   format.
 * @property {HTMLElement} controls.deleteOld The checkbox element indicating
 *   whether to delete old completed tasks.
 * @property {HTMLElement} controls.deleteAfter The input element for entering
 *   the number of days after which to delete completed tasks.
 * @property {HTMLElement} controls.deleteAfterLabel The label element for the
 *   deleteAfter control.
 */

/**
 * Holds private data for the
 * [SettingsModal]{@link module:settingsModal~SettingsModal} class.
 * @type {WeakMap}
 * @see module:settingsModal~SettingsModal~privates
 */
const privateMembers = new WeakMap();

/**
 * Initialize the values of the form elements based on current settings.
 * @param {module:settingsModal~SettingsModal} instance The class instance on
 *   which to apply the function.
 */
function initFormValues(instance) {
  const { controls, settings } = privateMembers.get(instance);

  switch (settings.storageMethod) {
    case 'none':
      controls.saveNever.checked = true;
      break;
    case 'local':
    default:
      controls.saveLocal.checked = true;
      break;
  }

  controls.dateFormat.value = settings.dateFormat.type;

  const deleteOld = settings.deleteAfter !== null;
  controls.deleteOld.checked = deleteOld;
  if (deleteOld) controls.deleteAfter.value = settings.deleteAfter.toString();

  // Disable storage options if local storage is unsupported or disabled
  if (!isLocalStorageSupported()) {
    controls.saveNever.disabled = true;
    controls.saveLocal.disabled = true;
  }
}

/**
 * Add the event listeners to the form controls in the modal.
 * @param {module:settingsModal~SettingsModal} instance The class instance on
 *   which to apply the function.
 */
function addListeners(instance) {
  const { controls } = privateMembers.get(instance);
  const fireEvent = (input) => input.dispatchEvent(new Event('change'));

  controls.deleteOld.addEventListener('change', (e) => {
    controls.deleteAfter.disabled = !e.target.checked;
  });
  fireEvent(controls.deleteOld);

  // Make delete-after label singular/plural based on value
  controls.deleteAfter.addEventListener('change', (e) => {
    const count = Number(e.target.value);
    if (e.target.value.length > 0 && Number.isFinite(count)) {
      const label = count === 1 ? ' day' : ' days';
      controls.deleteAfterLabel.textContent = label;
    }
  });
  fireEvent(controls.deleteAfter);
}

/**
 * A modal dialog for modifying user settings.
 * @implements {module:modalStack~Modal}
 */
class SettingsModal {
  /**
   * Specifies options for the modal.
   * @typedef {Object} module:settingsModal~SettingsModal~options
   * @property {Function} [confirm] A callback function that will be invoked
   *   when the user successfully confirms the modal. The function will be
   *   passed a reference to the modified [Settings]{module:settings~Settings}
   *   instance.
   * @property {Function} [cancel] A callback function that will be invoked
   *   when the user cancels the modal.
   */

  /**
   * Initialize the modal.
   * @param {module:settings~Settings} settings The app settings being
   *   modified.
   * @param {module:settingsModal~SettingsModal~options} [options={}] Holds
   *   configuration options for the modal.
   */
  constructor(settings, options = {}) {
    const privates = {
      settings,
      callbacks: {
        confirm: options.confirm || null,
        cancel: options.cancel || null,
      },
      controls: {
        saveLocal: null,
        saveNever: null,
        dateFormat: null,
        deleteOld: null,
        deleteAfter: null,
        deleteAfterLabel: null,
      },
    };
    privateMembers.set(this, privates);
  }

  /* eslint-disable-next-line class-methods-use-this --
   * Need to set title to conform to Modal interface, but setting property
   * directly in constructor would allow external modification.
   */
  get title() {
    return 'Edit Settings';
  }

  addContent(parent) {
    let container = document.createElement('div');
    container.classList.add('form-input-container');

    let label = document.createElement('div');
    label.classList.add('form-input-label');
    label.textContent = 'Data Storage';
    container.appendChild(label);

    container.appendChild(createFormControl({
      type: 'radio',
      id: 'settings-save-local',
      name: 'settings-save-method',
      value: 'local',
      label: {
        value: 'Save data in browser\'s local storage area',
        classList: ['form-input-label-inline'],
      },
      container: { classList: ['form-input-item-container'] },
    }));
    container.appendChild(createFormControl({
      type: 'radio',
      id: 'settings-save-never',
      name: 'settings-save-method',
      value: 'never',
      label: {
        value: 'Do not save data',
        classList: ['form-input-label-inline'],
      },
      container: { classList: ['form-input-item-container'] },
    }));
    parent.appendChild(container);

    const dateFormats = [
      'local',
      'iso',
      'month-day-year',
      'day-month-year',
      'year-month-day',
    ].map((value) => {
      const format = Settings.lookupDateFormat(value).visualPattern;
      let description;
      switch (value) {
        case 'local':
          description = 'Local Format';
          break;
        case 'iso':
          description = 'ISO';
          break;
        case 'month-day-year':
          description = 'Month/Day/Year';
          break;
        case 'day-month-year':
          description = 'Day/Month/Year';
          break;
        case 'year-month-day':
          description = 'Year/Month/Day';
          break;
        default:
          break;
      }

      return { value, label: `${description}: ${format}` };
    });
    parent.appendChild(createFormControl({
      type: 'select',
      id: 'settings-date-format',
      name: 'settings-date-format',
      classList: ['form-select'],
      label: { value: 'Date Format', classList: ['form-input-label'] },
      container: { classList: ['form-input-container'] },
      menuItems: dateFormats,
    }));

    container = document.createElement('div');
    container.classList.add('form-input-container');

    label = document.createElement('div');
    label.classList.add('form-input-label');
    label.textContent = 'Additional Options';
    container.appendChild(label);

    const optionContainer = document.createElement('div');
    optionContainer.classList.add('form-input-item-container');
    optionContainer.appendChild(createFormControl({
      type: 'checkbox',
      id: 'settings-delete-old-tasks',
      name: 'settings-delete-tasks',
      value: 'delete-old',
    }));
    label = document.createElement('label');
    label.classList.add('form-input-label-inline');
    label.htmlFor = 'settings-delete-old-tasks';
    label.textContent = 'Delete completed tasks after ';
    optionContainer.appendChild(label);

    optionContainer.appendChild(createFormControl({
      type: 'number',
      id: 'settings-delete-after',
      name: 'settings-delete-after',
      value: '14',
      classList: ['form-input-inline', 'form-input-count'],
      required: true,
      min: 0,
    }));
    label = document.createElement('label');
    label.id = 'settings-delete-after-label';
    label.classList.add('form-input-label-inline');
    label.htmlFor = 'settings-delete-after';
    label.textContent = ' days';
    optionContainer.appendChild(label);

    container.appendChild(optionContainer);
    parent.appendChild(container);

    const { controls } = privateMembers.get(this);
    controls.saveLocal = parent.querySelector('#settings-save-local');
    controls.saveNever = parent.querySelector('#settings-save-never');
    controls.dateFormat = parent.querySelector('#settings-date-format');
    controls.deleteOld = parent.querySelector('#settings-delete-old-tasks');
    controls.deleteAfter = parent.querySelector('#settings-delete-after');
    controls.deleteAfterLabel = parent.querySelector(
      '#settings-delete-after-label',
    );

    initFormValues(this);
    addListeners(this);
  }

  confirm() {
    const { callbacks, controls, settings } = privateMembers.get(this);

    if (!controls.saveLocal.disabled) {
      settings.storageMethod = controls.saveLocal.checked ? 'local' : 'none';
    }

    settings.setDateFormat(controls.dateFormat.value);

    if (controls.deleteOld.checked) {
      settings.deleteAfter = Number(controls.deleteAfter.value);
    } else {
      settings.deleteAfter = null;
    }

    if (callbacks.confirm) callbacks.confirm(settings);
  }

  cancel() {
    const { callbacks } = privateMembers.get(this);
    if (callbacks.cancel) callbacks.cancel();
  }

  validate() {
    const { controls } = privateMembers.get(this);

    if (controls.deleteOld.checked) {
      if (!controls.deleteAfter.reportValidity()) return false;
    }

    return true;
  }
}

export default SettingsModal;
