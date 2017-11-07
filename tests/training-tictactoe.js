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

var problemBuilder = function (inveniemus, ludorum_player_ml) {
	var training = ludorum_player_ml.training.init(inveniemus),
		TicTacToeGameModel = ludorum_player_ml.examples.TicTacToeGameModel;

	return new training.TrainingProblem({
		matchCount: 30,
		ClassifierType: ludorum_player_ml.LinearClassifier.actionClassifier(
			new TicTacToeGameModel()
		)/*,
		ClassifierType: ludorum_player_ml.LinearClassifier.resultClassifier(
			new TicTacToeGameModel(), [-1,+1]
		)*/
	});
}; // problemBuilder()

(function main() {
	var server = capataz.Capataz.run({
		port: 8088,
		workerCount: 2,
		desiredEvaluationTime: 2000, // 2 seconds.
		customFiles: './tests/lib',
		logFile: base.Text.formatDate(null, '"./tests/logs/ludorum_player_ml-"yyyymmdd-hhnnss".txt"')
	});
	server.expressApp.get(server.config.staticRoute +'/problem.js', function (request, response) {
		response.send("define("+ JSON.stringify(['inveniemus', 'ludorum-player-ml']) +", "+
			problemBuilder +');'
		);
	});

	return capataz_inveniemus.distributeEvaluation({
		server: server,
		mh: problemBuilder(inveniemus, ludorum_player_ml).geneticAlgorithm(),
		imports: ['problem'],
		fun: (function (problem, element) {
			return problem.evaluation(element);
		})
	});
})();
