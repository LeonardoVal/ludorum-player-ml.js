define(['creatartis-base', 'ludorum', 'ludorum-player-ml'], function (base, ludorum, ludorum_player_ml) {
	var declare = base.declare,
		Iterable = base.Iterable,
		Match = ludorum.Match,
		GameModel = ludorum_player_ml.GameModel,
		GameClassifier = ludorum_player_ml.GameClassifier;

	var TICTACTOE_MODEL = new ludorum_player_ml.examples.TicTacToeGameModel();

	describe("LinearGameClassifier", function () { ////////////////////////////////////////////////////
		var LinearGameClassifier = ludorum_player_ml.LinearGameClassifier,
			ActionClassifierPlayer = ludorum_player_ml.ActionClassifierPlayer,
			ResultClassifierPlayer = ludorum_player_ml.ResultClassifierPlayer;

		it("is properly configured", function () {
			expect(typeof LinearGameClassifier).toBe('function');
			expect(LinearGameClassifier.prototype instanceof GameClassifier).toBe(true);
		});

		it("with ActionClassifierPlayer", function (done) {
			var ActionLinearClassifier = LinearGameClassifier.actionClassifier(TICTACTOE_MODEL);
			expect(ActionLinearClassifier.prototype instanceof LinearGameClassifier).toBe(true);
			var linearGameClassifier = ActionLinearClassifier.randomClassifier();
			expect(linearGameClassifier instanceof ActionLinearClassifier).toBe(true);
			var player = new ActionClassifierPlayer({ classifier: linearGameClassifier }),
				match = new Match(TICTACTOE_MODEL.game, [player, player]);
			match.run().then(function () {
				expect(match.result()).toBeTruthy();
				done();
			});
		});

		it("with ResultClassifierPlayer", function (done) {
			var ResultLinearClassifier = LinearGameClassifier.resultClassifier(TICTACTOE_MODEL);
			expect(ResultLinearClassifier.prototype instanceof LinearGameClassifier).toBe(true);
			var linearGameClassifier = ResultLinearClassifier.randomClassifier();
			expect(linearGameClassifier instanceof ResultLinearClassifier).toBe(true);
			var player = new ResultClassifierPlayer({ classifier: linearGameClassifier }),
				match = new Match(TICTACTOE_MODEL.game, [player, player]);
			match.run().then(function () {
				expect(match.result()).toBeTruthy();
				done();
			});
		});
	}); //// LinearGameClassifier

}); //// define.
