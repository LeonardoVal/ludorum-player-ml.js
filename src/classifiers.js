/** # Classifiers

*/

/** ## Linear classifier ###########################################################################

*/
var LinearClassifier = exports.LinearClassifier = declare(GameClassifier, {
	constructor: function LinearClassifier(parameters) {
		GameClassifier.call(this, parameters);
		var featureCount = this.gameModel.featureRanges().length;
		this.__parameters__ = Iterable.range(this.classes.length).map(function (i) {
			return parameters.slice(i * featureCount, (i + 1) * featureCount);
		}).toArray();
	},

	evaluate: function evaluate(game, player) {
		var sum = 0,
			features = this.gameModel.normalizedFeatures(game, player),
			products = iterable(this.__parameters__).map(function (params) {
				var r = Iterable.zip(params, features).mapApply(function (w, x) {
					return w * x;
				}).sum();
				sum += r;
				return r;
			}).toArray();
		return products.map(function (y, i) {
			return [i, y / sum];
		});
	},

	'static actionClassifier': function actionClassifier(gameModel) {
		var featureCount = gameModel.featureRanges().length,
			classes = gameModel.possibleActions(),
			paramCount = featureCount * classes.length;
		return declare(this, {
			gameModel: gameModel,
			classes: classes,
			parameterRanges: Iterable.repeat({ min: -1, max: +1 }, paramCount).toArray()
		});
	}
}); // declare LinearClassifier
