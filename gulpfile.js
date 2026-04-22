const { src, dest, watch, series, parallel } = require("gulp");
const plumber = require("gulp-plumber");
const autoprefixer = require("gulp-autoprefixer");
const browserSync = require("browser-sync");
const rimraf = require("rimraf");

const ssi = require("gulp-ssi");
const prettyHtml = require("gulp-pretty-html");
const ejs = require("gulp-ejs");
const rename = require("gulp-rename");
const pug = require("gulp-pug");
const htmlHint = require("gulp-htmlhint");

const stylus = require("gulp-stylus");
const sass = require("gulp-sass");
const wait = require("gulp-wait");

const notify = require("gulp-notify");

const babel = require("gulp-babel");

const imageMin = require("gulp-imagemin");
const imageMinMozJpeg = require("imagemin-mozjpeg");
const imageMinPngQuant = require("imagemin-pngquant");

const directorySync = require("gulp-directory-sync");

const SRC_PATH = "./src",
  DIST_PATH = "./dist",
  PUBLIC_PATH = "./htdocs",
  assetsPath = "/assets";

// min image files
const minFiles = `${DIST_PATH}/**/[^_]*.{png,jpg,gif,svg}`;
const minOptions = [
  imageMinPngQuant({
    quality: [0.7, 0.85],
    speed: 1,
  }),
  imageMinMozJpeg({
    quality: 85,
    progressive: true,
  }),
  imageMin.gifsicle(),
  imageMin.svgo({
    plugins: [{ removeViewBox: false }],
  }),
];

const minImageFiles = () => {
  return src(minFiles)
    .pipe(imageMin(minOptions, { verbose: true }))
    .pipe(dest(`${DIST_PATH}`));
};

// html
const htmlFiles = [
  // `!${SRC_PATH}/static/assets/inc/**/[^_]*.html`,
  `${SRC_PATH}/html/**/[^_]*.html`,
];
const html = () => {
  return src(htmlFiles)
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(ssi({ root: `${SRC_PATH}/include` }))
    .pipe(prettyHtml())
    .pipe(dest(DIST_PATH));
};

// htmlPug
const htmlPug = () => {
  const option = {
    pretty: true,
  };
  return src(`${SRC_PATH}/pug/**/[^_]*.pug`)
    .pipe(
      plumber({
        errorHandler: notify.onError("Error: <%= error.message %>"),
      })
    )
    .pipe(pug(option))
    .pipe(dest(DIST_PATH));
};

// htmlEjs
const htmlEjs = () => {
  return src(`${SRC_PATH}/ejs/**/[^_]*.ejs`)
    .pipe(
      plumber({
        errorHandler: notify.onError("Error: <%= error.message %>"),
      })
    )
    .pipe(ejs())
    .pipe(rename({ extname: ".html" }))
    .pipe(dest(DIST_PATH));
};

const validateHTML = () => {
  return src(`${DIST_PATH}/**/*.html`)
    .pipe(
      htmlHint({
        "doctype-first": false,
      })
    )
    .pipe(htmlHint.reporter());
};

// cssStylus
const cssStylus = () => {
  return src(`${SRC_PATH}/stylus/**/*.styl`)
    .pipe(
      plumber({
        errorHandler: notify.onError("Error: <%= error.message %>"),
      })
    )
    .pipe(stylus({ "include css": true }))
    .pipe(
      autoprefixer({
        cascade: false,
        // grid: true,
      })
    )
    .pipe(dest(DIST_PATH));
};

// cssScss
const cssScss = () => {
  return (
    src(`${SRC_PATH}/scss/**/*.scss`)
      .pipe(wait(500))
      .pipe(
        plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
      )
      .pipe(sass())
      .pipe(
        autoprefixer({
          cascade: false,
          overrideBrowserslist: [
            "last 2 versions",
            "ie 11",
            "firefox >= 30",
            "ios >= 9",
            "android >= 4.4",
          ],
        })
      )
      // .pipe(sass({ outputStyle: 'compact' }))
      .pipe(sass({ outputStyle: "expanded" }))
      .pipe(dest(DIST_PATH))
  );
};

// script
const scripts = () => {
  return src(`${SRC_PATH}/scripts/**/[^_]*.js`)
    .pipe(
      plumber({
        errorHandler: notify.onError("Error: <%= error.message %>"),
      })
    )
    .pipe(babel())
    .pipe(dest(DIST_PATH));
};

// staticFiles
const staticFiles = () => {
  return src(`${SRC_PATH}/static/**/[^_]*`).pipe(dest(`${DIST_PATH}`));
};

// clean
const clean = (done) => {
  rimraf(DIST_PATH, done);
};

// serve
const routesOptions = {};
routesOptions[assetsPath] = `${SRC_PATH}/static/assets`;

const serve = (done) => {
  browserSync({
    server: {
      baseDir: [DIST_PATH],
      routes: routesOptions,
      // index: "./index.html",

      // serveStaticOptions: {
      //   extensions: ["html"],
      //   redirect: false
      // },
    },
    // redirect: false,
    port: 4444,
    open: "external",
    startPath: "/",
  });
  done();
};

// browserReload
const browserReload = (done) => {
  browserSync.reload();
  done();
};

// run publish
const sync = () => {
  return src(".").pipe(
    directorySync(DIST_PATH, PUBLIC_PATH, {
      printSummary: true,
      ignore: ".DS_Store",
    })
  );
};

// watchFiles
const watchFiles = (done) => {
  // watch(`${SRC_PATH}/ejs/**/*.ejs`, series(ejs, validateHTML, browserReload));
  // watch(`${SRC_PATH}/pug/**/*.pug`, series(pug, validateHTML, browserReload));
  watch(
    `${SRC_PATH}/html/**/*.html`,
    series(html, validateHTML, browserReload)
  );
  // watch(SRC_PATH + stylus/**/*.styl, series(cssStylus, browserReload));
  watch(`${SRC_PATH}/scss/**/*.scss`, series(cssScss, browserReload));
  watch(`${SRC_PATH}/scripts/**/*.js`, series(scripts, browserReload));
  watch(`${SRC_PATH}/static/**/*`, series(staticFiles, browserReload));
  watch(`${SRC_PATH}/include/**/*`, series(html, validateHTML, browserReload));
  done();
};

const buildFiles = series(
  clean,
  parallel(html, cssScss, scripts),
  validateHTML
);
// const buildFiles = series(
//   clean,
//   parallel(htmlPug, cssScss, scripts),
//   validateHTML
// );
// const buildFiles = series(
//   clean,
//   parallel(htmlEjs, cssStylus, scripts),
//   validateHTML
// );
exports.min = minImageFiles;
exports.html = html;
exports.dev = series(buildFiles, serve, watchFiles);
exports.build = series(buildFiles, staticFiles, minImageFiles);
exports.prod = series(buildFiles, staticFiles, minImageFiles, sync);
