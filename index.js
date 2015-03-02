'use strict';

var glob = require('glob');
var map = require('vinyl-map');

var path = require('path');

var removeNewLines = function (string) {
  return string.replace(/(\r\n|\n|\r)/gm, '');
};

var hasIndent = function (string) {
  return /[\s](\binclude\b|\bextends\b)/g.test(removeNewLines(string));
};

var getIndent = function (string) {
  var indentation = /([\s]+)?(\binclude\b|\bextends\b)/g.exec(removeNewLines(string))[1];

  if (typeof indentation === 'undefined') {
    return '';
  }

  return indentation;
};

var getType = function (string) {
  var type = 'include';

  if (/[\s]?extends\s/g.test(removeNewLines(string))) {
    type = 'extends';
  }

  return type;
};

var getGlobType = function (path) {
  var globType = '';

  if (/\/\*\*\/\*.jade/.test(path)) {
    globType = 'folder';
  } else if (/[^*]\.jade/.test(path)) {
    globType = 'direct';
  } else if (/[^*]\/\*\.jade/.test(path)) {
    globType = 'file';
  } else if (/\*\/\*[^\.]?/.test(path)) {
    globType = 'all';
  }

  return globType;
};

var jadeGlobbing = function (options) {
  if (!options) options = {};
  if (!options.ignore) options.ignore = [];

  if (typeof options.ignore == 'string') options.ignore = [options.ignore];

  return map(function (code, filename) {

    var content = code.toString();
    var includeRegExp = /^[\s]+?(\binclude\b|\bextends\b)\s+(.*\.jade)$/gm;
    var placeholderRegExp = /^([\s]*(\binclude\b|\bextends\b)\s+{.*})$/gm;
    var globRegExp = /\/\*/;
    var regexpTests = {
      'folder': /\/\*\*\/\*.jade/,
      'direct': /[^*]\.jade/,
      'file': /[^*]\/\*\.jade/,
      'all': /\*\/\*[^\.]?/,
    };
    var files;

    content = content.replace(includeRegExp, function (result, filePattern) {
      files = [];

      if (globRegExp.exec(filePattern)) {
        glob.sync(filePattern, { cwd: path.dirname(filename) }).forEach(function (foundFilename) {
          if ('.jade' === path.extname(foundFilename)) {
            if (options.ignore.length > 0) {
              var absolutePath = path.resolve(path.dirname(filename), foundFilename);
              var isNotIgnored = true;

              options.ignore.every(function (ignoreFolder) {
                if (absolutePath.indexOf(ignoreFolder) == -1) {
                  return true;
                } else {
                  isNotIgnored = false;
                  return false;
                }
              });

              if (isNotIgnored === true) {
                files.push(foundFilename);
              }
            } else {
              files.push(foundFilename);
            }
          }
        });

        if (files.length) {
          result = '';

          files.forEach(function (foundFilename) {
            result += 'include ' + foundFilename + '\n';
          });
        } else {
          result = '/* No files to include found in ' + filePattern.replace(/\//g,'\//') + ' */';
        }
      }

      return result;
    });

    var globType;
    var globPath;

    if (options.placeholders) {
      content = content.replace(placeholderRegExp, function (result, placeholderName) {
        var goBack = '';

        var testvar = [];

        files = [];

        var placeholderStr = placeholderName.replace(/([\s]*(\binclude\b|\bextends\b)\s+)/g, '');
        placeholderStr = placeholderStr.replace('{', '').replace('}', '');

        var placeholderDir = options.placeholders[placeholderStr];

        Object.keys(options.placeholders).forEach(function (placeholder) {
          if (placeholderStr === placeholder) {
            var fileDir = placeholderDir.split(path.sep)[0];
                fileDir+= path.dirname(filename).split(fileDir)[1];

            globType = getGlobType(placeholderDir);

            globPath = path.dirname(filename);

            var matchSlashes = new RegExp('\\' + path.sep, 'g');
            var countSlashes = (fileDir.match(matchSlashes)||[]).length + 1;

            fileDir.split(path.sep).forEach(function (dirNameFile) {
              placeholderDir.split(path.sep).forEach(function (dirNamePlaceholder) {
                if (dirNameFile !== dirNamePlaceholder) {
                  return false;
                }

                testvar.push(dirNameFile);
              });
            });

            for (var i = (countSlashes - testvar.length) - 1; i >= 0; i--) {
              goBack += '..' + path.sep;
            }

            return false;
          }
        });

        if (globType && regexpTests[globType].exec(placeholderDir)) {
          glob.sync(
            placeholderDir.replace(testvar.join(path.sep) + path.sep, ''),
            { cwd: path.resolve(globPath, goBack) }
          ).forEach(function (foundFilename) {
            files.push(foundFilename);
            return false;
          });

          if (files.length) {
            result = '';

            files.forEach(function (foundFilename) {
              if (hasIndent(placeholderName)) {
                result += getIndent(placeholderName);
              }
              result += getType(placeholderName) + ' ' + goBack + foundFilename + '\n';
            });
          } else {
            result = '/* No files to ' + getType(placeholderName) + ' found in ' + placeholderDir.replace(/\//g,'\//') + ' */';
          }
        }

        return result;
      });
    }

    return content;
  });
};

module.exports = jadeGlobbing;
