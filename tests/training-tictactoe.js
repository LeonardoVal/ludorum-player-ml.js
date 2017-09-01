/** # Training

*/
var capataz_inveniemus = require('capataz-inveniemus'),
	inveniemus = require('inveniemus'),
	capataz = require('capataz'),
	ludorum = require('ludorum'),
	base = require('creatartis-base'),
	ludorum_player_ml = require('../build/ludorum-player-ml.js');

var problemBuilder = function (base, inveniemus, ludorum, ludorum_player_ml) {
	var training = ludorum_player_ml.training.init(inveniemus);

	var TicTacToeGameModel = base.declare(ludorum_player_ml.GameModel, {
		constructor: function TicTacToeGameModel(game) {
			ludorum_player_ml.GameModel.call(this, game || new ludorum.games.TicTacToe());
		},

		__possibleActions__: [0,1,2,3,4,5,6,7,8],

		__featureRanges__: base.Iterable.repeat({ min: -1, max: 1 }, 9).toArray(),

		features: function features(game, player) {
			var players = game.players.map(function (p) {
					return p.charAt(0);
				}),
				factor = player === players[0] ? +1 : -1;
			return game.board.split('').map(function (sq) {
				return (sq === players[0]) ? factor : (sq === players[1]) ? -factor : 0;
			});
		}
	}); // declare TicTacToeGameModel

	return new training.TrainingProblem({
		ClassifierType: ludorum_player_ml.LinearClassifier.actionClassifier(
			new TicTacToeGameModel()
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
		response.send("define("+
			JSON.stringify(['creatartis-base', 'inveniemus', 'ludorum', 'ludorum-player-ml'])
			+", "+ problemBuilder +');'
		);
	});
	return capataz_inveniemus.distributeEvaluation({
		server: server,
		mh: new inveniemus.metaheuristics.GeneticAlgorithm({
			problem: problemBuilder(base, inveniemus, ludorum, ludorum_player_ml),
			mutationRate: 0.25,
			size: 25,
			steps: 25
		}),
		imports: ['problem'],
		fun: (function (problem, element) {
			return problem.evaluation(element);
		})
	});
})();
