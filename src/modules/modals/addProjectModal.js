/**
 * Defines the [AddProjectModal]{@link module:addProjectModal~AddProjectModal}
 * class.
 * @module addProjectModal
 */

import Project from '../project';
import { createFormControl } from '../utility';

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
    /**
     * The project being edited, if any.
     * @type {module:project~Project}
     */
    this._project = options.project || null;

    /**
     * Indicates the status of the project being entered. If set to 'add', a
     * new project is being created, and if set to 'edit', then an existing
     * project is being updated.
     * @type {string}
     */
    this._mode = options.project ? 'edit' : 'add';

    /**
     * An object holding callback functions.
     * @type {Object}
     * @property {Function} [confirm] A callback function that will be invoked
     *   when the user successfully confirms the modal.
     * @property {Function} [cancel] A callback function that will be invoked
     *   when the user cancels the modal.
     */
    this._callbacks = {
      confirm: options.confirm || null,
      cancel: options.cancel || null,
    }

    /**
     * An object holding the form input elements for the modal.
     * @type {Object}
     * @property {HTMLElement} name The text input element for the project
     *   name.
     * @property {HTMLElement} description The textarea element for the project
     *   description.
     */
    this._controls = {
      name: null,
      description: null,
    };
  }

  get title() {
    return (this._mode === 'edit') ? 'Edit Project' : 'Add Project';
  }

  get confirmLabel() {
    return (this._mode === 'edit') ? 'Update' : 'Add';
  }

  addContent(parent) {
    const containerType = { classList: ['form-input-container'] };
    const labelType = value => ({ value, classList: ['form-input-label'] });
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

    this._controls = {
      name: parent.querySelector('#project-name'),
      description: parent.querySelector('#project-description'),
    }

    this._initFormValues();
  }

  confirm() {
    const controls = this._controls;
    const project = new Project(controls.name.value, {
      description: controls.description.value || null,
    });

    if (this._callbacks.confirm)
      this._callbacks.confirm(project);
  }

  cancel() {
    if (this._callbacks.cancel)
      this._callbacks.cancel();
  }

  validate() {
    if (!this._controls.name.reportValidity())
      return false;
    return true;
  }

  /**
   * Initialize the values of the form elements based on the initial project
   * that was passed to the constructor, if any.
   */
  _initFormValues() {
    const project = this._project;
    const controls = this._controls;

    if (project) {
      controls.name.value = project.name || '';
      controls.description.value = project.description || '';
    }
  }
}

export default AddProjectModal;
