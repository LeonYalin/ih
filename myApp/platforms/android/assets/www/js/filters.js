var filtersModule = angular.module('starter.filters', []);

filtersModule.filter('ihParseDate', function() {
	return function(input) {
		var parts = input.split('/');

		return new Date( parseInt(parts[2], 10), parseInt(parts[1] - 1, 10), parseInt(parts[0], 10) );
	};
});