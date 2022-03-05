/**
 * Defines functions for manipulating data.
 * @module data
 */

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

export {
  addToMapArray,
  findInMapArray,
  getJsonType,
  removeFromMapArray,
  removeFromMapArrayBy,
};
