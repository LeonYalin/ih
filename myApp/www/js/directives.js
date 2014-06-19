var directModule = angular.module('starter.directives', []);

directModule.directive("ihBesttvPlayer",function($http, $q){
	function _loadScripts () {
		var deferred = $q.defer();
		$http({
			method: 'JSONP',
			url: 'http://admin.brightcove.com/js/BrightcoveExperiences.js',
			dataType: 'script',
			headers: {
				'Content-type': 'application/x-javascript'
			}
		}).success(function(data){
			console.log('get succeded. Data is: ');
			console.log(data);
			deferred.resolve();
		}).error(function (err) {
			console.log('fail: error is: ' + err);
			deferred.reject();
		});

		return deferred.promise;
	}

	_loadScripts().finally(function ($window) {
		console.log('in finally');
		brightcove.createExperiences();
	
		var player, APIModules, videoPlayer;
		$window.onTemplateLoad = function (experienceID){
			player = brightcove.api.getExperience(experienceID);
			APIModules = brightcove.api.modules.APIModules;
		};
	 
		$window.onTemplateReady = function (evt){
			videoPlayer = player.getModule(APIModules.VIDEO_PLAYER);
			videoPlayer.play();
		};
	});

	return {
		restrict: 'E',
		templateUrl: 'templates/besttv-player.html',
		scope: {
			vid: '@vid',
			width: '@width',
			height: '@height'
		}
	};
});

directModule.directive('ihPie', function ($compile) {
	return {
		restrict: 'E',
		templateUrl: 'templates/pie.html',
		link: function($scope, element, attrs) {
			$scope.title = 'My ihPie title';


			// var markup = "<input type='text' ng=model='sampleData'/> {{sampleData}} <br/>";
			// angular.element(element).html($compile(markup)(scope));
			// console.log($compile(markup)(scope));
		}
	};
});