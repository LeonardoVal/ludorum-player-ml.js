define(['creatartis-base', 'ludorum', 'ludorum-player-ml'], function (base, ludorum, ludorum_player_ml) {
	var declare = base.declare,
		Iterable = base.Iterable,
		Match = ludorum.Match,
		GameModel = ludorum_player_ml.GameModel,
		GameClassifier = ludorum_player_ml.GameClassifier,
		ActionClassifierPlayer = ludorum_player_ml.players.ActionClassifierPlayer,
		ResultClassifierPlayer = ludorum_player_ml.players.ResultClassifierPlayer;

	var tictactoe = ludorum_player_ml.games.tictactoe;

	describe("LinearGameClassifier", function () { ////////////////////////////////////////////////////
		var LinearGameClassifier = ludorum_player_ml.classifiers.LinearGameClassifier;

		it("is properly configured", function () {
			expect(typeof LinearGameClassifier).toBe('function');
			expect(LinearGameClassifier.prototype instanceof GameClassifier).toBe(true);
		});

		it("with ActionClassifierPlayer", function (done) {
			var ActionLinearClassifier = LinearGameClassifier.actionClassifier(tictactoe.MODEL);
			expect(ActionLinearClassifier.prototype instanceof LinearGameClassifier).toBe(true);
			var linearGameClassifier = ActionLinearClassifier.randomClassifier();
			expect(linearGameClassifier instanceof ActionLinearClassifier).toBe(true);
			var player = new ActionClassifierPlayer({ classifier: linearGameClassifier }),
				match = new Match(tictactoe.MODEL.game, [player, player]);
			match.run().then(function () {
				expect(match.result()).toBeTruthy();
				done();
			});
		});

		it("with ResultClassifierPlayer", function (done) {
			var ResultLinearClassifier = LinearGameClassifier.resultClassifier(tictactoe.MODEL);
			expect(ResultLinearClassifier.prototype instanceof LinearGameClassifier).toBe(true);
			var linearGameClassifier = ResultLinearClassifier.randomClassifier();
			expect(linearGameClassifier instanceof ResultLinearClassifier).toBe(true);
			var player = new ResultClassifierPlayer({ classifier: linearGameClassifier }),
				match = new Match(tictactoe.MODEL.game, [player, player]);
			match.run().then(function () {
				expect(match.result()).toBeTruthy();
				done();
			});
		});
	}); //// LinearGameClassifier


	describe("RuleBasedGameClassifier", function () {
		var RuleBasedGameClassifier = ludorum_player_ml.classifiers.RuleBasedGameClassifier;

		it("with ActionClassifierPlayer", function (done) {
			var player = tictactoe.ruleBasedActionPlayer(),
				match = new Match(tictactoe.MODEL.game, [player, player]);
			match.run().then(function () {
				expect(match.result()).toBeTruthy();
				done();
			});
		});

		it("with ActionClassifierPlayer against RandomPlayer", function (done) {
			var player1 = tictactoe.ruleBasedActionPlayer(),
				player2 = new ludorum.players.RandomPlayer({ name: 'RN' }),
				match = new Match(tictactoe.MODEL.game, [player1, player2]);
			match.run().then(function () {
				expect(match.result()).toBeTruthy();
				//console.log('RB vs '+ player2.name, match.result());//FIXME
				match = new Match(tictactoe.MODEL.game, [player2, player1]);
				match.run().then(function () {
					expect(match.result()).toBeTruthy();
					//console.log(player2.name +' vs RB', match.result());//FIXME
					done();
				});
			});
		});

		it("with ResultClassifierPlayer against RandomPlayer", function (done) {
			var player1 = tictactoe.ruleBasedResultPlayer(),
				player2 = new ludorum.players.RandomPlayer({ name: 'RN' }),
				match = new Match(tictactoe.MODEL.game, [player1, player2]);
			match.run().then(function () {
				expect(match.result()).toBeTruthy();
				//console.log('RB vs '+ player2.name, match.result());//FIXME
				match = new Match(tictactoe.MODEL.game, [player2, player1]);
				match.run().then(function () {
					expect(match.result()).toBeTruthy();
					//console.log(player2.name +' vs RB', match.result());//FIXME
					done();
				});
			});
		});
	}); //// RuleBasedGameClassifier
}); //// define.
