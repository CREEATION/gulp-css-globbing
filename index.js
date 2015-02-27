'use strict';

var glob = require('glob');
var map = require('vinyl-map');

var path = require('path');

var jadeGlobbing = function(options) {
  if (!options) options = {};
  if (!options.ignore) options.ignore = [];

  if (typeof options.ignore == 'string') options.ignore = [options.ignore];

  return map(function(code, filename) {

    var content = code.toString();
    var importRegExp = /^include\s+(.*\.jade)$/gm;
    var globRegExp = /\/\*/;
    var files;

    content = content.replace(importRegExp, function(result, filePattern) {
      files = [];

      if (globRegExp.exec(filePattern)) {
        glob.sync(filePattern, { cwd: path.dirname(filename) }).forEach(function(foundFilename) {
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

          files.forEach(function(foundFilename) {
            result += 'include ' + foundFilename + '\n';
          });
        } else {
          result = '/* No files to import found in ' + filePattern.replace(/\//g,'\//') + ' */';
        }
      }

      return result;
    });

    return content;
  });
};

module.exports = jadeGlobbing;
