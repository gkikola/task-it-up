/**
 * Defines the [ConfirmModal]{@link module:confirmModal~ConfirmModal} class.
 * @module confirmModal
 */

import { createFormControl } from '../utility';

/**
 * Object holding the private members for the
 * [ConfirmModal]{@link module:confirmModal~ConfirmModal} class.
 * @typedef {Object} module:confirmModal~ConfirmModal~privates
 * @property {string} title The title for the modal.
 * @property {string} message The message to be displayed in the content of the
 *   modal.
 * @property {string} confirmLabel The label to be used for the confirm button.
 * @property {string} cancelLabel The label to be used for the cancel button.
 * @property {string} initFocus Which button to give initial keyboard focus:
 *   'confirm', 'cancel', or 'none'.
 * @property {module:confirmModal~ConfirmModal~confirmBox} [confirmBox] Holds
 *   options controlling text that the user must enter to confirm the modal.
 * @property {Object} callbacks An object holding callback functions.
 * @property {Function} [callbacks.confirm] A callback function that will be
 *   invoked when the user successfully confirms the modal.
 * @property {Function} [callbacks.cancel] A callback function that will be
 *   invoked when the user cancels the modal.
 * @property {Object} controls An object holding the form input elements for
 *   the modal.
 * @property {HTMLElement} [controls.confirmBox] The text input element for the
 *   confirmation text that the user must enter, if applicable.
 */

/**
 * Holds private data for the
 * [ConfirmModal]{@link module:confirmModal~ConfirmModal} class.
 * @type {WeakMap}
 * @see module:confirmModal~ConfirmModal~privates
 */
const privateMembers = new WeakMap();

/**
 * Initialize the form elements for the modal.
 * @param {module:confirmModal~ConfirmModal} instance The class instance on
 *   which to apply the function.
 */
function initFormControls(instance) {
  const privates = privateMembers.get(instance);
  const { controls } = privates;

  if (controls.confirmBox) {
    const { confirmBox } = privates;

    controls.confirmBox.value = '';
    controls.confirmBox.addEventListener('change', (e) => {
      const { value } = e.target;
      if (value.length > 0) {
        let message = '';
        if (value !== confirmBox.value) message = confirmBox.errorMessage;
        e.target.setCustomValidity(message);
      }
    });
  }
}

/**
 * A modal dialog prompting the user for confirmation.
 * @implements {module:modalStack~Modal}
 */
class ConfirmModal {
  /**
   * Specifies options for text that the user must enter to confirm the action.
   * @typedef {Object} module:confirmModal~ConfirmModal~confirmBox
   * @property {string} [value=confirm] A value that the user must enter in a
   *   text box in order to confirm the action.
   * @property {string} [label] The label for the text box. If not given, a
   *   generic label is created.
   * @property {string} [errorMessage] The validation message that should be
   *   displayed when the user tries to confirm the modal without entering the
   *   correct value. If not given, a generic message is used.
   */

  /**
   * Specifies options for the modal.
   * @typedef {Object} module:confirmModal~ConfirmModal~options
   * @property {string} [title=Confirm] The title for the modal.
   * @property {string} [confirmLabel=Yes] The label to be used for the confirm
   *   button.
   * @property {string} [cancelLabel=No] The label to be used for the cancel
   *   button.
   * @property {string} [initFocus=cancel] Which button to give initial
   *   keyboard focus: 'confirm', 'cancel', or 'none'.
   * @property {module:confirmModal~ConfirmModal~confirmBox} [confirmBox] An
   *   object specifying options for text that the user must enter in order to
   *   confirm the action. If this property is provided, then a textbox will be
   *   displayed and the user will be required to type in the given value
   *   before confirming the modal.
   * @property {Function} [confirm] A callback function that will be invoked
   *   when the user successfully confirms the modal.
   * @property {Function} [cancel] A callback function that will be invoked
   *   when the user cancels the modal.
   */

  /**
   * Initialize the modal.
   * @param {string} message The message that should be displayed to the user.
   * @param {module:confirmModal~ConfirmModal~options} [options={}] Holds
   *   configuration options for the modal.
   */
  constructor(message, options = {}) {
    const privates = {
      title: options.title || 'Confirm',
      message,
      confirmLabel: options.confirmLabel || 'Yes',
      cancelLabel: options.cancelLabel || 'No',
      initFocus: options.initFocus || 'cancel',
      confirmBox: null,
      callbacks: {
        confirm: options.confirm || null,
        cancel: options.cancel || null,
      },
      controls: {
        confirmBox: null,
      },
    };

    const { confirmBox } = options;
    if (options.confirmBox) {
      privates.confirmBox = {
        value: confirmBox.value || 'confirm',
        label: confirmBox.label || `Please enter '${confirmBox.value}':`,
        errorMessage: confirmBox.errorMessage
          || `Please enter '${confirmBox.value}'.`,
      };
    }

    privateMembers.set(this, privates);
  }

  get title() {
    return privateMembers.get(this).title;
  }

  get confirmLabel() {
    return privateMembers.get(this).confirmLabel;
  }

  get cancelLabel() {
    return privateMembers.get(this).cancelLabel;
  }

  get initFocus() {
    return privateMembers.get(this).initFocus;
  }

  addContent(parent) {
    const privates = privateMembers.get(this);
    const { message, confirmBox } = privates;

    let label = document.createElement('p');
    label.classList.add('form-input-label-inline');
    label.textContent = message;
    parent.appendChild(label);

    if (confirmBox) {
      label = document.createElement('p');
      label.classList.add('form-input-label-inline');
      label.textContent = ' ';
      parent.appendChild(label);

      parent.appendChild(createFormControl({
        type: 'text',
        id: 'confirmation-box',
        name: 'confirmation-box',
        classList: ['form-input', 'confirmation-box'],
        required: true,
        placeholder: confirmBox.value,
        label: {
          value: confirmBox.label,
          classList: ['form-input-label-inline'],
        },
        container: { classList: ['form-input-container'] },
      }));

      privates.controls.confirmBox = parent.querySelector('#confirmation-box');
    }

    initFormControls(this);
  }

  confirm() {
    const { confirm } = privateMembers.get(this).callbacks;
    if (confirm) confirm();
  }

  cancel() {
    const { cancel } = privateMembers.get(this).callbacks;
    if (cancel) cancel();
  }

  validate() {
    const { controls } = privateMembers.get(this);
    if (controls.confirmBox && !controls.confirmBox.reportValidity()) {
      return false;
    }
    return true;
  }
}

export default ConfirmModal;
