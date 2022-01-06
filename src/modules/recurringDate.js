/**
 * Defines the [RecurringDate]{@link module:recurringDate~RecurringDate} class.
 * @module recurringDate
 */

import _ from 'lodash';
import ordinal from 'ordinal';

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
   * @param {Date} [options.startDate] The initial date from which the next
   *   recurrence is calculated. If this is null, then the next date is
   *   calculated from the present time.
   * @param {boolean} [options.allowPastOccurrence=false] If this is true, then
   *   the next occurrence is allowed to be in the past (this can happen if the
   *   start date is in the past).
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
    this._intervalUnit = intervalUnit;

    /**
     * The length of the repetition interval.
     * @type {number}
     */
    this._intervalLength = options.intervalLength || 1;

    /**
     * The initial date from which the next recurrence is calculated. If this
     * is null, then the next date is calculated from the present time.
     * @type {?Date}
     */
    this._startDate = options.startDate || null;

    /**
     * If this is true, then the next occurrence is allowed to be in the past
     * (this can happen if the start date is in the past).
     * @type {boolean}
     */
    this._allowPastOccurrence = options.allowPastOccurrence || false;

    /**
     * The number of the week within a month in which the recurring date should
     * occur. Used in conjunction with daysOfWeek. A value of 1 indicates the
     * first occurrence of a day within the month, 2 indicates the second
     * occurrence, and so on. If this is set to 5, then the 4th or 5th
     * occurrence of the day may be used, depending on how many such days are
     * in a particular month.
     * @type {?number}
     */
    this._weekNumber = options.weekNumber || null;

    /**
     * An array holding the days of the week on which the recurring date should
     * occur. Each day is an integer from 0-6, where 0 represents Sunday, 1
     * represents Monday, and so on.
     * @type {?number[]}
     */
    this._daysOfWeek = options.daysOfWeek || null;

    /**
     * The month in the year on which the recurring date should occur,
     * represented as a number between 0 and 11.
     * @type {?number}
     */
    this._month = null;
    if (options.month !== undefined && options.month !== null)
      this._month = options.month;

    /**
     * The day of the month on which the recurring date should occur,
     * represented as a number between 1 and 31.
     * @type {?number}
     */
    this._dayOfMonth = options.dayOfMonth || null;

    /**
     * Specifies what happens when the next recurrence occurs on a weekend. If
     * set to 'no-change', then the date is unaffected. If set to
     * 'previous-weekday' or 'next-weekday', then the previous or next weekday
     * is used instead. If set to 'nearest-weekday', then the closest weekday
     * is used instead.
     * @type {string}
     */
    this._onWeekend = options.onWeekend || 'no-change';

    /**
    * Indicates the date after which the repetition should stop, if any.
    * @type {?Date}
    */
    this._endDate = options.endDate || null;

    /**
     * Indicates the maximum number of repetitions before the recurrence should
     * stop, if ever.
     * @type {?number}
     */
    this._maxCount = options.maxCount || null;
  }

  /**
   * The unit of time ('day', 'week', 'month', or 'year') in which the
   * repetition interval is measured.
   * @type {string}
   */
  get intervalUnit() {
    return this._intervalUnit;
  }

  /**
   * The length of the repetition interval.
   * @type {number}
   */
  get intervalLength() {
    return this._intervalLength;
  }

  /**
   * The initial date from which the recurrence is calculated, or null if the
   * date is always calculated from the present time.
   * @type {?Date}
   */
  get startDate() {
    return this._startDate;
  }

  /**
   * If this is true, then the next occurrence is allowed to be in the past
   * (this can happen if the start date is in the past).
   * @type {boolean}
   */
  get allowPastOccurrence() {
    return this._allowPastOccurrence;
  }

  /**
   * The number of the week within a month in which the recurring date should
   * occur. Used in conjunction with daysOfWeek. A value of 1 indicates the
   * first occurrence of a day within the month, 2 indicates the second
   * occurrence, and so on. If this is set to 5, then the 4th or 5th occurrence
   * of the day may be used, depending on how many such days are in a
   * particular month.
   * @type {?number}
   */
  get weekNumber() {
    return this._weekNumber;
  }

  /**
   * An array holding the days of the week on which the recurring date should
   * occur. Each day is an integer from 0-6, where 0 represents Sunday, 1
   * represents Monday, and so on.
   * @type {?number[]}
   */
  get daysOfWeek() {
    return this._daysOfWeek;
  }

  /**
   * The month in the year on which the recurring date should occur, if any.
   * The month is represented as a number from 0 to 11.
   * @type {?number}
   */
  get month() {
    return this._month;
  }

  /**
   * The day of the month on which the recurring date should occur, if any. The
   * day is represented as a number from 1 to 31.
   * @type {?number}
   */
  get dayOfMonth() {
    return this._dayOfMonth;
  }

  /**
   * Specifies what happens when the next recurrence falls on a weekend. If set
   * to 'no-change', then the date is unaffected. If set to 'previous-weekday'
   * or 'next-weekday', then the previous or next weekday is used instead. If
   * set to 'nearest-weekday', then the closest weekday is used instead.
   * @type {string}
   */
  get onWeekend() {
    return this._onWeekend;
  }

  /**
   * Indicates the date after which the repetition should stop, if ever.
   * @type {?Date}
   */
  get endDate() {
    return this._endDate;
  }

  /**
   * Indicates the maximum number of repetitions before the recurrence should
   * stop, if ever.
   * @type {?number}
   */
  get maxCount() {
    return this._maxCount;
  }

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

  /**
   * Determine whether or not the recurrence was created with the default
   * options.
   * @returns {boolean} True if the recurring date is a default recurrence, and
   *   false otherwise.
   */
  isDefault() {
    const def = new RecurringDate(this.intervalUnit);
    if (this.intervalLength !== def.intervalLength)
      return false;
    if (this.startDate?.getTime() !== def.startDate?.getTime())
      return false;
    if (this.allowPastOccurrence !== def.allowPastOccurrence)
      return false;
    if (this.weekNumber !== def.weekNumber)
      return false;
    if (!_.isEqual(this.daysOfWeek, def.daysOfWeek))
      return false;
    if (this.month !== def.month)
      return false;
    if (this.dayOfMonth !== def.dayOfMonth)
      return false;
    if (this.onWeekend !== def.onWeekend)
      return false;
    if (this.endDate?.getTime() !== def.endDate?.getTime())
      return false;
    if (this.maxCount !== def.maxCount)
      return false;
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
          this.daysOfWeek.forEach((day, index, arr) => {
            if (index > 0)
              strValue += (index !== arr.length - 1) ? ', ' : ', and ';
            strValue += WEEKDAYS[day];
          });
        }
        break;
      case 'month':
        strValue = length === 1 ? 'Monthly' : `Every ${length} months`;

        if (this.dayOfMonth) {
          strValue += ` on the ${ordinal(this.dayOfMonth)}`;
        } else if (this.weekNumber && this.daysOfWeek?.length === 1) {
          let weekStr;
          if (this.weekNumber < 5)
            weekStr = ordinal(this.weekNumber);
          else
            weekStr = 'last';
          const dayStr = WEEKDAYS[this.daysOfWeek[0]];
          strValue += ` on the ${weekStr} ${dayStr}`;
        }
        break;
      case 'year':
        strValue = length === 1 ? 'Annually' : `Every ${length} years`;

        console.log(this);
        if (Number.isInteger(this.month) && this.dayOfMonth) {
          const monthStr = MONTHS[this.month];
          const dayStr = ordinal(this.dayOfMonth);
          strValue += ` on ${monthStr} ${dayStr}`;
        }
        break;
    }

    return strValue;
  }
};

export default RecurringDate;
