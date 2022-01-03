/**
 * Defines various utility functions.
 * @module utility
 */

import { format as dfFormat, parse as dfParse } from 'date-fns';

/**
 * Specifies options for creating a date input field in a form.
 * @typedef {Object} module:utility~dateInputOptions
 * @property {string} [id] The identifier for the text input element.
 * @property {string} [name] The name of the text input element.
 * @property {string} [title] The title of the text input element, usually
 *   displayed by the browser as a tooltip.
 * @property {string} [value] The initial value of the text input element.
 * @property {string[]} [classList=[]] An array of class names to apply to the
 *   text input element.
 * @property {boolean} [required=false] If true, indicates that the input
 *   control is a required field.
 * @property {string} [pattern] Specifies a regular expression that the input
 *   control's value should match in order to be considered valid.
 * @property {number} [minLength] Sets the minimum acceptable length for the
 *   text input field.
 * @property {number} [maxLength] Sets the maximum acceptable length for the
 *   text input field.
 * @property {Object} [label] An object specifying information about the label
 *   for the input field.
 * @property {string} [label.value] The text content of the label that should
 *   be displayed on the page.
 * @property {string[]} [label.classList=[]] An array of class names to apply
 *   to the label element.
 * @property {Object} [container] An object containing information about the
 *   container holding the input field.
 * @property {string} [container.id] The identifier for the container.
 * @property {string[]} [container.classList=[]] An array of class names to
 *   apply to the container.
 * @property {boolean} [container.inline=false] If set to true, indicates that
 *   the container should be an inline element rather than a block element.
 * @property {Object} [button] An object containing information about the
 *   button element.
 * @property {string} [button.id] The identifier for the button.
 * @property {string} [button.name] The form name for the button.
 * @property {string} [button.title] The title for the button, usually
 *   displayed by the browser as a tooltip.
 * @property {string} [button.label=Choose...] The label to be displayed in the
 *   button.
 * @property {string[]} [button.classList] An array of class names to apply to
 *   the button element.
 * @property {Function} [button.callback] A callback function to be invoked
 *   when the button is clicked or activated. The function will be passed a
 *   reference to the text input element as an argument.
 */

/**
 * Create an input field for entering dates. This will create a text input
 * control together with a button that can invoke a callback allowing for the
 * caller to open a date picker.
 * @param {module:utility~dateInputOptions} [options={}] An object specifying
 *   options for the input field.
 * @returns {HTMLElement} The container holding the input elements and label.
 */
function createDateInputField(options = {}) {
  const containerTag = options.container?.inline ? 'span' : 'div';
  const container = document.createElement(containerTag);
  if (options.container?.id)
    container.id = options.container.id;
  if (options.container?.classList)
    container.classList.add(...options.container.classList);

  if (options.label) {
    const label = document.createElement('label');
    if (options.id)
      label.htmlFor = options.id;
    if (options.label.classList)
      label.classList.add(...options.label.classList);
    label.textContent = options.label.value || '';
    container.appendChild(label);
  }

  container.appendChild(createFormControl({
    type: 'text',
    id: options.id || null,
    name: options.name || null,
    title: options.title || null,
    value: options.value || null,
    classList: options.classList || null,
    required: options.required || false,
    pattern: options.pattern || null,
    minLength: options.minLength || null,
    maxLength: options.maxLength || null,
  }));

  const button = document.createElement('button');
  if (options.button?.id)
    button.id = options.button.id;
  if (options.button?.name)
    button.name = options.button.name;
  if (options.button?.title)
    button.title = options.button.title;
  if (options.button?.classList)
    button.classList.add(...options.button.classList);
  button.textContent = options.button?.label || 'Choose...';
  if (options.button?.callback) {
    const input = container.querySelector('input');
    button.addEventListener('click', () => options.button.callback(input));
  }
  container.appendChild(button);

  return container;
}

/**
 * Specifies options for creating input controls in a form.
 * @typedef {Object} module:utility~formControlOptions
 * @property {string} [type=text] The type of input. For most text or numeric
 *   forms of input, this value is used as the 'type' attribute on an 'input'
 *   element. Setting this to 'select' indicates that a 'select' element should
 *   be created. Setting this to 'textarea' indicates that a 'textarea' element
 *   should be created.
 * @property {string} [id] The identifier for the input element.
 * @property {string} [name] The name of the input element, used in form
 *   submission and for grouping radio buttons.
 * @property {string} [title] The title of the input element, usually displayed
 *   by the browser as a tooltip.
 * @property {string} [value] The initial value of the input element, or a
 *   value identifying a checkbox or radio button option. This property is
 *   ignored for the 'select' input type.
 * @property {string[]} [classList=[]] An array of class names to apply to the
 *   input element.
 * @property {boolean} [checked=false] If true, indicates that the control
 *   should be checked by default. This applies only to the 'checkbox' and
 *   'radio' input types.
 * @property {boolean} [required=false] If true, indicates that the control
 *   is a required field.
 * @property {string} [pattern] Specifies a regular expression that the input
 *   control's value should match in order to be considered valid.
 * @property {number|string} [min] Sets the minimum acceptable value for a
 *   numeric input field.
 * @property {number|string} [max] Sets the maximum acceptable value for a
 *   numeric input field.
 * @property {number|string} [step] Sets the acceptable increments for values
 *   in a numeric input field. This can be a number or the string 'any'.
 * @property {number} [minLength] Sets the minimum acceptable length for an
 *   input field.
 * @property {number} [maxLength] Sets the maximum acceptable length for an
 *   input field.
 * @property {Object} [label] An object specifying information about the label
 *   for the input element.
 * @property {string} [label.value] The text content of the label that should
 *   be displayed on the page.
 * @property {string} [label.placement=auto] Determines whether the label
 *   should be placed before or after the input control. Valid values are
 *   'before', 'after', and 'auto' (the default). If set to 'auto', then the
 *   label is placed after the element if the input type is 'radio' or
 *   'checkbox', and before the element in all other cases.
 * @property {string[]} [label.classList=[]] An array of class names to apply
 *   to the label element.
 * @property {Object} [size] An object containing size information for the
 *   input element. This is only used for the 'textarea' input type.
 * @property {number} [size.rows] The number of rows that a textarea should
 *   have.
 * @property {number} [size.cols] The number of columns that a textarea should
 *   have.
 * @property {Object} [container] An object containing information about the
 *   container holding the input element and its label.
 * @property {string} [container.id] The identifier for the container.
 * @property {string[]} [container.classList=[]] An array of class names to
 *   apply to the container.
 * @property {boolean} [container.inline=false] If set to true, indicates that
 *   the container should be an inline element rather than a block element.
 * @property {Object[]} [menuItems] An array of objects containing information
 *   about options for a select control. This property is ignored unless the
 *   input type is 'select'.
 * @property {string} [menuItems.value] The form value identifying the item.
 * @property {string} menuItems.label The label that will be displayed for
 *   the item.
 * @property {boolean} [menuItems.selected=false] If true, indicates that the
 *   item should be selected by default.
 */

/**
 * Create an input control in a form, optionally including a label.
 * @param {module:utility~formControlOptions} [options={}] An object specifying
 *   options for the input element.
 * @returns {HTMLElement} The container holding the input element and its
 *   label. If no label and no container id were specified, then the form
 *   element is not placed in a container and is instead returned directly.
 */
function createFormControl(options = {}) {
  const type = options.type?.toLowerCase() || 'text';
  let container = null;
  if (options.label || options.container) {
    const containerTag = options.container?.inline ? 'span' : 'div';
    container = document.createElement(containerTag);
    if (options.container?.id)
      container.id = options.container.id;
    if (options.container?.classList)
      container.classList.add(...options.container.classList);
  }

  let label = null;
  if (options.label) {
    label = document.createElement('label');
    label.textContent = options.label.value || '';
    if (options.label.classList)
      label.classList.add(...options.label.classList);
    if (options.id)
      label.htmlFor = options.id;
  }

  let input = null;
  switch (type) {
    case 'select':
      input = document.createElement('select');
      if (options.menuItems) {
        options.menuItems.forEach(item => {
          const opt = document.createElement('option');
          if (item.value)
            opt.value = item.value;
          if (item.selected) {
            opt.defaultSelected = true;
            opt.selected = true;
          }
          opt.textContent = item.label;
          input.appendChild(opt);
        });
      }
      break;
    case 'textarea':
      input = document.createElement('textarea');
      input.textContent = options.value || '';
      if (options.size) {
        if (options.size.rows) input.rows = options.size.rows;
        if (options.size.cols) input.cols = options.size.cols;
      }
      break;
    default:
      input = document.createElement('input');
      input.type = type;
      if (options.value) {
        input.defaultValue = options.value;
        input.value = options.value;
      }

      if (options.pattern)
        input.pattern = options.pattern;
      if (options.min)
        input.min = options.min;
      if (options.max)
        input.max = options.max;
      if (options.step)
        input.step = options.step;
  }

  if (options.id)
    input.id = options.id;
  if (options.name)
    input.name = options.name;
  if (options.title)
    input.title = options.title;
  if (options.classList)
    input.classList.add(...options.classList);
  if (options.required)
    input.required = true;
  if (type !== 'select' && options.minLength)
    input.minLength = options.minLength;
  if (type !== 'select' && options.maxLength)
    input.maxLength = options.maxLength;

  const checkable = type === 'checkbox' || type === 'radio';
  if (checkable && options.checked) {
    input.defaultChecked = true;
    input.checked = true;
  }

  if (label) {
    let placement = options.label.placement || 'auto';
    if (placement === 'auto')
      placement = checkable ? 'after' : 'before';

    if (placement === 'after') {
      container.appendChild(input);
      container.appendChild(label);
    } else {
      container.appendChild(label);
      container.appendChild(input);
    }

    return container;
  } else if (container) {
    container.appendChild(input);
    return container;
  }

  return input;
}

/**
 * Create an icon button element.
 * @param {string} iconType The type of icon to display. This is stored in the
 *   data-icon-type attribute of the button and also indicates the icon to use
 *   from the Google Material Icons font.
 * @param {Object} [options={}] An object holding configuration options
 *   controlling the button creation.
 * @param {string} [options.id] The identifier for the button.
 * @param {string} [options.title] The title of the button, usually displayed
 *   by the browser as a tooltip.
 * @returns {HTMLElement} The newly-created button element.
 */
function createIconButton(iconType, options = {}) {
  const button = document.createElement('button');
  button.classList.add('icon', 'material-icons');
  button.dataset.iconType = iconType;
  button.textContent = iconType;
  if (options.id)
    button.id = options.id;
  if (options.title)
    button.title = options.title;
  return button;
}

/**
 * Create a button that can be toggled on and off.
 * @param {string} label The button label.
 * @param {Object} [options={}] An object holding configuration options
 *   controlling the button creation.
 * @param {string} [options.id] The identifier for the button.
 * @param {string} [options.name] The form name for the button.
 * @param {string} [options.title] The title of the button, usually displayed
 *   by the browser as a tooltip.
 * @param {string} [options.value] The form value associated with the button.
 * @param {string} [options.initialState=off] The initial state of the button,
 *   either 'on' or 'off'.
 * @param {string[]} [options.classList] An array of class names to apply to
 *   the button. If not specified, the button will receive the 'toggle-button'
 *   class.
 * @param {string} [options.activeClass=active] The CSS class to apply when
 *   the button is active (on).
 * @returns {HTMLElement} The newly-created button element.
 */
function createToggleButton(label, options = {}) {
  const button = document.createElement('button');
  if (options.id)
    button.id = options.id;
  if (options.name)
    button.name = options.name;
  if (options.title)
    button.title = options.title;
  if (options.value)
    button.value = options.value;
  if (options.classList)
    button.classList.add(...options.classList);
  else
    button.classList.add('toggle-button');
  button.textContent = label;

  const activeClass = options.activeClass || 'active';
  if (options.initialState === 'on')
    button.classList.add(activeClass);

  button.addEventListener('click', () => button.classList.toggle(activeClass));
  return button;
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
  if (!format)
    format = getDateFormat();

  return dfFormat(date, format);
}

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
 *   use. Valid values are 'internal' and 'human'. If set to 'internal' (the
 *   default), then the function uses the same format tokens that the
 *   [date-fns]{@link https://date-fns.org/} library uses. If set to 'human',
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

  if (!options.dateStyle)
    options.dateStyle = 'short';
  if (!options.timeStyle)
    options.timeStyle = 'none';

  const formatterOptions = {};
  if (options.dateStyle !== 'none')
    formatterOptions.dateStyle = options.dateStyle;
  if (options.timeStyle !== 'none')
    formatterOptions.timeStyle = options.timeStyle;
  if (options.hourSystem && options.hourSystem !== 'auto')
    formatterOptions.hour12 = options.hourSystem === 12;

  if (!locale)
    locale = [];
  const formatter = new Intl.DateTimeFormat(locale, formatterOptions);

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

    const hasDate = options.dateStyle !== 'none';
    const hasTime = options.timeStyle !== 'none';
    if (hasDate && hasTime) {
      parts = [
        ...dateParts,
        { type: 'literal', value: ' ' },
        ...timeParts,
      ]
    } else if (hasTime) {
      parts = timeParts;
    } else {
      parts = dateParts;
    }
  } else { // Browser supports formatToParts
    parts = formatter.formatToParts(REFERENCE_DATE);
  }

  return parts.map(({ type, value }) => {
    let token = '', count = 1;
    switch (type) {
      case 'literal':
        if (options.tokenStyle !== 'human' && /[A-Za-z]/.test(value))
          token = `'${value.replace(/\'/g, "''")}'`;
        else
          token = value;
        break;
      case 'day':
        token = options.tokenStyle === 'human' ? 'D' : 'd';
        if (options.padDays === true)
          count = 2;
        else if (options.padDays === false)
          count = 1;
        else
          count = value.length;
        break;
      case 'era':
        token = 'G';
        break;
      case 'month':
        token = 'M';
        if (value.length > 3)
          count = 4;
        else if (value.length === 3)
          count = 3;
        else if (options.padMonths === true)
          count = 2;
        else if (options.padMonths === false)
          count = 1;
        else
          count = value.length;
        break;
      case 'relatedYear':
      case 'year':
        token = options.tokenStyle === 'human' ? 'Y' : 'y';
        if (options.fullYear === true)
          count = 4;
        else if (options.fullYear === false)
          count = 2;
        else
          count = value.length;
        break;
      case 'dayPeriod':
        token = 'a';
        break;
      case 'fractionalSecond':
        token = 'S';
        count = value.length;
        break;
      case 'hour':
        if (options.tokenStyle === 'human')
          token = 'h';
        else
          token = formatter.resolvedOptions().hour12 ? 'h' : 'H';

        if (options.padHours === true)
          count = 2;
        else if (options.padHours === false)
          count = 1;
        else
          count = value.length;
        break;
      case 'minute':
        token = 'm';
        if (options.padMinutes === true)
          count = 2;
        else if (options.padMinutes === false)
          count = 1;
        else
          count = value.length;
        break;
      case 'second':
        token = 's';
        if (options.padSeconds === true)
          count = 2;
        else if (options.padSeconds === false)
          count = 1;
        else
          count = value.length;
        break;
      case 'weekday':
        token = 'e';
        count = 4;
    }
    return token.repeat(count);
  }).join('');
}

/**
 * Parse a date from a string according to a given pattern.
 * @param {string} dateString The string to parse.
 * @param {string} [format] The format string to use as a pattern. If not
 *   given, then the format from the browser's default locale is used. The
 *   format tokens are the same as used by the
 *   [date-fns]{@link https://date-fns.org/} library, as specified in the
 *   documentation for the
 *   [format function]{@link https://date-fns.org/v2.28.0/docs/format}.
 * @returns {Date} The parsed date, or null if the string does not match the
 *   pattern.
 */
function parseDate(dateString, format) {
  if (!format)
    format = getDateFormat();

  const result = dfParse(dateString, format, new Date());
  return Number.isFinite(result.getTime()) ? result : null;
}

export {
  createDateInputField,
  createFormControl,
  createIconButton,
  createToggleButton,
  formatDate,
  getDateFormat,
  parseDate,
};
