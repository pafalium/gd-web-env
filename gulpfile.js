//
// Adapted from: 
//  http://stackoverflow.com/questions/22330103/how-to-include-node-modules-in-a-separate-browserify-vendor-bundle
//

var gulp         = require('gulp');
var browserify   = require('browserify');
//var handleErrors = require('../util/handleErrors');
var source       = require('vinyl-source-stream');

var packageJson = require('./package.json');
var dependencies = Object.keys(packageJson && packageJson.dependencies || {});

function handleErrors(error) {
  console.error(error.stack);
  this.emit('end');
}

gulp.task('libs', function () {
  return browserify()
    .require(dependencies)
    .bundle()
    .on('error', handleErrors)
    .pipe(source('libs.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('scripts', function () {
  return browserify('./src/index.js')
    .external(dependencies)
    .bundle()
    .on('error', handleErrors)
    .on('end', ()=>{console.log("ended")})
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('watch', function(){
  gulp.watch('package.json', ['libs']);
  gulp.watch('src/**', ['scripts']);
});

gulp.task('default', ['libs', 'scripts', 'watch']);
