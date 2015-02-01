var fs            = require('fs');
var del           = require('del');
var gulp          = require('gulp');
var connect       = require('gulp-connect');
var concat        = require('gulp-concat');
var jshint        = require('gulp-jshint');
var header        = require('gulp-header');
var rename        = require('gulp-rename');
var uglify        = require('gulp-uglify');
var minifyHtml    = require('gulp-minify-html');
var minifyCSS     = require('gulp-minify-css');
var templateCache = require('gulp-angular-templatecache');
var gutil         = require('gulp-util');
var plumber       = require('gulp-plumber');
var open          = require('gulp-open');
var less          = require('gulp-less');
var order         = require("gulp-order");
var runSequence   = require('run-sequence');
var es            = require('event-stream');
var karma         = require('karma').server;


var config = {
  pkg : JSON.parse(fs.readFileSync('./package.json')),
  banner:
    '/*!\n' +
    ' * <%= pkg.name %>\n' +
    ' * <%= pkg.homepage %>\n' +
    ' * Version: <%= pkg.version %> - <%= timestamp %>\n' +
    ' * License: <%= pkg.license %>\n' +
    ' */\n\n\n'
};

gulp.task('connect', function() {
  return connect.server({
    root: '.',
    livereload: true
  });
});

gulp.task('html', function () {
  return gulp.src(['./demo/*.html', '.src/*.html'])
    .pipe(connect.reload());
});

gulp.task('watch', function () {
  gulp.watch(['./demo/**/*.html'], ['html']);
  gulp.watch(['./**/*.less'], ['styles']);
  gulp.watch(['./**/*.js', './**/*.html'], ['scripts']);
});

gulp.task('clean', function(cb) {
  del(['dist'], cb);
});

gulp.task('scripts', ['clean'], function() {

  function buildTemplates() {
    return gulp.src('src/**/*.html')
      .pipe(minifyHtml({
        empty: true,
        spare: true,
        quotes: true
      }))
      .pipe(templateCache({module: 'mohsen1.schema-form'}));
  };

  function buildDistJS(){
    return gulp.src('src/schema-form.js')
      .pipe(plumber({errorHandler: handleError}))
      .pipe(jshint())
      .pipe(jshint.reporter('jshint-stylish'))
      .pipe(jshint.reporter('fail'));
  };

  return es.merge(buildDistJS(), buildTemplates())
    .pipe(plumber({errorHandler: handleError}))
    .pipe(order([
      'schema-form.js',
      'template.js'
    ]))
    .pipe(concat('schema-form.js'))
    .pipe(header(config.banner, {
      timestamp: (new Date()).toISOString(), pkg: config.pkg
    }))
    .pipe(gulp.dest('dist'))
    .pipe(rename({suffix: '.min.js'}))
    .pipe(uglify({preserveComments: 'some'}))
    .pipe(gulp.dest('./dist'))
    .pipe(connect.reload());
});


gulp.task('styles', ['clean'], function() {

  return gulp.src('src/schema-form.less')
    .pipe(less())
    .pipe(header(config.banner, {
      timestamp: (new Date()).toISOString(), pkg: config.pkg
    }))
    .pipe(gulp.dest('dist'))
    .pipe(minifyCSS())
    .pipe(rename({suffix: '.min.css'}))
    .pipe(gulp.dest('dist'))
    .pipe(connect.reload());
});

gulp.task('open', function(){
  return gulp.src('./demo/demo.html')
  .pipe(open('', {url: 'http://localhost:8080/demo/demo.html'}));
});

gulp.task('jshint-test', function(){
  return gulp.src('./test/**/*.js').pipe(jshint());
})

gulp.task('karma', function (done) {
  karma.start({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done);
});

gulp.task('karma-serve', function(done){
  karma.start({
    configFile: __dirname + '/karma.conf.js'
  }, done);
});

function handleError(err) {
  console.log(err);
  this.emit('end');
};

gulp.task('build', ['scripts', 'styles']);
gulp.task('serve', function (cb) {
  runSequence('build', 'connect', 'watch', 'open', cb);
});
gulp.task('default', ['build', 'test']);
gulp.task('test', ['build', 'jshint-test', 'karma']);
gulp.task('serve-test', ['build', 'watch', 'jshint-test', 'karma-serve']);
