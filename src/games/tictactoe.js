/** # TicTacToe model.

Example of a game model for TicTacToe.
*/
var tictactoe = games.tictactoe = {};

tictactoe.TicTacToeGameModel = base.declare(GameModel, {
	constructor: function TicTacToeGameModel(params) {
		params = params || {};
		params.game = params.game || new ludorum.games.TicTacToe();
		GameModel.call(this, params);
	},

	/** The action classes for TicTacToe map to all possible moves.
	*/
	actionClasses: function actionClasses(game) {
		return [0,1,2,3,4,5,6,7,8];
	},

	/** A TicTacToe game has 9 features, one for each square in the board. An empty square has a
	value of zero. A square marked by the opponent has a value of -1. Squares marked by the player
	have a value of +1.
	*/
	__featureRanges__: base.Iterable.repeat({ min: -1, max: 1 }, 9).toArray(),

	featureRanges: function featureRanges() {
		return this.__featureRanges__;
	},

	features: function features(game, player) {
		var players = game.players.map(function (p) {
				return p.charAt(0);
			}),
			factor = player === game.players[0] ? +1 : -1;
		return game.board.split('').map(function (sq) {
			return (sq === players[0]) ? factor : (sq === players[1]) ? -factor : 0;
		});
	}
}); // declare TicTacToeGameModel

tictactoe.MODEL = new tictactoe.TicTacToeGameModel();

tictactoe.ACTION_RULES = (function () {
	var n = null;
	return [
		[[ n, n, n,  n, 0, n,  n, n, n], 4], // Take the center.
		[[ 0, n, n,  n, n, n,  n, n, n], 0], // Take the corners.
		[[ n, n, 0,  n, n, n,  n, n, n], 2],
		[[ n, n, n,  n, n, n,  0, n, n], 6],
		[[ n, n, n,  n, n, n,  n, n, 0], 8],

		[[+1, 0,+1,  n, n, n,  n, n, n], 1], // Take the borders to win.
		[[+1, n, n,  0, n, n, +1, n, n], 3],
		[[ n, n,+1,  n, n, 0,  n, n,+1], 5],
		[[ n, n, n,  n, n, n, +1, 0,+1], 7],
		
		[[-1, 0,-1,  n, n, n,  n, n, n], 1], // Take the borders to not lose.
		[[-1, n, n,  0, n, n, -1, n, n], 3],
		[[ n, n,-1,  n, n, 0,  n, n,-1], 5],
		[[ n, n, n,  n, n, n, -1, 0,-1], 7]
	];
})();

tictactoe.ACTION_REGEXP = [
	{ 4: /....1..../ },
	{ '[0,2,6,8]': /....0..../ },
	{ 0: /1(00|22)......|1..0..0..|1..2..2..|1...0...0|1...2...2/,
	  2: /(00|22)1......|..1..0..0|..1..2..2|..1.0.0..|..1.2.2../,
	  3: /...1(00|22)...|0..1..0..|2..1..2../,
	  5: /...(00|22)1...|..0..1..0|..2..1..2/,
	  6: /......1(00|22)|0..0..1..|2..2..1..|..0.0.1..|..2.2.1../,
	  8: /......(00|22)1|..0..0..1|..2..2..1|0...0...1|2...2...1/
	}
];

tictactoe.ruleBasedActionPlayer = function ruleBasedActionPlayer(rules) {
	rules = rules || tictactoe.ACTION_RULES;
	var ActionRBGC = RuleBasedGameClassifier.actionClassifier({
			gameModel: tictactoe.MODEL
		}),
		actionRBGC = new ActionRBGC(),
		n = null;
	rules.forEach(function (rule) {
		actionRBGC.add_ruleFromValues(rule[0], rule[1]);	
	});
	return actionRBGC.player();
};