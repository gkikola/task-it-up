/**
 * Defines the [Project]{@link module:project~Project} class.
 * @module project
 */

/**
 * Holds information about a user project.
 */
class Project {
  /**
   * Create a project.
   * @param {string} name The name of the project.
   * @param {Object} [options={}] An object holding additional project options.
   * @param {string} [options.description] A description for the project.
   */
  constructor(name, options = {}) {
    /**
     * The name of the project.
     * @type {string}
     */
    this.name = name;

    /**
     * A description for the project.
     * @type {?string}
     */
    this.description = options.description ?? null;
  }

  /**
   * Create a project from a JSON object.
   * @param {Object} data The JSON object holding the serialized data.
   * @returns {module:project~Project} A new project converted from the JSON
   *   data.
   */
  static fromJson(data) {
    return new Project(data.name, { description: data.description });
  }
}

export default Project;
