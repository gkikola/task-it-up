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
   * Create an object holding the default settings.
   */
  constructor() {
    /**
     * The format to use for calendar dates.
     * @type {module:settings~Settings~dateFormat}
     */
    this.dateFormat = null;
    this.setDateFormat('local');
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
