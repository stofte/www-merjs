module.exports = function(grunt) {
	'use strict';

	var jsfiles = [
		'src/StackBlur.js',
		'src/font-detect.js',
		'src/guid.js',
		'src/client.js',
		'src/js.js'
	];
	var cssfiles = [ 'src/css.css' ];

	var conf = {
		connect: {
			src: {
				options: {
					port: 80,
					base: 'src',
					keepalive: true
				}
			},
			www: {
				options: {
					port: 80,
					base: 'www',
					keepalive: true
				}
			}
		},
		uglify: {
			options: {
				compress: false,
				preserveComments: 'some'
			},
			'prod-test': {
				files: {
					'src/js.min.js': jsfiles
				}
			},
			'prod-debug': {
				options: { compress: false },
				files: {
					'www/js.min.js': jsfiles
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
		// prod-debug option to run full JS on aws
		copy: {
			'prod-debug': {
				files: [
					{
						expand: true,
						dest: 'www',
						cwd: 'src',
						src: ['*.js', '*.css', '*.woff', '*.woff2']
					}
				]
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
			'prod-debug': {
				options: {
					pretty: true,
					data: {
						env: 'prod-debug'
					}
				},
				files: { 'www/index.html': 'src/index.jade' }
			}			,
			'prod': {
				options: {
					data: {
						env: 'prod'
					}
				},
				files: { 'www/index.html': 'src/index.jade' }
			}
		},
		clean: ['www']
	};

	grunt.initConfig(conf);
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-jade');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');

	// dev == localhost
	grunt.registerTask('dev', ['jade:dev']);
	// prod-test == localhost with minified content
	grunt.registerTask('prod-test', ['cssmin:prod-test', 'uglify:prod-test', 'jade:prod-test']);
	grunt.registerTask('prod-debug', ['clean', 'copy:prod-debug', 'jade:prod-debug']);
	// prod === aws
	grunt.registerTask('prod', ['clean','cssmin:prod', 'uglify:prod', 'jade:prod']);

};
