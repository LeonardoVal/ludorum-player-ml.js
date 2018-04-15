/** # Result classifier player

`ResultClassifierPlayer`s are simple players that use the given classifier as a heuristic evaluation
of game states.
*/
var ResultClassifierPlayer = players.ResultClassifierPlayer = declare(HeuristicPlayer, {
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
