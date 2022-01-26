/**
 * Defines the [SettingsModal]{@link module:settingsModal~SettingsModal} class.
 * @module settingsModal
 */

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
    const message = document.createElement('p');
    message.textContent = 'TODO: Add Settings';
    parent.appendChild(message);
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
