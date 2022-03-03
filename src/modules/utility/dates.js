/**
 * Defines utility functions for handling dates and times.
 * @module dates
 */

import {
  format as dfFormat,
  formatISO,
  isValid,
  parse as dfParse,
  parseISO,
} from 'date-fns';

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
  { name: 'January', maxDays: 31 },
  { name: 'February', maxDays: 29 },
  { name: 'March', maxDays: 31 },
  { name: 'April', maxDays: 30 },
  { name: 'May', maxDays: 31 },
  { name: 'June', maxDays: 30 },
  { name: 'July', maxDays: 31 },
  { name: 'August', maxDays: 31 },
  { name: 'September', maxDays: 30 },
  { name: 'October', maxDays: 31 },
  { name: 'November', maxDays: 30 },
  { name: 'December', maxDays: 31 },
];

/**
 * Retrieve the date format for a given locale, or for the default locale.
 * For example, the format string for en-US should look like M/d/yy.
 * @param {string} [locale] The locale whose date format is to be retrieved.
 *   If not given, then the browser's default locale is used.
 * @param {Object} [options={}] An object with formatting options.
 * @param {string} [options.dateStyle=short] The date formatting style:
 *   'short', 'medium', 'long', 'full', or 'none'.
 * @param {string} [options.timeStyle=none] The time formatting style: 'short',
 *   'medium', 'long', 'full', or 'none'.
 * @param {string} [options.tokenStyle=internal] The type of format tokens to
 *   use. Valid values are 'internal' and 'visual'. If set to 'internal' (the
 *   default), then the function uses the same format tokens that the
 *   [date-fns]{@link https://date-fns.org/} library uses. If set to 'visual',
 *   then more human-readable tokens are used: for example, a human-readable
 *   format string might look like 'YYYY-MM-DD hh:mm:ss' or
 *   'MM/DD/YYYY hh:mm a'.
 * @param {boolean|string} [options.fullYear=auto] Indicates whether or not to
 *   use a full four-digit year instead of a two-digit abbreviation. If set to
 *   'auto', then the local default is used.
 * @param {boolean|string} [options.padMonths=auto] Indicates whether or not to
 *   pad single-digit months with a leading zero. If set to 'auto', then the
 *   local default is used.
 * @param {boolean|string} [options.padDays=auto] Indicates whether or not to
 *   pad single-digit days with a leading zero. If set to 'auto', then the
 *   local default is used.
 * @param {boolean|string} [options.padHours=auto] Indicates whether or not to
 *   pad single-digit hours with a leading zero. If set to 'auto', then the
 *   local default is used.
 * @param {boolean|string} [options.padMinutes=auto] Indicates whether or not
 *   to pad single-digit minutes with a leading zero. If set to 'auto', then
 *   the local default is used.
 * @param {boolean|string} [options.padSeconds=auto] Indicates whether or not
 *   to pad single-digit seconds with a leading zero. If set to 'auto', then
 *   the local default is used.
 * @param {number|string} [options.hourSystem=auto] Indicates whether to use a
 *   12- or 24-hour clock. Valid values are 12 for a 12-hour clock, 24 for a
 *   24-hour clock, or the string 'auto' to use the local default.
 * @returns The date format string.
 */
function getDateFormat(locale, options = {}) {
  const REFERENCE_DATE = new Date(2020, 0, 1, 14, 5, 5);

  const formatterOptions = {};
  const dateStyle = options.dateStyle || 'short';
  const timeStyle = options.timeStyle || 'none';
  if (dateStyle !== 'none') {
    formatterOptions.dateStyle = dateStyle;
  }
  if (timeStyle !== 'none') {
    formatterOptions.timeStyle = timeStyle;
  }
  if (options.hourSystem && options.hourSystem !== 'auto') {
    formatterOptions.hour12 = options.hourSystem === 12;
  }

  const formatter = new Intl.DateTimeFormat(locale || [], formatterOptions);

  let parts;

  // Fallback if browser doesn't support formatToParts - use en-US
  if (!('formatToParts' in formatter)) {
    const dateParts = [
      { type: 'month', value: '1' },
      { type: 'literal', value: '/' },
      { type: 'day', value: '1' },
      { type: 'literal', value: '/' },
      { type: 'year', value: '20' },
    ];

    let timeParts = [
      { type: 'hour', value: '2' },
      { type: 'literal', value: ':' },
      { type: 'minute', value: '05' },
    ];

    if (formatter.resolvedOptions().hour12) {
      timeParts = timeParts.concat([
        { type: 'literal', value: ' ' },
        { type: 'dayPeriod', value: 'am' },
      ]);
    }

    const hasDate = dateStyle !== 'none';
    const hasTime = timeStyle !== 'none';
    if (hasDate && hasTime) {
      parts = [
        ...dateParts,
        { type: 'literal', value: ' ' },
        ...timeParts,
      ];
    } else if (hasTime) {
      parts = timeParts;
    } else {
      parts = dateParts;
    }
  } else { // Browser supports formatToParts
    parts = formatter.formatToParts(REFERENCE_DATE);
  }

  return parts.map(({ type, value }) => {
    let token = '';
    let count = 1;
    switch (type) {
      case 'literal':
        if (options.tokenStyle !== 'visual' && /[A-Za-z]/.test(value)) {
          token = `'${value.replace(/'/g, "''")}'`;
        } else {
          token = value;
        }
        break;
      case 'day':
        token = options.tokenStyle === 'visual' ? 'D' : 'd';
        if (options.padDays === true) {
          count = 2;
        } else if (options.padDays === false) {
          count = 1;
        } else {
          count = value.length;
        }
        break;
      case 'era':
        token = 'G';
        break;
      case 'month':
        token = 'M';
        if (value.length > 3) {
          count = 4;
        } else if (value.length === 3) {
          count = 3;
        } else if (options.padMonths === true) {
          count = 2;
        } else if (options.padMonths === false) {
          count = 1;
        } else {
          count = value.length;
        }
        break;
      case 'relatedYear':
      case 'year':
        token = options.tokenStyle === 'visual' ? 'Y' : 'y';
        if (options.fullYear === true) {
          count = 4;
        } else if (options.fullYear === false) {
          count = 2;
        } else {
          count = value.length;
        }
        break;
      case 'dayPeriod':
        token = 'a';
        break;
      case 'fractionalSecond':
        token = 'S';
        count = value.length;
        break;
      case 'hour':
        if (options.tokenStyle === 'visual') {
          token = 'h';
        } else {
          token = formatter.resolvedOptions().hour12 ? 'h' : 'H';
        }

        if (options.padHours === true) {
          count = 2;
        } else if (options.padHours === false) {
          count = 1;
        } else {
          count = value.length;
        }
        break;
      case 'minute':
        token = 'm';
        if (options.padMinutes === true) {
          count = 2;
        } else if (options.padMinutes === false) {
          count = 1;
        } else {
          count = value.length;
        }
        break;
      case 'second':
        token = 's';
        if (options.padSeconds === true) {
          count = 2;
        } else if (options.padSeconds === false) {
          count = 1;
        } else {
          count = value.length;
        }
        break;
      case 'weekday':
        token = 'e';
        count = 4;
        break;
      default:
        break;
    }
    return token.repeat(count);
  }).join('');
}

/**
 * Format a date into a string representation according to a given pattern.
 * @param {Date} date The date to be formatted.
 * @param {string} [format] The format string to use as a pattern. If not
 *   given, then the format from the browser's default locale is used. The
 *   format tokens are the same as used by the
 *   [date-fns]{@link https://date-fns.org/} library, as specified in the
 *   documentation for the
 *   [format function]{@link https://date-fns.org/v2.28.0/docs/format}.
 * @returns {string} The formatted date string.
 */
function formatDate(date, format) {
  return dfFormat(date, format ?? getDateFormat());
}

/**
 * Format a date into a string representation in ISO 8601 format. The returned
 * date string will not include a time component. To include the time and time
 * zone, use [formatIsoDateTime]{@link module:dates~formatIsoDateTime}
 * instead.
 * @param {Date} date The date to be formatted.
 * @returns {string} The formatted date string.
 */
function formatIsoDate(date) {
  return formatISO(date, { representation: 'date' });
}

/**
 * Format a date and time into a string representation in ISO 8601 format. The
 * returned date string will include the time and time zone.
 * @param {Date} date The date to be formatted.
 * @returns {string} The formatted date string.
 */
function formatIsoDateTime(date) {
  return formatISO(date);
}

/**
 * Parse a date from a string according to a pattern or sequence of patterns.
 * @param {string} dateString The string to parse.
 * @param {string|string[]} [format] The format string or sequence of format
 *   strings to use as patterns. If an array is given, then each string in the
 *   array is attempted to be used as a pattern until a match is found. If no
 *   pattern is given, then the format from the browser's default locale is
 *   used. The format tokens are the same as used by the
 *   [date-fns]{@link https://date-fns.org/} library, as specified in the
 *   documentation for the
 *   [format function]{@link https://date-fns.org/v2.28.0/docs/format}.
 * @returns {Date} The parsed date, or null if the string does not match the
 *   pattern.
 */
function parseDate(dateString, format) {
  let patterns;
  if (typeof format === 'string') patterns = [format];
  else if (Array.isArray(format) && format.length > 0) patterns = format;
  else patterns = [getDateFormat()];

  const today = new Date();
  for (let i = 0; i < patterns.length; i += 1) {
    const result = dfParse(dateString, patterns[i], today);
    if (isValid(result)) return result;
  }

  return null;
}

/**
 * Parse a date from an ISO 8601 string representation.
 * @param {string} dateString The string to parse.
 * @returns {Date} The parsed date, or null if the string does not match the
 *   pattern.
 */
function parseIsoDateTime(dateString) {
  const result = parseISO(dateString);

  return isValid(result) ? result : null;
}

/**
 * Get the name of a day of the week.
 * @param {number} dayIndex The index of the weekday as an integer from 0 to 6,
 *   with 0 representing Sunday, 1 representing Monday, and so on.
 * @returns {string} The English name of the weekday.
 */
function getWeekdayName(dayIndex) {
  return WEEKDAYS[dayIndex] || 'Unknown';
}

/**
 * Get the name of a month.
 * @param {number} monthIndex The index of the month as an integer from 0 to
 *   11, with 0 representing January, 1 representing February, and so on.
 * @returns {string} The English name of the month.
 */
function getMonthName(monthIndex) {
  return MONTHS[monthIndex]?.name || 'Unknown';
}

/**
 * Get the (maximum) number of days in a particular month.
 * @param {number} monthIndex The index of the month as an integer from 0 to
 *   11, with 0 representing January, 1 representing February, and so on.
 * @returns {number} The maximum number of days in the month. For example, the
 *   value returned for February will be 29, not 28. Returns a value of 0 if
 *   an invalid index is given.
 */
function getDaysInMonth(monthIndex) {
  return MONTHS[monthIndex]?.maxDays ?? 0;
}

export {
  formatDate,
  formatIsoDate,
  formatIsoDateTime,
  getDateFormat,
  getDaysInMonth,
  getMonthName,
  getWeekdayName,
  parseDate,
  parseIsoDateTime,
};
