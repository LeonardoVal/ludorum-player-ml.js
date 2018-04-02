
/** # Game model

A game model provides the necessary metadata to process the state of a game with a classifier.
*/
var GameModel = exports.GameModel = declare({
	constructor: function GameModel(game) {
		this.game = game;
	},

	/** Classifiers that use the game's actions as classes must know the set of all possible
	actions that any player can make in any possible game state.
	*/
	actionClasses: function actionClasses() {
		return this.__actionClasses__;
	},

	actionForClass: function actionForClass(clazz, game, role) {
		return clazz;
	},

	/** Classifiers that use the game's results as classes must know the set of all posible results
	that any possible match can end with for all players.
	*/
	__resultClasses__: [-1, 0, 1],

	resultClasses: function resultClasses() {
		return this.__resultClasses__;
	},

	resultForClass: function resultForClass(clazz, game, role) {
		return clazz;
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
	featureRanges: function featureRanges() {
		return this.__featureRanges__;
	},

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