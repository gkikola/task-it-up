/**
 * Defines the [RecurringDate]{@link module:recurringDate~RecurringDate} class.
 * @module recurringDate
 */

import _ from 'lodash';
import ordinal from 'ordinal';
import {
  add as addToDate,
  getDaysInMonth,
  isBefore as isDateBefore,
  isWeekend,
  nextDay,
  previousDay,
  startOfDay,
  startOfMonth,
} from 'date-fns';

import {
  formatDate,
  getWeekdayName,
  getMonthName,
  parseIsoDateTime,
} from './utility/dates';

/**
 * Starting from the given date, find the next date landing on one of the given
 * days of the week.
 * @param {Date} date The initial date to start from.
 * @param {number[]} daysOfWeek An array of desired weekdays. Each day is a
 *   value from 0-6, with Sunday being 0.
 * @returns {Date} The first date on or after the given date that matches one
 *   of the given weekdays.
 */
function nextDayOfWeek(date, daysOfWeek) {
  let result = startOfDay(date);
  if (daysOfWeek.length === 0) return result;

  const currentDay = result.getDay();
  const daysToAdd = daysOfWeek.map((day) => (
    day >= currentDay ? day - currentDay : day + 7 - currentDay
  )).reduce((min, current) => (current < min ? current : min));

  if (daysToAdd > 0) result = addToDate(result, { days: daysToAdd });
  return result;
}

/**
 * Starting from the given date, find the next date with the indicated day of
 * the month.
 * @param {Date} date The initial date to start from.
 * @param {number} dayOfMonth The desired day of the month, from 1-31.
 * @returns {Date} The first date on or after the given date that matches the
 *   day of the month.
 */
function nextDayOfMonth(date, dayOfMonth) {
  const currentMonth = startOfMonth(date);
  const nextMonth = startOfMonth(addToDate(currentMonth, { months: 1 }));

  const result = (date.getDate() <= dayOfMonth) ? currentMonth : nextMonth;
  const daysInMonth = getDaysInMonth(result);
  result.setDate(Math.min(dayOfMonth, daysInMonth));
  return result;
}

/**
 * Starting from the given date, find the next date belonging to the indicated
 * week and weekday of the month.
 * @param {Date} date The initial date to start from.
 * @param {number} weekNumber The week of the month, from 1-5.
 * @param {number} weekDay The day of the week, from 0-6 with Sunday being 0.
 * @returns {Date} The first date on or after the given date that matches the
 *   week and day of the month.
 */
function nextWeekOfMonth(date, weekNumber, weekDay) {
  const currentMonth = startOfMonth(date);
  const nextMonth = startOfMonth(addToDate(currentMonth, { months: 1 }));

  const findDay = (month) => {
    const daysInMonth = getDaysInMonth(month);
    let result = month;
    if (result.getDay() !== weekDay) result = nextDay(result, weekDay);

    let daysToAdd = (weekNumber - 1) * 7;
    if (result.getDate() + daysToAdd > daysInMonth) {
      daysToAdd = Math.floor((daysInMonth - result.getDate()) / 7) * 7;
    }
    if (weekNumber > 1) result = addToDate(result, { days: daysToAdd });
    return result;
  };

  let result = findDay(currentMonth);
  if (isDateBefore(result, date)) result = findDay(nextMonth);

  return result;
}

/**
 * Starting from the given date, find the next date belonging to the given
 * month and day of the year.
 * @param {Date} date The initial date to start from.
 * @param {number} month The desired month, from 0-11 with January being 0.
 * @param {number} dayOfMonth The desired day of the month, from 1-31.
 * @returns {Date} The first date on or after the given date that matches the
 *   month and day of the year.
 */
function nextDayOfYear(date, month, dayOfMonth) {
  const dateOfCurrentYear = new Date(date.getFullYear(), month, 1);
  dateOfCurrentYear.setDate(
    Math.min(dayOfMonth, getDaysInMonth(dateOfCurrentYear)),
  );

  const dateOfNextYear = new Date(date.getFullYear() + 1, month, 1);
  dateOfNextYear.setDate(
    Math.min(dayOfMonth, getDaysInMonth(dateOfNextYear)),
  );

  let result = dateOfCurrentYear;
  if (isDateBefore(result, date)) result = dateOfNextYear;
  return result;
}

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
    this.intervalLength = options.intervalLength ?? 1;

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
    this.baseOnCompletion = options.baseOnCompletion ?? false;

    /**
     * The number of the week within a month in which the recurring date should
     * occur. Used in conjunction with daysOfWeek. A value of 1 indicates the
     * first occurrence of a day within the month, 2 indicates the second
     * occurrence, and so on. If this is set to 5, then the 4th or 5th
     * occurrence of the day may be used, depending on how many such days are
     * in a particular month.
     * @type {?number}
     */
    this.weekNumber = options.weekNumber ?? null;

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
    this.month = options.month ?? null;

    /**
     * The day of the month on which the recurring date should occur,
     * represented as a number between 1 and 31.
     * @type {?number}
     */
    this.dayOfMonth = options.dayOfMonth ?? null;

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
    this.maxCount = options.maxCount ?? null;
  }

  /**
   * Get the next occurrence of the recurring date.
   * @param {Date} [baseDate] The base date from which the next occurrence
   *   should be calculated. If not given, then the present day is used.
   * @returns {?Date} The date on which the recurrence will next occur, or null
   *   if the recurrence has ended.
   */
  getNextOccurrence(baseDate) {
    if (typeof this.maxCount === 'number' && this.maxCount < 1) return null;

    const reference = startOfDay(baseDate || new Date());

    let startDate = reference;
    if (this.startDate && isDateBefore(reference, this.startDate)) {
      startDate = startOfDay(this.startDate);
    }

    if (this.onWeekend === 'previous-weekday' && isWeekend(startDate)) {
      // Move starting date to following Monday
      startDate = nextDay(startDate, 1);
    } else if (this.onWeekend === 'nearest-weekday'
      && startDate.getDay() === 6) {
      // Move starting date to Sunday
      startDate = nextDay(startDate, 0);
    }

    const isBeforeStart = (date) => startDate && isDateBefore(date, startDate);

    let result = reference;
    switch (this.intervalUnit) {
      case 'day':
        result = addToDate(result, { days: this.intervalLength });
        if (isBeforeStart(result)) result = startDate;
        break;
      case 'month':
        if (this.dayOfMonth || this.weekNumber) {
          result = addToDate(result, {
            months: this.intervalLength,
            days: -14,
          });

          if (this.dayOfMonth) {
            result = nextDayOfMonth(result, this.dayOfMonth);

            if (isBeforeStart(result)) {
              result = nextDayOfMonth(startDate, this.dayOfMonth);
            }
          } else if (this.weekNumber) {
            let weekDay = 0;
            if (this.daysOfWeek && this.daysOfWeek.length > 0) {
              [weekDay] = this.daysOfWeek;
            }
            result = nextWeekOfMonth(result, this.weekNumber, weekDay);

            if (isBeforeStart(result)) {
              result = nextWeekOfMonth(startDate, this.weekNumber, weekDay);
            }
          }
        } else {
          result = addToDate(result, { months: this.intervalLength });
          if (isBeforeStart(result)) {
            result = nextDayOfMonth(startDate, reference.getDate());
          }
        }
        break;
      case 'year':
        if (typeof this.month === 'number') {
          result = addToDate(result, {
            years: this.intervalLength,
            months: -6,
          });

          result = nextDayOfYear(result, this.month, this.dayOfMonth || 1);
          if (isBeforeStart(result)) {
            result = nextDayOfYear(
              startDate,
              this.month,
              this.dayOfMonth || 1,
            );
          }
        } else {
          result = addToDate(result, { years: this.intervalLength });
          if (isBeforeStart(result)) {
            result = nextDayOfYear(
              startDate,
              reference.getMonth(),
              reference.getDate(),
            );
          }
        }
        break;
      case 'week':
        if (this.daysOfWeek && this.daysOfWeek.length > 0) {
          // Check for occurrences remaining for the current week
          if (this.daysOfWeek.findIndex((day) => (
            day > result.getDay()
          )) !== -1) {
            result = addToDate(result, { days: 1 });
            result = nextDayOfWeek(result, this.daysOfWeek);
          } else {
            // Done with current week, start at following Sunday
            result = nextDay(result, 0);
            if (this.intervalLength > 1) {
              result = addToDate(result, { weeks: this.intervalLength - 1 });
            }
            result = nextDayOfWeek(result, this.daysOfWeek);
          }

          if (isBeforeStart(result)) {
            result = nextDayOfWeek(startDate, this.daysOfWeek);
          }
        } else {
          result = addToDate(result, { weeks: this.intervalLength });
          if (isBeforeStart(result)) {
            result = nextDayOfWeek(startDate, [reference.getDay()]);
          }
        }
        break;
      default:
        break;
    }

    if (this.onWeekend !== 'no-change' && isWeekend(result)) {
      let forward;
      switch (this.onWeekend) {
        case 'previous-weekday':
          forward = false;
          break;
        case 'next-weekday':
          forward = true;
          break;
        case 'nearest-weekday':
          forward = result.getDay() === 0;
          break;
        default:
          forward = true;
          break;
      }

      if (forward) result = nextDay(result, 1); // Next Monday
      else result = previousDay(result, 5); // Previous Friday
    }

    if (this.endDate && isDateBefore(this.endDate, result)) return null;

    return result;
  }

  /**
   * Advance the recurrence to the next date. This will update the remaining
   * repetition count if needed.
   */
  advance() {
    if (typeof this.maxCount === 'number' && this.maxCount > 0) {
      this.maxCount -= 1;
    }
  }

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
              strValue += getWeekdayName(day);
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
          const dayStr = getWeekdayName(this.daysOfWeek[0]);
          strValue += ` on the ${weekStr} ${dayStr}`;
        }
        break;
      case 'year':
        strValue = length === 1 ? 'Annually' : `Every ${length} years`;

        if (Number.isInteger(this.month) && this.dayOfMonth) {
          const monthStr = getMonthName(this.month);
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

  /**
   * Create a recurring date from a JSON object.
   * @param {Object} data The JSON object holding the serialized data.
   * @returns {module:recurringDate~RecurringDate} A new recurring date
   *   converted from the JSON data.
   */
  static fromJson(data) {
    const convertDate = (date) => (date ? parseIsoDateTime(date) : null);
    return new RecurringDate(data.intervalUnit, {
      intervalLength: data.intervalLength,
      startDate: convertDate(data.startDate),
      baseOnCompletion: data.baseOnCompletion,
      weekNumber: data.weekNumber,
      daysOfWeek: data.daysOfWeek,
      month: data.month,
      dayOfMonth: data.dayOfMonth,
      onWeekend: data.onWeekend,
      endDate: convertDate(data.endDate),
      maxCount: data.maxCount,
    });
  }
}

export default RecurringDate;
