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
		},
		cssmin: {
			combine: {
				files: {
					'www/min.css': ['src/font.css', 'src/css.css']
				}
			}
		},
		jade: {
			options: {
				data: {

				},
				pretty: true,
				indentchar: '\t',
			},
			development: {
				options: {
					data: {
						env: 'development',
					}
				},
				files: {
					'src/index.html': 'src/index.jade'
				}								
			}
		}
	};

	grunt.initConfig(conf);
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-jade');
};
