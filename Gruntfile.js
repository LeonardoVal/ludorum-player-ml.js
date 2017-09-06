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
			{ name: 'creatartis-base', id: 'base',
				path: 'node_modules/creatartis-base/build/creatartis-base.min.js' },
			{ name: 'sermat', id: 'Sermat',
				path: 'node_modules/sermat/build/sermat-umd.js' },
			{ name: 'ludorum', id: 'ludorum',
				path: 'node_modules/ludorum/build/ludorum.js' }
		],
		otherCopy: [
			{ src: 'node_modules/@creatartis/ludorum-game-mancala/build/ludorum-game-mancala.js',
				dest: 'tests/lib/ludorum-game-mancala.js', nonull: true }
		]
	});

	grunt.registerTask('default', ['build']);
};
