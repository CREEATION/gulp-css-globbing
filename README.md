# gulp-jade-globbing
> Globbing with Jade's `include` the easy way.

Expands Jade `include` statements containing globs with the full paths.

Heavily inspired by [`sass-globbing`](https://github.com/chriseppstein/sass-globbing) and [`gulp-css-globbing`](https://github.com/jsahlen/gulp-css-globbing).

## Install

Install `gulp-jade-globbing` as a development dependency using npm:

```shell
npm install --save-dev gulp-jade-globbing
```

## Usage

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

Given a Jade file that looks like this:

```jade
//- Include Everything
include ../**/*.jade

doctype html
html
  head
    meta(charset='utf-8')
    title Hello?

  body
    h1 Hello World!
```

The plugin would produce the following:

```jade
//- Include Everything
include ../layout/header/template.jade
include ../layout/navigation/template.jade
include ../modules/buttons/template.jade
include ../modules/forms/template.jade
include ../modules/tables/template.jade
include ../modules/notification/template.jade

doctype html
html
  head
    meta(charset='utf-8')
    title Hello?

  body
    h1 Hello World!
```

## Options

`gulp-jade-globbing` can be called with an options object:

```javascript
gulp.task('jade', function(){
  gulp.src(['src/index.jade'])
    .pipe(jadeGlobbing({
      ignore: ['src/layout/templates']
    }))
    .pipe(gulp.dest('build'));
});
```

### ignore
Type: `String` or `Array`

Folders gulp-jade-globbing should ignore.

Default: `[]`
