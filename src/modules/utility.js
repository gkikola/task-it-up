/**
 * Defines various utility functions.
 * @module utility
 */

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
 * @property {string} [value] The initial value of the input element, or a
 *   value identifying a checkbox or radio button option. This property is
 *   ignored for the 'select' input type.
 * @property {string[]} [classList=[]] An array of class names to apply to the
 *   input element.
 * @property {boolean} [checked=false] If true, indicates that the control
 *   should be checked by default. This applies only to the 'checkbox' and
 *   'radio' input types.
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
  }

  if (options.id)
    input.id = options.id;
  if (options.name)
    input.name = options.name;
  if (options.classList)
    input.classList.add(...options.classList);

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
 * @returns {HTMLElement} The newly-created button element.
 */
function createIconButton(iconType) {
  const button = document.createElement('button');
  button.classList.add('icon', 'material-icons');
  button.dataset.iconType = iconType;
  button.textContent = iconType;
  return button;
}

/**
 * Create a button that can be toggled on and off.
 * @param {string} label The button label.
 * @param {Object} [options={}] An object holding configuration options
 *   controlling the button creation.
 * @param {string} [options.id] The identifier for the button.
 * @param {string} [options.name] The form name for the button.
 * @param {string} [options.value] The form value associated with the button.
 * @param {string} [options.initialState=off] The initial state of the button,
 *   either 'on' or 'off'.
 * @param {string[]} [options.classList] An array of class names to apply to
 *   the button. If not specified, the button will receive the 'toggle-button'
 *   class.
 * @param {string} [options.activeClass=active] The CSS class to  apply when
 *   the button is active (on).
 * @returns {HTMLElement} The newly-created button element.
 */
function createToggleButton(label, options = {}) {
  const button = document.createElement('button');
  if (options.id)
    button.id = options.id;
  if (options.name)
    button.name = options.name;
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

export {
  createFormControl,
  createIconButton,
  createToggleButton,
  getDateFormat
};
