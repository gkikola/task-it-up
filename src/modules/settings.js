/**
 * Defines the [Settings]{@link module:settings~Settings} class.
 * @module settings
 */

import EventEmitter from 'events';
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
 * @property {EventEmitter} eventEmitter Holds the event emitter which
 *   dispatches events to attached event listeners.
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
   * @property {string} sortBy The primary field to sort the tasks by:
   *   'default', 'name', 'due-date', 'create-date', 'priority', or 'project'.
   *   The default depends on the type of filter.
   * @property {boolean} sortDescending Indicates whether to sort in descending
   *   order rather than ascending order.
   * @property {boolean} showCompleted Indicates whether to include completed
   *   tasks in the results.
   */

  /**
   * Event that is fired when a setting is modified.
   * @event module:settings~Settings~updateSetting
   * @type {Object}
   * @property {string} type The event type: 'update-setting'.
   * @property {string} name The name of the setting. This is the same as the
   *   name of the corresponding instance property, except for filter group
   *   settings, which have the form 'filterGroups.group-name', where
   *   'group-name' is the name of the filter group.
   * @property {*} value The new value of the setting.
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
      eventEmitter: new EventEmitter(),
    };
    privateMembers.set(this, privates);

    this.resetToDefault();
  }

  /**
   * Get the value of a setting. Although each setting can be retrieved
   * directly using other class methods and properties, this method can make
   * storage and serialization easier.
   * @param {string} name The name of the setting. This is the same as the name
   *   of the corresponding instance property, except for filter group
   *   settings, which have the form 'filterGroups.group-name', where
   *   'group-name' is the name of the filter group.
   * @returns {*} The value of the setting. For filter group settings, this is
   *   a [filterOptions]{@link module:settings~Settings~filterOptions} object.
   *   For date format settings, this is a
   *   [dateFormat]{@link module:settings~Settings~dateFormat} object.
   */
  getSetting(name) {
    switch (name) {
      case 'storageMethod':
        return this.storageMethod;
      case 'dateFormat':
        return this.dateFormat;
      case 'deleteAfter':
        return this.deleteAfter;
      default:
        if (name.startsWith('filterGroups.')) {
          const group = name.substring('filterGroups.'.length);
          return this.getFilterOptions(group);
        }
        return null;
    }
  }

  /**
   * Set the value of a setting. Although each setting can be set directly
   * using other class methods and properties, this method can make storage and
   * deserialization easier.
   * @param {string} name The name of the setting. This is the same as the name
   *   of the corresponding instance property, except for filter group
   *   settings, which have the form 'filterGroups.group-name', where
   *   'group-name' is the name of the filter group.
   * @param {*} value The value of the setting. For filter group settings, this
   *   should be a
   *   [filterOptions]{@link module:settings~Settings~filterOptions} object.
   *   For date format settings, this can be either a
   *   [dateFormat]{@link module:settings~Settings~dateFormat} object or a
   *   string specifying the name of the format to use.
   * @fires module:settings~Settings~updateSetting
   */
  setSetting(name, value) {
    let validSetting = true;
    switch (name) {
      case 'storageMethod':
        this.storageMethod = value;
        break;
      case 'dateFormat':
        this.setDateFormat(value);
        break;
      case 'deleteAfter':
        this.deleteAfter = value;
        break;
      default:
        if (name.startsWith('filterGroups.')) {
          const group = name.substring('filterGroups.'.length);
          this.setFilterOptions(group, value);
        } else {
          validSetting = false;
        }
        break;
    }

    if (validSetting) {
      privateMembers.get(this).eventEmitter.emit('update-setting', {
        type: 'update-setting',
        name,
        value: _.cloneDeep(value),
      });
    }
  }

  /**
   * Execute the provided function for each available setting.
   * @param {Function} callback The function to execute for each setting. The
   *   function will be passed the name of each setting along with its value.
   */
  forEach(callback) {
    const privates = privateMembers.get(this);
    const settingList = [
      'storageMethod',
      'dateFormat',
      'deleteAfter',
    ];

    const groupKeys = [...privates.filterGroups.keys()].map(
      (key) => `filterGroups.${key}`,
    );
    settingList.push(...groupKeys);

    settingList.forEach((setting) => {
      callback(setting, this.getSetting(setting));
    });
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

    const privates = privateMembers.get(this);
    privates.storageMethod = method;

    privates.eventEmitter.emit('update-setting', {
      type: 'update-setting',
      name: 'storageMethod',
      value: method,
    });
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
    const privates = privateMembers.get(this);
    privates.deleteAfter = days;

    privates.eventEmitter.emit('update-setting', {
      type: 'update-setting',
      name: 'deleteAfter',
      value: days,
    });
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
   * @fires module:settings~Settings~updateSetting
   */
  setFilterOptions(filterGroup, options = {}) {
    const privates = privateMembers.get(this);
    const { filterGroups } = privates;

    const oldOptions = filterGroups.get(filterGroup);

    const newOptions = {
      groupBy: options.groupBy ?? oldOptions?.groupBy ?? 'default',
      sortBy: options.sortBy ?? oldOptions?.sortBy ?? 'default',
      sortDescending: options.sortDescending ?? oldOptions?.sortDescending
        ?? false,
      showCompleted: options.showCompleted ?? oldOptions?.showCompleted
        ?? false,
    };

    filterGroups.set(filterGroup, newOptions);

    privates.eventEmitter.emit('update-setting', {
      type: 'update-setting',
      name: `filterGroups.${filterGroup}`,
      value: _.cloneDeep(newOptions),
    });
  }

  /**
   * Reset all settings to their default values.
   * @fires module:settings~Settings~updateSetting
   */
  resetToDefault() {
    this.storageMethod = 'local';
    this.setDateFormat('local');
    this.deleteAfter = 14;

    const filterOptions = {
      groupBy: 'default',
      sortBy: 'default',
      sortDescending: false,
      showCompleted: false,
    };
    ['default', 'dates', 'projects', 'priorities'].forEach((group) => {
      this.setFilterOptions(group, filterOptions);
    });
  }

  /**
   * Set the pattern used for formatting and parsing dates.
   * @param {string|module:settings~Settings~dateFormat} [format=local] The
   *   type of date format to use. This can either be a string specifying the
   *   format type ('local', 'iso', 'month-day-year', 'day-month-year', or
   *   'year-month-day'), or it can be a full
   *   [dateFormat]{@link module:settings~Settings~dateFormat} object.
   * @fires module:settings~Settings~updateSetting
   */
  setDateFormat(format = 'local') {
    const privates = privateMembers.get(this);

    if (typeof format === 'string') {
      privates.dateFormat = Settings.lookupDateFormat(format);
    } else {
      privates.dateFormat = _.cloneDeep(format);
    }

    privates.eventEmitter.emit('update-setting', {
      type: 'update-setting',
      name: 'dateFormat',
      value: this.dateFormat,
    });
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
   * Add an event listener to settings instance.
   * @param {string} type The type of event to listen for.
   * @param {Function} listener A callback function to be invoked when the
   *   event is triggered.
   */
  addEventListener(type, listener) {
    privateMembers.get(this).eventEmitter.on(type, listener);
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
   * @fires module:settings~Settings~updateSetting
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
              'default',
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
