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
					.func('ClassifierType')
					.integer('precision', { coerce: true, ignore: true })
					.integer('matchCount', { coerce: true, ignore: true })
					.array('opponents', { ignore: true });

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
					var evaluation = this.evaluation === null ? '\u22A5' :
							this.evaluation.map(function (e) {
								return Math.round(e * 1e4) / 1e4;
							}).join(','),
						values = this.values().map(function (v) {
							return String.fromCharCode((v |0) + 0x4DC0);
						}).join('');
					return '[Element '+ evaluation +' '+ values +']';
				};
			},

			opponents: [
				new ludorum.players.RandomPlayer({ name: 'Random' }),
				new ludorum.players.AlphaBetaPlayer({ name: '\u0391\u0392(h1)', horizon: 0 }),
				new ludorum.players.AlphaBetaPlayer({ name: '\u0391\u0392(h2)', horizon: 1 }),
				new ludorum.players.AlphaBetaPlayer({ name: '\u0391\u0392(h3)', horizon: 2 }),
				new ludorum.players.AlphaBetaPlayer({ name: '\u0391\u0392(h4)', horizon: 3 })
			],

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
					return [stats.average({ key: 'results', player: player.name })];
				});
			}
		}); // declare TrainingProblem

		return this;
	}
};
