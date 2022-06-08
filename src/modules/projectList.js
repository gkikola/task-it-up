/**
 * Defines the [ProjectList]{@link module:projectList~ProjectList} class.
 * @module projectList
 */

import _ from 'lodash';
import { v4 as generateUuid } from 'uuid';

import Project from './project';
import { getJsonType, isUuidValid, validateValue } from './utility/data';

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
   * An object holding information about the status of a data import.
   * @typedef {Object} module:projectList~ProjectList~importStatus
   * @property {Object} projects An object holding information about the number
   *   of projects that were imported.
   * @property {number} projects.added The number of new projects that were
   *   added to the project list.
   * @property {number} projects.updated The number of existing projects in the
   *   project list that were updated.
   * @property {number} projects.failed The number of projects that failed to
   *   import.
   * @property {number} projects.total The total number of projects that were
   *   processed.
   * @property {string[]} errors An array of error messages describing any
   *   errors that occurred during the import.
   */

  /**
   * Create a project list.
   */
  constructor() {
    const privates = { projects: [] };
    privateMembers.set(this, privates);
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
   * Add or update a project. If a project with the given identifier exists,
   * then it is replaced with the given project. Otherwise, the project is
   * added to the list as a new project. If the given identifier is not a valid
   * UUID, then the method returns false and nothing happens.
   * @param {string} id The unique identifier of the project.
   * @param {module:project~Project} project The project that should be added
   *   or with which an existing project should be replaced.
   * @returns {boolean} True if the project was successfully added or updated,
   *   or false if the given identifier is not a valid UUID.
   */
  addOrUpdateProject(id, project) {
    if (!isUuidValid(id)) return false;

    if (!this.updateProject(id, project)) {
      const privates = privateMembers.get(this);
      const value = { id, project: _.cloneDeep(project) };

      // Maintain sort order on insertion
      const index = _.sortedIndexBy(
        privates.projects,
        value,
        (elem) => elem.project.name.toLowerCase(),
      );

      privates.projects.splice(index, 0, value);
    }

    return true;
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
      id = generateUuid();
    } while (this.hasProject(id));

    this.addOrUpdateProject(id, project);
    return id;
  }

  /**
   * Remove a project from the project list.
   * @param {string} id The identifier of the project to remove.
   * @returns {boolean} Returns true if the project was successfully removed,
   *   or false if an invalid identifier was given.
   */
  deleteProject(id) {
    const index = findIndex(this, id);
    if (index < 0) return false;

    privateMembers.get(this).projects.splice(index, 1);
    return true;
  }

  /**
   * Delete all projects from the project list.
   */
  deleteAll() {
    privateMembers.get(this).projects.length = 0;
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
   * Convert data to an object suitable for serialization.
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

  /**
   * Import projects from a JSON object.
   * @param {Object} data The serialized JSON object to import.
   * @returns {module:projectList~ProjectList~importStatus} An object holding
   *   information about the status of the import.
   */
  importFromJson(data) {
    const counts = {
      added: 0,
      updated: 0,
      failed: 0,
      total: 0,
    };
    const errors = [];

    if (!Array.isArray(data)) {
      errors.push('Error: Expected "projects" property to be an array.');
      return { projects: counts, errors };
    }

    data.forEach(({ name, id, description }) => {
      const handleError = (errorType, value, opts) => {
        if (value == null) return;
        const msgPrefix = `Warning: Project "${name}"`;
        let msg;
        switch (errorType) {
          case 'bad-type':
            msg = `Expected type "${opts.expectedType}" for property "${opts.valueName}" (received "${getJsonType(value)}").`;
            break;
          case 'bad-id':
            msg = `Expected a version 4 UUID for property "${opts.valueName}" (received "${value}").`;
            break;
          default:
            msg = `Encountered unrecognized error "${errorType}" for property "${opts.valueName}".`;
            break;
        }

        errors.push(`${msgPrefix}: ${msg}`);
      };

      if (name == null) {
        errors.push('Error: Project must have a name.');
        counts.failed += 1;
      } else if (typeof name !== 'string') {
        errors.push(`Error: Expected type "string" for project name (received "${getJsonType(name)}").`);
        counts.failed += 1;
      } else if (name.length === 0) {
        errors.push('Error: Project name must not be empty.');
        counts.failed += 1;
      } else {
        const projectOptions = {};

        if (validateValue(description, {
          valueName: 'description',
          expectedType: 'string',
          errorCallback: handleError,
        })) projectOptions.description = description;

        let newId = null;
        if (validateValue(id, {
          valueName: 'id',
          expectedType: 'string',
          requireUuid: true,
          errorCallback: handleError,
        })) newId = id;

        if (newId && this.hasProject(newId)) counts.updated += 1;
        else counts.added += 1;

        const project = new Project(name, projectOptions);
        if (newId) this.addOrUpdateProject(newId, project);
        else this.addProject(project);
      }
    });

    counts.total = counts.added + counts.updated + counts.failed;

    return { projects: counts, errors };
  }

  /**
   * Import projects from parsed CSV data.
   * @param {string[][]} data An array of string arrays. Each member of the
   *   outer array represents a single project, and each member of each inner
   *   array is a data field for that particular project. The first member of
   *   the outer array should be a header holding field names. Duplicate
   *   projects are ignored, as are unrelated fields.
   * @returns {module:taskList~TaskList~importStatus} An object holding
   *   information about the status of the import.
   */
  importFromCsv(data) {
    const columns = [];
    if (data.length > 0) {
      const header = data[0];
      header.forEach((field, index) => {
        switch (field.toLowerCase()) {
          case 'project name':
          case 'project-name':
            columns.push({ name: 'name', index });
            break;
          case 'project uuid':
          case 'project-uuid':
            columns.push({ name: 'id', index });
            break;
          case 'project description':
          case 'project-description':
            columns.push({ name: 'description', index });
            break;
          default:
            break;
        }
      });
    }

    const entries = [];
    if (columns.length > 0) {
      data.forEach((csvRecord, csvIndex) => {
        if (csvIndex === 0) return;

        const entry = {};
        columns.forEach(({ name, index }) => {
          if (csvRecord.length > index && csvRecord[index].length > 0) {
            entry[name] = csvRecord[index];
          }
        });
        if (!_.isEmpty(entry)) entries.push(entry);
      });
    }

    const isEntryEqual = (left, right) => {
      if (left.id != null || right.id != null) return left.id === right.id;
      return left.name === right.name
        && left.description === right.description;
    };
    return this.importFromJson(_.uniqWith(entries, isEntryEqual));
  }
}

export default ProjectList;
