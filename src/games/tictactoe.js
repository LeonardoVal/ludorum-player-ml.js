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

tictactoe.ACTION_RULES = RuleBasedGameClassifier.parseActions([
	{ 4: '...._....' },
	{ '0|2|6|8': '....-....' },
	{ 0: '_--...... _++...... _..-..-.. _..+..+.. _...-...- _...+...+',
	  2: '--_...... ++_...... .._..-..- .._..+..+ .._.-.-.. .._.+.+..',
	  3: '..._--... ..._++... -.._..-.. +.._..+..',
	  5: '...--_... ...++_... ..-.._..- ..+.._..+',
	  6: '......_-- ......_++ -..-.._.. +..+.._.. ..-.-._.. ..+.+._..',
	  8: '......--_ ......++_ ..-..-.._ ..+..+.._ -...-..._ +...+..._'
	}
]);

tictactoe.ruleBasedActionPlayer = function ruleBasedActionPlayer(rules) {
	rules = rules || tictactoe.ACTION_RULES;
	var ActionRBGC = RuleBasedGameClassifier.actionClassifier({
			gameModel: tictactoe.MODEL,
			__rules__: rules
		}),
		actionRBGC = new ActionRBGC();
	return actionRBGC.player();
};

tictactoe.RESULT_RULES = RuleBasedGameClassifier.parseActions([{
	'+': '....+.... +........ ..+...... ......+.. ........+',
	'-': '....-.... -........ ..-...... ......-.. ........-'
}]);

tictactoe.ruleBasedResultPlayer = function ruleBasedResultPlayer(rules) {
	rules = rules || tictactoe.RESULT_RULES;
	var ResultRBGC = RuleBasedGameClassifier.resultClassifier({
			gameModel: tictactoe.MODEL,
			__rules__: rules
		}),
		resultRBGC = new ResultRBGC();
	return resultRBGC.player();
};