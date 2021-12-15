/**
 * Defines various utility functions.
 * @module utility
 */

/**
 * Create an input field in a form.
 * @param {string} inputType The type of input, used in the type attribute of
 *   the input element.
 * @param {string} [label] An optional label, placed before the input element.
 * @param {string} id The identifier for the input element.
 * @returns {HTMLElement} The container holding the input and its label.
 */
function createFormField(inputType, label, id) {
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

export { createFormField };
