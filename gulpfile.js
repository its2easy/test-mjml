"use strict";
import gulp  from 'gulp';
import browsersync  from  'browser-sync';
import mjml  from  'gulp-mjml';
import newer from  'gulp-newer';
import { deleteAsync } from 'del'
import plumber from 'gulp-plumber';
import yargs from 'yargs';
import rename  from  'gulp-rename';
//import gulpif  from  'gulp-if';
//import fileinclude from  'gulp-file-include';
import mjmlEngine from 'mjml';

let config = {
  assetsDir: './assets',
  distDir: './dist',
  srcDir: './src',
  port: 3007,
};

const argv = yargs(process.argv.slice(2)).argv;
const PRODUCTION = !!(argv.production);

// function handleError (err) {
//   console.log(err.toString());
//   this.emit('end');
// }
function clean(done) {
  deleteAsync(`${config.distDir}/**/*`)
      .then(() => { done(); })
}

// Process mjml templates
function mjml2html() { //todo filter newer, check for production
  return gulp
    .src([`${config.srcDir}/**/*.mjml`, `!${config.srcDir}/includes/**/*`, `!${config.srcDir}/partials/**/*`])
    //.pipe(fileinclude({ prefix: "@@", basepath: "@file" }))
    .pipe(plumber())
    .pipe(mjml(mjmlEngine, { minify: true, validationLevel: "strict", beautify: false }))
    .pipe(gulp.dest(config.distDir))
    .pipe(browsersync.stream());
}

// BrowserSync
function browserSyncInit(done) {
  browsersync.init({
    server: {
      baseDir: config.distDir
    },
    port: config.port
  }, done);
}

// BrowserSync Reload
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

// Copy assets
function assets() {
  return gulp
    .src(`${config.assetsDir}/**/*`)
    .pipe(newer(`${config.distDir}/assets`))
    .pipe(gulp.dest(`${config.distDir}/assets`));
}

// Process after build
function prepareForDeploy(){
  return gulp.src([`${config.distDir}/**/*.html`, `!${config.distDir}/index.html`])
      .pipe(rename(function (path) {
        path.extname = ".hbs"
      }))
      .pipe(gulp.dest( config.distDir ));
}

function watchFiles() {
  gulp.watch( `${config.srcDir}/**/*`).on( 'all', gulp.series(gulp.parallel(mjml2html, assets), browserSyncReload) );
  gulp.watch( `${config.assetsDir}/**/*`).on('all', gulp.series(assets, browserSyncReload) );
}

const build = gulp.series( clean, gulp.parallel(mjml2html, assets), prepareForDeploy );
const watch = gulp.series(mjml2html, assets, browserSyncInit, watchFiles );


export { build, watch };
export default  watch;