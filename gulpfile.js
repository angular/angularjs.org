const gulp  = require('gulp');
const sass  = require('gulp-sass');


/*
* CSS
*
*/

gulp.task('sass', function () {
  return gulp.src('./src/scss/**/*.scss')
    .pipe(sass({outputStyle: 'compressed'})
    .on('error', sass.logError))
    .pipe(gulp.dest('./src/css'));
});


/*
* DEVELOPMENT
*
*/

gulp.task('dev', ['sass'], function() {
  gulp.watch('./src/scss/**/*', ['sass']);
  console.log('Watching Sass files for changes...');
});


/*
* PRODUCTION
*
*/

gulp.task('default', ['sass'], function() {
  console.log('Building production assets');
});

module.exports = gulp;
