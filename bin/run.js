#!/usr/bin/env node
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _setpath = require('./setpath');

var _setpath2 = _interopRequireDefault(_setpath);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _module2 = require('module');

var _module3 = _interopRequireDefault(_module2);

var _module_patch = require('./module_patch');

var _module_patch2 = _interopRequireDefault(_module_patch);

var _utils = require('./utils');

var _jsYaml = require('js-yaml');

var _jsYaml2 = _interopRequireDefault(_jsYaml);

var _babelCore = require('babel-core');

var _babelPolyfill = require('babel-polyfill');

var _babelPolyfill2 = _interopRequireDefault(_babelPolyfill);

var _sourceMapSupport = require('source-map-support');

var _sourceMapSupport2 = _interopRequireDefault(_sourceMapSupport);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var sourcemap_cache = {};

_sourceMapSupport2.default.install({
  environment: 'node',
  retrieveSourceMap: function retrieveSourceMap(source) {
    _utils.log.debug('Checking sourcemap for source: ' + source);
    var sourcemap = sourcemap_cache[source];
    if (!sourcemap) {
      return null;
    }
    _utils.log.debug('Retrieving sourcemap ' + sourcemap);

    return {
      url: source,
      map: _utils.cache.get(sourcemap)
    };
  }
});

var entry = _path2.default.resolve(process.argv[2]);

var transformer = function transformer(content, filename) {
  _utils.log.debug('Processing file: ' + filename);
  if (!(0, _utils.standard_transformer_filter)(filename)) {
    _utils.log.debug('Ignoring filtered file: ' + filename);
    return content;
  }

  if (filename.endsWith('.css') || filename.endsWith('.scss')) {
    _utils.log.debug('Skipping style file: ' + filename);
    return '';
  }

  if (filename.endsWith('.json')) {
    _utils.log.debug('Loading json file: ' + filename);
    return content;
  }

  _utils.log.debug('Transforming file: ' + filename);

  var key = _utils.cache.hash(content);
  try {
    sourcemap_cache[filename] = key + '.map';
    var cached = _utils.cache.get(key + '.code');
    _utils.log.debug('Retrieving cached transformed file: ' + (key + '.code'));
    return cached;
  } catch (err) {}

  // yaml transformation
  if (filename.endsWith('.yaml')) {
    _utils.log.debug('Transforming yaml file: ' + filename);
    var transformed = 'module.exports = ' + JSON.stringify(_jsYaml2.default.load(content));
    _utils.cache.put(key + '.code', transformed);
    return transformed;
  }

  // raw import
  var extensions = ['txt', 'key', 'crt', 'pem', 'ps1', 'sh'];
  if (extensions.some(function (ext) {
    return filename.endsWith('.' + ext);
  })) {
    _utils.log.debug('Transforming raw file: ' + filename);
    var _transformed = 'module.exports = ' + JSON.stringify(content.toString());
    _utils.cache.put(key + '.code', _transformed);
    return _transformed;
  }

  _utils.babel_opts.filename = filename;

  var transpiled = (0, _babelCore.transform)(content, _extends({}, _utils.babel_opts, { sourceMaps: true }));
  _utils.cache.put(key + '.map', transpiled.map);
  var source_map = _path2.default.resolve(process.cwd(), '.ease_cache', key + '.map');

  var transpiled_code = transpiled.code + '\n//# sourceMappingURL=' + source_map;
  _utils.cache.put(key + '.code', transpiled_code);
  return transpiled_code;
};

(0, _module_patch2.default)(transformer, _utils.standard_resolver);

require(entry);