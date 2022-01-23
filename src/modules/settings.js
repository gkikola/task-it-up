/**
 * Defines the [Settings]{@link module:settings~Settings} class.
 * @module settings
 */

import { getDateFormat } from './utility';

/**
 * Holds user app settings.
 */
class Settings {
  /**
   * Holds information about the pattern to use for formatting and parsing
   * calendar dates.
   * @typedef {Object} module:settings~Settings~dateFormat
   * @property {string} internal The internal date format string used for
   *   formatting and parsing dates.
   * @property {string} visual The date format as a pattern that can be shown
   *   to the user.
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
   * Create an object holding the default settings.
   */
  constructor() {
    /**
     * The format to use for calendar dates.
     * @type {module:settings~Settings~dateFormat}
     */
    this.dateFormat = null;
    this.setDateFormat('local');

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
    this.dateFormat = Settings.lookupDateFormat(type);
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
        return { internal: 'yyyy-MM-dd', visual: 'YYYY-MM-DD', type };
      case 'month-day-year':
        return { internal: 'MM/dd/yyyy', visual: 'MM/DD/YYYY', type };
      case 'day-month-year':
        return { internal: 'dd/MM/yyyy', visual: 'DD/MM/YYYY', type };
      case 'year-month-day':
        return { internal: 'yyyy/MM/dd', visual: 'YYYY/MM/DD', type };
      case 'local':
      default: {
        const formatOpts = {
          tokenStyle: 'internal',
          fullYear: true,
          padMonths: true,
          padDays: true,
        };
        const internal = getDateFormat(null, formatOpts);

        formatOpts.tokenStyle = 'visual';
        const visual = getDateFormat(null, formatOpts);

        return { internal, visual, type: 'local' };
      }
    }
  }
}

export default Settings;
