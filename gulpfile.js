"use strict";

const dotenv = require('dotenv');
const b2v = require("buffer-to-vinyl");
const connect = require("gulp-connect");
const createFile = require("create-file");
const del = require("del");
const dateFormat = require("dateformat");
const eslint = require("gulp-eslint");
const gulp = require("gulp");
const git = require("git-rev-sync");
const ngConfig = require("gulp-ng-config");
const lazypipe = require("lazypipe");
const livereload = require("gulp-livereload");
const merge = require("merge-stream");
const plugins = require("gulp-load-plugins")();
const runSequence = require("run-sequence").use(gulp);
const zip = require("zipfolder");
const CONFIG_BUILD = require("./gulp.conf.js")();
const CONFIG_SERVER = require("./server.conf.js")();

// There's no need to check if .env exists, dotenv will check this // for you. It will show a small warning which can be disabled when // using this in production.
dotenv.load();
dotenv.config();

import {
    Server as KarmaServer
} from "karma";

/**
 * Gulp task for all
 */

gulp.task("vendor-css", vendorCssTask);
gulp.task("lint-app:fix", lintFixAppTask);
gulp.task("lint-app:watch", lintWatchAppTask);
gulp.task("lint-common:fix", lintFixCommonTask);
gulp.task("lint-common:watch", lintWatchCommonTask);
gulp.task('get-build-info', getBuildInfoTask);
gulp.task('create-version-file', createVersionFileTask);
gulp.task('create-deploy-folder', createDeployFolderTask);
gulp.task('copy-file-deploy', copyFileToZipFolderTask);
gulp.task('zip-build-folder', ['create-deploy-folder', 'create-version-file', 'copy-file-deploy'], zipBuildFolderTask);
gulp.task("build", ['clean-deploy'], buildTask);

/**
 * Gulp task for develop
 */

gulp.task("clean", cleanTask);
gulp.task("copy-views", copyViewsTask);
gulp.task("copy-views-common", copyViewsCommonTask);
gulp.task("copy-images", copyImagesTask);
gulp.task("copy-fonts", copyFontsTask);
gulp.task("build-js-vendor", buildJsVendorTask);
gulp.task("build-js-linear", buildJsLinearTask);
gulp.task("index", indexTask);
gulp.task("sass", sassTask);
gulp.task("make-config", makeConfigTask);
gulp.task("del-config-file", delConfigFileTask);
gulp.task('del-fe-build-file', delFeBuildVersionFileTask);
gulp.task('make-fe-build-version', ['del-fe-build-file', 'get-build-info'], makeBuildFeInfoTask);
gulp.task("default", defaultTask);
gulp.task("watch", watchTask);

/**
 * gulp task for deploy
 */

gulp.task("clean-deploy", cleanDeployTask);
gulp.task("sass-deploy", sassDeployTask);
gulp.task("common-deploy", commonDeployTask);
gulp.task("vendor-css-deploy", vendorCssDeployTask);
gulp.task("copy-views-deploy", copyViewsDeployTask);
gulp.task("copy-views-common-deploy", copyViewsCommonDeployTask);
gulp.task("copy-images-deploy", copyImagesDeployTask);
gulp.task("copy-fonts-deploy", copyFontsDeployTask);
gulp.task("build-js-vendor-deploy", buildJsVendorDeployTask);
gulp.task("build-js-linear-deploy", buildJsLinearDeployTask);
gulp.task("index-deploy", indexDeployTask);
gulp.task("make-config-deploy", makeConfigDeployTask);
gulp.task("del-config-file-deploy", delConfigFileDeployTask);
gulp.task('del-fe-build-file-deploy', delFeBuildVersionFileDeployTask);
gulp.task('make-fe-build-version-deploy', ['del-fe-build-file-deploy', 'get-build-info'], makeBuildFeInfoDeployTask);
gulp.task("deploy", deployTask);

/**
 * gulp task for run server
 */

gulp.task("dev-server", devServerTask);
gulp.task("test-server", testServerTask);
gulp.task("prod-server", prodServerTask);
gulp.task("server-dev-start", startDevServerTask);
gulp.task("server-test-start", startTestServerTask);
gulp.task("server-prod-start", startProdServerTask);

/**
 * gulp task for run unit test
 */

gulp.task("unit-tests", done => {
    return new KarmaServer({
            configFile: __dirname + '/test/karma.conf.js',
            singleRun: true,
            module: ""
        }, (result) => {
            if (result) {
                return done("Karma tests failed - forcing exit");
            }
            done();
        })
        .start();
});

let OPTIONS = {
    DO_UGLIFY: false,
    DO_SOURCEMAPS: true,
    watchInterval: 1000
};

/**
 * Common utilities
 */

let VENDOR_CSS = CONFIG_BUILD.vendor_css;
let VENDOR_JS = CONFIG_BUILD.vendor_js;

/**
 * Set up server
 */

let DEV_SERVER = connect;
let TEST_SERVER = connect;
let PROD_SERVER = connect;

function handleNotification(message) {
    if (message) {
        console.log(message.message);
    }
};

function serverCallBack(err) {
    if (err) {
        console.log('Sorry! Server could not be ran. Please try to again');
        console.log(err);
    } else {
        console.log('Server ran successfully!');
    }
};

function packJS(name, folder, subfolder) {
    let destPath = folder + (!!subfolder ? subfolder + '/' : '');
    let fileName = name + '.js';

    return lazypipe()
        .pipe(function() {
            return plugins.if(OPTIONS.DO_SOURCEMAPS, plugins.sourcemaps.init());
        })
        .pipe(plugins.concat, fileName)
        .pipe(plugins.ngAnnotate)
        .pipe(function() {
            return plugins.if(OPTIONS.DO_UGLIFY, plugins.uglify({
                preserveComments: 'some',
                compress: {
                    drop_console: true
                }
            }))
        })
        .pipe(function() {
            return plugins.if(OPTIONS.DO_SOURCEMAPS, plugins.sourcemaps.write('./'));
        })
        .pipe(gulp.dest, destPath);
};

function cleanTask() {
    return del([
        CONFIG_BUILD.dev.path_js + '**',
        CONFIG_BUILD.dev.path_css + '**',
        CONFIG_BUILD.dev.path_html + '**'
    ], {
        force: true
    });
};

function cleanDeployTask() {
    return del(CONFIG_BUILD.prod.folder_name + '**/*', {
        force: true
    });
};

function lintFixAppTask() {
    return gulp.src([
            CONFIG_BUILD.src.app.path_js + '**/*.js'
        ])
        .pipe(eslint({
            fix: true
        }))
        .pipe(eslint.format())
        .pipe(gulp.dest(CONFIG_BUILD.src.app.path_js));
};

function lintFixCommonTask() {
    return gulp.src([
            CONFIG_BUILD.src.path_js + '**/*.js'
        ])
        .pipe(eslint({
            fix: true
        }))
        .pipe(eslint.format())
        .pipe(gulp.dest(CONFIG_BUILD.src.path_js));
};

function lintWatchAppTask() {
    return gulp.watch([
        CONFIG_BUILD.src.app.path_js + '**/*.js'
    ], ['lint-app:fix']);
};

function lintWatchCommonTask() {
    return gulp.watch([
        CONFIG_BUILD.src.path_js + '**/*.js'
    ], ['lint-common:fix']);
};

function copyImagesTask() {
    return gulp.src(CONFIG_BUILD.src.path_image + '**/*')
        .pipe(gulp.dest(CONFIG_BUILD.dev.path_image))
        .pipe(livereload(CONFIG_SERVER.live_server_dev.livereload.port));
};

function copyImagesDeployTask() {
    return gulp.src(CONFIG_BUILD.src.path_image + '**/*')
        .pipe(plugins.newer(CONFIG_BUILD.prod.path_image))
        .pipe(plugins.imagemin())
        .pipe(gulp.dest(CONFIG_BUILD.prod.path_image));
};

function copyViewsTask() {
    return gulp.src([
            CONFIG_BUILD.src.app.path_html
        ])
        .pipe(plugins.rename(function(path) {
            path.dirname = path.dirname.replace(CONFIG_BUILD.src.folder_html, '');
        }))
        .pipe(gulp.dest(CONFIG_BUILD.dev.path_html))
        .pipe(livereload(CONFIG_SERVER.live_server_dev.livereload.port));
};

function copyViewsCommonTask() {
    return gulp.src([
            CONFIG_BUILD.src.path_html + '**/*.html'
        ])
        .pipe(gulp.dest(CONFIG_BUILD.dev.path_html + 'common/'))
        .pipe(livereload(CONFIG_SERVER.live_server_dev.livereload.port));
};

function copyViewsDeployTask() {
    return gulp.src([
            CONFIG_BUILD.src.app.path_html
        ])
        .pipe(plugins.rename(function(path) {
            path.dirname = path.dirname.replace(CONFIG_BUILD.src.folder_html, '');
        }))
        .pipe(gulp.dest(CONFIG_BUILD.prod.path_html));
};

function copyViewsCommonDeployTask() {
    return gulp.src([
            CONFIG_BUILD.src.path_html + '**/*.html'
        ])
        .pipe(gulp.dest(CONFIG_BUILD.prod.path_html + 'common/'))
        .pipe(livereload(CONFIG_SERVER.live_server_dev.livereload.port));
};

function copyFontsTask() {
    return gulp.src(CONFIG_BUILD.src.path_font + '**/*')
        .pipe(gulp.dest(CONFIG_BUILD.dev.path_font))
        .pipe(livereload(CONFIG_SERVER.live_server_dev.livereload.port));
};

function copyFontsDeployTask() {
    return gulp.src(CONFIG_BUILD.src.path_font + '**/*')
        .pipe(gulp.dest(CONFIG_BUILD.prod.path_font));
};

function vendorCssTask() {
    return gulp.src(VENDOR_CSS)
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.concat('vendor.css'))
        .pipe(plugins.sourcemaps.write('./'))
        .pipe(gulp.dest(CONFIG_BUILD.dev.path_css));
};

function vendorCssDeployTask() {
    return gulp.src(VENDOR_CSS)
        .pipe(plugins.minifyCss())
        .pipe(plugins.concat('vendor.css'))
        .pipe(gulp.dest(CONFIG_BUILD.prod.path_css));
};

function indexTask() {
    return gulp.src(CONFIG_BUILD.src.path_index)
        .pipe(gulp.dest(CONFIG_BUILD.dev.folder_name + '/'))
        .pipe(livereload(CONFIG_SERVER.live_server_dev.livereload.port));
};

function indexDeployTask() {
    return gulp.src(CONFIG_BUILD.src.path_index)
        .pipe(gulp.dest(CONFIG_BUILD.prod.folder_name + '/'));
};

function sassTask() {
    return gulp.src(CONFIG_BUILD.src.app.path_screen_css)
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.sass())
        .on('error', handleNotification)
        .pipe(plugins.rename(function(path) {
            path.basename = path.basename.replace('screen', 'linear');
        }))
        .pipe(plugins.sourcemaps.write('./'))
        .pipe(gulp.dest(CONFIG_BUILD.dev.path_css))
        .pipe(livereload(CONFIG_SERVER.live_server_dev.livereload.port));
};

function sassDeployTask() {
    return gulp.src(CONFIG_BUILD.src.app.path_screen_css)
        .pipe(plugins.sass())
        .on('error', handleNotification)
        .pipe(plugins.rename(function(path) {
            path.basename = path.basename.replace('screen', 'linear');
        }))
        .pipe(gulp.dest(CONFIG_BUILD.prod.path_css));
};

function buildJsVendorTask() {
    OPTIONS.DO_SOURCEMAPS = false;
    OPTIONS.DO_UGLIFY = false;

    let lib = gulp.src(VENDOR_JS)
        .pipe(packJS('linear-lib', CONFIG_BUILD.dev.path_js)());

    let respond = gulp.src('node_modules/respond.js/src/respond.js')
        .pipe(packJS('respond', CONFIG_BUILD.dev.path_js, 'polyfill')());

    let xdomain = gulp.src('node_modules/xdomain/dist/xdomain.js')
        .pipe(packJS('xdomain', CONFIG_BUILD.dev.path_js, 'polyfill')());

    return merge(
        respond,
        xdomain
    );
};

function buildJsVendorDeployTask() {
    OPTIONS.DO_SOURCEMAPS = false;
    OPTIONS.DO_UGLIFY = true;

    let lib = gulp.src(VENDOR_JS)
        .pipe(packJS('linear-lib', CONFIG_BUILD.prod.path_js)());

    let respond = gulp.src('node_modules/respond.js/src/respond.js')
        .pipe(packJS('respond', CONFIG_BUILD.prod.path_js, 'polyfill')());

    let xdomain = gulp.src('node_modules/xdomain/dist/xdomain.js')
        .pipe(packJS('xdomain', CONFIG_BUILD.prod.path_js, 'polyfill')());

    return merge(
            respond,
            xdomain
        )
        .pipe(livereload(CONFIG_SERVER.live_server_dev.livereload.port));
};

function buildJsLinearTask() {
    OPTIONS.DO_SOURCEMAPS = true;
    OPTIONS.DO_UGLIFY = false;

    let common = gulp.src([
            CONFIG_BUILD.src.app.path_js + '/app.js',
            CONFIG_BUILD.src.app.path_js + 'constants/*.js',
            CONFIG_BUILD.src.app.path_js + 'mains/*.js',
            CONFIG_BUILD.src.app.path_js + 'controllers/*.js',
            CONFIG_BUILD.src.app.path_js + 'directives/*.js',
            CONFIG_BUILD.src.app.path_js + 'services/*.js',
            CONFIG_BUILD.src.app.path_js + 'resources/*.js',
            CONFIG_BUILD.src.app.path_js + '/routers.js'
        ])
        .pipe(eslint({
            quiet: true
        }))
        .pipe(eslint.format())
        .pipe(packJS('linear', CONFIG_BUILD.dev.path_js)())
        .on('error', handleNotification)
        .pipe(gulp.dest(CONFIG_BUILD.dev.path_js));

    return merge(common)
        .pipe(livereload(CONFIG_SERVER.live_server_dev.livereload.port));
};

function buildJsLinearDeployTask() {
    OPTIONS.DO_SOURCEMAPS = false;
    OPTIONS.DO_UGLIFY = true;

    let common = gulp.src([
            CONFIG_BUILD.src.app.path_js + '/app.js',
            CONFIG_BUILD.src.app.path_js + 'constants/*.js',
            CONFIG_BUILD.src.app.path_js + 'mains/*.js',
            CONFIG_BUILD.src.app.path_js + 'controllers/*.js',
            CONFIG_BUILD.src.app.path_js + 'directives/*.js',
            CONFIG_BUILD.src.app.path_js + 'services/*.js',
            CONFIG_BUILD.src.app.path_js + 'resources/*.js',
            CONFIG_BUILD.src.app.path_js + '/routers.js'
        ])
        .pipe(eslint({
            quiet: true
        }))
        .pipe(eslint.format())
        .pipe(packJS('linear', CONFIG_BUILD.prod.path_js)())
        .on('error', handleNotification)
        .pipe(gulp.dest(CONFIG_BUILD.prod.path_js));

    return merge(common);
};

function makeConfigTask() {
    let json = JSON.stringify({});

    return b2v.stream(new Buffer(json), 'config.js')
        .pipe(ngConfig('linear', {
            createModule: false,
            constants: {
                SERVICE_URL: CONFIG_SERVER.service_url,
                PROTOCOL_BE: CONFIG_SERVER.host_back_end_protocol,
                HOST_BE: CONFIG_SERVER.host_back_end,
                PORT_BE: CONFIG_SERVER.port_back_end,
                DOMAIN_BE: CONFIG_SERVER.domain_back_end,
                HOST_BE_FULL: CONFIG_SERVER.host_back_end_protocol + CONFIG_SERVER.host_back_end + ':' + CONFIG_SERVER.management_port,
                session_timeout: CONFIG_SERVER.session_timeout
            }
        }))
        .pipe(gulp.dest(CONFIG_BUILD.dev.path_js))
        .pipe(livereload(CONFIG_SERVER.live_server_dev.livereload.port));
};

function makeConfigDeployTask() {
    let json = JSON.stringify({});

    return b2v.stream(new Buffer(json), 'config.js')
        .pipe(ngConfig('linear', {
            createModule: false,
            constants: {
                SERVICE_URL: CONFIG_SERVER.service_url,
                PROTOCOL_BE: CONFIG_SERVER.host_back_end_protocol,
                HOST_BE: CONFIG_SERVER.host_back_end,
                PORT_BE: CONFIG_SERVER.port_back_end,
                DOMAIN_BE: CONFIG_SERVER.domain_back_end,
                HOST_BE_FULL: CONFIG_SERVER.host_back_end_protocol + CONFIG_SERVER.host_back_end + ':' + CONFIG_SERVER.management_port,
                session_timeout: CONFIG_SERVER.session_timeout
            }
        }))
        .pipe(gulp.dest(CONFIG_BUILD.prod.path_js))
};

function delConfigFileTask() {
    return del(CONFIG_BUILD.dev.path_js + 'config.js', {
        force: true
    });
};

function delConfigFileDeployTask() {
    return del(CONFIG_BUILD.prod.path_js + 'config.js', {
        force: true
    });
};

function watchTask() {
    plugins.livereload.listen(CONFIG_SERVER.live_server_dev.livereload.port);

    gulp.watch(CONFIG_BUILD.src.path_image + '**', {
        interval: OPTIONS.watchInterval
    }, () => {
        runSequence('copy-images');
    });

    gulp.watch([
        CONFIG_BUILD.src.app.path_html
    ], {
        interval: OPTIONS.watchInterval
    }, () => {
        runSequence('copy-views');
    });

    gulp.watch([
        CONFIG_BUILD.src.path_html + '**/*.html'
    ], {
        interval: OPTIONS.watchInterval
    }, () => {
        runSequence('copy-views-common');
    });

    gulp.watch([
        CONFIG_BUILD.src.path_font
    ], {
        interval: OPTIONS.watchInterval
    }, () => {
        runSequence('copy-fonts');
    });

    gulp.watch([
        CONFIG_BUILD.src.app.path_screen_css,
        CONFIG_BUILD.src.app.path_css
    ], {
        interval: OPTIONS.watchInterval
    }, () => {
        runSequence('sass');
    });

    gulp.watch([
        CONFIG_BUILD.src.app.path_js + '**/*.js'
    ], {
        interval: OPTIONS.watchInterval
    }, () => {
        runSequence('build-js-linear');
    });

    gulp.watch([
        CONFIG_BUILD.src.path_js + '**/*.js'
    ], {
        interval: OPTIONS.watchInterval
    }, () => {
        runSequence('build-js-vendor');
    });

    gulp.watch([
        CONFIG_BUILD.src.path_index
    ], {
        interval: OPTIONS.watchInterval
    }, () => {
        runSequence('index');
    });

    handleNotification('Watching for changes');
};

function devServerTask() {
    DEV_SERVER.server(CONFIG_SERVER.live_server_dev);
};

function testServerTask() {
    TEST_SERVER.server(CONFIG_SERVER.live_server_test);
};

function prodServerTask() {
    PROD_SERVER.server(CONFIG_SERVER.live_server_prod);
};

function startDevServerTask() {
    return runSequence('dev-server', function(err) {
        serverCallBack(err);
    });
};

function startTestServerTask() {
    return runSequence('test-server', function(err) {
        serverCallBack(err);
    });
};

function startProdServerTask() {
    return runSequence('prod-server', function(err) {
        serverCallBack(err);
    });
};

function getBuildInfoTask() {
    process.env.COMMIT_ID = git.short();
    process.env.BRANCH = git.branch();
    var now = new Date();
    var number = process.env.MAJOR + '.' + process.env.MINOR + '.' + process.env.POINT;
    var build_type = process.env.BUILD_TYPE;
    process.env.BUILD_TIME = dateFormat(now, 'dd/mm/yyyy');
    var firstName = process.env.PROJECT_NAME + '-frontend-' + process.env.RELEASE_NAME + '-' + dateFormat(now, 'yyyymmdd') + '-build-' + number + '-' + build_type;
    var lastName = '-Rev-' + process.env.COMMIT_ID;
    process.env.FOLDER_ZIP = firstName + lastName;
	process.env.FOLDER_ZIP_RELEASE = firstName;
};

function delFeBuildVersionFileTask() {
    return del([
        CONFIG_BUILD.dev.path_js + 'fe_build_version.js'
    ]);
};

function delFeBuildVersionFileDeployTask() {
    return del([
        CONFIG_BUILD.prod.path_js + 'fe_build_version.js'
    ]);
};

function makeBuildFeInfoTask() {
    var json = JSON.stringify({});

    return b2v.stream(new Buffer(json), 'fe_build_version.js')
        .pipe(ngConfig('linear', {
            createModule: false,
            constants: {
                FE_BUILD: {
                    commit_id: process.env.COMMIT_ID || '',
                    branch: process.env.BRANCH || '',
                    name: process.env.PROJECT_NAME,
                    time: process.env.BUILD_TIME,
                    build_number: process.env.MAJOR + '.' + process.env.MINOR + '.' + process.env.POINT,
                    build_type: process.env.BUILD_TYPE
                }
            }
        }))
        .pipe(gulp.dest(CONFIG_BUILD.dev.path_js));
};

function makeBuildFeInfoDeployTask() {
    var json = JSON.stringify({});

    return b2v.stream(new Buffer(json), 'fe_build_version.js')
        .pipe(ngConfig('linear', {
            createModule: false,
            constants: {
                FE_BUILD: {
                    commit_id: process.env.COMMIT_ID || '',
                    branch: process.env.BRANCH || '',
                    name: process.env.PROJECT_NAME,
                    time: process.env.BUILD_TIME,
                    build_number: process.env.MAJOR + '.' + process.env.MINOR + '.' + process.env.POINT,
                    build_type: process.env.BUILD_TYPE
                }
            }
        }))
        .pipe(gulp.dest(CONFIG_BUILD.prod.path_js));
};

function createVersionFileTask() {
    var contents = 'Build Time: ' + process.env.BUILD_TIME + '\n' +
        'Build Number: ' + process.env.MAJOR + '.' + process.env.MINOR + '.' + process.env.POINT + '\n' +
        'Build Type: ' + process.env.BUILD_TYPE + '\n' +
        'Branch: ' + process.env.BRANCH + '\n' +
        'Git Commit Id: ' + process.env.COMMIT_ID + '\n';

    createFile('deploy/' + process.env.FOLDER_ZIP + '/' + process.env.FOLDER_ZIP_RELEASE + '/version.txt', contents, function(err) {
        if (err) {
            console.log('oh no!', err);
        } else {
            console.log('create file successfully !');
        }
    });
};

function createDeployFolderTask() {
    return gulp.src([
            'build/**/*'
        ])
        .pipe(gulp.dest('deploy/' + process.env.FOLDER_ZIP + '/' + process.env.FOLDER_ZIP_RELEASE + '/build'));
};

function zipBuildFolderTask() {
    var folderName = process.env.FOLDER_ZIP;

    zip.zipFolder({ folderPath: 'deploy/' + folderName }, function(err, path) {
        if (err) {
            console.log(err);
        } else {
            del(['deploy/' + process.env.FOLDER_ZIP]).then(paths => {
                console.log('Deleted folder:', paths.join('\n'));
            });
        }
    });
};

function copyFileToZipFolderTask() {
    return gulp.src([
            'release/*',
            'release/.env',
            'version.txt'
        ])
        .pipe(gulp.dest('deploy/' + process.env.FOLDER_ZIP + '/' + process.env.FOLDER_ZIP_RELEASE + '/'));
};

function commonDeployTask(cb) {
    return runSequence([
            'sass-deploy',
            'copy-images-deploy',
            'copy-views-deploy',
            'copy-views-common-deploy',
            'copy-fonts-deploy',
            'index-deploy'
        ],
        cb);
};

function defaultTask() {
    runSequence('clean', [
            'copy-views',
            'copy-views-common',
            'copy-fonts',
            'copy-images',
            'lint-app:fix',
            'lint-common:fix',
            'index',
            'build-js-vendor',
            'build-js-linear',
            'make-config',
            'make-fe-build-version',
            'sass',
            'vendor-css'
        ],
        'server-dev-start',
        'watch',
        handleNotification);
};

function buildTask(cb) {
    OPTIONS.DO_UGLIFY = true;
    OPTIONS.DO_SOURCEMAPS = false;

    return runSequence(
        'common-deploy',
        'vendor-css-deploy',
        'build-js-vendor-deploy',
        'build-js-linear-deploy',
        'make-config-deploy',
        'make-fe-build-version-deploy',
        cb);
};

function deployTask(cb) {
    OPTIONS.DO_UGLIFY = true;
    OPTIONS.DO_SOURCEMAPS = false;

    return runSequence(
        'build',
        'unit-tests',
        'zip-build-folder',
        cb);
};