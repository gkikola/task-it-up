/**
 * Defines storage-related utility functions.
 * @module storage
 */

let storageSupported = null;

/**
 * Determine whether or not local storage is supported and enabled in the
 * browser. The check is only performed once: subsequent calls will immediately
 * return the same value.
 * @returns {boolean} True if local storage is supported and enabled, and false
 *   otherwise.
 */
function isLocalStorageSupported() {
  if (storageSupported !== null) return storageSupported;

  let storage;
  try {
    storage = window.localStorage;
    const testItem = '__storage-test';
    storage.setItem(testItem, testItem);
    storage.removeItem(testItem);
    storageSupported = true;
  } catch (e) {
    storageSupported = e instanceof DOMException && (
      e.code === 22 || e.code === 1014 || e.name === 'QuotaExceededError'
      || e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    ) && (storage && storage.length !== 0);
  }

  return storageSupported;
}

/**
 * Store data in the browser's local storage, if available. This function will
 * associate the given key with the given value in storage. The value is first
 * converted to JSON format before being stored.
 * @param {string} key The key to create or update.
 * @param {*} value The value to be associated with the key.
 * @returns {boolean} True if the data was successfully stored, and false
 *   otherwise. Possible reasons for returning false include local storage
 *   being unsupported or disabled, or storage limits being exceeded.
 */
function storeData(key, value) {
  if (!isLocalStorageSupported()) return false;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieve data from the browser's local storage, if available. This function
 * will return the data associated with the given key. The data is converted
 * from JSON format and the resulting value or object is used as the return
 * value. If the key does not exist or if local storage is not available, null
 * is returned.
 * @param {string} key The key whose value is to be retrieved.
 * @returns {*} The data associated with the key, or null if not found.
 */
function retrieveData(key) {
  if (!isLocalStorageSupported()) return null;

  try {
    return JSON.parse(window.localStorage.getItem(key));
  } catch {
    return null;
  }
}

/**
 * Remove data from the browser's local storage. If it exists, the given key
 * and its associated data will be removed from storage.
 * @param {string} key The key to be removed.
 * @returns {boolean} True if the key was found and removed. If the key was not
 *   found or if local storage is unavailable, returns false.
 */
function removeData(key) {
  if (!isLocalStorageSupported()) return false;

  window.localStorage.removeItem(key);
  return true;
}

/**
 * Clear all data from the browser's local storage. If local storage is
 * unsupported or disabled, nothing happens.
 */
function clearData() {
  if (isLocalStorageSupported()) {
    window.localStorage.clear();
  }
}

/**
 * Generate a text file, and present it to the user as a download.
 * @param {string} content The text data to store in the file.
 * @param {string} filename The default file name.
 * @param {string} [type=text/plain] The Internet media type for the file. For
 *   example, 'application/json' would indicate a JSON file, and 'text/csv'
 *   would indicate a file containing comma-separated values.
 */
function generateFile(content, filename, type = 'text/plain') {
  const data = new Blob([content], { type });
  const url = URL.createObjectURL(data);

  const linkElem = document.createElement('a');
  linkElem.href = url;
  linkElem.download = filename;
  linkElem.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Read the contents of a text file. The file contents are passed to the
 * specified callback function once the read operation is complete.
 * @param {Blob} file The file to be read.
 * @param {Function} callback The callback function that will receive the file
 *   contents.
 */
function readFile(file, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsText(file);
}

export {
  isLocalStorageSupported,
  storeData,
  retrieveData,
  removeData,
  clearData,
  generateFile,
  readFile,
};
