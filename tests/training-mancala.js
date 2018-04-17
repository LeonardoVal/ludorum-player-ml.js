/** # Training

*/
"use strict";
require('source-map-support').install();

var capataz_inveniemus = require('capataz-inveniemus'),
	inveniemus = require('inveniemus'),
	capataz = require('capataz'),
	ludorum = require('ludorum'),
	base = require('creatartis-base'),
	Sermat = require('sermat'),
	ludorum_player_ml = require('../build/ludorum-player-ml.js'),
	mancala = require('@creatartis/ludorum-game-mancala');

var problemBuilder = function (inveniemus, ludorum, ludorum_player_ml, mancala) {
	var MancalaGameModel = base.declare(ludorum_player_ml.GameModel, {
		constructor: function MancalaGameModel(params) {
			params = params || {};
			params.game = params.game || new mancala.Mancala();
			ludorum_player_ml.GameModel.call(this, params);
			this.__featureRanges__ = base.Iterable.repeat({ min: -1, max: +1 },
				params.game.board.length).toArray();
		},

		actionClasses: function actionClasses(game) {
			game = game || this.game;
			return game.houses(game.players[0]);
		},

		actionForClass: function actionForClass(clazz, game, role) {
			return role === game.players[0] ? clazz : clazz + game.board.length / 2;
		},

		featureRanges: function featureRanges() {
			return this.__featureRanges__;
		},

		features: function features(game, player) {
			var factor = player === game.players[0] ? +1 : -1,
				seedCount = base.iterable(game.board).sum(),
				board = game.board;
			return board.map(function (sq, i) {
				return ((i < board.length / 2) ? factor : -factor) * sq / seedCount;
			});
		}
	}); // declare TicTacToeGameModel
	
	var TrainingProblem = ludorum_player_ml.training
		.getParametricalGameClassifierOptimizationProblem(inveniemus);
	return new TrainingProblem({
		opponents: ['random', 'mmab2', 'mmab4' /*, 'mcts10', 'mcts50'*/],
		matchCount: 4,
		ClassifierType: ludorum_player_ml.LinearGameClassifier.actionClassifier(
			new MancalaGameModel()
		)
		/*ClassifierType: ludorum_player_ml.LinearGameClassifier.resultClassifier(
			new TicTacToeGameModel(), [-1,+1]
		)*/
	});
}; // problemBuilder()

(function main() {
	var server = capataz.Capataz.run({
		port: 8088,
		workerCount: 2,
		desiredEvaluationTime: 2000, // 2 seconds.
		customFiles: [
			{ module: ludorum_player_ml },
			{ module: ludorum },
			{ module: mancala }
		],
		logFile: base.Text.formatDate(null, '"./tests/logs/ludorum_player_ml-"yyyymmdd-hhnnss".txt"')
	});
	/* server.expressApp.get(server.config.staticRoute +'/problem.js', function (request, response) {
		response.send("define("+ JSON.stringify(['creatartis-base', 'inveniemus', 'ludorum',
			'ludorum-player-ml', 'ludorum-game-mancala']) +", "+ problemBuilder +');'
		);
	}); */
	var problem = problemBuilder(inveniemus, ludorum, ludorum_player_ml, mancala);
	console.log('Opponents: '+ Sermat.ser(problem.opponents, { mode: Sermat.BASIC_MODE })
		.replace(/(\[|\}\),?)/g, '$1\n\t'));
	return capataz_inveniemus.distributeEvaluation({
		server: server,
		problemBuilder: problemBuilder,
		problemDependencies: ['inveniemus', 'ludorum', 'ludorum-player-ml', 'ludorum-game-mancala'],
		mh: problem.geneticAlgorithm({ size: 100, steps: 25 }),
		imports: ['problem'],
		fun: (function (problem, element) {
			return problem.evaluation(element);
		})
	});
})();
