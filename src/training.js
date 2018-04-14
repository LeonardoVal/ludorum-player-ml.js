/** # Training

Player model adjustment using the Inveniemus framework.
*/
exports.add_inveniemus = function add_inveniemus(inveniemus) {
	inveniemus = inveniemus || require('inveniemus');
	var Problem = inveniemus.Problem,
		RandomPlayer = ludorum.players.RandomPlayer,
		Measurement = ludorum.tournaments.Measurement;

	exports.training.TrainingProblem = declare(Problem, {
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
			return new this.ClassifierType({ parameters: params });
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
};
