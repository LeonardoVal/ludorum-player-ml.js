/** # Parametrical classifiers

Game classifiers defined by a list of parameters.
*/
var ParametricalGameClassifier = exports.ParametricalGameClassifier = declare(GameClassifier, {
	/** All classifiers are defined by a list of numerical `parameters`.
	*/
	constructor: function ParametricalGameClassifier(args) {
		GameClassifier.call(this, args);
		var parameterRanges = this.parameterRanges,
			parameters = args.parameters || [];
		raiseIf(parameters.length !== parameterRanges.length, 
			"Expected ", parameterRanges.length, " parameters, but got ", parameters.length, "!");
		Iterable.zip(parameters, parameterRanges).forEachApply(function (p, r, i) {
			raiseIf(p < r.min || p > r.max, "Value ", p, " for parameter ", i, " not in range [",
				r.min, ",", r.max, "]!");
		});
		this.parameters = parameters;
	},

	/** The class property `parameterRanges` is a list of ranges (e.g. `{min:0, max:1}`) for the 
	parameters required to build a classifier of this type.
	*/
	parameterRanges: [],

	/** Parametrical classifiers pick the class with greater evaluation. If more than one has the 
	greatest evaluation, one of these is chosen at random.
	*/
	matches: GameClassifier.prototype.match_bestEvaluated,

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
		return new this({ parameters: params });
	}
}); // declare ParametricalGameClassifier
