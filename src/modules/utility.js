/**
 * Defines various utility functions.
 * @module utility
 */

/**
 * Create an input field in a form.
 * @param {string} inputType The type of input element to create. For most text
 *   or numeric forms of input, this value is used as the 'type' attribute in
 *   an 'input' form element. If this is set to 'select', then a 'select' box
 *   is created. If this is set to 'textarea', then a 'textarea' is created.
 * @param {Object} [options={}] An object holding additional options to control
 *   the creation of the input element.
 * @param {string} [options.id] The identifier for the input element. If the
 *   input type is 'checkbox' or 'radio', this is ignored since there may be
 *   multiple buttons in the group.
 * @param {string} [options.name] The name of the input element. For an input
 *   type of 'checkbox', each checkbox should be named individually and this
 *   property is ignored.
 * @param {string} [options.value] The initial value of the input element. This
 *   is ignored for input types of 'checkbox', 'radio', or 'select'.
 * @param {string} [options.label] An optional label that will be displayed
 *   before the input element.
 * @param {string[]} [options.classList] An array of class names to apply to
 *   the element. For 'checkbox' or 'radio' inputs, the class names will apply
 *   to each input item in the group.
 * @param {Object} [options.size] An object containing size information for the
 *   input element. This is only used for the 'textarea' input type.
 * @param {number} [options.size.rows] The number of rows that a textarea
 *   should have.
 * @param {number} [options.size.cols] The number of columns that a textarea
 *   should have.
 * @param {string} [options.containerId] The identifier for the container
 *   holding the input element and label.
 * @param {Object[]} [options.items] This property is ignored unless the input
 *   type is 'select', 'checkbox', or 'radio'. In these cases, this property
 *   can be set to an object holding information for the individual buttons in
 *   a checkbox or radio group, or for the options in a select box.
 * @param {string} [options.items[].id] The identifier for the checkbox or
 *   radio item. This property is ignored for the 'select' input type.
 * @param {string} [options.items[].name] For checkboxes only, this specifies
 *   the form name for the checkbox item. This property is ignored for other
 *   input types.
 * @param {string} [options.items[].value] The form value that is used when the
 *   item is selected.
 * @param {string} options.items[].label The label that will be displayed for
 *   the item.
 * @param {boolean} [options.items[].selected] If true, indicates that the item
 *   should be selected or checked by default.
 * @returns {HTMLElement} The container holding the input and its label.
 */
function createFormField(inputType, options = {}) {
  inputType = inputType.toLowerCase();
  const container = document.createElement('div');
  if (options.containerId)
    container.id = options.containerId;
  container.classList.add('form-input-container');

  if (options.label) {
    const labelElem = document.createElement('label');
    labelElem.classList.add('form-input-label');
    labelElem.textContent = options.label;
    if (options.id && inputType !== 'checkbox' && inputType !== 'radio')
      labelElem.htmlFor = options.id;
    container.appendChild(labelElem);
  }

  switch (inputType) {
    case 'checkbox':
    case 'radio': {
      if (options.items) {
        options.items.forEach(item => {
          const itemContainer = document.createElement('div');
          itemContainer.classList.add('form-input-item-container');
          container.appendChild(itemContainer);

          const input = document.createElement('input');
          const labelElem = document.createElement('label');
          input.type = inputType;
          input.classList.add('form-input-item');
          if (options.classList)
            input.classList.add(...options.classList);
          if (item.id) {
            input.id = item.id;
            labelElem.htmlFor = item.id;
          }
          if (item.name)
            input.name = item.name;
          if (options.name && inputType === 'radio')
            input.name = options.name;
          if (item.value)
            input.value = item.value;
          if (item.selected) {
            input.defaultChecked = true;
            input.checked = true;
          }
          itemContainer.appendChild(input);

          labelElem.classList.add('form-input-item-label');
          labelElem.textContent = item.label;
          itemContainer.appendChild(labelElem);
        });
      }
      break;
    }
    case 'select': {
      const select = document.createElement('select');
      select.classList.add('form-select');
      if (options.classList)
        select.classList.add(...options.classList);
      if (options.id)
        select.id = options.id;
      if (options.name)
        select.name = options.name;
      if (options.items) {
        options.items.forEach(item => {
          const opt = document.createElement('option');
          if (item.value)
            opt.value = item.value;
          if (item.selected) {
            opt.defaultSelected = true;
            opt.selected = true;
          }
          opt.textContent = item.label;
          select.appendChild(opt);
        });
      }
      container.appendChild(select);
      break;
    }
    case 'textarea': {
      const input = document.createElement('textarea');
      input.classList.add('form-textarea');
      if (options.classList)
        input.classList.add(...options.classList);
      if (options.id)
        input.id = options.id;
      if (options.name)
        input.name = options.name;
      if (options.value)
        input.textContent = value;
      if (options.size) {
        if (options.size.rows) input.rows = options.size.rows;
        if (options.size.cols) input.cols = options.size.cols;
      }
      container.appendChild(input);
      break;
    }
    case 'text':
    default: {
      const input = document.createElement('input');
      input.classList.add('form-input');
      if (options.classList)
        input.classList.add(...options.classList);
      if (options.id)
        input.id = options.id;
      if (options.name)
        input.name = options.name;
      if (options.value) {
        input.defaultValue = options.value;
        input.value = options.value;
      }
      input.type = inputType;
      container.appendChild(input);
      break;
    }
  }

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
