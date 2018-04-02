(function (init) { "use strict";
			if (typeof define === 'function' && define.amd) {
				define(["creatartis-base","sermat","ludorum"], init); // AMD module.
			} else if (typeof exports === 'object' && module.exports) {
				module.exports = init(require("creatartis-base"),require("sermat"),require("ludorum")); // CommonJS module.
			} else {
				this["ludorum-player-ml"] = init(this.base,this.Sermat,this.ludorum); // Browser.
			}
		}).call(this,/** Library ludorum-classifier-player wrapper and layout.
*/
function __init__(base, Sermat, ludorum){ "use strict";

// Import synonyms. ////////////////////////////////////////////////////////////////////////////////
	var declare = base.declare,
		raiseIf = base.raiseIf,
		iterable = base.iterable,
		Iterable = base.Iterable,
		unimplemented = base.objects.unimplemented,
		initialize = base.initialize,

		Player = ludorum.Player,
		HeuristicPlayer = ludorum.players.HeuristicPlayer;

// Library layout. /////////////////////////////////////////////////////////////////////////////////
	var exports = {
			__package__: 'ludorum-player-ml',
			__name__: 'ludorum_player_ml',
			__init__: __init__,
			__dependencies__: [base, Sermat, ludorum],

			examples: { }
		},
		examples = exports.examples;

// See __epilogue__.js



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

/** # Game classifier

A game classifier is a classifier that takes its inputs from a game state and a player. The outputs
(classes) can be different concepts, depending on the way the classifier is meant to be used.
*/
var GameClassifier = exports.GameClassifier = declare({
	/** All classifiers are defined by a list of numerical `parameters`.
	*/
	constructor: function GameClassifier(parameters) {
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

	/** The normalization makes the evaluations for all classes fit in the [0,1] range, adding up
	to 1.
	*/
	normalizedEvaluate: function normalizedEvaluate(game, player) {
		var evals = iterable(this.evaluate(game, player)),
			min = +Infinity,
			max = -Infinity,
			sum = 0,
			count = 0;
		evals.forEachApply(function (i, v) {
			if (min > v) {
				min = v;
			}
			if (max < v) {
				max = v;
			}
			sum += v;
			count++;
		});
		sum = sum - count * min;
		return evals.mapApply(function (i, v) {
			return [i, (v - min) / sum];
		}).toArray();
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
	'static actionClassifier': function actionClassifier(ClassifierType, gameModel, parameterRanges) {
		raiseIf(typeof ClassifierType !== 'function', "Invalid ClassifierType!");
		raiseIf(!parameterRanges, "Invalid parameterRanges!");
		return declare(ClassifierType, {
			gameModel: gameModel,
			classes: gameModel.actionClasses(),
			parameterRanges: parameterRanges,

			/** The player used by an action classifier is `ActionClassifierPlayer` by default.
			*/
			player: function player(params) {
				return new ActionClassifierPlayer(Object.assign(params || {}, {
					classifier: this
				}));
			}
		});
	},

	/** An `resultClassifier` is a game classifier that uses the game's possible results as the
	classes into which classify any game state.
	*/
	'static resultClassifier': function resultClassifier(ClassifierType, gameModel, parameterRanges, resultClasses) {
		raiseIf(typeof ClassifierType !== 'function', "Invalid ClassifierType!");
		raiseIf(!parameterRanges, "Invalid parameterRanges!");
		return declare(ClassifierType, {
			gameModel: gameModel,
			classes: resultClasses || gameModel.resultClasses(),
			parameterRanges: parameterRanges,

			/** If an `horizon` parameter is given, the player used by the classifier is an
			`AlphaBetaPlayer` with an heuristic that uses the classifier. Else the
			`ResultClassifierPlayer` is used.
			*/
			player: function player(params) {
				params = Object.assign(params || {}, {
					classifier: this
				});
				if (params.hasOwnProperty('horizon')) {
					params.heuristic = ResultClassifierPlayer.heuristic.bind(null, this);
					return new ludorum.players.AlphaBetaPlayer(params);
				}
				return new ResultClassifierPlayer(params);
			}
		});
	},

	/** `randomClassifier` builds a classifier of this type with random parameters.
	*/
	'static randomClassifier': function randomClassifier(random) {
		random = random || this.prototype.random;
		var parameterRanges = this.prototype.parameterRanges;
		raiseIf(!parameterRanges, "Parameter ranges are not defined!");
		var params = parameterRanges.map(function (r) {
			return random.random(r.min, r.max);
		});
		return new this(params);
	}
}); // declare GameClassifier


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
					return [gameModel.actionForClass(classes[c[0]], game, role), c[1]];
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


/** # Linear classifier

A [linear classifier](https://en.wikipedia.org/wiki/Linear_classifier) selects a class for an
game state based on a linear combination of its features.
*/
var LinearClassifier = exports.LinearClassifier = declare(GameClassifier, {
	constructor: function LinearClassifier(parameters) {
		GameClassifier.call(this, parameters);
		var featureCount = this.gameModel.featureRanges().length;
		this.__parameters__ = Iterable.range(this.classes.length).map(function (i) {
			return parameters.slice(i * featureCount, (i + 1) * featureCount);
		}).toArray();
	},

	/** Every class has a vector with a weight for every feature. A linear classifier is evaluated
	by calculating the product of this weight vector and the feature vector for every class.
	*/
	evaluate: function evaluate(game, player) {
		var features = this.gameModel.normalizedFeatures(game, player);
		return iterable(this.__parameters__).map(function (params, i) {
				var r = Iterable.zip(params, features).mapApply(function (w, x) {
					return w * x;
				}).sum();
				return [i, r];
			}).toArray();
	},

	/** An action classifier based on a linear classifier has as many parameters as the product of
	the feature count by the class count, i.e. the amount of possible actions in the game model.
	*/
	'static actionClassifier': function actionClassifier(gameModel) {
		var featureCount = gameModel.featureRanges().length,
			classes = gameModel.actionClasses(),
			paramCount = featureCount * classes.length;
		return GameClassifier.actionClassifier(this, gameModel,
			Iterable.repeat({ min: -1, max: +1 }, paramCount).toArray()
		);
	},

	/** A result classifier based on a linear classifier has as many parameters as the product of
	the feature count by the class count, i.e. the amount of possible results in the game model.
	*/
	'static resultClassifier': function resultClassifier(gameModel, possibleResults) {
		var featureCount = gameModel.featureRanges().length,
			classes = possibleResults || gameModel.resultClasses(),
			paramCount = featureCount * classes.length;
		return GameClassifier.resultClassifier(this, gameModel,
			Iterable.repeat({ min: -1, max: +1 }, paramCount).toArray(),
			possibleResults);
	}
}); // declare LinearClassifier


/** # Training

Player model adjustment using the Inveniemus framework.
*/
exports.training = {
	init: function init(inveniemus) {
		var Problem = inveniemus.Problem,
			RandomPlayer = ludorum.players.RandomPlayer,
			Measurement = ludorum.tournaments.Measurement;

		this.TrainingProblem = declare(Problem, {
			random: base.Randomness.DEFAULT,
			objectives: [+Infinity],
			precision: 10,
			matchCount: 3,

			constructor: function TrainingProblem(params) {
				initialize(this, params)
					.func('ClassifierType')
					.integer('precision', { coerce: true, ignore: true })
					.integer('matchCount', { coerce: true, ignore: true })
					.array('opponents', { ignore: true });
				this.opponents = this.__initOpponents__(this.opponents);

				var precision = this.precision,
					parameterRanges = this.ClassifierType.prototype.parameterRanges,
					game = this.ClassifierType.prototype.gameModel.game;
				Problem.call(this, Object.assign(params, {
					title: "TrainingProblem for "+ this.ClassifierType,
					description: "Training method based on inveniemus for "+ this.ClassifierType,
					elementModel: parameterRanges.map(function (range) {
						return { n: (range.max - range.min) * precision + 1 };
					})
				}));

				this.Element.prototype.emblem = function emblem() { //FIXME
					var evaluation = this.evaluation === null ? '?' :
							this.evaluation.map(function (e) {
								return Math.round(e * 1e4) / 1e4;
							}).join(','),
						values = this.values().map(function (v) {
							return String.fromCharCode((v |0) + 0x4DC0);
						}).join('');
					return '[Element '+ evaluation +' '+ values +']';
				};
				this.Element.prototype.evaluate = function evaluate() {
					return Future.then(this.problem.evaluation(this), function (e) {
						if (this.__evaluationCount__) {
							e = (elem.evaluation * (this.__evaluationCount__ - 1) + e) /
								this.__evaluationCount__;
						}
						this.__evaluationCount__ = (this.__evaluationCount__ |0) + 1;
						elem.evaluation = e;
						raiseIf(elem.evaluation === null, 'The evaluation of ', elem, ' is null!');
						return elem.evaluation;
					});
				};
			},

			'dual opponentFromString': function opponentFromString(str) {
				str = str.toLowerCase();
				if (str === 'random') {
					return new ludorum.players.RandomPlayer({ name: 'Random' });
				} else if (/^mmab\d+$/.test(str)) {
					var h = +str.substr(4);
					return new ludorum.players.AlphaBetaPlayer({
						name: 'MM\u03B1\u03B2('+ h +')',
						horizon: h-1
					});
				} else if (/^mcts\d+$/.test(str)) {
					var s = +str.substr(4);
					return new ludorum.players.MonteCarloPlayer({
						name: 'MCTS('+ s +')',
						simulationCount: s,
						timeCap: +Infinity
					});
				} else {
					raise("Unknown opponent '"+ str +"'!");
				}
			},

			__initOpponents__: function __initOpponents__(opponents) {
				var self = this;
				return opponents.map(function (opponent, i) {
					if (typeof opponent === 'string') {
						opponent = self.opponentFromString(opponent);
					}
					raiseIf(!opponent || !(opponent instanceof ludorum.Player),
						"Invalid opponent player #", i, "!");
					return opponent;
				});
			},

			opponents: ['random'],

			mapping: function mapping(element) {
				var precision = this.precision,
					parameterRanges = this.ClassifierType.prototype.parameterRanges,
					params = Iterable.zip(element.values(), parameterRanges)
					.mapApply(function (v, r) {
						return Math.max(r.min, Math.min(r.max,
							v / precision * (r.max - r.min) + r.min));
					}).toArray();
				return new this.ClassifierType(params);
			},

			player: function player(classifier) {
				return classifier.player({ name: 'Trainee' });
			},

			evaluation: function evaluation(element) {
				var game = this.ClassifierType.prototype.gameModel.game,
					classifier = this.mapping(element),
					player = this.player(classifier),
					tournament = new Measurement(game, [player], this.opponents, this.matchCount);
				return tournament.run().then(function () {
					var stats = tournament.statistics;
					return [ (stats.count({ key: 'victories', player: player.name }) -
						stats.count({ key: 'defeats', player: player.name })) /
						stats.count({ key: 'results', player: player.name }) ];
				});
			},

			evaluate: function evaluate(elements) {
				return Problem.prototype.evaluate.call(this, elements, true); // Reevaluate.
			},

			geneticAlgorithm: function geneticAlgorithm(params) {
				var mh = new inveniemus.metaheuristics.GeneticAlgorithm(Object.assign({
					problem: this,
					mutationRate: 0.25,
					size: 10,
					steps: 10
				}, params));
				mh.events.on('advanced', function (mh) { // Eliminate duplicates.
					while (mh.state.length < mh.size) {
						mh.state.push(new mh.problem.Element());
					}
				});
				return mh;
			}
		}); // declare TrainingProblem

		return this;
	}
};


/** # TicTacToe model.

Example of a game model for TicTacToe.
*/
examples.TicTacToeGameModel = base.declare(GameModel, {
	constructor: function TicTacToeGameModel(game) {
		GameModel.call(this, game || new ludorum.games.TicTacToe());
	},

	/** The action classes for TicTacToe map to all possible moves.
	*/
	__actionClasses__: [0,1,2,3,4,5,6,7,8],

	/** A TicTacToe game has 9 features, one for each square in the board. An empty square has a
	value of zero. A square marked by the opponent has a value of -1. Squares marked by the player
	have a value of +1.
	*/
	__featureRanges__: base.Iterable.repeat({ min: -1, max: 1 }, 9).toArray(),

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


// See __prologue__.js

	return exports;
});
//# sourceMappingURL=ludorum-player-ml.js.map