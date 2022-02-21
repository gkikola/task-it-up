/**
 * Defines the [RecurrenceModal]{@link module:recurrenceModal~RecurrenceModal}
 * class.
 * @module recurrenceModal
 */

import _ from 'lodash';
import ordinal from 'ordinal';

import DatePickerModal from './datePickerModal';
import RecurringDate from '../recurringDate';
import Settings from '../settings';
import {
  formatDate,
  parseDate,
  getWeekdayName,
  getMonthName,
  getDaysInMonth,
} from '../utility/dates';
import {
  createDateInputField,
  createFormControl,
  createToggleButton,
} from '../utility/dom';

const UNITS = [
  { value: 'day', singular: 'Day', plural: 'Days' },
  { value: 'week', singular: 'Week', plural: 'Weeks' },
  { value: 'month', singular: 'Month', plural: 'Months' },
  { value: 'year', singular: 'Year', plural: 'Years' },
];

/**
 * Object holding private members for the
 * [RecurrenceModal]{@link module:recurrenceModal~RecurrenceModal} class.
 * @typedef {Object} module:recurrenceModal~RecurrenceModal~privates
 * @property {module:recurringDate~RecurringDate} [initialRecurrence] The
 *   recurring date to use as a default when initializing the form controls, if
 *   any.
 * @property {Date} baseDate The date to use when initializing certain input
 *   fields.
 * @property {module:settings~Settings~dateFormat} dateFormat An object holding
 *   date format information.
 * @property {Object} callbacks An object holding callback functions.
 * @property {Function} [callbacks.confirm] A callback function that will be
 *   invoked when the user successfully confirms the modal.
 * @property {Function} [callbacks.cancel] A callback function that will be
 *   invoked when the user cancels the modal.
 * @property {Object} containers An object holding the various container
 *   elements used in the modal's contents.
 * @property {HTMLElement} containers.parent The parent container element
 *   holding all the form elements.
 * @property {HTMLElement} containers.context The container element holding
 *   context-sensitive options that depend on the selected interval unit.
 * @property {HTMLElement} containers.weekOptions The container element holding
 *   the form elements specific to weekly recurrences.
 * @property {HTMLElement} containers.monthOptions The container element
 *   holding the form elements specific to monthly recurrences.
 * @property {HTMLElement} containers.yearOptions The container element holding
 *   the form elements specific to yearly recurrences.
 * @property {string} title The title of the modal.
 */

/**
 * Holds private data for the
 * [RecurrenceModal]{@link module:recurrenceModal~RecurrenceModal} class.
 * @type {WeakMap}
 * @see module:recurrenceModal~RecurrenceModal~privates
 */
const privateMembers = new WeakMap();

/**
 * Create the form elements for the context options for weekly recurrences.
 * @returns {HTMLElement} The container element holding the form elements.
 */
function createWeekContextForm() {
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
      value: 'The same day of the week as before',
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

  _.range(7).map((index) => {
    const name = getWeekdayName(index);
    return { value: name.toLowerCase(), label: name.slice(0, 1) };
  }).forEach((day) => {
    optionContainer.appendChild(createToggleButton(day.label, {
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
function createMonthContextForm() {
  const container = document.createElement('div');
  container.classList.add('form-input-container');

  let label;
  let optionContainer;
  let selectItems;

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
      value: 'The same day of the month as before',
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

  selectItems = _.range(1, 32).map((day) => (
    { value: day.toString(), label: ordinal(day) }
  ));
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

  selectItems = _.range(1, 6).map((week) => (
    { value: week.toString(), label: (week < 5) ? ordinal(week) : 'last' }
  ));
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

  selectItems = _.range(7).map((index) => {
    const day = getWeekdayName(index);
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
function createYearContextForm() {
  const container = document.createElement('div');
  container.classList.add('form-input-container');

  let label;
  let selectItems;

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
      value: 'The same month and day as before',
      classList: ['form-input-label-inline'],
    },
    container: { classList: ['form-input-item-container'] },
  }));

  const optionContainer = document.createElement('div');
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
  label.textContent = 'The ';
  optionContainer.appendChild(label);

  selectItems = _.range(1, 32).map((day) => (
    { value: day.toString(), label: ordinal(day) }
  ));
  optionContainer.appendChild(createFormControl({
    type: 'select',
    id: 'recurring-date-year-day',
    name: 'recurring-date-year-day',
    classList: ['form-select-inline'],
    menuItems: selectItems,
  }));

  label = document.createElement('span');
  label.classList.add('form-input-label-inline');
  label.textContent = ' day of ';
  optionContainer.appendChild(label);

  selectItems = _.range(12).map((index) => {
    const name = getMonthName(index);
    return { value: name.toLowerCase(), label: name };
  });
  optionContainer.appendChild(createFormControl({
    type: 'select',
    id: 'recurring-date-year-month',
    name: 'recurring-date-year-month',
    classList: ['form-select-inline'],
    menuItems: selectItems,
  }));
  container.appendChild(optionContainer);

  return container;
}

/**
 * Select a form control in the modal.
 * @param {module:recurrenceModal~RecurrenceModal} instance The class instance
 *   on which to apply the function.
 * @param {string} idSuffix The identifier of the control to retrieve,
 *   without the 'recurring-date-' prefix.
 * @param {string} [container] The container in which to look for the
 *   control. If not given, then the modal content container is used.
 * @returns {HTMLElement} The requested element, or undefined if not found.
 */
function getControl(instance, idSuffix, container) {
  const parent = container || privateMembers.get(instance).containers.parent;
  return parent.querySelector(`#recurring-date-${idSuffix}`);
}

/**
 * Initialize the values of the form elements based on the initial recurrence
 * that was passed to the constructor, if any.
 * @param {module:recurrenceModal~RecurrenceModal} instance The class instance
 *   on which to apply the function.
 */
function initFormValues(instance) {
  const privates = privateMembers.get(instance);
  const { weekOptions, monthOptions, yearOptions } = privates.containers;
  const initial = privates.initialRecurrence;
  if (initial) {
    getControl(instance, 'interval-length').value = initial.intervalLength;
    getControl(instance, 'interval-unit').value = initial.intervalUnit;

    let context;
    switch (initial.intervalUnit) {
      case 'week':
        context = weekOptions;
        if (initial.daysOfWeek) {
          getControl(instance, 'week-type-select-days', context).checked = true;
          initial.daysOfWeek.forEach((day) => {
            const id = `weekday-${getWeekdayName(day).toLowerCase()}`;
            const button = getControl(instance, id, context);
            if (button) button.classList.add('active');
          });
        } else {
          getControl(instance, 'week-type-previous', context).checked = true;
        }
        break;
      case 'month':
        context = monthOptions;
        if (initial.dayOfMonth) {
          getControl(instance, 'month-type-day', context).checked = true;
          getControl(instance, 'month-day', context).value = initial.dayOfMonth;
        } else if (initial.weekNumber && initial.daysOfWeek
          && initial.daysOfWeek.length === 1) {
          getControl(instance, 'month-type-week', context).checked = true;
          const weekSelect = getControl(instance, 'month-week-number', context);
          const daySelect = getControl(instance, 'month-week-day', context);
          weekSelect.value = initial.weekNumber;
          daySelect.value = getWeekdayName(
            initial.daysOfWeek[0],
          ).toLowerCase();
        } else {
          getControl(instance, 'month-type-previous', context).checked = true;
        }
        break;
      case 'year':
        context = yearOptions;
        if (Number.isInteger(initial.month) && initial.dayOfMonth) {
          getControl(instance, 'year-type-day', context).checked = true;
          const monthSelect = getControl(instance, 'year-month', context);
          const daySelect = getControl(instance, 'year-day', context);
          monthSelect.value = getMonthName(initial.month).toLowerCase();
          daySelect.value = initial.dayOfMonth;
        } else {
          getControl(instance, 'year-type-previous', context).checked = true;
        }
        break;
      default:
        break;
    }

    if (initial.endDate) {
      getControl(instance, 'end-type-date').checked = true;
      const input = getControl(instance, 'end-date');
      input.value = formatDate(
        initial.endDate,
        privates.dateFormat.outputPattern,
      );
    } else if (initial.maxCount) {
      getControl(instance, 'end-type-count').checked = true;
      getControl(instance, 'end-count').value = initial.maxCount;
    } else {
      getControl(instance, 'end-type-never').checked = true;
    }

    if (initial.startDate) {
      getControl(instance, 'use-start-date').checked = true;
      const input = getControl(instance, 'start-date');
      input.value = formatDate(
        initial.startDate,
        privates.dateFormat.outputPattern,
      );
    }

    if (initial.baseOnCompletion) {
      getControl(instance, 'base-on-completion').checked = true;
    }

    if (initial.onWeekend !== 'no-change') {
      getControl(instance, 'no-weekend').checked = true;
      getControl(instance, 'weekend-select').value = initial.onWeekend;
    }
  }

  const date = privates.baseDate;
  const dayOfWeek = getWeekdayName(date.getDay()).toLowerCase();
  const dayOfMonth = date.getDate();
  const month = getMonthName(date.getMonth()).toLowerCase();
  const weekNumber = Math.floor((dayOfMonth - 1) / 7) + 1;

  if (!initial || initial.intervalUnit !== 'week' || !initial.daysOfWeek) {
    const dayButton = getControl(instance, `weekday-${dayOfWeek}`, weekOptions);
    dayButton.classList.add('active');
  }

  if (!initial || initial.intervalUnit !== 'month' || !initial.dayOfMonth) {
    const monthDaySelect = getControl(instance, 'month-day', monthOptions);
    monthDaySelect.value = dayOfMonth.toString();
  }

  if (!initial || initial.intervalUnit !== 'month' || !initial.weekNumber) {
    const monthWeekNumSelect = getControl(
      instance,
      'month-week-number',
      monthOptions,
    );
    const monthWeekDaySelect = getControl(
      instance,
      'month-week-day',
      monthOptions,
    );
    monthWeekNumSelect.value = weekNumber.toString();
    monthWeekDaySelect.value = dayOfWeek;
  }

  if (!initial || initial.intervalUnit !== 'year'
    || !Number.isInteger(initial.month)) {
    const yearMonthSelect = getControl(instance, 'year-month', yearOptions);
    const yearDaySelect = getControl(instance, 'year-day', yearOptions);
    yearMonthSelect.value = month;
    yearDaySelect.value = dayOfMonth.toString();
  }
}

/**
 * Opens a date picker and updates the given input field with the selected
 * date.
 * @param {module:recurrenceModal~RecurrenceModal} instance The class instance
 *   on which to apply the function.
 * @param {HTMLElement} input The text input field where the date is being
 *   entered.
 * @param {module:modalStack~ModalStack} modalStack The modal stack in which
 *   the modal has been inserted.
 */
function pickDate(instance, input, modalStack) {
  const privates = privateMembers.get(instance);

  let startDate = null;
  if (input.value) {
    startDate = parseDate(input.value, privates.dateFormat.inputPatterns);
  }

  let title = null;
  switch (input.id) {
    case 'recurring-date-start-date':
      title = 'Select Start Date';
      break;
    case 'recurring-date-end-date':
      title = 'Select End Date';
      break;
    default:
      break;
  }

  const field = input;
  modalStack.showModal(new DatePickerModal({
    confirm: (date) => {
      field.value = formatDate(date, privates.dateFormat.outputPattern);
      field.setCustomValidity('');
    },
    startDate,
    title,
  }));
}

/**
 * Update the contents of the container holding context-sensitive options,
 * based on the selected interval unit.
 * @param {module:recurrenceModal~RecurrenceModal} instance The class instance
 *   on which to apply the function.
 */
function updateContextContainer(instance) {
  const { containers } = privateMembers.get(instance);
  const contextContainer = containers.context;

  while (contextContainer.firstChild) {
    contextContainer.removeChild(contextContainer.firstChild);
  }

  switch (getControl(instance, 'interval-unit').value) {
    case 'week':
      contextContainer.appendChild(containers.weekOptions);
      break;
    case 'month':
      contextContainer.appendChild(containers.monthOptions);
      break;
    case 'year':
      contextContainer.appendChild(containers.yearOptions);
      break;
    default:
      break;
  }
}

/**
 * Add the event listeners to the form controls in the modal.
 * @param {module:recurrenceModal~RecurrenceModal} instance The class instance
 *   on which to apply the function.
 */
function addListeners(instance) {
  const privates = privateMembers.get(instance);
  const { parent } = privates.containers;
  const fireEvent = (input) => input.dispatchEvent(new Event('change'));

  // Make units singular or plural based on length
  const lengthSelect = getControl(instance, 'interval-length');
  const unitSelect = getControl(instance, 'interval-unit');
  lengthSelect.addEventListener('change', (e) => {
    const length = Number(e.target.value);
    if (e.target.value.length > 0 && Number.isFinite(length)) {
      const plural = length !== 1;
      UNITS.forEach((unit) => {
        const selector = `option[value="${unit.value}"]`;
        const option = unitSelect.querySelector(selector);
        const label = plural ? unit.plural : unit.singular;
        if (option.textContent !== label) option.textContent = label;
      });
    }
  });
  fireEvent(lengthSelect);

  unitSelect.addEventListener('change', () => {
    updateContextContainer(instance);
  });
  fireEvent(unitSelect);

  const radioSelector = 'input[type="radio"]';
  const { weekOptions, monthOptions, yearOptions } = privates.containers;

  // Conditionally enable/disable controls for weekly recurrences
  const weekTypeListener = (e) => {
    const buttons = weekOptions.querySelectorAll('.form-weekday-button');
    const enable = e.target.value === 'select-days';
    buttons.forEach((button) => {
      const elem = button;
      elem.disabled = !enable;
    });
  };
  weekOptions.querySelectorAll(radioSelector).forEach((radio) => {
    radio.addEventListener('change', weekTypeListener);
    if (radio.checked) fireEvent(radio);
  });

  // Conditionally enable/disable controls for monthly recurrences
  const monthTypeListener = (e) => {
    const daySelect = getControl(instance, 'month-day', monthOptions);
    const weekNumberSelect = getControl(
      instance,
      'month-week-number',
      monthOptions,
    );
    const weekDaySelect = getControl(instance, 'month-week-day', monthOptions);

    daySelect.disabled = e.target.value !== 'day-of-month';
    weekNumberSelect.disabled = e.target.value !== 'week-of-month';
    weekDaySelect.disabled = e.target.value !== 'week-of-month';
  };
  monthOptions.querySelectorAll(radioSelector).forEach((radio) => {
    radio.addEventListener('change', monthTypeListener);
    if (radio.checked) fireEvent(radio);
  });

  // Conditionally enable/disable controls for yearly recurrences
  const yearTypeListener = (e) => {
    const selectBoxes = yearOptions.querySelectorAll('select');
    const enable = e.target.value === 'month-and-day';
    selectBoxes.forEach((select) => {
      const elem = select;
      elem.disabled = !enable;
    });
  };
  yearOptions.querySelectorAll(radioSelector).forEach((radio) => {
    radio.addEventListener('change', yearTypeListener);
    if (radio.checked) fireEvent(radio);
  });

  // Update day select box based on the number of days in the selected month
  const yearMonthSelect = getControl(instance, 'year-month', yearOptions);
  const yearDaySelect = getControl(instance, 'year-day', yearOptions);
  const yearMonthListener = (e) => {
    const month = _.range(12).findIndex((monthIndex) => (
      getMonthName(monthIndex).toLowerCase() === e.target.value
    ));
    const oldValue = Number(yearDaySelect.value);
    yearDaySelect.innerHTML = '';

    const maxDays = getDaysInMonth(month);
    _.range(1, maxDays + 1).forEach((day) => {
      const opt = document.createElement('option');
      opt.value = day.toString();
      opt.textContent = ordinal(day);
      yearDaySelect.appendChild(opt);
    });
    if (oldValue <= maxDays) yearDaySelect.value = oldValue;
    else yearDaySelect.value = maxDays;
  };
  yearMonthSelect.addEventListener('change', yearMonthListener);
  fireEvent(yearMonthSelect);

  // Make end count label singular/plural based on value
  const endCount = getControl(instance, 'end-count');
  endCount.addEventListener('change', (e) => {
    const count = Number(e.target.value);
    if (e.target.value.length > 0 && Number.isFinite(count)) {
      const label = count === 1 ? ' occurrence' : ' occurrences';
      getControl(instance, 'end-count-label').textContent = label;
    }
  });
  fireEvent(endCount);

  // Conditionally enable/disable recurrence end controls
  const endRadioSelector = 'input[name="recurring-date-end-type"]';
  const endTypeListener = (e) => {
    const dateInput = getControl(instance, 'end-date');
    const dateButton = getControl(instance, 'end-date-button');
    const countInput = getControl(instance, 'end-count');

    dateInput.disabled = e.target.value !== 'date';
    dateButton.disabled = e.target.value !== 'date';
    countInput.disabled = e.target.value !== 'count';
  };
  parent.querySelectorAll(endRadioSelector).forEach((radio) => {
    radio.addEventListener('change', endTypeListener);
    if (radio.checked) fireEvent(radio);
  });

  // Conditionally enable/disable controls for checkbox options
  const useDateCheckbox = getControl(instance, 'use-start-date');
  useDateCheckbox.addEventListener('change', (e) => {
    const enable = e.target.checked;
    getControl(instance, 'start-date').disabled = !enable;
    getControl(instance, 'start-date-button').disabled = !enable;
  });
  fireEvent(useDateCheckbox);

  const noWeekendCheckbox = getControl(instance, 'no-weekend');
  noWeekendCheckbox.addEventListener('change', (e) => {
    getControl(instance, 'weekend-select').disabled = !e.target.checked;
  });
  fireEvent(noWeekendCheckbox);

  // Check date validity
  const dateListener = (e) => {
    const { value } = e.target;
    if (value.length > 0) {
      let message = '';
      if (!parseDate(value, privates.dateFormat.inputPatterns)) {
        const format = privates.dateFormat.visualPattern;
        message = `Please enter a valid date in ${format} format.`;
      }
      e.target.setCustomValidity(message);
    }
  };
  getControl(instance, 'end-date').addEventListener('change', dateListener);
  getControl(instance, 'start-date').addEventListener('change', dateListener);
}

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
   * @param {Date} [options.baseDate] The date to use as a default for
   *   initializing certain fields. If not given, then the present date is
   *   used.
   * @param {module:settings~Settings~dateFormat} [options.dateFormat] An
   *   object holding information about the calendar date format to use for
   *   date fields. If not given, then the browser default is used.
   */
  constructor(options = {}) {
    const privates = {
      initialRecurrence: options.initial || null,
      baseDate: options.baseDate || new Date(),
      dateFormat: options.dateFormat || Settings.lookupDateFormat(),
      callbacks: {
        confirm: options.confirm || null,
        cancel: options.cancel || null,
      },
      containers: {
        parent: null,
        context: null,
        weekOptions: null,
        monthOptions: null,
        yearOptions: null,
      },
      title: 'Edit Recurring Date',
    };
    privateMembers.set(this, privates);
  }

  get title() {
    return privateMembers.get(this).title;
  }

  addContent(parent, modalStack) {
    const privates = privateMembers.get(this);

    let container = document.createElement('div');
    container.classList.add('form-input-container');
    container.appendChild(createFormControl({
      type: 'number',
      id: 'recurring-date-interval-length',
      name: 'recurring-date-interval-length',
      value: '1',
      classList: ['form-input-inline', 'form-input-count'],
      required: true,
      min: 1,
      container: { inline: true },
      label: {
        value: 'Repeat every ',
        classList: ['form-input-label-inline'],
      },
    }));

    let label = document.createElement('span');
    label.classList.add('form-input-label-inline');
    label.textContent = ' ';
    container.appendChild(label);

    container.appendChild(createFormControl({
      type: 'select',
      id: 'recurring-date-interval-unit',
      name: 'recurring-date-interval-unit',
      classList: ['form-select-inline'],
      menuItems: UNITS.map((unit) => {
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

    let optionContainer = document.createElement('div');
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
      placeholder: privates.dateFormat.visualPattern,
      classList: ['form-input-inline'],
      required: true,
      container: {
        classList: ['form-input-date-container-inline'],
        inline: true,
      },
      button: {
        id: 'recurring-date-end-date-button',
        classList: ['form-button'],
        callback: (input) => pickDate(this, input, modalStack),
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
      required: true,
      min: 1,
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
      placeholder: privates.dateFormat.visualPattern,
      classList: ['form-input-inline'],
      required: true,
      container: {
        classList: ['form-input-date-container-inline'],
        inline: true,
      },
      button: {
        id: 'recurring-date-start-date-button',
        classList: ['form-button'],
        callback: (input) => pickDate(this, input, modalStack),
      },
    }));
    container.appendChild(optionContainer);

    container.appendChild(createFormControl({
      type: 'checkbox',
      id: 'recurring-date-base-on-completion',
      name: 'recurring-date-additional-options',
      value: 'base-on-completion',
      label: {
        value: 'Repeat from completion date',
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
        { value: 'nearest-weekday', label: 'nearest', selected: true },
        { value: 'previous-weekday', label: 'previous' },
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

    const weekOptions = createWeekContextForm();
    const monthOptions = createMonthContextForm();
    const yearOptions = createYearContextForm();

    privates.containers = {
      parent,
      context: contextContainer,
      weekOptions,
      monthOptions,
      yearOptions,
    };

    initFormValues(this);
    addListeners(this);
  }

  confirm() {
    const privates = privateMembers.get(this);
    if (privates.callbacks.confirm) {
      const unit = getControl(this, 'interval-unit').value;
      const options = {};

      const lengthInput = getControl(this, 'interval-length');
      options.intervalLength = Number(lengthInput.value);

      let context;
      const getDayIndex = (day) => (
        _.range(7).findIndex((dayIndex) => (
          day === getWeekdayName(dayIndex).toLowerCase()
        ))
      );
      switch (unit) {
        case 'week':
          context = privates.containers.weekOptions;
          if (getControl(this, 'week-type-select-days', context).checked) {
            const daysOfWeek = [];
            context.querySelectorAll('.form-weekday-button').forEach(
              (button) => {
                if (button.classList.contains('active')) {
                  daysOfWeek.push(getDayIndex(button.value));
                }
              },
            );
            if (daysOfWeek.length > 0) options.daysOfWeek = daysOfWeek;
          }
          break;
        case 'month':
          context = privates.containers.monthOptions;
          if (getControl(this, 'month-type-day', context).checked) {
            const daySelect = getControl(this, 'month-day', context);
            options.dayOfMonth = Number(daySelect.value);
          } else if (getControl(this, 'month-type-week', context).checked) {
            const weekSelect = getControl(this, 'month-week-number', context);
            const daySelect = getControl(this, 'month-week-day', context);
            options.weekNumber = Number(weekSelect.value);
            options.daysOfWeek = [getDayIndex(daySelect.value)];
          }
          break;
        case 'year':
          context = privates.containers.yearOptions;
          if (getControl(this, 'year-type-day', context).checked) {
            const monthSelect = getControl(this, 'year-month', context);
            const daySelect = getControl(this, 'year-day', context);
            options.month = _.range(12).findIndex((monthIndex) => (
              getMonthName(monthIndex).toLowerCase() === monthSelect.value
            ));
            options.dayOfMonth = Number(daySelect.value);
          }
          break;
        default:
          break;
      }

      if (getControl(this, 'end-type-date').checked) {
        const input = getControl(this, 'end-date');
        options.endDate = parseDate(
          input.value,
          privates.dateFormat.inputPatterns,
        );
      } else if (getControl(this, 'end-type-count').checked) {
        const input = getControl(this, 'end-count');
        options.maxCount = Number(input.value);
      }

      if (getControl(this, 'use-start-date').checked) {
        const input = getControl(this, 'start-date');
        options.startDate = parseDate(
          input.value,
          privates.dateFormat.inputPatterns,
        );
      }

      options.baseOnCompletion = getControl(
        this,
        'base-on-completion',
      ).checked;

      if (getControl(this, 'no-weekend').checked) {
        options.onWeekend = getControl(this, 'weekend-select').value;
      }

      privates.callbacks.confirm(new RecurringDate(unit, options));
    }
  }

  cancel() {
    const { callbacks } = privateMembers.get(this);
    if (callbacks.cancel) callbacks.cancel();
  }

  validate() {
    if (!getControl(this, 'interval-length').reportValidity()) return false;

    if (getControl(this, 'end-type-date').checked) {
      if (!getControl(this, 'end-date').reportValidity()) return false;
    }

    if (getControl(this, 'end-type-count').checked) {
      if (!getControl(this, 'end-count').reportValidity()) return false;
    }

    if (getControl(this, 'use-start-date').checked) {
      if (!getControl(this, 'start-date').reportValidity()) return false;
    }

    return true;
  }
}

export default RecurrenceModal;
