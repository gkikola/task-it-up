/**
 * Defines the [AddProjectModal]{@link module:addProjectModal~AddProjectModal}
 * class.
 * @module addProjectModal
 */

import Project from '../project';
import { createFormControl } from '../utility/dom';

/**
 * Object holding private members for the
 * [AddProjectModal]{@link module:addProjectModal~AddProjectModal} class.
 * @typedef {Object} module:addProjectModal~AddProjectModal~privates
 * @property {module:project~Project} [project] The project being edited, if
 *   any.
 * @property {string} mode Indicates the status of the project being entered.
 *   If set to 'add', a new project is being created, and if set to 'edit',
 *   then an existing project is being updated.
 * @property {Object} callbacks An object holding callback functions.
 * @property {Function} [callbacks.confirm] A callback function that will be
 *   invoked when the user successfully confirms the modal.
 * @property {Function} [callbacks.cancel] A callback function that will be
 *   invoked when the user cancels the modal.
 * @property {Object} controls An object holding the form input elements for
 *   the modal.
 * @property {HTMLElement} controls.name The text input element for the project
 *   name.
 * @property {HTMLElement} controls.description The textarea element for the
 *   project description.
 */

/**
 * Holds private data for the
 * [AddProjectModal]{@link module:addProjectModal~AddProjectModal} class.
 * @type {WeakMap}
 * @see module:addProjectModal~AddProjectModal~privates
 */
const privateMembers = new WeakMap();

/**
 * Initialize the values of the form elements based on the initial project that
 * was passed to the constructor, if any.
 * @param {module:addProjectModal~AddProjectModal} instance The class instance
 *   on which to apply the function.
 */
function initFormValues(instance) {
  const { project, controls } = privateMembers.get(instance);

  if (project) {
    controls.name.value = project.name || '';
    controls.description.value = project.description || '';
  }
}

/**
 * A modal dialog for adding or editing a project.
 * @implements {module:modalStack~Modal}
 */
class AddProjectModal {
  /**
   * Specifies options for the modal.
   * @typedef {Object} module:addProjectModal~AddProjectModal~options
   * @property {Function} [confirm] A callback function that will be invoked
   *   when the user successfully confirms the modal. The function will be
   *   passed the new (or modified) project.
   * @property {Function} [cancel] A callback function that will be invoked
   *   when the user cancels the modal.
   * @property {module:project~Project} [project] The project to edit. If not
   *   given, then a new project is created.
   */

  /**
   * Initialize the modal.
   * @param {module:addProjectModal~AddProjectModal~options} [options={}] An
   *   object holding configuration options for the modal.
   */
  constructor(options = {}) {
    const privates = {
      project: options.project || null,
      mode: options.project ? 'edit' : 'add',
      callbacks: {
        confirm: options.confirm || null,
        cancel: options.cancel || null,
      },
      controls: {
        name: null,
        description: null,
      },
    };
    privateMembers.set(this, privates);
  }

  get title() {
    const privates = privateMembers.get(this);
    return (privates.mode === 'edit') ? 'Edit Project' : 'Add Project';
  }

  get confirmLabel() {
    const privates = privateMembers.get(this);
    return (privates.mode === 'edit') ? 'Update' : 'Add';
  }

  get initFocus() {
    return privateMembers.get(this).controls.name;
  }

  addContent(parent) {
    const containerType = { classList: ['form-input-container'] };
    const labelType = (value) => ({ value, classList: ['form-input-label'] });
    parent.appendChild(createFormControl({
      type: 'text',
      id: 'project-name',
      name: 'project-name',
      classList: ['form-input'],
      required: true,
      label: labelType('Name'),
      container: containerType,
    }));

    parent.appendChild(createFormControl({
      type: 'textarea',
      id: 'project-description',
      name: 'project-description',
      classList: ['form-textarea'],
      label: labelType('Description'),
      container: containerType,
      size: { rows: 4, cols: 20 },
    }));

    privateMembers.get(this).controls = {
      name: parent.querySelector('#project-name'),
      description: parent.querySelector('#project-description'),
    };

    initFormValues(this);
  }

  confirm() {
    const privates = privateMembers.get(this);
    const { controls } = privates;
    const project = new Project(controls.name.value, {
      description: controls.description.value || null,
    });

    if (privates.callbacks.confirm) privates.callbacks.confirm(project);
  }

  cancel() {
    const privates = privateMembers.get(this);
    if (privates.callbacks.cancel) privates.callbacks.cancel();
  }

  validate() {
    if (!privateMembers.get(this).controls.name.reportValidity()) return false;
    return true;
  }
}

export default AddProjectModal;
