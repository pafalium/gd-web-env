//
// Adapted from: 
//  http://stackoverflow.com/questions/22330103/how-to-include-node-modules-in-a-separate-browserify-vendor-bundle
//

var gulp         = require('gulp');
var browserify   = require('browserify');
var source       = require('vinyl-source-stream');

var packageJson = require('./package.json');
var dependencies = Object.keys(packageJson && packageJson.dependencies || {});

function handleErrors(error) {
  console.error(error.stack);
  // Emit 'end' as the stream wouldn't do it itself.
  // Without this, the gulp task won't end and the watch stops working.
  this.emit('end');
}

gulp.task('libs', function () {
  return browserify({debug: true})
    .require(dependencies)
    .bundle()
    .on('error', handleErrors)
    .pipe(source('libs.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('scripts', function () {
  return browserify('./src/index.js', {debug: true})
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
