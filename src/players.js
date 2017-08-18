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
			classes = classifier.classes,
			selected = iterable(classifier.evaluate(game, role)).filter(function (c) {
					return validMoves.indexOf(classes[c[0]]) >= 0;
				}).greater(function (c) {
					return c[1];
				}).map(function (c) {
					return classes[c[0]];
				});
		return classifier.random.choice(selected);
	}
}); // declare ActionClassifierPlayer
