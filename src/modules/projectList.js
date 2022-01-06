/**
 * Defines the [ProjectList]{@link module:projectList~ProjectList} class.
 * @module projectList
 */

import _ from 'lodash';
import { v4 as uuid } from 'uuid';

/**
 * Holds a list of projects.
 */
class ProjectList {
  /**
   * Wrapper object holding a project along with its UUID.
   * @typedef {Object} module:projectList~ProjectList~projectWrapper
   * @property {string} id The unique identifier for the project.
   * @property {module:project~Project} project The project instance.
   */

  /**
   * Create a project list.
   */
  constructor() {
    /**
     * An array of projects. Each element in the array is a wrapper that holds
     * the project along with its unique identifier.
     * @type {module:projectList~ProjectList~projectWrapper[]}
     */
    this._projects = [];
  }

  /**
   * Add a project to the list. In order to prevent unintentional external
   * modification of the project, a deep copy is made, and the original object
   * is not kept.
   * @param {module:project~Project} project The project to add.
   * @returns {string} The identifier of the newly-added project.
   */
  addProject(project) {
    // Generate UUID (loop in case of collision)
    let id;
    do {
      id = uuid();
    } while (this._projects.find(proj => proj.id === id));

    const value = { id, project: _.cloneDeep(project) };

    // Maintain sort order on insertion
    const index = _.sortedIndexBy(this._projects, value,
      elem => elem.project.name);

    this._projects.splice(index, 0, value);
    return id;
  }

  /**
   * Get a project in the project list. This method only returns a copy of the
   * project, not an actual reference to the project itself. To modify a
   * project in the list, use the
   * [updateProject]{@link module:projectList~ProjectList#updateProject}
   * method.
   * @param {string} id The unique identifier of the project to retrieve.
   * @returns {?module:project~Project} The requested project, or undefined if
   *   it could not be found.
   */
  getProject(id) {
    const index = this._findIndex(id);
    if (index < 0)
      return undefined;

    return _.cloneDeep(this._projects[index].project);
  }

  /**
   * Update a project in the project list.
   * @param {string} id The unique identifier of the project to replace.
   * @param {module:project~Project} project The new project to associate with
   *   the given identifier.
   * @returns {boolean} Returns true if the project was replaced successfully,
   *   or false if the given identifier is invalid.
   */
  updateProject(id, project) {
    const index = this._findIndex(id);
    if (index < 0)
      return false;

    const wrapper = this._projects[index];
    const needSort = project.name !== wrapper.project.name;
    wrapper.project = _.cloneDeep(project);

    if (needSort) {
      this._projects.splice(index, 1);
      const insertAt = _.sortedIndexBy(this._projects, wrapper,
        elem => elem.project.name);
      this._projects.splice(insertAt, 0, wrapper);
    }
    return true;
  }

  /**
   * Remove a project from the project list.
   * @param {string} id The identifier of the project to remove.
   * @returns {boolean} Returns true if the project was successfully removed,
   *   or false if an invalid identifier was given.
   */
  removeProject(id) {
    const index = this._findIndex(id);
    if (index < 0)
      return false;

    this._projects.splice(index, 1);
    return true;
  }

  /**
   * Iterate over the project list. Each iteration yields a wrapper containing
   * the identifier of the project along with the project itself.
   * @yields {module:projectList~ProjectList~projectWrapper} The next project
   *   in the list.
   */
  *[Symbol.iterator]() {
    for (const entry of this._projects)
      yield _.cloneDeep(entry);
  }

  /**
   * Execute the provided function on each project in the list.
   * @param {Function} callback The function to execute on each project. The
   *   function will be passed a
   *   [wrapper]{@link module:projectList~ProjectList~projectWrapper}
   *   containing the project and its identifier. The function can also
   *   optionally accept the index of the project in the list as its second
   *   argument.
   */
  forEach(callback) {
    for (let index = 0; index < this._projects.length; index++) {
      const copy = _.cloneDeep(this._projects[index]);
      callback(copy, index);
    }
  }

  /**
   * Get a project's index in the project list.
   * @param {string} id The identifier for the project to look up.
   * @returns {number} The index of the project, or -1 if not found.
   */
  _findIndex(id) {
    return this._projects.findIndex(entry => entry.id === id);
  }
}

export default ProjectList;
