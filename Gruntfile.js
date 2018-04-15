/** Gruntfile for [ludorum-player-ml.js](https://github.com/LeonardoVal/ludorum-player-ml.js).
*/
module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
	});

	require('creatartis-grunt').config(grunt, {
		sourceNames: ['__prologue__',
			// game models
				'GameModel', 
				'models/TicTacToeGameModel',
			// classifiers
				'GameClassifier', 
				'classifiers/ParametricalGameClassifier',
				'classifiers/LinearGameClassifier',
			// players
				'players/ActionClassifierPlayer',
				'ṕlayers/ResultClassifierPlayer',
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
