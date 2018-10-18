/** Gruntfile for [ludorum-player-ml.js](https://github.com/LeonardoVal/ludorum-player-ml.js).
*/
module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
	});

	require('@creatartis/creatartis-grunt').config(grunt, {
		sourceNames: ['__prologue__',
			// core
				'GameModel',
				'GameClassifier',
			// classifiers
				'classifiers/ParametricalGameClassifier',
				'classifiers/LinearGameClassifier',
				'classifiers/RuleBasedGameClassifier',
			// players
				'players/ActionClassifierPlayer',
				'players/ResultClassifierPlayer',
			// games
				'games/tictactoe',
			// training 
				'training/ParametricalGameClassifierOptimizationProblem',
			'__epilogue__'],
		deps: [
			{ id: 'creatartis-base', name: 'base' },
			{ id: 'sermat', name: 'Sermat',
				path: 'node_modules/sermat/build/sermat-umd.js' },
			{ id: 'ludorum' },
			{ id: 'ludorum-game-mancala', dev: true, module: false,
		 		path: 'node_modules/@creatartis/ludorum-game-mancala/build/ludorum-game-mancala.js' }
		]
	});

	grunt.registerTask('default', ['build']);
};
