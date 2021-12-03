/**
 * Defines the [RecurringDate]{@link module:recurringDate~RecurringDate} class.
 * @module recurringDate
 */

/**
 * Represents a recurring date.
 */
class RecurringDate {
  /**
   * Create a recurring date.
   * @param {string} intervalUnit The unit of time (e.g. "week") in which the
   *   repetition interval is measured.
   * @param {number} intervalLength The length of the repetition interval.
   * @param {Date} [startFrom] An optional initial date from which to calculate
   *   the next recurrence. If not provided, the next date is calculated from
   *   the present time.
   */
  constructor(intervalUnit, intervalLength, startFrom) {
    /**
     * The unit of time in which the repetition interval is measured.
     * @type {string}
     */
    this.intervalUnit = intervalUnit;

    /**
     * The length of the repetition interval.
     * @type {number}
     */
    this.intervalLength = intervalLength;

    /**
     * The initial date from which the next recurrence is calculated. If this
     * is null, then the next date is calculated from the present time.
     * @type {?Date}
     */
    this.startFrom = startFrom || null;

    /**
     * The number of the week within a month in which the recurring date should
     * occur. A value of 1 indicates the first week of the month, 2 indicates
     * the second, and so on.
     * @type {?number}
     */
    this.weekOfMonth = null;

    /**
     * An array holding the days of the week on which the recurring date should
     * occur. Each day is an integer from 0-6, where 0 represents Sunday, 1
     * represents Monday, and so on.
     * @type {number[]}
     */
    this.daysOfWeek = [];

    /**
     * Specifies what happens when the next recurrence occurs on a weekend. If
     * set to 'no change', then the date is unaffected. If set to
     * 'previous weekday', then the previous weekday is used instead. If
     * set to 'next weekday', then the next weekday is used instead.
     * @type {string}
     */
    this.onWeekends = 'no change';

    /**
     * Indicates the date after which the repetition should stop, if any.
     * @type {?Date}
     */
    this.endDate = null;

    /**
     * Indicates the maximum number of repetitions before the recurrence should
     * stop, if ever.
     * @type {?number}
     */
    this.count = null;
  }
};

export default RecurringDate;
