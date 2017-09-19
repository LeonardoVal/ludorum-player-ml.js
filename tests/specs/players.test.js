define(['creatartis-base', 'ludorum', 'ludorum-player-ml'], function (base, ludorum, ludorum_player_ml) {
	var declare = base.declare,
		Iterable = base.Iterable,
		Match = ludorum.Match,
		GameModel = ludorum_player_ml.GameModel,
		GameClassifier = ludorum_player_ml.GameClassifier;

	var TicTacToeGameModel = declare(GameModel, {
		constructor: function TicTacToeGameModel(game) {
			GameModel.call(this, game || new ludorum.games.TicTacToe());
		},

		__actionClasses__: [0,1,2,3,4,5,6,7,8],

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

	var TICTACTOE_MODEL = new TicTacToeGameModel();

	function randomClassifier(ClassifierType) {
		var random = ClassifierType.prototype.random,
			parameters = ClassifierType.prototype.parameterRanges.map(function (r) {
				return random.random(r.min, r.max);
			});
		return new ClassifierType(parameters);
	}

	describe("LinearClassifier", function () { ////////////////////////////////////////////////////
		var LinearClassifier = ludorum_player_ml.LinearClassifier,
			ActionClassifierPlayer = ludorum_player_ml.ActionClassifierPlayer,
			ResultClassifierPlayer = ludorum_player_ml.ResultClassifierPlayer;

		it("is properly configured", function () {
			expect(typeof LinearClassifier).toBe('function');
			expect(LinearClassifier.prototype instanceof GameClassifier).toBe(true);
		});

		it("with ActionClassifierPlayer", function (done) {
			var ActionLinearClassifier = LinearClassifier.actionClassifier(TICTACTOE_MODEL);
			expect(ActionLinearClassifier.prototype instanceof LinearClassifier).toBe(true);
			var linearClassifier = randomClassifier(ActionLinearClassifier);
			expect(linearClassifier instanceof ActionLinearClassifier).toBe(true);
			var player = new ActionClassifierPlayer({ classifier: linearClassifier }),
				match = new Match(TICTACTOE_MODEL.game, [player, player]);
			match.run().then(function () {
				expect(match.result()).toBeTruthy();
				done();
			});
		});

		it("with ResultClassifierPlayer", function (done) {
			var ResultLinearClassifier = LinearClassifier.resultClassifier(TICTACTOE_MODEL);
			expect(ResultLinearClassifier.prototype instanceof LinearClassifier).toBe(true);
			var linearClassifier = randomClassifier(ResultLinearClassifier);
			expect(linearClassifier instanceof ResultLinearClassifier).toBe(true);
			var player = new ResultClassifierPlayer({ classifier: linearClassifier }),
				match = new Match(TICTACTOE_MODEL.game, [player, player]);
			match.run().then(function () {
				expect(match.result()).toBeTruthy();
				done();
			});
		});
	}); //// LinearClassifier

}); //// define.
