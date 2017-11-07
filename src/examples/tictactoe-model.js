/** # TicTacToe model.

Example of a game model for TicTacToe.
*/
examples.TicTacToeGameModel = base.declare(GameModel, {
	constructor: function TicTacToeGameModel(game) {
		GameModel.call(this, game || new ludorum.games.TicTacToe());
	},

	/** The action classes for TicTacToe map to all possible moves.
	*/
	__actionClasses__: [0,1,2,3,4,5,6,7,8],

	/** A TicTacToe game has 9 features, one for each square in the board. An empty square has a
	value of zero. A square marked by the opponent has a value of -1. Squares marked by the player
	have a value of +1.
	*/
	__featureRanges__: base.Iterable.repeat({ min: -1, max: 1 }, 9).toArray(),

	features: function features(game, player) {
		var players = game.players.map(function (p) {
				return p.charAt(0);
			}),
			factor = player === players[0] ? +1 : -1;
		return game.board.split('').map(function (sq) {
			return (sq === players[0]) ? factor : (sq === players[1]) ? -factor : 0;
		});
	}
}); // declare TicTacToeGameModel
