/**
 * Defines the [ProjectList]{@link module:projectList~ProjectList} class.
 * @module projectList
 */

import _ from 'lodash';
import { v4 as uuid } from 'uuid';

/**
 * Object holding private members for the
 * [ProjectList]{@link module:projectList~ProjectList} class.
 * @typedef {Object} module:projectList~ProjectList~privates
 * @property {module:projectList~ProjectList~projectWrapper[]} projects An
 *   array of projects. Each element in the array is a wrapper that holds the
 *   project along with its unique identifier.
 */

/**
 * Holds private data for the
 * [ProjectList]{@link module:projectList~ProjectList} class.
 * @type {WeakMap}
 * @see module:projectList~ProjectList~privates
 */
const privateMembers = new WeakMap();

/**
 * Get a project's index in the project list.
 * @param {module:projectList~ProjectList} instance The class instance on which
 *   to apply the function.
 * @param {string} id The identifier for the project to look up.
 * @returns {number} The index of the project, or -1 if not found.
 */
function findIndex(instance, id) {
  return privateMembers.get(instance).projects.findIndex((entry) => (
    entry.id === id
  ));
}

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
    const privates = { projects: [] };
    privateMembers.set(this, privates);
  }

  /**
   * Add a project to the list. In order to prevent unintentional external
   * modification of the project, a deep copy is made, and the original object
   * is not kept.
   * @param {module:project~Project} project The project to add.
   * @returns {string} The identifier of the newly-added project.
   */
  addProject(project) {
    const privates = privateMembers.get(this);

    // Generate UUID (loop in case of collision)
    let id;
    do {
      id = uuid();
    } while (this.hasProject(id));

    const value = { id, project: _.cloneDeep(project) };

    // Maintain sort order on insertion
    const index = _.sortedIndexBy(
      privates.projects,
      value,
      (elem) => elem.project.name.toLowerCase(),
    );

    privates.projects.splice(index, 0, value);
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
    const index = findIndex(this, id);
    if (index < 0) return undefined;

    return _.cloneDeep(privateMembers.get(this).projects[index].project);
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
    const index = findIndex(this, id);
    if (index < 0) return false;

    const privates = privateMembers.get(this);
    const wrapper = privates.projects[index];
    const needSort = project.name !== wrapper.project.name;
    wrapper.project = _.cloneDeep(project);

    if (needSort) {
      privates.projects.splice(index, 1);
      const insertAt = _.sortedIndexBy(
        privates.projects,
        wrapper,
        (elem) => elem.project.name.toLowerCase(),
      );
      privates.projects.splice(insertAt, 0, wrapper);
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
    const index = findIndex(this, id);
    if (index < 0) return false;

    privateMembers.get(this).projects.splice(index, 1);
    return true;
  }

  /**
   * Determines whether a project with the given identifier exists within the
   * project list.
   * @param {string} id The unique identifier of the project to look for.
   * @returns {boolean} True if the project exists, and false otherwise.
   */
  hasProject(id) {
    return findIndex(this, id) >= 0;
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
    privateMembers.get(this).projects.forEach((project, index) => {
      const copy = _.cloneDeep(project);
      callback(copy, index);
    });
  }

  /**
   * Returns an object suitable for serialization.
   * @returns {Object} An object representing serializable data for the class.
   */
  toJSON() {
    const projects = [];
    privateMembers.get(this).projects.forEach(({ id, project }) => {
      projects.push({
        name: project.name,
        id,
        description: project.description,
      });
    });
    return projects;
  }
}

export default ProjectList;
