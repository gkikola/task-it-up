/**
 * Defines various utility functions.
 * @module utility
 */

/**
 * Create an input field in a form.
 * @param {string} inputType The type of input, used in the type attribute of
 *   the input element.
 * @param {string} id The identifier for the input element.
 * @param {string} [label] An optional label, placed before the input element.
 * @returns {HTMLElement} The container holding the input and its label.
 */
function createFormField(inputType, id, label) {
  const container = document.createElement('div');
  container.classList.add('form-input-container');

  if (label) {
    const labelElem = document.createElement('div');
    labelElem.classList.add('form-input-label');
    labelElem.textContent = label;
    container.appendChild(labelElem);
  }

  const input = document.createElement('input');
  input.classList.add('form-input');
  input.id = id;
  input.type = inputType;
  container.appendChild(input);

  return container;
}

/**
 * Create an icon button element.
 * @param {string} iconType The type of icon to display. This is stored in the
 *   data-icon-type attribute of the button and also indicates the icon to use
 *   from the Google Material Icons font.
 * @returns {HTMLElement} The newly created button element.
 */
function createIconButton(iconType) {
  const button = document.createElement('button');
  button.classList.add('icon', 'material-icons');
  button.dataset.iconType = iconType;
  button.textContent = iconType;
  return button;
}

const REFERENCE_DATE = new Date(2020, 0, 1, 14, 5, 5);

/**
 * Retrieve the date format for a given locale, or for the default locale.
 * For example, the format string for en-US should look like MM/dd/yy.
 * @param {string} [locale] The locale whose date format is to be retrieved.
 *   If not given, then the browser's default locale is used.
 * @param {Object} [options] An object with formatting options.
 * @param {string} [options.dateStyle] The date formatting style: short,
 *   medium, long, or full.
 * @param {string} [options.timeStyle] The time formatting style: short,
 *   medium, long, or full.
 * @param {boolean} [options.hour12] Indicates whether to use a 12-hour clock.
 *   If false, the 24-hour clock is used. If not provided, then the local
 *   default is used.
 * @returns The date format string.
 */
function getDateFormat(locale, options = { dateStyle: 'short' }) {
  if (!locale)
    locale = [];
  const formatter = new Intl.DateTimeFormat(locale, options);
  return formatter.formatToParts(REFERENCE_DATE).map(({ type, value }) => {
    switch (type) {
      case 'literal':
        if (/[A-Za-z]/.test(value))
          return `'${value.replace(/\'/g, "''")}'`;
        else
          return value;
      case 'day':
        return 'd'.repeat(value.length);
      case 'era':
        return 'G';
      case 'month':
        return 'M'.repeat(value.length);
      case 'relatedYear':
      case 'year':
        return 'y'.repeat(value.length);
      case 'dayPeriod':
        return 'a';
      case 'fractionalSecond':
        return 'S'.repeat(value.length);
      case 'hour':
        if (formatter.resolvedOptions().hour12)
          return 'h'.repeat(value.length);
        else
          return 'H'.repeat(value.length);
      case 'minute':
        return 'm'.repeat(value.length);
      case 'second':
        return 's'.repeat(value.length);
      case 'weekday':
        return 'eeee';
      default:
        return '';
    }
  }).join('');
}

export { createFormField, createIconButton, getDateFormat };
