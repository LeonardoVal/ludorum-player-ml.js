/** # Training

*/
"use strict";
require('source-map-support').install();

var capataz_inveniemus = require('capataz-inveniemus'),
	inveniemus = require('inveniemus'),
	capataz = require('capataz'),
	ludorum = require('ludorum'),
	base = require('creatartis-base'),
	ludorum_player_ml = require('../build/ludorum-player-ml.js');

var problemBuilder = function problem(inveniemus, ludorum_player_ml) {
	var TicTacToeGameModel = ludorum_player_ml.games.tictactoe.TicTacToeGameModel,
		TrainingProblem = ludorum_player_ml.training
			.getParametricalGameClassifierOptimizationProblem(inveniemus);

	return new TrainingProblem({
		matchCount: 30,
		ClassifierType: ludorum_player_ml.classifiers.LinearGameClassifier.actionClassifier(
			new TicTacToeGameModel()
		)/*,
		ClassifierType: ludorum_player_ml.LinearGameClassifier.resultClassifier(
			new TicTacToeGameModel(), [-1,+1]
		)*/
	});
};
problemBuilder.dependencies = ['inveniemus', 'ludorum-player-ml'];

(function main() {
	var server = capataz.Capataz.run({
		port: 8088,
		workerCount: 2,
		desiredEvaluationTime: 2000, // 2 seconds.
		customFiles: [
			{ module: ludorum_player_ml },
			{ module: ludorum }
		],
		logFile: base.Text.formatDate(null, '"./tests/logs/ludorum_player_ml-"yyyymmdd-hhnnss".txt"')
	});

	return capataz_inveniemus.distributeEvaluation({
		server: server,
		problemBuilder: problemBuilder,
		problemDependencies: ['inveniemus', 'ludorum-player-ml'],
		mh: problemBuilder(inveniemus, ludorum_player_ml).geneticAlgorithm(),
		imports: ['problem'],
		fun: (function (problem, element) {
			return problem.evaluation(element);
		})
	});
})();
