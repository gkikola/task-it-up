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
}

export default ProjectList;
