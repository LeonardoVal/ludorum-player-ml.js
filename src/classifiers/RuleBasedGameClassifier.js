/** # Rule based game classifier

A rule based game classifier selects a class for a game state based on a list of rules. Rules that 
apply indicate a class. If many rules apply, different classifications must be resolved.
*/
var RuleBasedGameClassifier = classifiers.RuleBasedGameClassifier = declare(GameClassifier, {
	constructor: function RuleBasedGameClassifier(args) {
		GameClassifier.call(this, args);
		this.__rules__ = args && args.rules || [];
	},

	/** The `rules` property is a list of lists of functions with the signature 
	`(features, game, role)` returning a class if the rule applies or `null` if it does not. Each 
	function is called a _rule_, and a list of rules is a called a _level_.
	*/
	rules: function rules() {
		return this.__rules__;
	},

	__rules__: [],

	classify: GameClassifier.prototype.classify_firstMatch,

	/** Matching goes level by level, and stops at the first level that has at least one rule that
	applies to the given game state.
	*/
	match_rules: function match_rules(game, role, rules, ruleContext) {
		rules = rules || this.rules();
		var features = this.gameModel.features(game, role),
			classes = this.classes,
			matches = [];
		for (var i = 0; matches.length < 1 && i < rules.length; i++) {
			matches = iterable(rules[i]).map(function (rule) {
				return rule.call(ruleContext, features, game, role);
			}, function (clazz) {
				return classes.indexOf(r) >= 0;
			}).toArray();
		}
		return matches;
	},

	/**
	*/
	evaluate_rules: function evaluate_rules(game, role, rules, ruleContext) {
		rules = rules || this.rules();
		var features = this.gameModel.features(game, role),
			counts = Iterable.zip(this.classes, Iterable.repeat(0)).toObject(),
			done = false,
			level;
		for (var i = 0; !done && i < rules.length; i++) {
			rules[i].forEach(function (level) {
				var c = rule.call(ruleContext, features, game, role);
				if (typeof c !== 'undefined' && c !== null) {
					counts[c]++;
					done = true;
				}
			});
		}
		return iterable(counts).toArray();
	},

	// ## Rule construction #######################################################################

	'dual ruleFromValues': function ruleFromValues(values, clazz, metadata) {
		var ruleFunction = function (features) {
			var result = Iterable.zip(features, values).all(function (p) {
					var f = p[0], v = p[1];
					return (typeof v === 'undefined' || v === null || f === v);
				}) ? clazz : null;
			return result;
		};
		Object.assign(ruleFunction, metadata);
		return ruleFunction;
	},

	add_ruleFromValues: function add_ruleFromValues(values, clazz, metadata) {
		this.__rules__.push(this.ruleFromValues(values, clazz, metadata));
		return this;
	},

	'dual parseActions': function parseActions(levels, chars2Features) {
		chars2Features = chars2Features || {
			'.': null,
			'+': +1, '_':  0, '-': -1
		};
		var self = this;
	
		return levels.map(function (level) {
			var r = [],
				vs;
			for (var k in level) {
				vs = level[k];
				k.split('|').forEach(function (clazz) {
					vs.split(/\s+/).forEach(function (chars) {
						var fs = chars.split('').map(function (chr) {
								return chars2Features[chr];
							}),
							c = +(clazz === '+' ? +1 : clazz === '-' ? -1 : clazz),
							rule = self.ruleFromValues(fs, c, { features: fs, class: c });
						r.push(rule); 
					});
				});
			}
			return r;
		});
	},

	// ## Players #################################################################################

	'static actionClassifier': function actionClassifier(members) {
		return GameClassifier.actionClassifier.call(this, Object.assign({
			match: RuleBasedGameClassifier.prototype.match_rules 
		}, members));
	},

	'static resultClassifier': function resultClassifier(members) {
		return GameClassifier.resultClassifier.call(this, Object.assign({
			match: GameClassifier.prototype.match_bestEvaluated,
			evaluate: RuleBasedGameClassifier.prototype.evaluate_rules 
		}, members));
	},

}); // declare RuleBasedGameClassifier