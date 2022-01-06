/**
 * Defines the [DatePickerModal]{@link module:datePickerModal~DatePickerModal}
 * class.
 * @module datePickerModal
 */

import DatePicker from '../datePicker';

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
    /**
     * An object holding callback functions.
     * @type {Object}
     * @property {Function} [confirm] A callback function that will be invoked
     *   when the user confirms the modal.
     * @property {Function} [cancel] A callback function that will be invoked
     *   when the user cancels the modal.
     */
    this._callbacks = {
      confirm: options.confirm || null,
      cancel: options.cancel || null,
    }

    /**
     * The default date that is selected when the modal is opened, if different
     * from today.
     * @type {?Date}
     */
    this._startDate = options.startDate || null;

    /**
     * The title of the modal.
     * @type {string}
     */
    this._title = options.title || 'Select Date';

    /**
     * The date picker instance.
     * @type {module:datePicker~DatePicker}
     */
    this._picker = null;
  }

  get title() {
    return this._title;
  }

  get confirmLabel() {
    return 'Okay';
  }

  get cancelLabel() {
    return 'Cancel';
  }

  get noCancelButton() {
    return false;
  }

  addContent(parent) {
    this._picker = new DatePicker(parent, this._startDate);
  }

  confirm() {
    if (this._callbacks.confirm)
      this._callbacks.confirm(this._picker.date);
  }

  cancel() {
    if (this._callbacks.cancel)
      this._callbacks.cancel();
  }

  validate() {
    return true;
  }
}

export default DatePickerModal;
