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
   * @param {boolean} [options.skipPast=false] If this is true, then the
   *   recurring date will never occur in the past (i.e. before the present
   *   day), even if the start date is in the past.
   * @param {number} [options.weekNumber] The number of the week within a month
   *   in which the recurring date should occur. A value of 1 indicates the
   *   first week of the month, 2 indicates the second, and so on.
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
   *   the previous or next weekday is used instead.
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
     * If this is true, then the recurring date will never occur in the past
     * (i.e. before the present day), even if the start date is in the past.
     * @type {boolean}
     */
    this._skipPast = options.skipPast || false;

    /**
    * The number of the week within a month in which the recurring date should
    * occur. A value of 1 indicates the first week of the month, 2 indicates
    * the second, and so on.
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
   * If this is true, then the recurring date will never occur in the past
   * (i.e. before the present day), even if the start date is in the past.
   * @type {boolean}
   */
  get skipPast() {
    return this._skipPast;
  }

  /**
   * The number of the week within a month in which the recurring date should
   * occur, if any. A value of 1 indicates the first week of the month, 2
   * indicates the second, and so on.
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
   * or 'next-weekday', then the previous or next weekday is used instead.
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
   * Get a string representation of the recurring date.
   * @returns {string} A string representation of the recurring date.
   */
  toString() {
    return 'RecurringDate';
  }

  /**
   * Create a daily recurrence.
   * @param {Object} [options={}] An object holding options for the recurrence.
   * @param {number} [options.intervalLength=1] Specifies how many days occur
   *   between each repetition.
   * @param {Date} [options.startDate] The initial date from which the next
   *   recurrence will be calculated. If not given, then the next date is
   *   calculated from the present time.
   * @param {boolean} [options.skipPast] If this is true, then the recurring
   *   date will never occur in the past (i.e. before the present day), even if
   *   the start date is in the past.
   * @param {string} [options.onWeekend=no-change] Specifies what happens when
   *   the next recurrence occurs on a weekend. If set to 'no-change', then the
   *   date is unaffected. If set to 'previous-weekday', then the previous
   *   weekday is used instead. If set to 'next-weekday', then the next weekday
   *   is used instead.
   * @param {Date} [options.endDate] Specifies the date after which the
   *   repetitions should stop.
   * @param {number} [options.maxCount] Specifies the maximum number of
   *   repetitions before the recurrence should stop.
   * @returns {module:recurringDate~RecurringDate} The newly-created recurring
   *   date.
   */
  static daily(options = {}) {
    return new RecurringDate('day', {
      intervalLength: options.intervalLength || 1,
      startDate: options.startDate || null,
      skipPast: options.skipPast || false,
      onWeekend: options.onWeekend || 'no-change',
      endDate: options.endDate || null,
      maxCount: options.maxCount || null,
    });
  }

  /**
   * Create a weekly recurrence.
   * @param {Object} [options={}] An object holding options for the recurrence.
   * @param {number} [options.intervalLength=1] Specifies how many weeks occur
   *   between each repetition.
   * @param {Date} [options.startDate] The initial date from which the next
   *   recurrence will be calculated. If not given, then the next date is
   *   calculated from the present time.
   * @param {boolean} [options.skipPast] If this is true, then the recurring
   *   date will never occur in the past (i.e. before the present day), even if
   *   the start date is in the past.
   * @param {number[]} [options.daysOfWeek] An array holding the days of the
   *   week on which the recurring date should occur. Each day is an integer
   *   from 0-6, where 0 represents Sunday, 1 represents Monday, and so on.
   * @param {string} [options.onWeekend=no-change] Specifies what happens when
   *   the next recurrence occurs on a weekend. If set to 'no-change', then the
   *   date is unaffected. If set to 'previous-weekday', then the previous
   *   weekday is used instead. If set to 'next-weekday', then the next weekday
   *   is used instead.
   * @param {Date} [options.endDate] Specifies the date after which the
   *   repetitions should stop.
   * @param {number} [options.maxCount] Specifies the maximum number of
   *   repetitions before the recurrence should stop.
   * @returns {module:recurringDate~RecurringDate} The newly-created recurring
   *   date.
   */
  static weekly(options = {}) {
    return new RecurringDate('week', {
      intervalLength: options.intervalLength || 1,
      startDate: options.startDate || null,
      skipPast: options.skipPast || false,
      daysOfWeek: options.daysOfWeek || null,
      onWeekend: options.onWeekend || 'no-change',
      endDate: options.endDate || null,
      maxCount: options.maxCount || null,
    });
  }

  /**
   * Create a monthly recurrence.
   * @param {Object} [options={}] An object holding options for the recurrence.
   * @param {number} [options.intervalLength=1] Specifies how many months occur
   *   between each repetition.
   * @param {Date} [options.startDate] The initial date from which the next
   *   recurrence will be calculated. If not given, then the next date is
   *   calculated from the present time.
   * @param {boolean} [options.skipPast] If this is true, then the recurring
   *   date will never occur in the past (i.e. before the present day), even if
   *   the start date is in the past.
   * @param {number} [options.weekNumber] The number of the week within a month
   *   in which the recurring date should occur. A value of 1 indicates the
   *   first week of the month, 2 indicates the second, and so on.
   * @param {number[]} [options.weekDay] The day of the week on which the
   *   recurring date should occur, represented as a number from 0-6. A value
   *   of 0 represents Sunday, 1 represents Monday, and so on.
   * @param {number} [options.dayOfMonth] The day of the month on which the
   *   recurring date should occur, represented as a number from 1 to 31. This
   *   value overrides the weekNumber and weekDay options.
   * @param {string} [options.onWeekend=no-change] Specifies what happens when
   *   the next recurrence occurs on a weekend. If set to 'no-change', then the
   *   date is unaffected. If set to 'previous-weekday', then the previous
   *   weekday is used instead. If set to 'next-weekday', then the next weekday
   *   is used instead.
   * @param {Date} [options.endDate] Specifies the date after which the
   *   repetitions should stop.
   * @param {number} [options.maxCount] Specifies the maximum number of
   *   repetitions before the recurrence should stop.
   * @returns {module:recurringDate~RecurringDate} The newly-created recurring
   *   date.
   */
  static monthly(options = {}) {
    let daysOfWeek = null;
    if (options.weekDay !== null && options.weekDay !== undefined)
      daysOfWeek = [options.weekDay];

    return new RecurringDate('month', {
      intervalLength: options.intervalLength || 1,
      startDate: options.startDate || null,
      skipPast: options.skipPast || false,
      weekNumber: options.weekNumber || null,
      daysOfWeek,
      dayOfMonth: options.dayOfMonth || null,
      onWeekend: options.onWeekend || 'no-change',
      endDate: options.endDate || null,
      maxCount: options.maxCount || null,
    });
  }

  /**
   * Create a yearly recurrence.
   * @param {Object} [options={}] An object holding options for the recurrence.
   * @param {number} [options.intervalLength=1] Specifies how many years occur
   *   between each repetition.
   * @param {Date} [options.startDate] The initial date from which the next
   *   recurrence will be calculated. If not given, then the next date is
   *   calculated from the present time.
   * @param {boolean} [options.skipPast] If this is true, then the recurring
   *   date will never occur in the past (i.e. before the present day), even if
   *   the start date is in the past.
   * @param {number} [options.weekNumber] The number of the week within a month
   *   in which the recurring date should occur. A value of 1 indicates the
   *   first week of the month, 2 indicates the second, and so on.
   * @param {number[]} [options.weekDay] The day of the week on which the
   *   recurring date should occur, represented as a number from 0-6. A value
   *   of 0 represents Sunday, 1 represents Monday, and so on.
   * @param {number} [options.month] The month in the year on which the
   *   recurring date should occur, represented as a number from 0 to 11.
   * @param {number} [options.dayOfMonth] The day of the month on which the
   *   recurring date should occur, represented as a number from 1 to 31. This
   *   value overrides the weekNumber and weekDay options.
   * @param {string} [options.onWeekend=no-change] Specifies what happens when
   *   the next recurrence occurs on a weekend. If set to 'no-change', then the
   *   date is unaffected. If set to 'previous-weekday', then the previous
   *   weekday is used instead. If set to 'next-weekday', then the next weekday
   *   is used instead.
   * @param {Date} [options.endDate] Specifies the date after which the
   *   repetitions should stop.
   * @param {number} [options.maxCount] Specifies the maximum number of
   *   repetitions before the recurrence should stop.
   * @returns {module:recurringDate~RecurringDate} The newly-created recurring
   *   date.
   */
  static yearly(options = {}) {
    let daysOfWeek = null;
    if (options.weekDay !== null && options.weekDay !== undefined)
      daysOfWeek = [options.weekDay];

    let month = null;
    if (options.month !== null && options.month !== undefined)
      month = options.month;

    return new RecurringDate('year', {
      intervalLength: options.intervalLength || 1,
      startDate: options.startDate || null,
      skipPast: options.skipPast || false,
      weekNumber: options.weekNumber || null,
      daysOfWeek,
      month,
      dayOfMonth: options.dayOfMonth || null,
      onWeekend: options.onWeekend || 'no-change',
      endDate: options.endDate || null,
      maxCount: options.maxCount || null,
    });
  }
};

export default RecurringDate;
