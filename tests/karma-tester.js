(function () {
	require.config({ // Configure RequireJS.
		baseUrl: '/base',
		paths: {
			'creatartis-base': '/base/tests/lib/creatartis-base.min',
			'sermat': '/base/tests/lib/sermat-umd',
			'ludorum': '/base/tests/lib/ludorum',
			'ludorum-player-ml': '/base/tests/lib/ludorum-player-ml',
			'ludorum-game-mancala': '/base/tests/lib/ludorum-game-mancala'
		}
	});
	require(Object.keys(window.__karma__.files) // Dynamically load all test files
			.filter(function (file) { // Filter test modules.
				return /\.test\.js$/.test(file);
			}).map(function (file) { // Normalize paths to RequireJS module names.
				return file.replace(/^\/base\//, '').replace(/\.js$/, '');
			}),
		function () {
			window.__karma__.start(); // we have to kickoff jasmine, as it is asynchronous
		}
	);
})();
