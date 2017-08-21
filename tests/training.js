/** # Training

*/
var capataz_inveniemus = require('capataz-inveniemus'),
	inveniemus = require('inveniemus'),
	capataz = require('capataz'),
	ludorum = require('ludorum'),
	base = require('creatartis-base'),
	Sermat = require('sermat'),
	ludorum_player_ml = require('../build/ludorum-player-ml.js');

var problemBuilder = function (base, inveniemus, ludorum, ludorum_player_ml) {
	// Import synonyms
	var declare = base.declare,
		Iterable = base.Iterable,
		Randomness = base.Randomness,
		Problem = inveniemus.Problem,
		GeneticAlgorithm = inveniemus.metaheuristics.GeneticAlgorithm,
		TicTacToe = ludorum.games.TicTacToe,
		RandomPlayer = ludorum.players.RandomPlayer,
		Measurement = ludorum.tournaments.Measurement,
		GameModel = ludorum_player_ml.GameModel,
		LinearClassifier = ludorum_player_ml.LinearClassifier,
		ActionClassifierPlayer = ludorum_player_ml.ActionClassifierPlayer,
		ResultClassifierPlayer = ludorum_player_ml.ResultClassifierPlayer;

	var TicTacToeGameModel = declare(GameModel, {
		constructor: function TicTacToeGameModel(game) {
			GameModel.call(this, game);
		},

		__possibleActions__: [0,1,2,3,4,5,6,7,8],

		__featureRanges__: Iterable.repeat({ min: -1, max: 1 }, 9).toArray(),

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

	var TrainingProblem = declare(Problem, {
		random: Randomness.DEFAULT,
		objectives: [+Infinity],

		constructor: function TrainingProblem(params) {
			var precision = this.precision = params.precision || 100;
			this.ClassifierType = params.ClassifierType;
			var parameterRanges = this.ClassifierType.prototype.parameterRanges,
				game = this.ClassifierType.prototype.gameModel.game;
			Problem.call(this, Object.assign(params, {
				title: "TrainingProblem for "+ this.ClassifierType,
				description: "Training method based on inveniemus for "+ this.ClassifierType,
				elementModel: parameterRanges.map(function (range) {
					return { n: (range.max - range.min) * precision + 1 };
				})
			}));
		},

		mapping: function mapping(element) {
			var precision = this.precision,
				parameterRanges = this.ClassifierType.prototype.parameterRanges,
				params = Iterable.zip(element.values(), parameterRanges)
				.mapApply(function (v, r) {
					return Math.max(r.min, Math.min(r.max,
						v / precision * (r.max - r.min) + r.min));
				}).toArray();
			return new this.ClassifierType(params);
		},

		evaluation: function evaluation(element) {
			var playerName = 'ElementPlayer',
				game = this.ClassifierType.prototype.gameModel.game,
				classifier = this.mapping(element),
				player = classifier.player({ name: playerName }),
				opponents = [new RandomPlayer({ name: 'RandomPlayer' })]
				tournament = new Measurement(game, [player], opponents, 30);
			return tournament.run().then(function () {
				var stats = tournament.statistics;
				return [stats.average({ key: 'results', player: playerName })];
			});
		}
	}); // declare TrainingProblem

	return new TrainingProblem({
		ClassifierType: LinearClassifier.actionClassifier(
			new TicTacToeGameModel(new TicTacToe())
		)
		/*ClassifierType: LinearClassifier.resultClassifier(
			new TicTacToeGameModel(new TicTacToe()), [-1,+1]
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
