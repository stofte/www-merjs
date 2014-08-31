var saveLicense = require('uglify-save-license');

module.exports = function(grunt) {
	'use strict';

	var conf = {
		connect: {
			server: {
				options: {
					port: 80,
					base: 'src',
					keepalive: true
				}
			}
		},
		uglify: {
			options: {
				preserveComments: 'some'
			},
			production: {
				files: {
					'www/min.js': [
						'src/StackBlur.js',
						'src/font-detect.js',
						'src/guid.js',
						'src/client.js',
						'src/js.js'
					]
				}
			}
		}		

	};

	grunt.initConfig(conf);
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-uglify');
};
