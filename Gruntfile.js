/** Gruntfile for [ludorum-player-ml.js](https://github.com/LeonardoVal/ludorum-player-ml.js).
*/
module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
	});

	require('creatartis-grunt').config(grunt, {
		sourceNames: ['__prologue__',
				'core', 'players', 'linear-classifiers', 'training',
			'__epilogue__'],
		deps: [
			{ id: 'creatartis-base', name: 'base' },
			{ id: 'sermat', name: 'Sermat',
				path: 'node_modules/sermat/build/sermat-umd.js' },
			{ id: 'ludorum' }
		],
		otherCopy: [
			{ src: 'node_modules/@creatartis/ludorum-game-mancala/build/ludorum-game-mancala.js',
				dest: 'tests/lib/ludorum-game-mancala.js', nonull: true }
		]
	});

	grunt.registerTask('default', ['build']);
};
