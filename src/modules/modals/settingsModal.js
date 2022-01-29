/**
 * Defines the [SettingsModal]{@link module:settingsModal~SettingsModal} class.
 * @module settingsModal
 */

import Settings from '../settings';
import { createFormControl } from '../utility';

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
 */

/**
 * Holds private data for the
 * [SettingsModal]{@link module:settingsModal~SettingsModal} class.
 * @type {WeakMap}
 * @see module:settingsModal~SettingsModal~privates
 */
const privateMembers = new WeakMap();

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

  /* eslint-disable-next-line class-methods-use-this --
   * Temporary until content is added.
   */
  addContent(parent) {
    const dateFormats = [
      'local',
      'iso',
      'month-day-year',
      'day-month-year',
      'year-month-day',
    ].map((value) => {
      const format = Settings.lookupDateFormat(value).visual;
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

    const container = document.createElement('div');
    container.classList.add('form-input-container');

    let label = document.createElement('div');
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
      id: 'settings-delete-task-day-count',
      name: 'settings-delete-task-day-count',
      value: '1',
      classList: ['form-input-inline', 'form-input-count'],
      required: true,
      min: 0,
    }));
    label = document.createElement('label');
    label.classList.add('form-input-label-inline');
    label.htmlFor = 'settings-delete-task-day-count';
    label.textContent = ' days';
    optionContainer.appendChild(label);

    container.appendChild(optionContainer);
    parent.appendChild(container);
  }

  confirm() {
    const { callbacks, settings } = privateMembers.get(this);
    if (callbacks.confirm) callbacks.confirm(settings);
  }

  cancel() {
    const { callbacks } = privateMembers.get(this);
    if (callbacks.cancel) callbacks.cancel();
  }

  /* eslint-disable-next-line class-methods-use-this --
   * Necessary since modal must have validate function in order to satisfy
   * Modal interface.
   */
  validate() {
    return true;
  }
}

export default SettingsModal;
