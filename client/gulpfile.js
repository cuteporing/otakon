var gulp         = require("gulp");
var clean        = require("gulp-clean");
var compass      = require("gulp-compass");
var minifyCss    = require("gulp-minify-css");
var minifyHtml   = require("gulp-minify-html");
var minifyInline = require("gulp-minify-inline");
var concat       = require("gulp-concat");
var uglify       = require("gulp-uglify");
var runSequence  = require("run-sequence");
var watch        = require("gulp-watch");
var jshint       = require("gulp-jshint");
var htmlhint     = require("gulp-htmlhint");
var minimist     = require("minimist");
var replace      = require("gulp-replace");
var config       = require("./config/config.json");

var SRC          = "app";
var DIST         = "public";
var LOG_LEVEL    = "ALL";

var controllers = {
  "common"    : SRC + "/js/controller/commonController.js",
  "dashboard" : SRC + "/js/controller/dashboardController.js",
  "index"     : SRC + "/js/controller/indexController.js"
};

var vendorList = [
//  SRC + "/lib/jquery-1.11.3.min.js",
  SRC + "/lib/h5/h5-logger.config.js",
  SRC + "/lib/jquery.mobile-1.4.5.js",
  SRC + "/lib/jquery-ui.js",
  SRC + "/lib/h5/ejs-1.0.h5mod.js",
  SRC + "/lib/h5/h5-1.1.14.js"
];

var defineList = [
  SRC + "/js/common.js",
  SRC + "/js/config.js"
];

//================================================
// For Development
//================================================
gulp.task("vendorsCompile", function() {
  gulp.src(vendorList)
   .pipe(replace(/LOG_LEVEL/g, LOG_LEVEL))
   .pipe(concat("vendor.min.js"))
   .pipe(gulp.dest(DIST + "/lib"));
});

gulp.task("htmlCompile", function() {
  gulp.src("app/*.html")
    .pipe(gulp.dest(DIST));
});

gulp.task("compassCompile", function() {
  gulp.src("app/sass/**/*sass")
    .pipe(compass({
      config_file: "config.rb",
      css: "app/css/",
      sass: "app/sass"
    }))
    .pipe(gulp.dest(DIST + "/css"));
});

gulp.task("controllersCompile", function() {
  for(var key in controllers){
    if (controllers.hasOwnProperty(key)) {
      gulp.src(controllers[key])
      .pipe(concat(key + ".min.js"))
      .pipe(gulp.dest(DIST + "/js/controller"));
    }
  }
});

gulp.task("defineCompile", function() {
  gulp.src(defineList)
  .pipe(concat("define.min.js"))
  .pipe(gulp.dest(DIST + "/js"));
});

//================================================
// For Production
//================================================

//================================================
// Common task
//================================================
gulp.task("clean", function() {
  return gulp.src(DIST + "/*", {read:false})
          .pipe(clean({force:true}));
});

gulp.task("copy", function() {
  gulp.src("app/css/*")
    .pipe(gulp.dest(DIST + "/css"));
  gulp.src("app/images/**")
    .pipe(gulp.dest(DIST + "/images"));
  gulp.src(SRC + "/lib/jquery-1.11.3.min.js")
    .pipe(gulp.dest(DIST + "/lib/"));
  gulp.src(SRC + "/js/view/*")
    .pipe(gulp.dest(DIST + "/js/view"));
});

//================================================
// Build type
// Development : compile
// Production  : uglify
//================================================
gulp.task("development", function() {
  runSequence(
     "clean",
    ["compassCompile",
     "vendorsCompile",
     "defineCompile",
     "htmlCompile",
     "controllersCompile"],
     "copy"
  );
});

gulp.task("production", function() {
  runSequence(
    "clean"
  );
});