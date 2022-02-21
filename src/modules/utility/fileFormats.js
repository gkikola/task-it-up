/**
 * Defines general-purpose functions for converting to and from different file
 * formats.
 * @module fileFormats
 */

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

export { arrayToCsvRecord };
