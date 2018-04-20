/** # Rule based game classifier

A rule based game classifier selects a class for a game state based on a list of rules. Rules that 
apply indicate a class. If many rules apply, different classifications must be resolved.
*/
var RuleBasedGameClassifier = classifiers.RuleBasedGameClassifier = declare(GameClassifier, {
	constructor: function RuleBasedGameClassifier(args) {
		GameClassifier.call(this, args);
		this.__rules__ = args && args.rules || [];
	},

	rules: function rules() {
		return this.__rules__;
	},

	classify: GameClassifier.prototype.classify_firstMatch,

	match_rules: function match_rules(game, role, rules, ruleContext) {
		rules = rules || this.rules();
		var features = this.gameModel.features(game, role),
			classes = this.classes;
		return iterable(rules).map(function (rule) {
				return rule.call(ruleContext, features, game, role);
			}, function (clazz) {
				return classes.indexOf(r) >= 0;
			}).toArray();
	},

	evaluate_rules: function evaluate_rules(game, role, rules, ruleContext) {
		rules = rules || this.rules();
		var features = this.gameModel.features(game, role),
			counts = Iterable.zip(this.classes, Iterable.repeat(0)).toObject();
		rules.forEach(function (rule) {
			var c = rule.call(ruleContext, features, game, role);
			if (typeof c !== 'undefined' && c !== null) {
				counts[c]++;
			}
		});
		return iterable(counts).toArray();
	},

	// ## Rule construction #######################################################################

	ruleFromValues: function ruleFromValues(values, clazz, metadata) {
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