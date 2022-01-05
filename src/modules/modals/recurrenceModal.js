/**
 * Defines the [RecurrenceModal]{@link module:recurrenceModal~RecurrenceModal}
 * class.
 * @module recurrenceModal
 */

import DatePickerModal from './datePickerModal';
import RecurringDate from '../recurringDate';
import Settings from '../settings';
import {
  createDateInputField,
  createFormControl,
  createToggleButton,
  formatDate,
  parseDate,
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

const UNITS = [
  { value: 'day', singular: 'Day', plural: 'Days' },
  { value: 'week', singular: 'Week', plural: 'Weeks' },
  { value: 'month', singular: 'Month', plural: 'Months' },
  { value: 'year', singular: 'Year', plural: 'Years' },
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
   * @param {module:settings~Settings~dateFormat} [options.dateFormat] An
   *   object holding information about the calendar date format to use for
   *   date fields. If not given, then the browser default is used.
   */
  constructor(options = {}) {
    /**
     * The recurring date to use as a default when initializing the form
     * controls, if any.
     * @type {module:recurringDate~RecurringDate}
     */
    this._initialRecurrence = options.initial || null;

    /**
     * An object holding date format information.
     * @type {module:settings~Settings~dateFormat}
     */
    this._dateFormat = options.dateFormat || Settings.lookupDateFormat();

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
      menuItems: UNITS.map(unit => {
        const selected = unit.value === 'week';
        return { value: unit.value, label: unit.singular, selected };
      }),
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
      placeholder: this._dateFormat.visual,
      classList: ['form-input-inline'],
      container: {
        classList: ['form-input-date-container-inline'],
        inline: true,
      },
      button: {
        id: 'recurring-date-end-date-button',
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
    label.id = 'recurring-date-end-count-label';
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
      placeholder: this._dateFormat.visual,
      classList: ['form-input-inline'],
      container: {
        classList: ['form-input-date-container-inline'],
        inline: true,
      },
      button: {
        id: 'recurring-date-start-date-button',
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
   * @param {string} [container] The container in which to look for the
   *   control. If not given, then the modal content container is used.
   * @returns {HTMLElement} The requested element, or undefined if not found.
   */
  _getControl(idSuffix, container) {
    if (!container)
      container = this._containers.parent;
    return container.querySelector(`#recurring-date-${idSuffix}`);
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
    const containers = this._containers;
    const initial = this._initialRecurrence;

    if (initial) {
      this._getControl('interval-length').value = initial.intervalLength;
      this._getControl('interval-unit').value = initial.intervalUnit;

      let context;
      switch (initial.intervalUnit) {
        case 'week':
          context = containers.weekOptions;
          if (initial.daysOfWeek) {
            this._getControl('week-type-select-days', context).checked = true;
            initial.daysOfWeek.forEach(day => {
              const id = `weekday-${WEEKDAYS[day].toLowerCase()}`;
              const button = this._getControl(id, context);
              if (button)
                button.classList.add('active');
            });
          } else {
            this._getControl('week-type-previous', context).checked = true;
          }
          break;
        case 'month':
          context = containers.monthOptions;
          if (initial.dayOfMonth) {
            this._getControl('month-type-day', context).checked = true;
            this._getControl('month-day', context).value = initial.dayOfMonth;
          } else if (initial.weekNumber && initial.daysOfWeek
            && initial.daysOfWeek.length === 1) {
            this._getControl('month-type-week', context).checked = true;
            const weekSelect = this._getControl('month-week-number', context);
            const daySelect = this._getControl('month-week-day', context);
            weekSelect.value = initial.weekNumber;
            daySelect.value = WEEKDAYS[initial.daysOfWeek[0]].toLowerCase();
          } else {
            this._getControl('month-type-previous', context).checked = true;
          }
          break;
        case 'year':
          context = containers.yearOptions;
          if (initial.month && initial.dayOfMonth) {
            this._getControl('year-type-day', context).checked = true;
            const monthSelect = this._getControl('year-month', context);
            const daySelect = this._getControl('year-day', context);
            monthSelect.value = MONTHS[initial.month].toLowerCase();
            daySelect.value = initial.dayOfMonth;
          } else {
            this._getControl('year-type-previous', context).checked = true;
          }
          break;
      }

      if (initial.endDate) {
        this._getControl('end-type-date').checked = true;
        const input = this._getControl('end-date');
        input.value = formatDate(initial.endDate, this._dateFormat.internal);
      } else if (initial.maxCount) {
        this._getControl('end-type-count').checked = true;
        this._getControl('end-count').value = initial.maxCount;
      } else {
        this._getControl('end-type-never').checked = true;
      }

      if (initial.startDate) {
        this._getControl('use-start-date').checked = true;
        const input = this._getControl('start-date');
        input.value = formatDate(initial.startDate, this._dateFormat.internal);
      }

      if (initial.allowPastOccurrence) {
        this._getControl('allow-past').checked = true;
      }

      if (initial.onWeekend !== 'no-change') {
        this._getControl('no-weekend').checked = true;
        this._getControl('weekend-select').value = initial.onWeekend;
      }
    }
  }

  /**
   * Add the event listeners to the form controls in the modal.
   */
  _addListeners() {
    const parent = this._containers.parent;
    const fireEvent = input => input.dispatchEvent(new Event('change'));

    // Make units singular or plural based on length
    const lengthSelect = this._getControl('interval-length');
    const unitSelect = this._getControl('interval-unit');
    lengthSelect.addEventListener('change', e => {
      const length = Number.parseInt(e.target.value);

      if (Number.isFinite(length)) {
        const plural = length !== 1;
        UNITS.forEach(unit => {
          const selector = `option[value="${unit.value}"]`;
          const option = unitSelect.querySelector(selector);
          const label = plural ? unit.plural : unit.singular;
          if (option.textContent !== label)
            option.textContent = label;
        });
      }
    });
    fireEvent(lengthSelect);

    unitSelect.addEventListener('change', () => {
      this._updateContextContainer();
    });
    fireEvent(unitSelect);

    const radioSelector = 'input[type="radio"]';

    const weekOptions = this._containers.weekOptions;
    const weekTypeListener = e => {
      const buttons = weekOptions.querySelectorAll('.form-weekday-button');
      const enable = e.target.value === 'select-days';
      buttons.forEach(button => button.disabled = !enable);
    };
    weekOptions.querySelectorAll(radioSelector).forEach(radio => {
      radio.addEventListener('change', weekTypeListener);
      if (radio.checked)
        fireEvent(radio);
    });

    const monthOptions = this._containers.monthOptions;
    const monthTypeListener = e => {
      const daySelect = this._getControl('month-day', monthOptions);
      const weekNumberSelect = this._getControl('month-week-number',
        monthOptions);
      const weekDaySelect = this._getControl('month-week-day', monthOptions);

      daySelect.disabled = e.target.value !== 'day-of-month';
      weekNumberSelect.disabled = e.target.value !== 'week-of-month';
      weekDaySelect.disabled = e.target.value !== 'week-of-month';
    };
    monthOptions.querySelectorAll(radioSelector).forEach(radio => {
      radio.addEventListener('change', monthTypeListener);
      if (radio.checked)
        fireEvent(radio);
    });

    const yearOptions = this._containers.yearOptions;
    const yearTypeListener = e => {
      const selectBoxes = yearOptions.querySelectorAll('select');
      const enable = e.target.value === 'month-and-day';
      selectBoxes.forEach(select => select.disabled = !enable);
    };
    yearOptions.querySelectorAll(radioSelector).forEach(radio => {
      radio.addEventListener('change', yearTypeListener);
      if (radio.checked)
        fireEvent(radio);
    });

    const endCount = this._getControl('end-count');
    endCount.addEventListener('change', e => {
      const count = Number.parseInt(e.target.value);
      if (Number.isFinite(count)) {
        const label = count === 1 ? ' occurrence' : ' occurrences';
        this._getControl('end-count-label').textContent = label;
      }
    });
    fireEvent(endCount);

    const endRadioSelector = 'input[name="recurring-date-end-type"]';
    const endTypeListener = e => {
      const dateInput = this._getControl('end-date');
      const dateButton = this._getControl('end-date-button');
      const countInput = this._getControl('end-count');

      dateInput.disabled = e.target.value !== 'date';
      dateButton.disabled = e.target.value !== 'date';
      countInput.disabled = e.target.value !== 'count';
    }
    parent.querySelectorAll(endRadioSelector).forEach(radio => {
      radio.addEventListener('change', endTypeListener);
      if (radio.checked)
        fireEvent(radio);
    });

    const useDateCheckbox = this._getControl('use-start-date');
    useDateCheckbox.addEventListener('change', e => {
      const enable = e.target.checked;
      this._getControl('start-date').disabled = !enable;
      this._getControl('start-date-button').disabled = !enable;
    });
    fireEvent(useDateCheckbox);

    const noWeekendCheckbox = this._getControl('no-weekend');
    noWeekendCheckbox.addEventListener('change', e => {
      this._getControl('weekend-select').disabled = !e.target.checked;
    });
    fireEvent(noWeekendCheckbox);
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
