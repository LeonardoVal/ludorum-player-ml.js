/** Library ludorum-classifier-player wrapper and layout.
*/
function __init__(base, Sermat, ludorum){ "use strict";

// Import synonyms. ////////////////////////////////////////////////////////////////////////////////
	var declare = base.declare,
		raiseIf = base.raiseIf,
		iterable = base.iterable,
		Iterable = base.Iterable,
		unimplemented = base.objects.unimplemented,
		initialize = base.initialize,

		Player = ludorum.Player,
		HeuristicPlayer = ludorum.players.HeuristicPlayer;

// Library layout. /////////////////////////////////////////////////////////////////////////////////
	var exports = {
			__package__: 'ludorum-player-ml',
			__name__: 'ludorum_player_ml',
			__init__: __init__,
			__dependencies__: [base, Sermat, ludorum]
		},
		models = exports.models = { },
		classifiers = exports.classifiers = { },
		players = exports.players = { },
		training = exports.training = { };

// See __epilogue__.js
