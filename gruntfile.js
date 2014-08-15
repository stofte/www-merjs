module.exports = function(grunt) {
    'use strict';

    var conf = {
        copy: {
            main: {
                expand: true,
                cwd: 'src/',
                dest: 'out/',
                src: '*'
            }
        },
        clean: {
            folder: 'out/*'
        },
        connect: {
            server: {
                options: {
                    port: 80,
                    base: 'client',
                    keepalive: true
                }
            }
        },
        compress: {
            main: {
                options: {
                    archive: 'web_merjs.zip'
                },
                files: [
                    {src: 'www/**', dst: '.'},
                    {src: 'app.js', dst: 'app.js'},
                    {src: 'package.json', dst: 'package.json'}
                ]
            }
        }
    };

    grunt.initConfig(conf);
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-compress');
};