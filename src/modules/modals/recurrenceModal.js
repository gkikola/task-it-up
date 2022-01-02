/**
 * Defines the [RecurrenceModal]{@link module:recurrenceModal~RecurrenceModal}
 * class.
 * @module recurrenceModal
 */

import DatePickerModal from './datePickerModal';
import RecurringDate from '../recurringDate';
import {
  createDateInputField,
  createFormControl,
  createToggleButton,
} from '../utility';

import ordinal from 'ordinal';
import { create } from 'lodash';

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * A modal dialog for selecting a recurring date.
 * @implements {module:modalStack~Modal}
 */
class RecurrenceModal {
  /**
   * Initialize the modal.
   * @param {Object} [options={}] Holds configuration options for the modal.
   * @param {Function} [options.confirm] A callback function that will be
   *   invoked when the user successfully confirms the modal. The function will
   *   be passed the recurring date that was selected.
   * @param {Function} [options.cancel] A callback function that will be
   *   invoked when the user cancels the modal.
   * @param {module:recurringDate~RecurringDate} [options.initial] A recurring
   *   date to use as a default when initializing the form controls.
   */
  constructor(options = {}) {
    /**
     * The recurring date to use as a default when initializing the form
     * controls, if any.
     * @type {module:recurringDate~RecurringDate}
     */
    this._initialRecurrence = options.initial || null;

    /**
     * An object holding callback functions.
     * @type {Object}
     * @property {Function} [confirm] A callback function that will be invoked
     *   when the user successfully confirms the modal.
     * @property {Function} [cancel] A callback function that will be invoked
     *   when the user cancels the modal.
     */
    this._callbacks = {
      confirm: options.confirm || null,
      cancel: options.cancel || null,
    };

    /**
     * An object holding the various container elements used in the modal's
     * contents.
     * @type {Object}
     * @property {HTMLElement} parent The parent container element holding all
     *   the form elements.
     * @property {HTMLElement} context The container element holding
     *   context-sensitive options that depend on the selected interval unit.
     * @property {HTMLElement} weekOptions The container element holding the
     *   form elements specific to weekly recurrences.
     * @property {HTMLElement} monthOptions The container element holding the
     *   form elements specific to monthly recurrences.
     * @property {HTMLElement} yearOptions The container element holding the
     *   form elements specific to yearly recurrences.
     */
    this._containers = {
      parent: null,
      context: null,
      weekOptions: null,
      monthOptions: null,
      yearOptions: null,
    };
  }

  get title() {
    return 'Edit Recurring Date';
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

  addContent(parent, modalStack) {
    let container, optionContainer, label;
    container = document.createElement('div');
    container.classList.add('form-input-container');
    container.appendChild(createFormControl({
      type: 'number',
      id: 'recurring-date-interval-length',
      name: 'recurring-date-interval-length',
      value: '1',
      classList: ['form-input-inline', 'form-input-count'],
      container: { inline: true },
      label: {
        value: 'Repeat every ',
        classList: ['form-input-label-inline'],
      },
    }));

    label = document.createElement('span');
    label.classList.add('form-input-label-inline');
    label.textContent = ' ';
    container.appendChild(label);

    container.appendChild(createFormControl({
      type: 'select',
      id: 'recurring-date-interval-unit',
      name: 'recurring-date-interval-unit',
      classList: ['form-select-inline'],
      menuItems: [
        { value: 'day', label: 'Day' },
        { value: 'week', label: 'Week', selected: true },
        { value: 'month', label: 'Month' },
        { value: 'year', label: 'Year' },
      ],
    }));
    parent.appendChild(container);

    const contextContainer = document.createElement('div');
    parent.appendChild(contextContainer);

    container = document.createElement('div');
    container.classList.add('form-input-container');

    label = document.createElement('div');
    label.classList.add('form-input-label-inline');
    label.textContent = 'Stop repeating';
    container.appendChild(label);

    container.appendChild(createFormControl({
      type: 'radio',
      id: 'recurring-date-end-type-never',
      name: 'recurring-date-end-type',
      value: 'never',
      checked: true,
      label: { value: 'Never', classList: ['form-input-label-inline'] },
      container: { classList: ['form-input-item-container'] },
    }));

    optionContainer = document.createElement('div');
    optionContainer.classList.add('form-input-item-container');
    optionContainer.appendChild(createFormControl({
      type: 'radio',
      id: 'recurring-date-end-type-date',
      name: 'recurring-date-end-type',
      value: 'date',
    }));

    label = document.createElement('label');
    label.classList.add('form-input-label-inline');
    label.htmlFor = 'recurring-date-end-type-date';
    label.textContent = 'On date ';
    optionContainer.appendChild(label);

    optionContainer.appendChild(createDateInputField({
      id: 'recurring-date-end-date',
      name: 'recurring-date-end-date',
      classList: ['form-input-inline'],
      container: {
        classList: ['form-input-date-container-inline'],
        inline: true,
      },
      button: {
        classList: ['form-button'],
        callback: input => this._pickDate(input, modalStack),
      },
    }));
    container.appendChild(optionContainer);

    optionContainer = document.createElement('div');
    optionContainer.classList.add('form-input-item-container');
    optionContainer.appendChild(createFormControl({
      type: 'radio',
      id: 'recurring-date-end-type-count',
      name: 'recurring-date-end-type',
      value: 'count',
    }));

    label = document.createElement('label');
    label.classList.add('form-input-label-inline');
    label.htmlFor = 'recurring-date-end-type-count';
    label.textContent = 'After ';
    optionContainer.appendChild(label);

    optionContainer.appendChild(createFormControl({
      type: 'number',
      id: 'recurring-date-end-count',
      name: 'recurring-date-end-count',
      value: '1',
      classList: ['form-input-inline', 'form-input-count'],
    }));

    label = document.createElement('label');
    label.classList.add('form-input-label-inline');
    label.htmlFor = 'recurring-date-end-count';
    label.textContent = ' occurrences';
    optionContainer.appendChild(label);
    container.appendChild(optionContainer);

    parent.appendChild(container);

    container = document.createElement('div');
    container.classList.add('form-input-container');

    label = document.createElement('div');
    label.classList.add('form-input-label-inline');
    label.textContent = 'Additional options:';
    container.appendChild(label);

    optionContainer = document.createElement('div');
    optionContainer.classList.add('form-input-item-container');

    optionContainer.appendChild(createFormControl({
      type: 'checkbox',
      id: 'recurring-date-use-start-date',
      name: 'recurring-date-additional-options',
      value: 'use-start-date',
    }));

    label = document.createElement('label');
    label.classList.add('form-input-label-inline');
    label.htmlFor = 'recurring-date-use-start-date';
    label.textContent = 'Start on ';
    optionContainer.appendChild(label);

    optionContainer.appendChild(createDateInputField({
      id: 'recurring-date-start-date',
      name: 'recurring-date-start-date',
      classList: ['form-input-inline'],
      container: {
        classList: ['form-input-date-container-inline'],
        inline: true,
      },
      button: {
        classList: ['form-button'],
        callback: input => this._pickDate(input, modalStack),
      },
    }));
    container.appendChild(optionContainer);

    container.appendChild(createFormControl({
      type: 'checkbox',
      id: 'recurring-date-allow-past',
      name: 'recurring-date-additional-options',
      value: 'allow-past-occurrences',
      label: {
        value: 'Allow occurrences in the past',
        classList: ['form-input-label-inline'],
      },
      container: { classList: ['form-input-item-container'] },
    }));

    optionContainer = document.createElement('div');
    optionContainer.classList.add('form-input-item-container');

    optionContainer.appendChild(createFormControl({
      type: 'checkbox',
      id: 'recurring-date-no-weekend',
      name: 'recurring-date-additional-options',
      value: 'no-weekend',
    }));

    label = document.createElement('label');
    label.classList.add('form-input-label-inline');
    label.htmlFor = 'recurring-date-no-weekend';
    label.textContent = 'On weekends, use ';
    optionContainer.appendChild(label);

    optionContainer.appendChild(createFormControl({
      type: 'select',
      id: 'recurring-date-weekend-select',
      name: 'recurring-date-weekend-select',
      classList: ['form-select-inline'],
      menuItems: [
        { value: 'previous-weekday', label: 'previous', selected: true },
        { value: 'next-weekday', label: 'next' },
      ],
    }));

    label = document.createElement('label');
    label.classList.add('form-input-label-inline');
    label.htmlFor = 'recurring-date-weekend-select';
    label.textContent = ' weekday';
    optionContainer.appendChild(label);
    container.appendChild(optionContainer);

    parent.appendChild(container);

    const weekOptions = this._createWeekContextForm();
    const monthOptions = this._createMonthContextForm();
    const yearOptions = this._createYearContextForm();

    this._containers = {
      parent,
      context: contextContainer,
      weekOptions,
      monthOptions,
      yearOptions,
    };

    this._initFormValues();
    this._addListeners();
  }

  confirm() {
    if (this._callbacks.confirm)
      this._callbacks.confirm(new RecurringDate('day'));
  }

  cancel() {
    if (this._callbacks.cancel)
      this._callbacks.cancel();
  }

  validate() {
    return true;
  }

  /**
   * Select a form control in the modal.
   * @param {string} idSuffix The identifier of the control to retrieve,
   *   without the 'recurring-date-' prefix.
   * @returns {HTMLElement} The requested element, or undefined if not found.
   */
  _getControl(idSuffix) {
    return this._containers.parent.querySelector(`#recurring-date-${idSuffix}`);
  }

  /**
   * Create the form elements for the context options for weekly recurrences.
   * @returns {HTMLElement} The container element holding the form elements.
   */
  _createWeekContextForm() {
    const container = document.createElement('div');
    container.classList.add('form-input-container');

    let label = document.createElement('div');
    label.classList.add('form-input-label-inline');
    label.textContent = 'Repeat on';
    container.appendChild(label);

    container.appendChild(createFormControl({
      type: 'radio',
      id: 'recurring-date-week-type-previous',
      name: 'recurring-date-week-type',
      value: 'use-previous',
      checked: true,
      label: {
        value: 'The same day of the week as last occurrence',
        classList: ['form-input-label-inline'],
      },
      container: { classList: ['form-input-item-container'] },
    }));

    const optionContainer = document.createElement('div');
    optionContainer.classList.add('form-input-item-container');

    optionContainer.appendChild(createFormControl({
      type: 'radio',
      id: 'recurring-date-week-type-select-days',
      name: 'recurring-date-week-type',
      value: 'select-days',
    }));

    label = document.createElement('label');
    label.classList.add('form-input-label-inline');
    label.textContent = 'These days: ';
    label.htmlFor = 'recurring-date-week-type-select-days';
    optionContainer.appendChild(label);

    const days = WEEKDAYS.map(day => {
      return { name: day, value: day.toLowerCase(), short: day.slice(0, 1) };
    });
    days.forEach(day => {
      optionContainer.appendChild(createToggleButton(day.short, {
        id: `recurring-date-weekday-${day.value}`,
        name: 'recurring-date-weekday',
        value: day.value,
        classList: ['toggle-button', 'form-weekday-button'],
      }));
    });
    container.appendChild(optionContainer);

    return container;
  }

  /**
   * Create the form elements for the context options for monthly recurrences.
   * @returns {HTMLElement} The container element holding the form elements.
   */
  _createMonthContextForm() {
    const container = document.createElement('div');
    container.classList.add('form-input-container');

    let label, optionContainer, selectItems;

    label = document.createElement('div');
    label.classList.add('form-input-label-inline');
    label.textContent = 'Repeat on';
    container.appendChild(label);

    container.appendChild(createFormControl({
      type: 'radio',
      id: 'recurring-date-month-type-previous',
      name: 'recurring-date-month-type',
      value: 'use-previous',
      checked: true,
      label: {
        value: 'The same day of the month as last occurrence',
        classList: ['form-input-label-inline'],
      },
      container: { classList: ['form-input-item-container'] },
    }));

    optionContainer = document.createElement('div');
    optionContainer.classList.add('form-input-item-container');
    optionContainer.appendChild(createFormControl({
      type: 'radio',
      id: 'recurring-date-month-type-day',
      name: 'recurring-date-month-type',
      value: 'day-of-month',
    }));

    label = document.createElement('label');
    label.classList.add('form-input-label-inline');
    label.htmlFor = 'recurring-date-month-type-day';
    label.textContent = 'The ';
    optionContainer.appendChild(label);

    selectItems = [];
    for (let day = 1; day <= 31; day++)
      selectItems.push({ value: day.toString(), label: ordinal(day) });
    optionContainer.appendChild(createFormControl({
      type: 'select',
      id: 'recurring-date-month-day',
      name: 'recurring-date-month-day',
      classList: ['form-select-inline'],
      menuItems: selectItems,
    }));

    label = document.createElement('label');
    label.classList.add('form-input-label-inline');
    label.htmlFor = 'recurring-date-month-day';
    label.textContent = ' day of the month';
    optionContainer.appendChild(label);

    container.appendChild(optionContainer);

    optionContainer = document.createElement('div');
    optionContainer.classList.add('form-input-item-container');
    optionContainer.appendChild(createFormControl({
      type: 'radio',
      id: 'recurring-date-month-type-week',
      name: 'recurring-date-month-type',
      value: 'week-of-month',
    }));

    label = document.createElement('label');
    label.classList.add('form-input-label-inline');
    label.htmlFor = 'recurring-date-month-type-week';
    label.textContent = 'The ';
    optionContainer.appendChild(label);

    selectItems = [];
    for (let week = 1; week <= 5; week++)
      selectItems.push({ value: week.toString(), label: ordinal(week) });
    optionContainer.appendChild(createFormControl({
      type: 'select',
      id: 'recurring-date-month-week-number',
      name: 'recurring-date-month-week-number',
      classList: ['form-select-inline'],
      menuItems: selectItems,
    }));

    label = document.createElement('span');
    label.classList.add('form-input-label-inline');
    label.textContent = ' ';
    optionContainer.appendChild(label);

    selectItems = WEEKDAYS.map(day => {
      return { value: day.toLowerCase(), label: day };
    });
    optionContainer.appendChild(createFormControl({
      type: 'select',
      id: 'recurring-date-month-week-day',
      name: 'recurring-date-month-week-day',
      classList: ['form-select-inline'],
      menuItems: selectItems,
    }));

    label = document.createElement('label');
    label.classList.add('form-input-label-inline');
    label.htmlFor = 'recurring-date-month-week-day';
    label.textContent = ' of the month';
    optionContainer.appendChild(label);

    container.appendChild(optionContainer);
    return container;
  }

  /**
   * Create the form elements for the context options for yearly recurrences.
   * @returns {HTMLElement} The container element holding the form elements.
   */
  _createYearContextForm() {
    const container = document.createElement('div');
    container.classList.add('form-input-container');

    let label, optionContainer, selectItems;

    label = document.createElement('div');
    label.classList.add('form-input-label-inline');
    label.textContent = 'Repeat on';
    container.appendChild(label);

    container.appendChild(createFormControl({
      type: 'radio',
      id: 'recurring-date-year-type-previous',
      name: 'recurring-date-year-type',
      value: 'use-previous',
      checked: true,
      label: {
        value: 'The same month and day as last occurrence',
        classList: ['form-input-label-inline'],
      },
      container: { classList: ['form-input-item-container'] },
    }));

    optionContainer = document.createElement('div');
    optionContainer.classList.add('form-input-item-container');
    optionContainer.appendChild(createFormControl({
      type: 'radio',
      id: 'recurring-date-year-type-day',
      name: 'recurring-date-year-type',
      value: 'month-and-day',
    }));

    label = document.createElement('label');
    label.classList.add('form-input-label-inline');
    label.htmlFor = 'recurring-date-year-type-day';
    label.textContent = 'On ';
    optionContainer.appendChild(label);

    selectItems = MONTHS.map(month => {
      return { value: month.toLowerCase(), label: month };
    });
    optionContainer.appendChild(createFormControl({
      type: 'select',
      id: 'recurring-date-year-month',
      name: 'recurring-date-year-month',
      classList: ['form-select-inline'],
      menuItems: selectItems,
    }));

    label = document.createElement('span');
    label.classList.add('form-input-label-inline');
    label.textContent = ' ';
    optionContainer.appendChild(label);

    selectItems = [];
    for (let day = 1; day <= 31; day++)
      selectItems.push({ value: day.toString(), label: ordinal(day) });
    optionContainer.appendChild(createFormControl({
      type: 'select',
      id: 'recurring-date-year-day',
      name: 'recurring-date-year-day',
      classList: ['form-select-inline'],
      menuItems: selectItems,
    }));
    container.appendChild(optionContainer);

    return container;
  }

  /**
   * Initialize the values of the form elements based on the initial recurrence
   * that was passed to the constructor, if any.
   */
  _initFormValues() {
    this._updateContextContainer();
  }

  /**
   * Add the event listeners to the form controls in the modal.
   */
  _addListeners() {
    this._getControl('interval-unit').addEventListener('change', () => {
      this._updateContextContainer();
    });
  }

  /**
   * Update the contents of the container holding context-sensitive options,
   * based on the selected interval unit.
   */
  _updateContextContainer() {
    const containers = this._containers;
    const contextContainer = containers.context;

    while (contextContainer.firstChild)
      contextContainer.removeChild(contextContainer.firstChild);

    switch (this._getControl('interval-unit').value) {
      case 'week':
        contextContainer.appendChild(containers.weekOptions);
        break;
      case 'month':
        contextContainer.appendChild(containers.monthOptions);
        break;
      case 'year':
        contextContainer.appendChild(containers.yearOptions);
        break;
    }
  }

  /**
   * Opens a date picker and updates the given input field with the selected
   * date.
   * @param {HTMLElement} input The text input field where the date is being
   *   entered.
   * @param {module:modalStack~ModalStack} modalStack The modal stack in which
   *   the modal has been inserted.
   */
  _pickDate(input, modalStack) {
    modalStack.showModal(new DatePickerModal());
  }
}

export default RecurrenceModal;
