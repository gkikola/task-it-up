/**
 * Defines the [RecurringDate]{@link module:recurringDate~RecurringDate} class.
 * @module recurringDate
 */

import _ from 'lodash';
import ordinal from 'ordinal';

import { formatDate } from './utility';

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
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
 * Represents a recurring date.
 */
class RecurringDate {
  /**
   * Create a recurring date.
   * @param {string} intervalUnit The unit of time (e.g. 'week') in which the
   *   repetition interval is measured. Valid options are 'day', 'week',
   *   'month', and 'year'.
   * @param {Object} options An object holding configuration options for the
   *   recurrence.
   * @param {number} [options.intervalLength=1] The length of the repetition
   *   interval.
   * @param {Date} [options.startDate] Indicates the earliest date that the
   *   next occurrence can happen. Any occurrences that would fall before this
   *   date are skipped.
   * @param {boolean} [options.baseOnCompletion=false] If this is true, then
   *   the next occurrence should be calculated from the task's completion
   *   date. Otherwise, the occurrence should be calculated from the task's due
   *   date.
   * @param {number} [options.weekNumber] The number of the week within a month
   *   in which the recurring date should occur. Used in conjunction with
   *   daysOfWeek. A value of 1 indicates the first occurrence of a day within
   *   the month, 2 indicates the second occurrence, and so on. If this is set
   *   to 5, then the 4th or 5th occurrence of the day may be used, depending
   *   on how many such days are in a particular month.
   * @param {number[]} [options.daysOfWeek] An array holding the days of the
   *   week on which the recurring date should occur. Each day is an integer
   *   from 0-6, where 0 represents Sunday, 1 represents Monday, and so on.
   * @param {number} [options.month] The month in the year on which the
   *   recurring date should occur, represented as a number from 0 to 11.
   * @param {number} [options.dayOfMonth] The day of the month on which the
   *   recurring date should occur, represented as a number from 1 to 31.
   * @param {string} [options.onWeekend=no-change] Specifies what happens when
   *   the next recurrence falls on a weekend. If set to 'no-change', then the
   *   date is unaffected. If set to 'previous-weekday' or 'next-weekday', then
   *   the previous or next weekday is used instead. If set to
   *   'nearest-weekday', then the closest weekday is used instead.
   * @param {Date} [options.endDate] Indicates the date after which the
   *   repetition should stop.
   * @param {number} [options.maxCount] Indicates the maximum number of
   *   repetitions before the recurrence should stop.
   */
  constructor(intervalUnit, options = {}) {
    /**
     * The unit of time in which the repetition interval is measured.
     * @type {string}
     */
    this.intervalUnit = intervalUnit;

    /**
     * The length of the repetition interval.
     * @type {number}
     */
    this.intervalLength = options.intervalLength || 1;

    /**
     * Indicates the earliest date that the next occurrence can happen. Any
     * occurrences that would fall before this date are skipped.
     * @type {?Date}
     */
    this.startDate = options.startDate || null;

    /**
     * If this is true, then the next occurrence should be calculated from the
     * task's completion date. Otherwise, the occurrence should be calculated
     * from the task's due date.
     * @type {boolean}
     */
    this.baseOnCompletion = options.baseOnCompletion || false;

    /**
     * The number of the week within a month in which the recurring date should
     * occur. Used in conjunction with daysOfWeek. A value of 1 indicates the
     * first occurrence of a day within the month, 2 indicates the second
     * occurrence, and so on. If this is set to 5, then the 4th or 5th
     * occurrence of the day may be used, depending on how many such days are
     * in a particular month.
     * @type {?number}
     */
    this.weekNumber = options.weekNumber || null;

    /**
     * An array holding the days of the week on which the recurring date should
     * occur. Each day is an integer from 0-6, where 0 represents Sunday, 1
     * represents Monday, and so on.
     * @type {?number[]}
     */
    this.daysOfWeek = options.daysOfWeek || null;

    /**
     * The month in the year on which the recurring date should occur,
     * represented as a number between 0 and 11.
     * @type {?number}
     */
    this.month = null;
    if (options.month !== undefined && options.month !== null) {
      this.month = options.month;
    }

    /**
     * The day of the month on which the recurring date should occur,
     * represented as a number between 1 and 31.
     * @type {?number}
     */
    this.dayOfMonth = options.dayOfMonth || null;

    /**
     * Specifies what happens when the next recurrence occurs on a weekend. If
     * set to 'no-change', then the date is unaffected. If set to
     * 'previous-weekday' or 'next-weekday', then the previous or next weekday
     * is used instead. If set to 'nearest-weekday', then the closest weekday
     * is used instead.
     * @type {string}
     */
    this.onWeekend = options.onWeekend || 'no-change';

    /**
    * Indicates the date after which the repetition should stop, if any.
    * @type {?Date}
    */
    this.endDate = options.endDate || null;

    /**
     * Indicates the maximum number of repetitions before the recurrence should
     * stop, if ever.
     * @type {?number}
     */
    this.maxCount = options.maxCount || null;
  }

  /* eslint-disable class-methods-use-this --
   * TODO: This linter rule should be reenabled after methods are implemented.
   */

  /**
   * Get the next occurrence of the recurring date.
   * @returns {?Date} The date on which the recurrence will next occur, or null
   *   if the recurrence has ended.
   */
  getNextOccurrence() {
    return null;
  }

  /**
   * Update the recurrence to move to the next recurring date. This will update
   * the starting date and remaining repetition count if appropriate.
   */
  advance() {
  }

  /* eslint-enable class-methods-use-this --
   * TODO: Remove after implementing above methods.
   */

  /**
   * Determine whether or not the recurrence was created with the default
   * options.
   * @returns {boolean} True if the recurring date is a default recurrence, and
   *   false otherwise.
   */
  isDefault() {
    const def = new RecurringDate(this.intervalUnit);
    if (this.intervalLength !== def.intervalLength) return false;
    if (this.startDate?.getTime() !== def.startDate?.getTime()) return false;
    if (this.baseOnCompletion !== def.baseOnCompletion) return false;
    if (this.weekNumber !== def.weekNumber) return false;
    if (!_.isEqual(this.daysOfWeek, def.daysOfWeek)) return false;
    if (this.month !== def.month) return false;
    if (this.dayOfMonth !== def.dayOfMonth) return false;
    if (this.onWeekend !== def.onWeekend) return false;
    if (this.endDate?.getTime() !== def.endDate?.getTime()) return false;
    if (this.maxCount !== def.maxCount) return false;
    return true;
  }

  /**
   * Get a string representation of the recurring date.
   * @returns {string} A string representation of the recurring date.
   */
  toString() {
    const length = this.intervalLength;

    let strValue = '';
    switch (this.intervalUnit) {
      case 'day':
        strValue = length === 1 ? 'Daily' : `Every ${length} days`;
        break;
      case 'week':
        strValue = length === 1 ? 'Weekly' : `Every ${length} weeks`;

        if (this.daysOfWeek && this.daysOfWeek.length > 0) {
          strValue += ' on ';
          if (_.uniq(this.daysOfWeek).length === 7) {
            strValue += 'all days';
          } else {
            this.daysOfWeek.forEach((day, index) => {
              if (index > 0) strValue += ', ';
              strValue += WEEKDAYS[day];
            });
          }
        }
        break;
      case 'month':
        strValue = length === 1 ? 'Monthly' : `Every ${length} months`;

        if (this.dayOfMonth) {
          strValue += ` on the ${ordinal(this.dayOfMonth)}`;
        } else if (this.weekNumber && this.daysOfWeek?.length === 1) {
          let weekStr;
          if (this.weekNumber < 5) weekStr = ordinal(this.weekNumber);
          else weekStr = 'last';
          const dayStr = WEEKDAYS[this.daysOfWeek[0]];
          strValue += ` on the ${weekStr} ${dayStr}`;
        }
        break;
      case 'year':
        strValue = length === 1 ? 'Annually' : `Every ${length} years`;

        if (Number.isInteger(this.month) && this.dayOfMonth) {
          const monthStr = MONTHS[this.month];
          const dayStr = ordinal(this.dayOfMonth);
          strValue += ` on ${monthStr} ${dayStr}`;
        }
        break;
      default:
        break;
    }

    return strValue;
  }

  /**
   * Like [toString]{@link module:recurringDate~RecurringDate#toString}, but
   * more verbose, including all details of the recurrence.
   * @param {string} dateFormatStr The format to use for dates.
   * @returns {string} A string representation of the recurring date.
   */
  toStringVerbose(dateFormatStr) {
    let strValue = this.toString();

    if (this.startDate) {
      const dateStr = formatDate(this.startDate, dateFormatStr);
      strValue += `, from ${dateStr}`;
    }

    if (this.endDate) {
      const dateStr = formatDate(this.endDate, dateFormatStr);
      strValue += `, until ${dateStr}`;
    } else if (this.maxCount) {
      if (this.maxCount === 1) strValue += ', 1 time';
      else strValue += `, ${this.maxCount} times`;
    }

    if (this.baseOnCompletion) {
      strValue += ', based on completion date';
    }

    if (this.onWeekend !== 'no-change') {
      strValue += ', ';
      switch (this.onWeekend) {
        case 'previous-weekday':
          strValue += 'previous weekday';
          break;
        case 'next-weekday':
          strValue += 'next weekday';
          break;
        case 'nearest-weekday':
          strValue += 'nearest weekday';
          break;
        default:
          break;
      }
    }

    return strValue;
  }
}

export default RecurringDate;
