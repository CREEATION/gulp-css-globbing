'use strict';

/**
 * Require 'em all!
 */
var glob    = require('glob');
var map     = require('vinyl-map');
var colors  = require('colors');

var path    = require('path');

/**
 * Output a message, e.g. errors, warnings,...
 * @param  {Object} options Title, message
 */
var message = function (options) {
  options = options || {};
  options.title = options.title || 'Error!';
  options.message = options.message || '';

  console.log('gulp-jade-globbing'.bold.red + ': '.red + options.title);
  console.log(options.message);
};

/**
 * Remove new lines (you never know!)
 * @param  {String} string Input string
 * @return {String}        Output string without new lines
 */
var removeNewLines = function (string) {
  return string.replace(/(\r\n|\n|\r)/gm, '');
};

/**
 * Check if given string has indentation or not
 * @param  {String} string Input string
 * @return {Boolean}
 */
var hasIndent = function (string) {
  return /[\s](\binclude\b|\bextends\b)/g.test(removeNewLines(string));
};

/**
 * Return indentation of a string
 * @param  {String} string Input string
 * @return {String}        Indentation
 */
var getIndentation = function (string) {
  return /(\s*)?(?:\binclude\b|\bextends\b)/g.exec(removeNewLines(string))[1] || '';
};

/**
 * Return if string is an "include" or "extends"
 * @param  {String} string Input string
 * @return {String}        "include" or "extends"
 */
var getType = function (string) {
  return /[\s]?extends\s/g.test(removeNewLines(string)) ? 'extends' : 'include';
};

/**
 * Check if given object is empty or not.
 * @param  {Object}  obj The object to check
 * @return {Boolean}
 */
var isEmptyObject = function (obj) {
  return Object.keys(obj).length === 0;
};

/**
 * Regex tests to check which type of globbing is used
 * @return {Object} Tests
 */
var regexTests = {
  folder: /\/\*\*\/\*.jade/,
  direct: /[^*]\.jade/,
  file: /[^*]\/\*\.jade/,
  all: /\*\/\*[^\.]?/,
};

/**
 * Get type of globbing used via path string
 * @param  {String} path Path which includes globbing stuff
 * @return {String}      Globbing type used
 */
var getGlobType = function (path) {
  var globType;

  Object.keys(regexTests).forEach(function (type) {
    if (regexTests[type].test(path)) {
      globType = type;
      return false;
    }
  });

  return globType;
};

module.exports = function (options) {
  /**
   * Default options object
   * @type {Object}
   */
  var opt = options || {};

  /**
   * Ignore specific paths which shouldn't be included
   * @type {Array}
   */
  opt.ignore = opt.ignore || [];
  if (typeof opt.ignore == 'string') opt.ignore = [opt.ignore];

  /**
   * Check if given path should be ignored or not
   * @param  {String} path Path to check
   * @return {Boolean}     Yep/Nope
   */
  var ignorePath = function (path) {
    var ignore = false;

    if (opt.ignore.length > 0) {
      opt.ignore.forEach(function (ignoreFolder) {
        if ((new RegExp(ignoreFolder)).test(path)) {
          ignore = true;
        }
      });
    }

    return ignore;
  };

  /**
   * Turn on/off placeholder replacement
   * @type {Object}
   */
  opt.placeholder = opt.placeholder || {};

  return map(function (buffer, filepath) {
    var content             = buffer.toString();
    var contentRegex        = /^((?:\s+)?(?:\binclude\b|\bextends\b)\s.+)$/gm;
    var globRegEx           = /\/\*/;
    var placeholderRegEx    = /\{/;
    var dirName             = path.dirname(filepath);

    /**
     * Check file for "include"'s and "extends" and replace
     * those with relative paths to given files.
     */
    content = content.replace(contentRegex, function (result, includeGlob) {
      /**
       * This holds all paths found by one glob pattern
       * @type {Array}
       */
      var files = [];

      /**
       * "include" or "extends"?
       * @type {String}
       */
      var lineType = getType(result);

      /**
       * Check if it's a placeholder...
       */
      var isPlaceholder = !isEmptyObject(opt.placeholder) && placeholderRegEx.exec(includeGlob) ? true : false;

      if (isPlaceholder) {
        /**
         * Plain placeholder name
         */
        var placeholder = /\{(.+)\}/.exec(includeGlob)[1];

        /**
         * Iterate over all placeholders defined...
         */
        Object.keys(opt.placeholder).forEach(function (name) {
          /**
           * ... and if we have a match...
           */
          if (placeholder === name) {
            var placeholderPath = includeGlob.replace(
              /^(?:\s+)?(?:\binclude\b|\bextends\b)\s({.+})$/,
              opt.placeholder[name]
            );

            var placeholderPathArr = placeholderPath.split(path.sep);
            var rootDir = placeholderPathArr[0] === '.' ? placeholderPathArr[1] : placeholderPathArr[0];
            var relativeFilepath = rootDir + dirName.split(rootDir)[1];
            var relativePath = path.relative(relativeFilepath, placeholderPath);

            includeGlob = includeGlob.replace(
              '{' + name + '}',
              relativePath
            );
          }
        });
      }

      /**
       * Check if we have a glob pattern...
       */
      var hasGlobPattern = includeGlob.match(globRegEx);

      /**
       * Include Path containing the glob
       */
      var includeGlobPath = includeGlob.replace(/^\s\s*/, '');
          includeGlobPath = includeGlobPath.replace(/^(\binclude\b|\bextends\b)\s+/, '');

      /**
       * If we have a glob pattern in the current line...
       */
      if (hasGlobPattern || isPlaceholder) {
        glob.sync(includeGlobPath, { cwd: dirName }).forEach(function (includePath) {
          /**
           * ... push only ".jade" filepaths into the files array...
           */
          if (path.extname(includePath) === '.jade') {
            /**
             * ... if they are not set to be ignored.
             */
            if (!ignorePath(path.resolve(dirName, includePath))) {
              files.push(includePath);
            } else if (isPlaceholder && !hasGlobPattern) {
              files.push(includePath);
            }
          }
        });

        /**
         * If we managed to push filepaths into the files array...
         */
        if (files.length > 0) {
          /**
           * ... and, if it's an "extends" statement, contains
           * no globs or placeholders...
           */
          if (lineType === 'extends' && /\s?(?:\bextends\b)\s(?:[^*{]+)$/.test(includeGlob) === false) {
            var errorMessage = '  statement:    ' + includeGlobPath.cyan + '\n';

            if (isPlaceholder) {
              errorMessage  += '  placeholder:  {' + placeholder + '}\n';
            }

            message({
              title: 'Error!\n  glob patterns are not allowed on extend statements.'.red,
              message: errorMessage
            });
          } else {
            /**
             * ... we can now replace the line containing the glob...
             */
            result = '';

            /**
             * ... with the found file paths.
             */
            files.forEach(function (includePath) {
              result += getIndentation(includeGlob) + lineType + ' ' + includePath + '\n';
            });
          }
        /**
         * Otherwise show a warning about the glob pattern not matching.
         */
        } else {
          var warningMessage = '  pattern:      ' + includeGlobPath.cyan + '\n';

          if (isPlaceholder) {
            warningMessage  += '  placeholder:  {' + placeholder + '}\n';
          }

          message({
            title: 'Warning!\n  glob pattern did not match any files.'.red,
            message: warningMessage
          });

          result = '//- No file(s) found in ' + includeGlobPath + '\n';
        }
      }

      return result;
    });

    return content;
  });
};
