/** # Players

Players based on classifiers can be built in many ways, and also combined with other algorithms like
MCTS or MiniMax.
*/

/** ## Action classifier player ####################################################################

`ActionClassifierPlayer`s are simple players that use the given classifier to directly choose the
action to make. The game `classifier` must be set up to use the game's possible actions as the
classes into which classify any game state.
*/
var ActionClassifierPlayer = exports.ActionClassifierPlayer = declare(Player, {
	constructor: function ActionClassifierPlayer(params) {
		Player.call(this, params);
		this.classifier = params.classifier;
	},

	/** To make a `decision`, the given `game` state is evaluated by the player's `classifier`. All
	non-viable actions are removed. The best evaluated viable actions is selected. If more than one
	has the best score, one of the best evaluated is selected randomly.
	*/
	decision: function decision(game, role) {
		var validMoves = game.moves()[role],
			classifier = this.classifier,
			gameModel = classifier.gameModel,
			classes = classifier.classes,
			selected = iterable(classifier.evaluate(game, role)).map(function (c) {
					return [gameModel.customizeAction(classes[c[0]], game, role), c[1]];
				}).filter(function (c) {
					return validMoves.indexOf(c[0]) >= 0;
				}).greater(function (c) {
					return c[1];
				}).map(function (c) {
					return c[0];
				});
		return classifier.random.choice(selected);
	}
}); // declare ActionClassifierPlayer

/** ## Result classifier player ####################################################################

`ResultClassifierPlayer`s are simple players that use the given classifier to directly choose the
action to make. The game `classifier` must be set up to use the game's possible actions as the
classes into which classify any game state.
*/
var ResultClassifierPlayer = exports.ResultClassifierPlayer = declare(HeuristicPlayer, {
	constructor: function ResultClassifierPlayer(params) {
		HeuristicPlayer.call(this, params);
		this.classifier = params.classifier;
	},

	/** Heuristic functions based on result classifiers return a normalized weighted average of the
	classifier's evaluation. Each class is assumed to have a numerical value.
	*/
	'static heuristic': function (classifier, game, role) {
		var resultBounds = game.resultBounds(),
			divisor = Math.max(Math.abs(resultBounds[0]), Math.abs(resultBounds[1])) * 1.1,
			classes = classifier.classes,
			evals = classifier.normalizedEvaluate(game, role),
			result = iterable(evals).map(function (c) {
				return classes[c[0]] * c[1];
			}).sum() / divisor;
		return result;
	},

	heuristic: function (game, player) {
		return this.constructor.heuristic(this.classifier, game, player);
	}
}); // declare ResultClassifierPlayer

//TODO Move filter with action classifier.
