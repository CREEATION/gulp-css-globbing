# gulp-jade-globbing
> Globbing with Jade the easy way.

Expands Jade `include` and `extends` statements to allow globbing and placeholders.

Based on [`gulp-css-globbing`](https://github.com/jsahlen/gulp-css-globbing).

## Install

Install `gulp-jade-globbing` as a development dependency using npm:

```shell
npm install --save-dev gulp-jade-globbing
```

## Usage without options

### gulpfile
```javascript
var jade          = require('gulp-jade');
var jadeGlobbing  = require('gulp-jade-globbing');

gulp.task('jade', function(){
  gulp.src(['src/index.jade'])
    .pipe(jadeGlobbing())
    .pipe(jade())
    .pipe(gulp.dest('build'));
});
```

### src/index.jade
```jade
//- ...
include ../foo/bar/**/*.jade
//- ...
```

## Advanced example

### gulp task
```javascript
gulp.task('jade', function(){
  gulp.src(['src/views/**/*.jade'])
    .pipe(jadeGlobbing({
      placeholder: {
        'modules': 'src/modules/**/*.jade',
        'layout': 'src/layout/**/*',
        'default-template': 'src/layout/templates/default.jade',
      }
      ignore: [
        'src/views',
        'src/layout/templates'
      ]
    }))
    .pipe(jade())
    .pipe(gulp.dest('build'));
});
```

### page
```jade
extends {default-template}

block includes
  include ../../utilities/**/*.jade
  include ../../base/*.jade
  include {modules}
  include {layout}

block container
  h1 Hello World!
```

### template to extend
```jade
block includes
doctype html
html
  head
    meta(charset='utf-8')
    title Hello?

  body
    block container
```

## Options

`gulp-jade-globbing` can be called with an options object:

```javascript
gulp.task('jade', function(){
  gulp.src(['src/index.jade'])
    .pipe(jadeGlobbing({
      placeholder: {
        'base': 'src/jade/base/*.jade',
        'modules': 'src/jade/modules/**/*.jade',
        'layout': 'src/jade/layout/**/*',
        'default-template': 'src/jade/layout/templates/default.jade',
      }
      ignore: ['src/jade/layout/templates']
    }))
    .pipe(jade())
    .pipe(gulp.dest('build'));
});
```

### ignore
Type: `String` or `Array`

Folders gulp-jade-globbing should ignore.

Default: `[]`

### placeholder
Type: `Object`

Placeholders to use within jade files, e.g. `{modules}`.

Default: `{}`
