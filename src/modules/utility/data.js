/**
 * Defines functions for manipulating data.
 * @module data
 */

import {
  validate as validateUuid,
  version as uuidVersion,
} from 'uuid';

import { isDateValid, parseIsoDateTime } from './dates';

/**
 * Add a value to an array belonging to a Map having array values. If the given
 * key does not exist in the map, then a new array will be inserted at that
 * key.
 * @param {Map} map The map of arrays.
 * @param {*} key The key corresponding to the array in which the value is to
 *   be inserted.
 * @param {*} value The value to insert into the array.
 */
function addToMapArray(map, key, value) {
  let arr = map.get(key);
  if (!arr) {
    arr = [];
    map.set(key, arr);
  }
  arr.push(value);
}

/**
 * Compare two semantic version strings. The version strings should be
 * formatted according to the [Semantic Versioning 2.0.0](https://semver.org/)
 * specifications. Pre-release information and build metadata are ignored.
 * @param {string} v1 The first version string to compare.
 * @param {string} v2 The second version string to compare.
 * @returns {number} If v1 has a lower version number than v2 (that is, v1 is
 *   an older version), then a value less than 0 is returned. If v1 has higher
 *   version number than v2 (that is, v1 is a newer version), then a value
 *   greater than 0 is returned. Otherwise, if both v1 and v2 are equivalent
 *   versions, then 0 is returned.
 * @throws {RangeError} If either string is not a valid semantic version.
 */
function compareVersions(v1, v2) {
  const splitVersion = (version) => {
    const components = version.match(/^([0-9]+)(\.([0-9]+)(\.([0-9]+))?)?/);
    if (!components) {
      throw new RangeError(`Invalid semantic version "${version}"`);
    }

    const major = Number(components[1]);
    const minor = (components[3] != null) ? Number(components[3]) : 0;
    const patch = (components[5] != null) ? Number(components[5]) : 0;

    return { major, minor, patch };
  };

  const leftVer = splitVersion(v1);
  const rightVer = splitVersion(v2);

  if (leftVer.major !== rightVer.major) {
    return (leftVer.major < rightVer.major) ? -1 : 1;
  }

  if (leftVer.minor !== rightVer.minor) {
    return (leftVer.minor < rightVer.minor) ? -1 : 1;
  }

  if (leftVer.patch !== rightVer.patch) {
    return (leftVer.patch < rightVer.patch) ? -1 : 1;
  }

  return 0;
}

/**
 * Find a value in an array belonging to a Map having array values. The first
 * value in the appropriate array for which the predicate returns true is
 * returned.
 * @param {Map} map The map of arrays.
 * @param {*} key The key corresponding to the array in which the element is to
 *   be found.
 * @param {Function} predicate The predicate function that will be used to find
 *   the array element. The function will be invoked for each element in the
 *   array associated with the given key. When invoked, the function will be
 *   passed the array element, the index of the element in the array, and the
 *   array itself, in that order, as arguments.
 * @return {*} The matching value, or undefined if not found.
 */
function findInMapArray(map, key, predicate) {
  const arr = map.get(key);
  if (!arr) return undefined;
  return arr.find(predicate);
}

/**
 * Remove a value from an array belonging to a Map having array values. This
 * function is similar to
 * [removeFromMapArray]{@link module:data~removeFromMapArray}, except that it
 * takes a predicate function instead of a value. The first value in the array
 * for which the predicate returns true is removed.
 * @param {Map} map The map of arrays.
 * @param {*} key The key corresponding to the array from which the value is to
 *   be removed.
 * @param {Function} predicate The predicate function that will be used to find
 *   a matching array element. The function will be invoked for each element in
 *   the array associated with the given key. When invoked, the function will
 *   be passed the array element, the index of the element in the array, and
 *   the array itself, in that order, as arguments.
 * @returns {boolean} Returns true if a value was successfully removed, or
 *   false if a matching array element could not be found.
 */
function removeFromMapArrayBy(map, key, predicate) {
  const arr = map.get(key);
  if (!arr) return false;

  const index = arr.findIndex(predicate);
  if (index < 0) return false;

  arr.splice(index, 1);
  if (arr.length === 0) map.delete(key);
  return true;
}

/**
 * Remove a value from an array belonging to a Map having array values.
 * @param {Map} map The map of arrays.
 * @param {*} key The key corresponding to the array from which the value is to
 *   be removed.
 * @param {*} value The value to remove from the array.
 * @returns {boolean} Returns true if the value was successfully removed, or
 *   false if a matching array element could not be found.
 */
function removeFromMapArray(map, key, value) {
  return removeFromMapArrayBy(map, key, (elem) => elem === value);
}

/**
 * Get the type of a JSON value: 'object', 'array', 'string', 'number',
 * 'boolean', or 'null'. Types that are not supported in JSON, such as
 * functions or undefined, will return 'null'.
 * @param {*} value The value whose type is to be checked.
 * @returns {string} A string representation of the value's type.
 */
function getJsonType(value) {
  if (value == null) return 'null';
  switch (typeof value) {
    case 'object':
      return Array.isArray(value) ? 'array' : 'object';
    case 'string':
    case 'number':
    case 'boolean':
      return typeof value;
    default:
      return 'null';
  }
}

/**
 * Determine whether a string is a valid version 4 UUID.
 * @param {string} id The string to test.
 * @returns {boolean} True if the UUID is valid, and false otherwise.
 */
function isUuidValid(id) {
  return typeof id === 'string' && validateUuid(id) && uuidVersion(id) === 4;
}

/**
 * A callback function that will be invoked when a value passes validation.
 * @callback module:data~validationSuccess
 * @param {*} value The value that passed validation. If the allowConversion
 *   option was set, then this will be the converted value.
 * @param {Object} options An object specifying additional information.
 * @param {string} [options.valueName] The name for the data field that the
 *   value corresponds to.
 */

/**
 * A callback function that will be invoked when a value fails validation.
 * @callback module:data~validationError
 * @param {string} errorType A string specifying the type of error that
 *   occurred: 'bad-type' indicates a type error, 'unknown-value' indicates an
 *   unrecognized value, 'not-integer' indicates a value that is not an
 *   integer, 'too-low' indicates a value below the minimum, 'too-high'
 *   indicates a value above the maximum, 'bad-date' indicates an invalid date,
 *   'bad-id' indicates an invalid UUID, and 'failed-predicate' indicates that
 *   the value was rejected by the custom predicate function.
 * @param {*} value The value that failed validation.
 * @param {Object} options An object specifying the criteria that were used to
 *   validate the value.
 * @param {string} [options.valueName] The name for the data field that the
 *   value corresponds to.
 * @param {string} [options.expectedType] The expected type of the value.
 * @param {boolean} [options.allowConversion] Indicates whether conversion from
 *   string was allowed.
 * @param {string[]} [options.expectedValues] An array of acceptable strings
 *   that the value should have matched.
 * @param {boolean} [options.requireUuid] Indicates whether a UUID was
 *   required.
 * @param {boolean} [options.requireInteger] Indicates whether an integer was
 *   required.
 * @param {number} [options.min] The minimum acceptable value.
 * @param {number} [options.max] The maximum acceptable value.
 * @param {Function} [options.customPredicate] The custom predicate function
 *   that was used for validation.
 */

/**
 * An object specifying options for validating a value.
 * @typedef {Object} module:data~validationOptions
 * @property {string} [valueName] An optional name for the data field that the
 *   value is read from or being assigned to. This is passed to the callback
 *   functions but is otherwise ignored.
 * @property {string} [expectedType] The type that the value should have. This
 *   can be one of 'object', 'array', 'string', 'number', 'boolean', 'null', or
 *   'date'.
 * @property {boolean} [allowConversion=false] This property is used in
 *   conjunction with expectedType. If this is set to true, then the value is
 *   allowed to have string type as long as it can be converted to the expected
 *   type. Objects and arrays cannot be converted from string.
 * @property {string[]} [expectedValues] For string values, this property
 *   specifies an optional list of acceptable values. Values that do match an
 *   item in the given array will fail validation.
 * @property {boolean} [requireUuid=false] For string values, if this property
 *   is set to true, then the string must contain a UUID.
 * @property {boolean} [requireInteger=false] For values of number type, if
 *   this property is set to true, then the number must be an integer.
 * @property {number} [min] For numeric values, this property specifies the
 *   minimum acceptable value.
 * @property {number} [max] For numeric values, this property specifies the
 *   maximum acceptable value.
 * @property {Function} [customPredicate] A predicate function that can perform
 *   custom validation. If the value passes all other constraints, then it is
 *   passed to this function. The function should return true or false to
 *   indicate whether the value passes validation.
 * @property {module:data~validationSuccess} [successCallback] A callback
 *   function that will be invoked if the value passes validation.
 * @property {module:data~validationError} [errorCallback] A callback
 *   function that will be invoked if the value fails validation.
 */

/**
 * Validate a value according to a set of criteria.
 * @param {*} value The value to check.
 * @param {module:data~validationOptions} [options={}] An object specifying
 *   validation options.
 * @returns {boolean} True if the value passes validation, and false otherwise.
 */
function validateValue(value, options = {}) {
  const fail = (errorType) => {
    options.errorCallback?.(errorType, value, {
      valueName: options.valueName ?? null,
      expectedType: options.expectedType ?? null,
      allowConversion: options.allowConversion || false,
      expectedValues: options.expectedValues || null,
      requireUuid: options.requireUuid || false,
      requireInteger: options.requireInteger || false,
      min: options.min ?? null,
      max: options.max ?? null,
      customPredicate: options.customPredicate || null,
    });
  };

  const allowConversion = options.allowConversion || false;
  let convertedValue = value;
  if (options.expectedType) {
    if (options.expectedType !== 'null' && value == null) {
      fail('bad-type');
      return false;
    }

    switch (options.expectedType) {
      case 'string':
        if (typeof value !== 'string') {
          fail('bad-type');
          return false;
        }
        break;
      case 'number':
        if (typeof value !== 'number') {
          if (!allowConversion || typeof value !== 'string') {
            fail('bad-type');
            return false;
          }
          convertedValue = Number(value);
        }

        if (!Number.isFinite(convertedValue)) {
          fail('bad-type');
          return false;
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          if (!allowConversion || typeof value !== 'string') {
            fail('bad-type');
            return false;
          }

          switch (value.toLowerCase()) {
            case 'true':
              convertedValue = true;
              break;
            case 'false':
              convertedValue = false;
              break;
            default:
              fail('bad-type');
              return false;
          }
        }
        break;
      case 'null':
        if (value != null) {
          fail('bad-type');
          return false;
        }
        break;
      case 'date':
        if (!(value instanceof Date)) {
          if (!allowConversion || typeof value !== 'string') {
            fail('bad-type');
            return false;
          }
          convertedValue = parseIsoDateTime(value);
        }

        if (!isDateValid(convertedValue)) {
          fail('bad-date');
          return false;
        }
        break;
      default:
        if (getJsonType(value) !== options.expectedType) {
          fail('bad-type');
          return false;
        }
        break;
    }
  }

  if (typeof convertedValue === 'string') {
    if (options.expectedValues
      && !options.expectedValues.includes(convertedValue)) {
      fail('unknown-value');
      return false;
    }

    if (options.requireUuid && !isUuidValid(convertedValue)) {
      fail('bad-id');
      return false;
    }
  }

  if (typeof convertedValue === 'number') {
    if (options.requireInteger && !Number.isInteger(convertedValue)) {
      fail('not-integer');
      return false;
    }

    if (options.min != null && convertedValue < options.min) {
      fail('too-low');
      return false;
    }

    if (options.max != null && convertedValue > options.max) {
      fail('too-high');
      return false;
    }
  }

  if (options.customPredicate) {
    if (!options.customPredicate(convertedValue)) {
      fail('failed-predicate');
      return false;
    }
  }

  options.successCallback?.(convertedValue, {
    valueName: options.valueName ?? null,
  });
  return true;
}

export {
  addToMapArray,
  compareVersions,
  findInMapArray,
  getJsonType,
  isUuidValid,
  removeFromMapArray,
  removeFromMapArrayBy,
  validateValue,
};
