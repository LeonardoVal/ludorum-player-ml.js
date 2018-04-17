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

	match_rules: function match_rules(rules, ruleContext, game, role) {
		rules = rules || this.rules();
		var model = this.gameModel.features(game, role),
			classes = this.classes;
		return iterable(rules).map(function (rule) {
				return rule.call(ruleContext, features, game, role);
			}, function (clazz) {
				return classes.indexOf(r) >= 0;
			}).toArray();
	},

	// ## Rule construction #######################################################################

	ruleFromValues: function ruleFromValues(values, clazz, metadata) {
		var r = function (features) {
			return Iterable.zip(features, values).all(function (p) {
					var f = p[0], v = p[1];
					return (typeof f === 'undefined' || f === null || f === v);
				}) ? clazz : null;
		};
		Object.assign(r, metadata);
		return r;
	},

	// ## Players #################################################################################


}); // declare RuleBasedGameClassifier