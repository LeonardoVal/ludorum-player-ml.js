/** # Game classifier

A game classifier is a classifier that takes its inputs from a game state and a player. The outputs
(classes) can be different concepts, depending on the way the classifier is meant to be used.
*/
var GameClassifier = exports.GameClassifier = declare({
	/** The base `GameClassifier` type is not meant to be used, but rather to be extended. The base
	constructor may take the following arguments:
	*/
	constructor: function GameClassifier(args) {
		initialize(this, args)
		/** + `gameModel`: the game model that defines features and classes for the games to be 
			classified. 
		*/
			.object('gameModel', { ignore: true })
		/** + `classes` is a list of values, each belonging to one of the classes in which the 
			game states are supposed to be classified.
		*/
			.array('classes', { ignore: true })
		/** + `random`: a pseudo-random number generator, as a `base.Randomness` instance.
		*/
			.object('random', { ignore: true })
		;
	},

	/** The `gameModel` is used to calculate features and other information from game states.
	*/
	gameModel: null,

	/** No classes are defined by default. */
	classes: [],

	/** The default value for `random` is the default is the default `base.Randomness` singleton.
	This is not seeded. It is adviced to change this when performing simulations or training.
	*/
	random: base.Randomness.DEFAULT,

	// ## Classification ##########################################################################

	/** The base implementation returns a class at random. Only useful for testing purposes.
	*/
	classify: function classify(game, player) {
		return this.classify_randomMatch(game, player);
	},

	/** Simple classification that returns the first class that matches the `game` state.
	*/
	classify_firstMatch: function classify_firstMatch(game, player) {
		var matches = this.matches(game, player);
		return matches.length > 0 ? matches[0] : null;
	},

	classify_randomMatch: function classify_randomMatch(game, player) {
		var matches = this.matches(game, player);
		return matches.length > 0 ? this.random.choice(matches) : null;
	},

	// ## Matching ################################################################################

	/** Although the function of a classifier is to choose one and only one class for a given game
	state, sometimes it may be useful to know whether many classes can apply. The `matches` method
	returns a list of classes that may apply to the given `game` state. By default it returns all
	possible classes.
	*/
	matches: function matches(game, player) {
		return this.classes;
	},

	/** If the `evaluate` method is implemented, the `match_bestEvaluated` method returns an array
	with the best evaluated classes.
	*/
	match_bestEvaluated: function match_bestEvaluated(game, player) {
		var classes = this.classes;
		return iterable(this.evaluate(game, player)).greater(function (clazz) {
			return clazz[1];
		}).map(function (clazz) {
			return classes[clazz[0]];
		});
	},

	// ## Evaluation ##############################################################################

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

	/** The normalization makes the evaluations for all classes fit in the [0,1] range.
	*/
	normalizedEvaluate: function normalizedEvaluate(game, player) {
		var evals = iterable(this.evaluate(game, player)),
			min = +Infinity,
			max = -Infinity,
			count = 0;
		evals.forEachApply(function (c, v) {
			if (min > v) {
				min = v;
			}
			if (max < v) {
				max = v;
			}
			count++;
		});
		var d = max - min;
		return evals.mapApply(function (c, v) {
			return [c, (v - min) / (d || max || 1) / count];
		}).toArray();
	},

	// ## Players #################################################################################

	/** An `actionClassifier` is a game classifier that uses the game's possible actions as the
	classes into which classify any game state.
	*/
	'static actionClassifier': function actionClassifier(members) {
		var gameModel = members.gameModel || this.prototype.gameModel;
		raiseIf(!gameModel, 'Game model not provided!');
		members = base.copy({}, members, {
				classes: gameModel.actionClasses(),
				
				/** The player used by an action classifier is `ActionClassifierPlayer` by default.
				*/
				player: function player(params) {
					params = base.copy({}, params, { classifier: this });
					return new ActionClassifierPlayer(params);
				}
			});
		return declare(this, members);
	},

	/** An `resultClassifier` is a game classifier that uses the game's possible results as the
	classes into which classify any game state.
	*/
	'static resultClassifier': function resultClassifier(members) {
		var gameModel = members.gameModel || this.prototype.gameModel;
		raiseIf(!gameModel, 'Game model not provided!');
		members = base.copy({}, members, {
				classes: gameModel.resultClasses(),
				
				/** The player used by an action classifier is `ActionClassifierPlayer` by default.
				*/
				player: function player(params) {
					params = base.copy({}, params, { classifier: this });
					if (params.hasOwnProperty('horizon')) {
						params.heuristic = ResultClassifierPlayer.heuristic.bind(null, this);
						return new ludorum.players.AlphaBetaPlayer(params);
					}
					return new ResultClassifierPlayer(params);
				}
			});
		return declare(this, members);
	},

}); // declare GameClassifier
