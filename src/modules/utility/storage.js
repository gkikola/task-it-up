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
 * @param {?string} prefix A prefix to use for the key name to avoid clashes
 *   with other web apps hosted on the same origin. If given, the actual key
 *   used will have the form 'prefix.key'.
 * @param {string} key The key to create or update.
 * @param {*} value The value to be associated with the key.
 * @returns {boolean} True if the data was successfully stored, and false
 *   otherwise. Possible reasons for returning false include local storage
 *   being unsupported or disabled, or storage limits being exceeded.
 */
function storeData(prefix, key, value) {
  if (!isLocalStorageSupported()) return false;

  const fullKey = prefix ? `${prefix}.${key}` : key;

  try {
    window.localStorage.setItem(fullKey, JSON.stringify(value));
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
 * @param {?string} prefix The prefix for the key name whose value is to be
 *   retrieved.
 * @param {string} key The key whose value is to be retrieved.
 * @returns {*} The data associated with the key, or null if not found.
 */
function retrieveData(prefix, key) {
  if (!isLocalStorageSupported()) return null;

  const fullKey = prefix ? `${prefix}.${key}` : key;

  try {
    return JSON.parse(window.localStorage.getItem(fullKey));
  } catch {
    return null;
  }
}

/**
 * Remove data from the browser's local storage. If it exists, the given key
 * and its associated data will be removed from storage.
 * @param {?string} prefix The prefix for the key to be removed.
 * @param {string} key The key to be removed.
 * @returns {boolean} True if the key was found and removed. If the key was not
 *   found or if local storage is unavailable, returns false.
 */
function removeData(prefix, key) {
  if (!isLocalStorageSupported()) return false;

  window.localStorage.removeItem(prefix ? `${prefix}.${key}` : key);
  return true;
}

/**
 * Clear all data from the browser's local storage. If local storage is
 * unsupported or disabled, nothing happens.
 * @param {?string} prefix The prefix for the keys to be removed. If not given,
 *   then everything stored in local storage will be removed.
 */
function clearData(prefix) {
  if (isLocalStorageSupported()) {
    const storage = window.localStorage;
    if (prefix) {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key.startsWith(prefix)) storage.removeItem(key);
      }
    } else {
      storage.clear();
    }
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
 *   contents. If an error occurs, the callback function will be invoked with a
 *   null argument instead.
 */
function readFile(file, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.addEventListener('error', () => callback(null));
  reader.addEventListener('abort', () => callback(null));
  reader.readAsText(file);
}

/**
 * Convert an array of strings to comma-separated values (CSV format, as
 * described by the
 * [RFC 4180]{@link https://datatracker.ietf.org/doc/html/rfc4180}
 * specification). This function will create one CSV record, which can then be
 * combined with other records to form a complete CSV file.
 * @param {string[]} data An array of strings specifying the values for the
 *   fields in the record.
 * @param {Object} [options={}] An object specifying options for the
 *   conversion.
 * @param {string} [options.newlineSequence] The character sequence to use for
 *   newlines. If not provided, a carriage return/line feed pair (CRLF) is
 *   used. All newline characters within each field will be replaced by this
 *   sequence.
 * @returns {string} The record in CSV format. The returned string is not
 *   terminated by a newline, but may contain quoted newlines within the field
 *   data.
 */
function arrayToCsvRecord(data, options = {}) {
  const newlineSequence = options.newlineSequence ?? '\r\n';

  const fields = [];
  data.forEach((value) => {
    let needQuotes = false;
    const result = value.replace(/,|"|\r\n|\n|\r/g, (match) => {
      needQuotes = true;
      switch (match) {
        case '"':
          return '""';
        case '\r\n':
        case '\n':
          return newlineSequence;
        default:
          return match;
      }
    });

    fields.push(needQuotes ? `"${result}"` : result);
  });

  return fields.join(',');
}

/**
 * Convert data in comma-separated value (CSV) format into an array of arrays
 * of strings. Each data record is stored as an array of strings within the
 * outer array, with each string corresponding to a field in the record. Any
 * newline sequences (CRLF, LF, or CR) are converted to linefeed (LF)
 * characters.
 * @param {string} data The data in CSV format.
 * @returns {string[][]} An array of string arrays. Each inner array contains
 *   the fields for one record.
 */
function parseCsv(data) {
  const result = [];

  let currentRow = [];
  let currentField = '';

  const commitField = () => {
    currentRow.push(currentField);
    currentField = '';
  };
  const commitRow = () => {
    result.push(currentRow);
    currentRow = [];
  };

  let quoted = false;
  for (let pos = 0; pos < data.length; pos += 1) {
    switch (data[pos]) {
      case '"':
        if (!quoted) {
          quoted = true;
        } else if (pos + 1 < data.length && data[pos + 1] === '"') {
          // This is a double double quote, so convert it and move to next char
          currentField += '"';
          pos += 1;
        } else {
          // Not a double double quote, so the quoting ends here
          quoted = false;
        }
        break;
      case '\r':
      case '\n':
        // Handle CRLF sequence
        if (data[pos] === '\r'
          && pos + 1 < data.length && data[pos + 1] === '\n') {
          pos += 1;
        }

        if (quoted) {
          currentField += '\n';
        } else {
          commitField();
          commitRow();
        }
        break;
      case ',':
        if (quoted) currentField += ',';
        else commitField();
        break;
      default:
        currentField += data[pos];
        break;
    }
  }

  // Commit last entry if last character was not a newline
  if (data.length > 0) {
    const lastChar = data[data.length - 1];
    if (lastChar !== '\r' && lastChar !== '\n') {
      commitField();
      commitRow();
    }
  }

  return result;
}

/**
 * Extract the extension from a file name. The extension, for the purposes of
 * this function, is considered to be the portion of the filename starting from
 * (and including) the last period in the name and extending to the end of the
 * name. If there is no period in the name, or if the only period is located at
 * the very start of the name (as seen with dotfiles on Unix systems, for
 * example), then the file is considered to have no extension.
 * @param {string} filename The name of the file.
 * @returns {string} The file's extension, including the period. If the file
 *   has no extension, an empty string is returned.
 */
function getFileExtension(filename) {
  const index = filename.lastIndexOf('.');
  return (index > 0) ? filename.substring(index) : '';
}

export {
  arrayToCsvRecord,
  clearData,
  generateFile,
  getFileExtension,
  isLocalStorageSupported,
  parseCsv,
  readFile,
  removeData,
  retrieveData,
  storeData,
};
