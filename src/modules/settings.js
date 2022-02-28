/**
 * Defines the [Settings]{@link module:settings~Settings} class.
 * @module settings
 */

import { getDateFormat } from './utility/dates';

/**
 * Holds user app settings.
 */
class Settings {
  /**
   * Holds information about the pattern to use for formatting and parsing
   * calendar dates.
   * @typedef {Object} module:settings~Settings~dateFormat
   * @property {string} outputPattern The date format string used for
   *   formatting dates for output.
   * @property {string[]} inputPatterns An array of date format strings used
   *   for parsing dates. Each pattern will be tried in sequence until a valid
   *   match is made.
   * @property {string} visualPattern A visual representation of the date
   *   format suitable for displaying to the user.
   * @property {string} type The type of date format. Valid values are 'local',
   *   'iso', 'month-day-year', 'day-month-year', and 'year-month-day'.
   */

  /**
   * Holds options for displaying a task filter.
   * @typedef {Object} module:settings~Settings~filterOptions
   * @property {string} groupBy The field to group the tasks by: 'default',
   *   'due-date', 'priority', 'project', or 'none'. The default depends on the
   *   type of filter.
   * @property {string} sortBy The primary field to sort the tasks by: 'name',
   *   'due-date', 'create-date', 'priority', or 'project'.
   * @property {boolean} sortDescending Indicates whether to sort in descending
   *   order rather than ascending order.
   * @property {boolean} showCompleted Indicates whether to include completed
   *   tasks in the results.
   */

  /**
   * An object holding information about the status of a data import.
   * @typedef {Object} module:settings~Settings~importStatus
   * @property {string[]} errors An array of error messages describing any
   *   errors that occurred during the import.
   */

  /**
   * Create an object holding the default settings.
   */
  constructor() {
    /**
     * The method for storing data: 'none' (no storage) or 'local' (local
     * storage in the browser).
     * @type {string}
     */
    this.storageMethod = 'local';

    /**
     * The format to use for calendar dates.
     * @type {module:settings~Settings~dateFormat}
     */
    this.dateFormat = {};
    this.setDateFormat('local');

    /**
     * Determines how many days after a task is completed before the task will
     * be automatically deleted. If set to null, completed tasks will never be
     * deleted automatically.
     * @type {?number}
     */
    this.deleteAfter = 14;

    /**
     * Holds options for displaying the different types of task filters.
     * @type {Object}
     * @property {module:settings~Settings~filterOptions} default Options for
     *   displaying filters in the 'default' group.
     * @property {module:settings~Settings~filterOptions} dates Options for
     *   displaying filters in the 'dates' group.
     * @property {module:settings~Settings~filterOptions} projects Options for
     *   displaying filters in the 'projects' group.
     * @property {module:settings~Settings~filterOptions} priorities Options
     *   for displaying filters in the 'priorities' group.
     */
    this.filters = {
      default: null,
      dates: null,
      projects: null,
      priorities: null,
    };
    Object.keys(this.filters).forEach((property) => {
      this.filters[property] = {
        groupBy: 'default',
        sortBy: 'create-date',
        sortDescending: false,
        showCompleted: false,
      };
    });
  }

  /**
   * Set the pattern used for formatting and parsing dates.
   * @param {string} [type=local] The type of date format: 'local', 'iso',
   *   'month-day-year', 'day-month-year', or 'year-month-day'.
   */
  setDateFormat(type = 'local') {
    Object.assign(this.dateFormat, Settings.lookupDateFormat(type));
  }

  /**
   * Retrieve formatting information for a particular date format.
   * @param {string} [type=local] The type of date format to lookup: 'local',
   *   'iso', 'month-day-year', 'day-month-year', or 'year-month-day'.
   * @returns {module:settings~Settings~dateFormat} An object holding
   *   information about the date format.
   */
  static lookupDateFormat(type = 'local') {
    switch (type) {
      case 'iso':
        return {
          outputPattern: 'yyyy-MM-dd',
          inputPatterns: ['yyyy-MM-dd'],
          visualPattern: 'YYYY-MM-DD',
          type,
        };
      case 'month-day-year':
        return {
          outputPattern: 'MM/dd/yyyy',
          inputPatterns: ['MM/dd/yy', 'MM/dd/yyyy'],
          visualPattern: 'MM/DD/YYYY',
          type,
        };
      case 'day-month-year':
        return {
          outputPattern: 'dd/MM/yyyy',
          inputPatterns: ['dd/MM/yy', 'dd/MM/yyyy'],
          visualPattern: 'DD/MM/YYYY',
          type,
        };
      case 'year-month-day':
        return {
          outputPattern: 'yyyy/MM/dd',
          inputPatterns: ['yy/MM/dd', 'yyyy/MM/dd'],
          visualPattern: 'YYYY/MM/DD',
          type,
        };
      case 'local':
      default: {
        const formatOpts = {
          tokenStyle: 'internal',
          fullYear: false,
          padMonths: true,
          padDays: true,
        };
        const inputPatterns = [getDateFormat(null, formatOpts)];

        formatOpts.fullYear = true;
        const outputPattern = getDateFormat(null, formatOpts);
        inputPatterns.push(outputPattern);

        formatOpts.tokenStyle = 'visual';
        const visualPattern = getDateFormat(null, formatOpts);

        return {
          outputPattern,
          inputPatterns,
          visualPattern,
          type: 'local',
        };
      }
    }
  }

  /**
   * Import settings from a JSON object.
   * @param {Object} data The serialized JSON object to import.
   * @returns {module:settings~Settings~importStatus} An object holding
   *   information about the status of the import.
   */
  importFromJson(data) {
    const errors = [];

    const badTypeMsg = (setting, type, expectedType) => `Error: Expected type "${expectedType}" for setting "${setting}" (received "${type}").`;
    const badValueMsg = (setting, value) => `Error: Unrecognized value "${value}" for setting "${setting}".`;
    const tooLowMsg = (setting, value, min) => `Error: Value for setting "${setting}" cannot be below "${min}" (received "${value}").`;
    const tooHighMsg = (setting, value, max) => `Error: Value for setting "${setting}" cannot be above "${max}" (received "${value}").`;

    // Check if value matches constraints and add appropriate error message.
    const validate = (
      setting,
      value,
      {
        expectedType,
        expectedValues,
        min,
        max,
      },
    ) => {
      if (value == null) return false;

      /* eslint-disable-next-line valid-typeof --
       * Violations of this rule are usually typing mistakes, but the
       * comparison below is intended.
       */
      if (expectedType && typeof value !== expectedType) {
        errors.push(badTypeMsg(setting, typeof value, expectedType));
        return false;
      }
      if (min != null && value < min) {
        errors.push(tooLowMsg(setting, value, min));
        return false;
      }
      if (max != null && value > max) {
        errors.push(tooHighMsg(setting, value, max));
        return false;
      }
      if (expectedValues != null
        && !expectedValues.includes(value.toLowerCase())) {
        errors.push(badValueMsg(setting, value));
        return false;
      }
      return true;
    };

    if (validate(
      'storageMethod',
      data.storageMethod,
      { expectedType: 'string', expectedValues: ['none', 'local'] },
    )) this.storageMethod = data.storageMethod;

    if (data.dateFormat != null) {
      if (validate(
        'dateFormat.type',
        data.dateFormat.type,
        {
          expectedType: 'string',
          expectedValues: [
            'local',
            'iso',
            'month-day-year',
            'day-month-year',
            'year-month-day',
          ],
        },
      )) this.setDateFormat(data.dateFormat.type);
    }

    if (validate(
      'deleteAfter',
      data.deleteAfter,
      { expectedType: 'number', min: 0 },
    )) this.deleteAfter = data.deleteAfter;

    if (data.filters != null) {
      const processFilter = (name) => {
        const filter = data.filters[name];
        if (filter != null) {
          if (validate(
            `filters.${name}.groupBy`,
            filter.groupBy,
            {
              expectedType: 'string',
              expectedValues: [
                'default',
                'due-date',
                'priority',
                'project',
                'none',
              ],
            },
          )) this.filters[name].groupBy = filter.groupBy;

          if (validate(
            `filters.${name}.sortBy`,
            filter.sortBy,
            {
              expectedType: 'string',
              expectedValues: [
                'name',
                'due-date',
                'create-date',
                'priority',
                'project',
              ],
            },
          )) this.filters[name].sortBy = filter.sortBy;

          if (validate(
            `filters.${name}.sortDescending`,
            filter.sortDescending,
            { expectedType: 'boolean' },
          )) this.filters[name].sortDescending = filter.sortDescending;

          if (validate(
            `filters.${name}.showCompleted`,
            filter.showCompleted,
            { expectedType: 'boolean' },
          )) this.filters[name].showCompleted = filter.showCompleted;
        }
      };

      processFilter('default');
      processFilter('dates');
      processFilter('projects');
      processFilter('priorities');
    }

    return { errors };
  }
}

export default Settings;
