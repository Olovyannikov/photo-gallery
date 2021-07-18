let project_folder = "build";
let source_folder = "src";

let path = {
    build: {
        html: project_folder + "/",
        css: project_folder + "/css/",
        js: project_folder + "/js/",
        img: project_folder + "/img/",
        fonts: project_folder + "/fonts/"
    },
    src: {
        html: [
            source_folder + "/html/*.html",
            "!" + source_folder + "/**/_*.html",
        ],
        pug: [
            source_folder + "/pug/pages/*.pug",
            "!" + source_folder + "/**/_*.pug",
        ],
        css: source_folder + "/scss/style.scss",
        js: source_folder + "/js/script.js",
        img: source_folder + "/img/**/*.{png,jpeg,jpg,gif,ico,webp,svg}",
        fonts: source_folder + "/fonts/*.{woff,woff2,ttf,svg}",
    },
    watch: {
        html: source_folder + "/**/*.html",
        pug: source_folder + "/**/*.pug",
        css: source_folder + "/scss/**/*.scss",
        js: source_folder + "/js/**/*.js",
        img: source_folder + "/img/**/*.{png,jpeg,jpg,svg,gif,ico,webp}",
    },
    clean: "./" + project_folder + "/",
};

const {src, dest, series, watch} = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const babel = require('gulp-babel');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const cleanCSS = require('gulp-clean-css');
const del = require('del');
const fileInclude = require('gulp-file-include');
const gulpif = require('gulp-if');
const htmlmin = require('gulp-htmlmin');
const image = require('gulp-image');
const notify = require('gulp-notify');
const plumber = require("gulp-plumber");
const pug = require("gulp-pug");
const rev = require('gulp-rev');
const revDel = require('gulp-rev-delete-original');
const revRewrite = require('gulp-rev-rewrite');
const rename = require("gulp-rename");
const sass = require('gulp-sass');
const smartGrid = require("smart-grid");
const sourcemaps = require('gulp-sourcemaps');
const svgSprite = require('gulp-svg-sprite');
const uglify = require('gulp-uglify-es').default;
const webpack = require("webpack");
const webpackStream = require("webpack-stream");
const {readFileSync} = require('fs');

let isProd = true; // dev by default
let isGrid = false; // smartgrid or not

const clean = () => {
    return del(path.clean)
}

//svg sprite
const svgSprites = () => {
    return src([source_folder + "/img/svg/**.svg"])
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: "../sprite.svg" //sprite file name
                }
            },
        }))
        .pipe(dest(path.build.img));
}

const styles = () => {
    return src(path.src.css)
        .pipe(gulpif(!isProd, sourcemaps.init()))
        .pipe(sass().on("error", notify.onError()))
        .pipe(autoprefixer({
            cascade: false,
        }))
        .pipe(
            rename({
                extname: ".min.css",
            })
        )
        .pipe(gulpif(isProd, cleanCSS({level: 2})))
        .pipe(gulpif(!isProd, sourcemaps.write('.')))

        .pipe(dest(path.build.css))
        .pipe(browserSync.stream());
};

const stylesBackend = () => {
    return src(path.src.css)
        .pipe(sass().on("error", notify.onError()))
        .pipe(autoprefixer({
            cascade: false,
        }))
        .pipe(dest(path.build.css))
};

const scripts = () => {
    return src(path.src.js)
        .pipe(
            webpackStream({
                mode: "production",
                output: {
                    filename: "script.js",
                },
                module: {
                    rules: [
                        {
                            test: /\.m?js$/,
                            exclude: /(node_modules|bower_components)/,
                            use: {
                                loader: "babel-loader",
                                options: {
                                    presets: ["@babel/preset-env"],
                                },
                            },
                        },
                    ],
                },
                plugins: [
                    new webpack.ContextReplacementPlugin(
                        /moment[/\\]locale$/,
                        /ru/
                    ),
                ],
            })
        )
        .pipe(dest(path.build.js))
        .pipe(uglify())
        .pipe(
            rename({
                extname: ".min.js",
            })
        )
        .pipe(dest(path.build.js))
        .pipe(browserSync.stream());
}

const resources = () => {
    return src(source_folder + '/assets/**')
        .pipe(dest(project_folder + '/assets'))
}

const fonts = () => {
    return src(source_folder + '/fonts/**')
        .pipe(dest(path.build.fonts))
}

const images = () => {
    return src(path.src.img)
        .pipe(gulpif(isProd, image()))
        .pipe(dest(path.build.img))
};

const pug2html = () => {
    return src(path.src.pug)
        .pipe(
            plumber({
                errorHandler: notify.onError(function (err) {
                    return {
                        title: "Pug",
                        sound: false,
                        message: err.message,
                    };
                }),
            })
        )
        .pipe(
            pug({
                pretty: true,
            })
        )
        .pipe(dest(path.build.html))
        .pipe(browserSync.stream());
}

const watchFiles = () => {
    browserSync.init({
        server: {
            baseDir: "./" + project_folder + "/",
        },
    });

    watch(path.watch.css, styles);
    watch(path.watch.js, scripts);
    //watch('./src/partials/*.html', htmlInclude);
    watch(path.watch.pug, pug2html);
    watch(source_folder + '/assets', resources);
    watch(path.watch.img, images);
    //watch('./src/img/**/*.{jpg,jpeg,png}', images);
    watch(source_folder + '/img/svg/**.svg', svgSprites);
}

const cache = () => {
    return src('build/**/*.{css,js,svg,png,jpg,jpeg,woff2}', {
        base: 'build'
    })
        .pipe(rev())
        .pipe(revDel())
        .pipe(dest('build'))
        .pipe(rev.manifest('rev.json'))
        .pipe(dest('build'));
};

const rewrite = () => {
    const manifest = readFileSync('build/rev.json');
    src('build/css/*.css')
        .pipe(revRewrite({
            manifest
        }))
        .pipe(dest('build/css'));
    return src('build/**/*.html')
        .pipe(revRewrite({
            manifest
        }))
        .pipe(dest('build'));
}

const htmlMinify = () => {
    return src('app/**/*.html')
        .pipe(htmlmin({
            collapseWhitespace: true
        }))
        .pipe(dest('app'));
}

const toProd = (done) => {
    isProd = true;
    done();
};

const grid = (callback) => {
    isGrid = true;
    delete require.cache[require.resolve('./smartgrid.js')];
    let settings = require('./smartgrid.js');
    smartGrid(source_folder + '/scss/vendor', settings);
    callback();
}

exports.default = series(clean, svgSprites, pug2html, scripts, styles, resources, fonts, images, watchFiles);

exports.build = series(toProd, clean, svgSprites, pug2html, scripts, styles, resources, fonts, images);

exports.cache = series(cache, rewrite);

exports.backend = series(toProd, clean, svgSprites, pug2html, stylesBackend, resources, fonts, images);
