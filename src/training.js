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
			precision: 100,
			matchCount: 30,

			constructor: function TrainingProblem(params) {
				initialize(this, params)
					.integer('precision', { coerce: true, ignore: true })
					.integer('matchCount', { coerce: true, ignore: true })
					.func('ClassifierType', { });

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

				//FIXME
				this.Element.prototype.emblem = function emblem() {
					return 'Element['+ this.values().map(function (v) {
						return String.fromCharCode(v + 0xB0);
					}).join('') +' '+ (+this.evaluation) +']';
				};
			},

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

			evaluation: function evaluation(element) {
				var playerName = 'Player:'+ element,
					game = this.ClassifierType.prototype.gameModel.game,
					classifier = this.mapping(element),
					player = classifier.player({ name: playerName }),
					opponents = [new RandomPlayer({ name: 'RandomPlayer' })],
					tournament = new Measurement(game, [player], opponents, this.matchCount);
				return tournament.run().then(function () {
					var stats = tournament.statistics;
					return [stats.average({ key: 'results', player: playerName })];
				});
			}
		}); // declare TrainingProblem

		return this;
	}
};
