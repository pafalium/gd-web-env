//
// Adapted from: 
//  http://stackoverflow.com/questions/22330103/how-to-include-node-modules-in-a-separate-browserify-vendor-bundle
//

var gulp         = require('gulp');
var browserify   = require('browserify');
var source       = require('vinyl-source-stream');

var bust         = require('gulp-buster');
var streamify    = require('gulp-streamify');

var htmlreplace  = require('gulp-html-replace');
var fs           = require('fs');

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
    .pipe(gulp.dest('./dist/'))
    .pipe(streamify(bust()))
    .pipe(gulp.dest('.'));
});

gulp.task('scripts', function () {
  return browserify('./src/index.js', {debug: true})
    .external(dependencies)
    .bundle()
    .on('error', handleErrors)
    .on('end', ()=>{console.log("ended")})
    .pipe(source('scripts.js'))
    .pipe(gulp.dest('./dist/'))
    .pipe(streamify(bust()))
    .pipe(gulp.dest('.'));
});

gulp.task('css', function () {
  return gulp.src('./styles/styles.css')
    .pipe(gulp.dest('./dist/'))
    .pipe(streamify(bust()))
    .pipe(gulp.dest('.'));
});

gulp.task('icons', function () {
  return gulp.src('./icons/**/*')
    .pipe(gulp.dest('./dist/icons'));
});

gulp.task('favicons', function () {
  return gulp.src('./favicons/**/*')
    .pipe(gulp.dest('./dist/'));
});

gulp.task('html', function () {
  var busters = JSON.parse(fs.readFileSync('busters.json'));

  return gulp.src('index.html')
    .pipe(htmlreplace({
      'css': 'styles.css?v=' + busters['dist/styles.css'],
      'js': [
        'libs.js?v=' + busters['dist/libs.js'],
        'scripts.js?v=' + busters['dist/scripts.js']
      ]
    }))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('watch', function(){
  gulp.watch('package.json', ['libs']);
  gulp.watch('src/**', ['scripts']);
  gulp.watch('styles/styles.css', ['css']);
  gulp.watch('icons/**', ['icons']);
  gulp.watch('favicons/**', ['favicons']);
  gulp.watch(['busters.json', 'index.html'], ['html']);
});

gulp.task('default', ['libs', 'scripts', 'css', 'icons', 'favicons', 'html', 'watch']);
