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

var problemBuilder = function (base, inveniemus, ludorum, ludorum_player_ml, mancala) {
	var training = ludorum_player_ml.training.init(inveniemus);

	var MancalaGameModel = base.declare(ludorum_player_ml.GameModel, {
		constructor: function MancalaGameModel(game) {
			ludorum_player_ml.GameModel.call(this, game || new mancala.Mancala());
			this.__actionClasses__ = this.game.houses(this.game.players[0]);
			this.__seedCount__ = base.iterable(this.game.board).sum();
			this.__featureRanges__ = base.Iterable.repeat({ min: -1, max: +1 },
				this.game.board.length).toArray();
		},

		actionForClass: function actionForClass(clazz, game, role) {
			return role === game.players[0] ? clazz : clazz + game.board.length / 2;
		},

		features: function features(game, player) {
			var factor = player === game.players[0] ? +1 : -1,
				seedCount = this.__seedCount__,
				board = game.board;
			return board.map(function (sq, i) {
				return ((i < board.length / 2) ? factor : -factor) * sq / seedCount;
			});
		}
	}); // declare TicTacToeGameModel

	return new training.TrainingProblem({
		opponents: ['random', 'mmab2', 'mmab4', 'mcts10', 'mcts50'],
		matchCount: 4,
		ClassifierType: ludorum_player_ml.LinearClassifier.actionClassifier(
			new MancalaGameModel()
		)
		/*ClassifierType: ludorum_player_ml.LinearClassifier.resultClassifier(
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
		response.send("define("+ JSON.stringify(['creatartis-base', 'inveniemus', 'ludorum',
			'ludorum-player-ml', 'ludorum-game-mancala']) +", "+ problemBuilder +');'
		);
	});
	var problem = problemBuilder(base, inveniemus, ludorum, ludorum_player_ml, mancala);
	console.log('Opponents: '+ Sermat.ser(problem.opponents, { mode: Sermat.BASIC_MODE })
		.replace(/(\[|\}\),?)/g, '$1\n\t'));
	return capataz_inveniemus.distributeEvaluation({
		server: server,
		mh: problem.geneticAlgorithm({ size: 100, steps: 25 }),
		imports: ['problem'],
		fun: (function (problem, element) {
			return problem.evaluation(element);
		})
	});
})();
