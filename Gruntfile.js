const webpackConfig = require('./webpack.config');

var serveStatic = require('serve-static');

var mountFolder = function (dir) {
  return serveStatic(require('path').resolve(dir));
};

var replaceInFile = function(fromText, toText, path){
    require("replace")({
        regex: fromText,
        replacement: toText,
        paths: [path],
        recursive: true,
        silent: false,
    });
};
 

module.exports = function(grunt) {

    var packageConfig = grunt.file.readJSON('package.json');

    //Initialize grunt config
    grunt.initConfig({
        'pkg': packageConfig,
        'clean': {
            prod: {
                options: {
                    force: true
                },
                src: [
                    '<%= pkg.paths.electron %>/*',
                    '<%= pkg.paths.web %>/*'
                ]
            },
            dev: {
                options: {
                    force: true
                },
                src: [
                    '<%= pkg.paths.static %>/*'
                ]
            }    
        },
        'copy': {
            prod: {
                files: [
                    {
                        flatten: true,
                        src: ['./index.web.html'],
                        dest: '<%= pkg.paths.web %>/index.html'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: ['<%= pkg.paths.static %>/assets/*'],
                        dest: '<%= pkg.paths.web %>/assets/',
                        filter: 'isFile'
                    },
                    {
                        flatten: true,
                        src: ['./index.desktop.html'],
                        dest: '<%= pkg.paths.electron %>/index.html'
                    },
                    {
                        flatten: true,
                        src: ['./electron.js'],
                        dest: '<%= pkg.paths.electron %>/electron.js'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: ['<%= pkg.paths.static %>/assets/*'],
                        dest: '<%= pkg.paths.electron %>/assets/',
                        filter: 'isFile'
                    }
                    
                ]
            },
            dev: {
                files: [
                    {
                        flatten: true,
                        src: ['./index.web.html'],
                        dest: '<%= pkg.paths.static %>/index.web.html'
                    },
                    {
                        flatten: true,
                        src: ['./index.desktop.html'],
                        dest: '<%= pkg.paths.static %>/index.desktop.html'
                    },
                    {
                        flatten: true,
                        src: ['./electron.js'],
                        dest: '<%= pkg.paths.static %>/electron.js'
                    }
                ]
            }
        },
        'webpack': {
            dist: webpackConfig
         },
         'env' : {
            dev : {
                NODE_ENV : 'development'
               
            },
            prod : {
                NODE_ENV : 'production'
                
            }
         },
        'webpack-dev-server': {
            options: {
                webpack: webpackConfig
            },
            start: {
                keepAlive: true
            }
        },
        'connect': {
            options: {
                port: 3000
            },
            prod: {
                options: {
                    keepalive: true,
                    middleware: function () {
                        return [
                            mountFolder('<%= pkg.paths.web %>')
                        ];
                    }
                }
            }
        },
        'open': {
            options: {
                delay: 500
            },
            dev: {
                path: 'http://localhost:<%= connect.options.port %>/webpack-dev-server/index.web.html'
            },
            dev_electron: {
                path: 'http://localhost:<%= connect.options.port %>/index.desktop.html'
            }
        },
        'exec': {
            launch_nw: '/Applications/nwjs.app/Contents/MacOS/nwjs .',
            launch_electron: 'electron <%= pkg.paths.static %>/electron.js',
            launch_webpack_dev_server: 'node ./node_modules/webpack-dev-server/bin/webpack-dev-server.js'
        },
        'concurrent': {
            nw: {
                tasks: ['watch', 'exec:launch_nw'],
                options: {
                logConcurrentOutput: true
                }
            },
            electron: {
                tasks: ['exec:launch_electron'],
                options: {
                logConcurrentOutput: true
                }
            }
        }
    });

    //load npm tasks
    grunt.registerTask('serve-web', function (target) {
        if (target === 'prod') {
            return grunt.task.run(['build-prod', 'open:prod', 'connect:prod']);
        }

        grunt.task.run([
            'open:dev',
            //'webpack-dev-server',
            'exec:launch_webpack_dev_server'
        ]);
    });

    grunt.registerTask('serve-electron', function () {
        grunt.task.run([
        'concurrent:electron'
        ]);
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-webpack');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-env');
    grunt.loadNpmTasks('grunt-open');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-concurrent');

    grunt.registerTask('overwrite-file',function(){
        var electronFilePath = packageConfig.paths.electron + '/electron.js';
        replaceInFile('index.desktop.html','index.html',electronFilePath);
    });

    //Register custom tasks
    grunt.registerTask('build-dev', ['env:dev','clean:dev','webpack','copy:dev']);
    grunt.registerTask('build-prod',['env:prod','clean:prod', 'webpack','copy:prod','overwrite-file']);

    
    
};