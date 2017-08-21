/** # Classifiers

This library provides the following types of classifiers.
*/

/** ## Linear classifier ###########################################################################

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
			classes = gameModel.possibleActions(),
			paramCount = featureCount * classes.length;
		return declare(this, {
			gameModel: gameModel,
			classes: classes,
			parameterRanges: Iterable.repeat({ min: -1, max: +1 }, paramCount).toArray(),

			/** The player used by the linear action classifier is `ActionClassifierPlayer`.
			*/
			player: function player(params) {
				return new ActionClassifierPlayer(Object.assign(params || {}, {
					classifier: this
				}));
			}
		});
	},

	/** A result classifier based on a linear classifier has as many parameters as the product of
	the feature count by the class count, i.e. the amount of possible results in the game model.
	*/
	'static resultClassifier': function resultClassifier(gameModel, possibleResults) {
		var featureCount = gameModel.featureRanges().length,
			classes = possibleResults || gameModel.possibleResults(),
			paramCount = featureCount * classes.length;
		return declare(this, {
			gameModel: gameModel,
			classes: classes,
			parameterRanges: Iterable.repeat({ min: -1, max: +1 }, paramCount).toArray(),

			/** If an `horizon` parameter is given, the player used by the linear result
			classifier is an `AlphaBetaPlayer` with an heuristic that uses the classifier. Else
			the `ResultClassifierPlayer` is used.
			*/
			player: function player(params) {
				params = Object.assign(params || {}, {
					classifier: this
				});
				if (params.horizon) {
					params.heuristic = ResultClassifierPlayer.heuristic.bind(null, this);
					return new ludorum.players.AlphaBetaPlayer(params);
				}
				return new ResultClassifierPlayer(params);
			}
		});
	}
}); // declare LinearClassifier
