import fs from 'fs';
import glob from 'glob';

/**
 * Gets an array of files that exist at a given path recursively
 *
 * @param {String} path Path to get files from
 * @returns {Array} Array of file paths
 */
export function getFiles(path) {
  return new Promise((resolve, reject) => {
    glob(`${path}/**/*`, async (err, items) => {
      if (err) {
        return reject(err);
      }

      try {
        const files = [];

        for (const item of items) {
          if (!fs.lstatSync(item).isDirectory()) {
            files.push(item);
          }
        }
        return resolve(files);
      } catch (err) {
        return reject(err);
      }
    });
  });
}
