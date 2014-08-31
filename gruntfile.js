module.exports = function(grunt) {
	'use strict';

	var jsfiles = [
		'src/StackBlur.js',
		'src/font-detect.js',
		'src/guid.js',
		'src/client.js',
		'src/js.js'
	];
	var cssfiles = [ 'src/font.css', 'src/css.css' ];

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
				compress: {
					drop_console: true
				},
				preserveComments: 'some'
			},
			'prod-test': {
				files: {
					'src/js.min.js': jsfiles
				}
			},
			'prod': {
				files: {
					'www/js.min.js': jsfiles
				}
			}
		},
		cssmin: {
			'prod-test': {
				files: {
					'src/css.min.css': cssfiles
				}
			},
			'prod': {
				files: {
					'www/css.min.css': cssfiles
				}
			}
		},
		jade: {
			dev: {
				options: {
					pretty: true,
					data: {
						env: 'dev'
					}
				},
				files: { 'src/index.html': 'src/index.jade' }
			},
			'prod-test': {
				options: {
					data: {
						env: 'prod-test'
					}
				},
				files: { 'src/index.html': 'src/index.jade' }
			},
			'prod': {
				options: {
					data: {
						env: 'prod'
					}
				},
				files: { 'www/index.html': 'src/index.jade' }
			}
		}
	};

	grunt.initConfig(conf);
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-jade');

	// dev == localhost
	grunt.registerTask('dev', ['jade:dev']);
	// prod-test == localhost with minified content
	grunt.registerTask('prod-test', ['cssmin:prod-test', 'uglify:prod-test', 'jade:prod-test']);
	// prod === aws
	grunt.registerTask('prod', ['cssmin:prod', 'uglify:prod', 'jade:prod']);

};
