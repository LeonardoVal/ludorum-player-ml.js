
/** # Game model

A game model provides the necessary metadata to process the state of a game with a classifier.
*/
var GameModel = exports.GameModel = declare({
	constructor: function GameModel(params) {
		initialize(this, params)
		/** TODO
		*/
			.object('game', { ignore: true })
		;
	},

	/** Classifiers that use the game's actions as classes must know the set of all possible
	actions that any player can make in any possible game state. By default, all the actions for
	the active player of the given game instance is used. 
	*/
	actionClasses: function actionClasses(game) {
		game = game || this.game;
		return game.moves()[game.activePlayer()];
	},

	actionForClass: function actionForClass(actionClass, game, role) {
		return actionClass;
	},

	/** Classifiers that use the game's results as classes must know the set of all posible results
	that any possible match can end with for all players. By default, the bounds for the game 
	results and zero are used.
	*/
	resultClasses: function resultClasses(game) {
		game = game || this.game;
		return base.Iterable.chain([0], game.resultBounds()).sorted().toArray();
	},

	resultForClass: function resultForClass(resultClass, game, role) {
		return resultClass;
	},

	/** Classifiers take as inputs a set of features that describe every possible game state. Every
	feature is a number, within a given range. In order to execute a classifier, the list of
	`features` must be calculated from a given `game` state. Usually these values also change
	depending on the perspective of the `player`.
	*/
	features: unimplemented('GameModel', 'feature(game, player)'),

	/** In order to properly build a classifier, the amount of features and their possible values
	(i.e. their ranges) must be known.
	*/
	featureRanges: unimplemented('GameModel', 'featureRanges(game)'),

	// ## Utilities ###############################################################################

	/** Some classifiers use the features as they are calculated. Others may need to normalize
	these values. By default features are normalized in the [0, 1] range.
	*/
	normalizedFeatures: function normalizedFeatures(game, player, min, max) {
		min = isNaN(min) ? 0 : +min;
		max = isNaN(max) ? 1 : +max;
		var d = max - min;
		return Iterable.zip(this.features(game, player), this.featureRanges())
			.mapApply(function (f, r) {
				return (f - r.min) / (r.max - r.min) * d + min;
			}).toArray();
	}
}); // declare GameModel