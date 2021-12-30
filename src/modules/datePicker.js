/**
 * Defines the [DatePicker]{@link module:datePicker~DatePicker} class.
 * @module datePicker
 */

import { createFormControl, createIconButton } from "./utility";

import {
  add,
  differenceInWeeks,
  endOfMonth,
  endOfWeek,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

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
    if (!startDate)
      startDate = new Date();

    /**
     * The year that is currently selected.
     * @type {number}
     */
    this._year = startDate.getFullYear();

    /**
     * The month that is currently selected, represented as a value from 0 to
     * 11.
     * @type {number}
     */
    this._month = startDate.getMonth();

    /**
     * The day of the month that is currently selected, represented as a value
     * from 1 to 31.
     * @type {number}
     */
    this._day = startDate.getDate();

    /**
     * The month that is currently being displayed in the calendar grid.
     * @type {number}
     */
    this._displayedMonth = this._month;

    /**
     * The year that is currently being displayed in the calendar grid.
     * @type {number}
     */
    this._displayedYear = this._year;

    /**
     * The select box element that is shown in the header and is used to select
     * the month.
     * @type {HTMLElement}
     */
    this._monthInput = null;

    /**
     * The input element that is shown in the header is used to select the
     * year.
     * @type {HTMLElement}
     */
    this._yearInput = null;

    /**
     * The container element holding the grid of calendar days.
     * @type {HTMLElement}
     */
    this._dayGrid = null;

    this._createFormElements(parent);
  }

  /**
   * The date that is currently selected in the form.
   * @type {Date}
   */
  get date() {
    // Use setFullYear to avoid constructor misinterpreting two-digit years
    const value = new Date();
    value.setFullYear(this._year, this._month, this._day);
    return value;
  }

  /**
   * The year that is currently selected in the form. For four-digit years,
   * this will be a four-digit number.
   * @type {number}
   */
  get year() {
    return this._year;
  }

  /**
   * The month that is currently selected in the form, as a number between 0
   * and 11, with January corresponding to a value of 0.
   * @type {number}
   */
  get month() {
    return this._month;
  }

  /**
   * The day of the month that is currently selected in the form, as a number
   * between 1 and 31.
   * @type {number}
   */
  get day() {
    return this._day;
  }

  /**
   * Create the form elements for the date picker.
   * @param {HTMLElement} parent The parent DOM node under which the form
   *   should be inserted.
   */
  _createFormElements(parent) {
    const heading = document.createElement('div');
    heading.classList.add('date-picker-heading');

    const menuItems = MONTHS.map((month, index) => {
      return { value: index.toString(), label: month };
    });
    this._monthInput = createFormControl({
      type: 'select',
      id: 'date-picker-month-select',
      name: 'date-picker-month-select',
      classList: ['form-select-inline'],
      menuItems,
    });

    this._yearInput = createFormControl({
      type: 'number',
      id: 'date-picker-year-input',
      name: 'date-picker-year-input',
      classList: ['form-input-inline', 'form-input-count'],
    });

    const monthYearContainer = document.createElement('div');
    monthYearContainer.appendChild(this._monthInput);
    const spacer = document.createElement('span');
    spacer.classList.add('form-input-label-inline');
    spacer.textContent = ' ';
    monthYearContainer.appendChild(spacer);
    monthYearContainer.appendChild(this._yearInput);
    heading.appendChild(monthYearContainer);

    const buttonContainer = document.createElement('div');
    const backButton = createIconButton('navigate_before');
    const todayButton = createIconButton('today');
    const forwardButton = createIconButton('navigate_next');
    buttonContainer.appendChild(backButton);
    buttonContainer.appendChild(todayButton);
    buttonContainer.appendChild(forwardButton);
    heading.appendChild(buttonContainer);

    parent.appendChild(heading);

    const grid = document.createElement('div');
    grid.classList.add('date-picker-grid');
    parent.appendChild(grid);
    this._dayGrid = grid;

    this._updateInputs();
    this._updateDayGrid();

    backButton.addEventListener('click', () => this._previousMonth());
    todayButton.addEventListener('click', () => this._thisMonth());
    forwardButton.addEventListener('click', () => this._nextMonth());
    this._monthInput.addEventListener('change', e => {
      this._displayedMonth = Number.parseInt(e.target.value);
      this._updateDayGrid();
    });
    this._yearInput.addEventListener('change', e => {
      const value = Number.parseInt(e.target.value);
      if (Number.isInteger(value)) {
        this._displayedYear = value;
        this._updateDayGrid();
      }
    });
    this._dayGrid.addEventListener('click', e => {
      const elem = e.target;
      if (elem.classList.contains('date-picker-day')) {
        this._year = Number.parseInt(elem.dataset.year);
        this._month = Number.parseInt(elem.dataset.month);
        this._day = Number.parseInt(elem.dataset.day);

        if (this._displayedMonth !== this._month
          || this._displayedYear !== this._year) {
          this._displayedMonth = this._month;
          this._displayedYear = this._year;
          this._updateInputs();
        }

        this._updateDayGrid();
      }
    });
  }

  /**
   * Clear the grid of calendar days and rebuild it using the current display
   * month and display year.
   */
  _updateDayGrid() {
    this._dayGrid.innerHTML = '';

    const date = new Date(this._displayedYear, this._displayedMonth, 1);
    if (this._displayedYear < 100) // Fix for two-digit years
      date.setFullYear(this._displayedYear);

    const selected = this.date;
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const start = startOfWeek(monthStart);
    const end = add(start, { weeks: 5, days: 6, hours: 11 });

    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(label => {
      const dayLabel = document.createElement('span');
      dayLabel.classList.add('date-picker-day-header');
      dayLabel.textContent = label;
      this._dayGrid.appendChild(dayLabel);
    });

    let currentDay = start;
    while (isBefore(currentDay, end)) {
      const dayElem = document.createElement('button');
      dayElem.classList.add('date-picker-day');
      if (isSameDay(selected, currentDay))
        dayElem.classList.add('selected');
      else if (isToday(currentDay))
        dayElem.classList.add('today');
      if (!isSameMonth(date, currentDay))
        dayElem.classList.add('different-month');
      dayElem.textContent = currentDay.getDate();
      dayElem.dataset.year = currentDay.getFullYear();
      dayElem.dataset.month = currentDay.getMonth();
      dayElem.dataset.day = currentDay.getDate();
      this._dayGrid.appendChild(dayElem);

      currentDay = add(currentDay, { days: 1 });
    }
  }

  /**
   * Update the month and year input controls to match the selected date.
   */
  _updateInputs() {
    this._monthInput.value = this._displayedMonth.toString();
    this._yearInput.value = this._displayedYear.toString();
  }

  /**
   * Switch to the present month.
   */
  _thisMonth() {
    const now = new Date();
    this._displayedYear = now.getFullYear();
    this._displayedMonth = now.getMonth();

    this._updateInputs();
    this._updateDayGrid();
  }

  /**
   * Switch to the previous month.
   */
  _previousMonth() {
    if (this._displayedMonth > 0) {
      this._displayedMonth--;
    } else {
      this._displayedYear--;
      this._displayedMonth = 11;
    }

    this._updateInputs();
    this._updateDayGrid();
  }

  /**
   * Switch to the next month.
   */
  _nextMonth() {
    if (this._displayedMonth < 11) {
      this._displayedMonth++;
    } else {
      this._displayedYear++;
      this._displayedMonth = 0;
    }

    this._updateInputs();
    this._updateDayGrid();
  }
}

export default DatePicker;
