import path from 'path';
import {find} from 'shelljs';
import builtins from 'builtins';

let ignored = builtins.reduce((agg, key) => {agg[key] = true; return agg;}, {});
ignored.test = true;

let resolved_from_ease = [/babel\-/, /webpack/];

let deps = find(path.resolve(__dirname, '../node_modules'))
  .filter(file => /package\.json$/.test(file))
  .reduce((agg, file) => {
    let dir = path.dirname(file);
    let dep = path.basename(dir);
    if (dep.indexOf('webpack') === -1 && dep.indexOf('babel') === -1) {
      return agg;
    }
    if (ignored[dep]) return agg;
    agg[dep] = dir;
    return agg;
  }, {});

const formatter = (percentage, message) => {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(`${(100.0 * percentage).toFixed(1)}%: ${message}`);
};

const babel_opts = {
  babelrc: false,
  presets: ['es2015', 'react', 'stage-2'],
  plugins: ['syntax-decorators', 'transform-decorators-legacy']
};

const eslint_opts = {
  'parser': 'babel-eslint',
  'env': {
    'node': true
  },
  'rules': {
    'strict': 0,
    'semi': [2, 'always'],
    'semi-spacing': [2, {'before': false, 'after': true}],
    'no-trailing-spaces': [2, {'skipBlankLines': true}],
    'no-var': 2,
    'arrow-body-style': [2, 'as-needed'],
    'babel/arrow-parens': [2, 'as-needed'],
    'constructor-super': 2,
    'no-arrow-condition': 2,
    'no-class-assign': 2,
    'no-const-assign': 2,
    'no-dupe-class-members': 2,
    'no-this-before-super': 2,
    'object-shorthand': [2, 'always'],
    'prefer-arrow-callback': 2,
    'prefer-template': 2,
    'prefer-spread': 2,
    'quotes': [2, 'single'],
    'indent': [2, 2, {'SwitchCase': 1}],
    'brace-style': [2, 'stroustrup', { 'allowSingleLine': true }],
    'camelcase': 0
  },
  'plugins': [
    'babel'
  ]
}

let standard_transformer = (content, filename) => content;

let standard_resolver = (request, parent) => {
  return deps[request] ? deps[request] : request;
}

export {
  formatter,
  babel_opts,
  eslint_opts,
  standard_transformer,
  standard_resolver
}