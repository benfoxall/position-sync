/*

Build the client script

*/

var config = require('./config');
var gulp = require('gulp');
var rename = require("gulp-rename");
var awspublish = require('gulp-awspublish');
var cloudfront = require("gulp-cloudfront");
var revall = require('gulp-rev-all');
var inject = require("gulp-inject");
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var cssmin = require('gulp-cssmin');
var htmlmin = require('gulp-htmlmin');


var paths = {
  js:[
    "./bower_components/d3/d3.js",
    "./bower_components/bean/bean.js",
    "./bower_components/tweenjs/src/Tween.js",
    "./syncDemo.js",
    "./ps.js",
    "./client.js"
  ],
  css: ['style.css','icons/style.css'],

  assets: ['icons/ps*', 'demo-bg.jpg']
}


gulp.task('assets', function() {
  return gulp.src(paths.assets)
    .pipe(gulp.dest('dist'));
});

gulp.task('js', function() {
  return gulp.src(paths.js)
    .pipe(concat('all.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist'));
});

gulp.task('css', function() {
  return gulp.src(paths.css)
    .pipe(concat('all.css'))
    .pipe(cssmin())
    .pipe(gulp.dest('dist'));
});


gulp.task('html', ['js', 'css'], function() {
  var sources = gulp.src(['*.js','*.css'], {cwd:'./dist'});

  return gulp.src('client.html')
    .pipe(rename('index.html'))
    .pipe(inject(sources, {addRootSlash: false}))
    .pipe(htmlmin({collapseWhitespace: true, removeComments: true}))
    .pipe(gulp.dest('dist'))
});

gulp.task('build', ['html', 'assets'])


gulp.task('publish', ['build'], function() {

  var publisher = awspublish.create(config.aws);

  return gulp.src('./dist/*')
            .pipe(revall())
            // .pipe(awspublish.gzip({ ext: '.gz' }))
            .pipe(publisher.publish())
            // .pipe(publisher.sync())
            .pipe(awspublish.reporter())
            .pipe(cloudfront(config.aws))
            // .pipe(gulp.dest('cdn'))

})

gulp.task('default', ['build'])