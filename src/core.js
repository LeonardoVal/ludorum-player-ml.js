/** # Core definitions.


*/

/** ## Game model ##################################################################################

A game model provides the necessary metadata to process the state of a game with a classifier.
*/
var GameModel = exports.GameModel = declare({
	constructor: function GameModel(game) {
		this.game = game;
	},

	/** Classifiers that use the game's actions as classes must know the set of all possible
	actions that any player can make in any possible game state.
	*/
	possibleActions: function possibleActions() {
		return this.__possibleActions__;
	},

	/** Classifiers that use the game's results as classes must know the set of all posible results
	that any possible match can end with for all players.
	*/
	__possibleResults__: [-1, 0, 1],

	possibleResults: function possibleResults() {
		return this.__possibleResults__;
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

/** ## Game classifier #############################################################################

A game classifier is a classifier that takes its inputs from a game state and a player. The outputs
(classes) can be different concepts, depending on the way the classifier is meant to be used.
*/
var GameClassifier = exports.GameClassifier = declare({
	/** All classifiers are defined by a list of numerical `parameters`.
	*/
	constructor: function Classifier(parameters) {
		var parameterRanges = this.parameterRanges;
		raiseIf(parameters.length !== parameterRanges.length, "Expected ", parameterRanges.length,
			" parameters, but got ", parameters.length, "!");
		Iterable.zip(parameters, parameterRanges).forEachApply(function (p, r, i) {
			raiseIf(p < r.min || p > r.max, "Value ", p, " for parameter ", i, " not in range [",
				r.min, ",", r.max, "]!");
		});
	},

	/** The base `GameClassifier` type is not meant to be used, but rather to be extended. Subtypes
	must provide three definitions in their prototypes:

		+ `gameModel` is used to calculate features and other information from game states.
	*/
	gameModel: null,

	/**	+ `parameterRanges` is a list of ranges (e.g. `{min:0, max:1}`) for the parameters
		required to build a classifier of this type.
	*/
	parameterRanges: [],

	/**	+ `classes` is a list of values, each belonging to one of the classes in which the game
		states are supposed to be classified.
	*/
	classes: [null],

	/** All classifiers may need a pseudo-random number generator in one way or another.
	*/
	random: base.Randomness.DEFAULT,

	/** To `evaluate` a classifier is to calculate a list of pairs `[class, n]`, where `n` is a
	numerical evaluation of the membership of the given `game` state to the corresponding `class`.
	The greater the evaluation, the most likely the game state is to belong to the class.
	*/
	evaluate: function evaluate(game, player) {
		var random = this.random;
		return this.classes.map(function (clazz) {
			return [clazz, random.random()];
		});
	},

	/** To `classify` a `game` state is to pick the class with greater evaluation. If more than one
	has the greatest evaluation, one of these is chosen at random.
	*/
	classify: function classify(game, player) {
		var classes = this.classes,
			selected = iterable(this.evaluate(game, player)).greater(function (clazz) {
				return clazz[1];
			}).map(function (clazz) {
				return classes[clazz[0]];
			});
		return this.random.choice(selected);
	},

	/** An `actionClassifier` is a game classifier that uses the game's possible actions as the
	classes into which classify any game state.
	*/
	'static actionClassifier': unimplemented('GameClassifier', 'static actionClassifier(gameModel)')
}); // declare GameClassifier