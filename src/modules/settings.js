/**
 * Defines the [Settings]{@link module:settings~Settings} class.
 * @module settings
 */

import _ from 'lodash';

import { getJsonType, validateValue } from './utility/data';
import { getDateFormat } from './utility/dates';

/**
 * Object holding private members for the
 * [Settings]{@link module:settings~Settings} class.
 * @typedef {Object} module:settings~Settings~privates
 * @property {string} storageMethod The method for storing data: 'none' (no
 *   storage) or 'local' (local storage in the browser).
 * @property {module:settings~Settings~dateFormat} dateFormat The format to use
 *   for calendar dates.
 * @property {?number} deleteAfter Determines how many days after a task is
 *   completed before the task will be automatically deleted. If set to null,
 *   completed tasks will never be deleted automatically.
 * @property {Map} filterGroups A map associating the name of a filter group to
 *   a [filterOptions]{@link module:settings~Settings~filterOptions} object.
 */

/**
 * Holds private data for the [Settings]{@link module:settings~Settings} class.
 * @type {WeakMap}
 * @see module:settings~Settings~privates
 */
const privateMembers = new WeakMap();

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
    const privates = {
      storageMethod: null,
      dateFormat: {},
      deleteAfter: null,
      filterGroups: new Map(),
    };
    privateMembers.set(this, privates);

    this.resetToDefault();
  }

  /**
   * The method for storing data: 'none' (no storage) or 'local' (local storage
   * in the browser).
   * @type {string}
   */
  get storageMethod() {
    return privateMembers.get(this).storageMethod;
  }

  set storageMethod(method) {
    if (method !== 'none' && method !== 'local') {
      throw new RangeError(`Unrecognized storage method: "${method}"`);
    }
    privateMembers.get(this).storageMethod = method;
  }

  /**
   * An object holding information about the format to use for calendar dates.
   * @type {module:settings~Settings~dateFormat}
   * @readonly
   */
  get dateFormat() {
    return _.cloneDeep(privateMembers.get(this).dateFormat);
  }

  /**
   * Determines how many days after a task is completed before the task will be
   * automatically deleted. If set to null, completed tasks will never be
   * deleted automatically.
   * @type {?number}
   */
  get deleteAfter() {
    return privateMembers.get(this).deleteAfter;
  }

  set deleteAfter(days) {
    privateMembers.get(this).deleteAfter = days;
  }

  /**
   * Get an object holding options for displaying task filters belonging to a
   * particular filter group.
   * @param {string} filterGroup The filter group whose options are to be
   *   retrieved.
   * @returns {?module:settings~Settings~filterOptions} An object holding the
   *   filter options, or null if the filter group was not found.
   */
  getFilterOptions(filterGroup) {
    const opts = privateMembers.get(this).filterGroups.get(filterGroup);
    return opts ? _.cloneDeep(opts) : null;
  }

  /**
   * Set options for displaying task filters belonging to a particular filter
   * group.
   * @param {string} filterGroup The filter group whose options are to be
   *   changed.
   * @param {module:settings~Settings~filterOptions} [options={}] An object
   *   specifying the filter options to set. Any unspecified options will
   *   retain their prior values, or will be set to default values if they were
   *   not previously set.
   */
  setFilterOptions(filterGroup, options = {}) {
    const { filterGroups } = privateMembers.get(this);

    const oldOptions = filterGroups.get(filterGroup);

    const newOptions = {
      groupBy: options.groupBy ?? oldOptions?.groupBy ?? 'default',
      sortBy: options.sortBy ?? oldOptions?.sortBy ?? 'create-date',
      sortDescending: options.sortDescending ?? oldOptions?.sortDescending
        ?? false,
      showCompleted: options.showCompleted ?? oldOptions?.showCompleted
        ?? false,
    };

    filterGroups.set(filterGroup, newOptions);
  }

  /**
   * Reset all settings to their default values.
   */
  resetToDefault() {
    this.storageMethod = 'local';
    this.setDateFormat('local');
    this.deleteAfter = 14;
    ['default', 'dates', 'projects', 'priorities'].forEach((group) => {
      this.setFilterOptions(group);
    });
  }

  /**
   * Set the pattern used for formatting and parsing dates.
   * @param {string} [type=local] The type of date format: 'local', 'iso',
   *   'month-day-year', 'day-month-year', or 'year-month-day'.
   */
  setDateFormat(type = 'local') {
    privateMembers.get(this).dateFormat = Settings.lookupDateFormat(type);
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
   * Convert data to an object suitable for serialization.
   * @returns {Object} An object representing serializable data for the class.
   */
  toJSON() {
    const result = {
      storageMethod: this.storageMethod,
      dateFormat: this.dateFormat,
      deleteAfter: this.deleteAfter,
      filterGroups: {},
    };

    privateMembers.get(this).filterGroups.forEach((options, group) => {
      result.filterGroups[group] = _.cloneDeep(options);
    });

    return result;
  }

  /**
   * Import settings from a JSON object.
   * @param {Object} data The serialized JSON object to import.
   * @returns {module:settings~Settings~importStatus} An object holding
   *   information about the status of the import.
   */
  importFromJson(data) {
    const errors = [];

    const handleError = (errorType, value, options) => {
      if (value == null) return;
      switch (errorType) {
        case 'bad-type':
          errors.push(`Error: Expected type "${options.expectedType}" for setting "${options.valueName}" (received "${getJsonType(value)}").`);
          break;
        case 'unknown-value':
          errors.push(`Error: Unrecognized value "${value}" for setting "${options.valueName}".`);
          break;
        case 'not-integer':
          errors.push(`Error: Value for setting "${options.valueName}" must be an integer (received "${value}").`);
          break;
        case 'too-low':
          errors.push(`Error: Value for setting "${options.valueName}" cannot be below "${options.min}" (received "${value}").`);
          break;
        case 'too-high':
          errors.push(`Error: Value for setting "${options.valueName}" cannot be above "${options.max}" (received "${value}").`);
          break;
        default:
          errors.push(`Error: Encountered unrecognized error "${errorType}" for setting "${options.valueName}".`);
          break;
      }
    };

    if (validateValue(data.storageMethod, {
      valueName: 'storageMethod',
      expectedType: 'string',
      expectedValues: ['none', 'local'],
      errorCallback: handleError,
    })) this.storageMethod = data.storageMethod;

    if (data.dateFormat != null) {
      if (validateValue(data.dateFormat.type, {
        valueName: 'dateFormat.type',
        expectedType: 'string',
        expectedValues: [
          'local',
          'iso',
          'month-day-year',
          'day-month-year',
          'year-month-day',
        ],
        errorCallback: handleError,
      })) this.setDateFormat(data.dateFormat.type);
    }

    if (validateValue(data.deleteAfter, {
      valueName: 'deleteAfter',
      expectedType: 'number',
      requireInteger: true,
      min: 0,
      errorCallback: handleError,
    })) this.deleteAfter = data.deleteAfter;

    if (data.filterGroups != null) {
      const processGroup = (name) => {
        const filterOptions = data.filterGroups[name];
        if (filterOptions != null) {
          const newOptions = {};

          if (validateValue(filterOptions.groupBy, {
            valueName: `filterGroups.${name}.groupBy`,
            expectedType: 'string',
            expectedValues: [
              'default',
              'due-date',
              'priority',
              'project',
              'none',
            ],
            errorCallback: handleError,
          })) newOptions.groupBy = filterOptions.groupBy;

          if (validateValue(filterOptions.sortBy, {
            valueName: `filterGroups.${name}.sortBy`,
            expectedType: 'string',
            expectedValues: [
              'name',
              'due-date',
              'create-date',
              'priority',
              'project',
            ],
            errorCallback: handleError,
          })) newOptions.sortBy = filterOptions.sortBy;

          if (validateValue(filterOptions.sortDescending, {
            valueName: `filterGroups.${name}.sortDescending`,
            expectedType: 'boolean',
            errorCallback: handleError,
          })) newOptions.sortDescending = filterOptions.sortDescending;

          if (validateValue(filterOptions.showCompleted, {
            valueName: `filterGroups.${name}.showCompleted`,
            expectedType: 'boolean',
            errorCallback: handleError,
          })) newOptions.showCompleted = filterOptions.showCompleted;

          this.setFilterOptions(name, newOptions);
        }
      };

      processGroup('default');
      processGroup('dates');
      processGroup('projects');
      processGroup('priorities');
    }

    return { errors };
  }
}

export default Settings;
