/**
 * Defines the [DatePickerModal]{@link module:datePickerModal~DatePickerModal}
 * class.
 * @module datePickerModal
 */

import DatePicker from '../datePicker';

/**
 * Object holding private members for the
 * [DatePickerModal]{@link module:datePickerModal~DatePickerModal} class.
 * @typedef {Object} module:datePickerModal~DatePickerModal~privates
 * @property {Object} callbacks An object holding callback functions.
 * @property {Function} [callbacks.confirm] A callback function that will be
 *   invoked when the user successfully confirms the modal.
 * @property {Function} [callbacks.cancel] A callback function that will be
 *   invoked when the user cancels the modal.
 * @property {Date} [stateDate] The default date that is selected when the
 *   modal is opened, if different from today.
 * @property {string} title The title of the modal.
 * @property {module:datePicker~DatePicker} picker The date picker instance.
 */

/**
 * Holds private data for the
 * [DatePickerModal]{@link module:datePickerModal~DatePickerModal} class.
 * @type {WeakMap}
 * @see module:datePickerModal~DatePickerModal~privates
 */
const privateMembers = new WeakMap();

/**
 * A modal dialog for choosing a calendar date.
 * @implements {module:modalStack~Modal}
 */
class DatePickerModal {
  /**
   * Initialize the modal.
   * @param {Object} [options={}] Holds configuration options for the modal.
   * @param {Function} [options.confirm] A callback function that will be
   *   invoked when the user successfully confirms the modal. The selected date
   *   will be passed to the function as an argument.
   * @param {Function} [options.cancel] A callback function that will be
   *   invoked when the user cancels the modal.
   * @param {Date} [options.startDate] The date that will be initially
   *   selected. If not given, then the present date is used.
   * @param {string} [options.title=Select Date] The title of the modal.
   */
  constructor(options = {}) {
    const privates = {
      callbacks: {
        confirm: options.confirm || null,
        cancel: options.cancel || null,
      },
      startDate: options.startDate || null,
      title: options.title || 'Select Date',
      picker: null,
    };
    privateMembers.set(this, privates);
  }

  get title() {
    return privateMembers.get(this).title;
  }

  addContent(parent) {
    const privates = privateMembers.get(this);
    privates.picker = new DatePicker(parent, privates.startDate);
  }

  confirm() {
    const { callbacks, picker } = privateMembers.get(this);
    if (callbacks.confirm) callbacks.confirm(picker.date);
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

export default DatePickerModal;
