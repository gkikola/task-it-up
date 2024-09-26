/**
 * Defines the [DatePicker]{@link module:datePicker~DatePicker} class.
 * @module datePicker
 */

import {
  add,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

import LeftArrowIcon from '../images/arrow-left.svg';
import RightArrowIcon from '../images/arrow-right.svg';
import TodayIcon from '../images/today.svg';

import { createFormControl, createImageButton } from './utility/dom';

const ICON_WIDTH = 24;
const ICON_HEIGHT = 24;
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
 * Object holding private members for the
 * [DatePicker]{@link module:datePicker~DatePicker} class.
 * @typedef {Object} module:datePicker~DatePicker~privates
 * @property {number} year The year that is currently selected.
 * @property {number} month The month that is currently selected, represented
 *   as a value from 0 to 11.
 * @property {number} day The day of the month that is currently selected,
 *   represented as a value from 1 to 31.
 * @property {number} displayedMonth The month that is currently being
 *   displayed in the calendar grid.
 * @property {number} displayedYear The year that is currently being displayed
 *   in the calendar grid.
 * @property {HTMLElement} monthInput The select box element that is shown in
 *   the header and is used to select the month.
 * @property {HTMLElement} yearInput The input element that is shown in the
 *   header and is used to select the year.
 * @property {HTMLElement} dayGrid The container element holding the grid of
 *   calendar days.
 */

/**
 * Holds private data for the [DatePicker]{@link module:datePicker~DatePicker}
 * class.
 * @type {WeakMap}
 * @see module:datePicker~DatePicker~privates
 */
const privateMembers = new WeakMap();

/**
 * Clear the grid of calendar days and rebuild it using the current display
 * month and display year.
 * @param {module:datePicker~DatePicker} instance The class instance on which
 *   to apply the function.
 */
function updateDayGrid(instance) {
  const privates = privateMembers.get(instance);
  privates.dayGrid.innerHTML = '';

  const date = new Date(privates.displayedYear, privates.displayedMonth, 1);
  if (privates.displayedYear < 100) {
    // Fix for two-digit years
    date.setFullYear(privates.displayedYear);
  }

  const selected = instance.date;
  const monthStart = startOfMonth(date);
  const start = startOfWeek(monthStart);
  const end = add(start, { weeks: 5, days: 6, hours: 11 });

  ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach((label) => {
    const dayLabel = document.createElement('span');
    dayLabel.classList.add('date-picker-day-header');
    dayLabel.textContent = label;
    privates.dayGrid.appendChild(dayLabel);
  });

  let currentDay = start;
  while (isBefore(currentDay, end)) {
    const dayElem = document.createElement('button');
    dayElem.classList.add('date-picker-day');

    if (isSameDay(selected, currentDay)) dayElem.classList.add('selected');
    else if (isToday(currentDay)) dayElem.classList.add('today');

    if (!isSameMonth(date, currentDay)) {
      dayElem.classList.add('different-month');
    }

    dayElem.textContent = currentDay.getDate();
    dayElem.dataset.year = currentDay.getFullYear();
    dayElem.dataset.month = currentDay.getMonth();
    dayElem.dataset.day = currentDay.getDate();
    privates.dayGrid.appendChild(dayElem);

    currentDay = add(currentDay, { days: 1 });
  }
}

/**
 * Update the month and year input controls to match the selected date.
 * @param {module:datePicker~DatePicker} instance The class instance on which
 *   to apply the function.
 */
function updateInputs(instance) {
  const privates = privateMembers.get(instance);
  privates.monthInput.value = privates.displayedMonth.toString();
  privates.yearInput.value = privates.displayedYear.toString();
}

/**
 * Create the form elements for the date picker.
 * @param {module:datePicker~DatePicker} instance The class instance on which
 *   to apply the function.
 * @param {HTMLElement} parent The parent DOM node under which the form
 *   should be inserted.
 */
function createFormElements(instance, parent) {
  const privates = privateMembers.get(instance);

  const heading = document.createElement('div');
  heading.classList.add('date-picker-heading');

  const menuItems = MONTHS.map((month, index) => (
    { value: index.toString(), label: month }
  ));
  privates.monthInput = createFormControl({
    type: 'select',
    id: 'date-picker-month-select',
    name: 'date-picker-month-select',
    classList: ['form-select-inline'],
    menuItems,
  });

  privates.yearInput = createFormControl({
    type: 'number',
    id: 'date-picker-year-input',
    name: 'date-picker-year-input',
    classList: ['form-input-inline', 'form-input-count'],
  });

  const monthYearContainer = document.createElement('div');
  monthYearContainer.appendChild(privates.monthInput);
  const spacer = document.createElement('span');
  spacer.classList.add('form-input-label-inline');
  spacer.textContent = ' ';
  monthYearContainer.appendChild(spacer);
  monthYearContainer.appendChild(privates.yearInput);
  heading.appendChild(monthYearContainer);

  const buttonContainer = document.createElement('div');
  const backButton = createImageButton(LeftArrowIcon, {
    altText: 'Go to previous month',
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
  });
  const todayButton = createImageButton(TodayIcon, {
    altText: 'Go to today',
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
  });
  const forwardButton = createImageButton(RightArrowIcon, {
    altText: 'Go to next month',
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
  });
  buttonContainer.appendChild(backButton);
  buttonContainer.appendChild(todayButton);
  buttonContainer.appendChild(forwardButton);
  heading.appendChild(buttonContainer);

  parent.appendChild(heading);

  const grid = document.createElement('div');
  grid.classList.add('date-picker-grid');
  parent.appendChild(grid);
  privates.dayGrid = grid;

  updateInputs(instance);
  updateDayGrid(instance);

  backButton.addEventListener('click', () => instance.goToPreviousMonth());
  todayButton.addEventListener('click', () => instance.selectToday());
  forwardButton.addEventListener('click', () => instance.goToNextMonth());
  privates.monthInput.addEventListener('change', (e) => {
    privates.displayedMonth = Number(e.target.value);
    updateDayGrid(instance);
  });

  const yearListener = (e) => {
    if (e.type === 'change' || e.target.value.length === 4) {
      const value = Number(e.target.value);
      if (e.target.value.length > 0 && Number.isInteger(value)) {
        if (privates.displayedYear !== value) {
          privates.displayedYear = value;
          updateDayGrid(instance);
        }
      } else if (e.type === 'change') {
        e.target.value = privates.displayedYear.toString();
      }
    }
  };
  privates.yearInput.addEventListener('input', yearListener);
  privates.yearInput.addEventListener('change', yearListener);

  privates.dayGrid.addEventListener('click', (e) => {
    const elem = e.target;
    if (elem.classList.contains('date-picker-day')) {
      privates.year = Number(elem.dataset.year);
      privates.month = Number(elem.dataset.month);
      privates.day = Number(elem.dataset.day);

      if (privates.displayedMonth !== privates.month
        || privates.displayedYear !== privates.year) {
        privates.displayedMonth = privates.month;
        privates.displayedYear = privates.year;
        updateInputs(instance);
      }

      updateDayGrid(instance);
    }
  });
}

/**
 * Controls a form that the user can use to select a calendar date.
 */
class DatePicker {
  /**
   * Create the date picker form.
   * @param {HTMLElement} parent The parent DOM node under which the form
   *   should be inserted.
   * @param {Date} [startDate] The date that will be initially selected. If not
   *   given, then the present date is used.
   */
  constructor(parent, startDate) {
    const date = startDate || new Date();

    const privates = {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      displayedMonth: date.getMonth(),
      displayedYear: date.getFullYear(),
      monthInput: null,
      yearInput: null,
      dayGrid: null,
    };
    privateMembers.set(this, privates);

    createFormElements(this, parent);
  }

  /**
   * The date that is currently selected in the form.
   * @type {Date}
   */
  get date() {
    const privates = privateMembers.get(this);

    const value = new Date(privates.year, privates.month, privates.day);
    if (privates.year < 100) {
      // Fix for two-digit years
      value.setFullYear(privates.year);
    }
    return value;
  }

  /**
   * The year that is currently selected in the form. For four-digit years,
   * this will be a four-digit number.
   * @type {number}
   */
  get year() {
    return privateMembers.get(this).year;
  }

  /**
   * The month that is currently selected in the form, as a number between 0
   * and 11, with January corresponding to a value of 0.
   * @type {number}
   */
  get month() {
    return privateMembers.get(this).month;
  }

  /**
   * The day of the month that is currently selected in the form, as a number
   * between 1 and 31.
   * @type {number}
   */
  get day() {
    return privateMembers.get(this).day;
  }

  /**
   * Select a particular date in the picker. If needed, update the displayed
   * month so that the date is visible.
   * @param {Date} date The date to be selected.
   */
  selectDate(date) {
    const privates = privateMembers.get(this);
    privates.year = date.getFullYear();
    privates.month = date.getMonth();
    privates.day = date.getDate();
    privates.displayedYear = privates.year;
    privates.displayedMonth = privates.month;

    updateInputs(this);
    updateDayGrid(this);
  }

  /**
   * Select the present day in the picker. If needed, update the displayed
   * month so that the date is visible.
   */
  selectToday() {
    this.selectDate(new Date());
  }

  /**
   * Switch to the present month.
   */
  goToThisMonth() {
    const privates = privateMembers.get(this);
    const now = new Date();
    privates.displayedYear = now.getFullYear();
    privates.displayedMonth = now.getMonth();

    updateInputs(this);
    updateDayGrid(this);
  }

  /**
   * Switch to the previous month.
   */
  goToPreviousMonth() {
    const privates = privateMembers.get(this);
    if (privates.displayedMonth > 0) {
      privates.displayedMonth -= 1;
    } else {
      privates.displayedYear -= 1;
      privates.displayedMonth = 11;
    }

    updateInputs(this);
    updateDayGrid(this);
  }

  /**
   * Switch to the next month.
   */
  goToNextMonth() {
    const privates = privateMembers.get(this);
    if (privates.displayedMonth < 11) {
      privates.displayedMonth += 1;
    } else {
      privates.displayedYear += 1;
      privates.displayedMonth = 0;
    }

    updateInputs(this);
    updateDayGrid(this);
  }
}

export default DatePicker;
