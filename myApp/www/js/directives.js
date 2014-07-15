var directModule = angular.module('starter.directives', []);

directModule.directive("ihBesttvPlayer",function($http, $q, $compile, $timeout){
	return {
		restrict: 'E',
		templateUrl: 'templates/besttv-player.html',
		scope: {
			vid: '@vid',
			width: '@width',
			height: '@height'
		},
		link: function(scope, element, attrs) {
			$timeout(function() {
				brightcove.createExperiences();
			}, 300);
		}
	};
});

directModule.directive('ihPie', function ($compile, $timeout, $ihCache, $ihPieSrvc, $ihUtil) {
	return {
		restrict: 'E',
		templateUrl: 'templates/pie.html',
		link: function($scope, element, attrs) {
			$scope.title = 'Menu';
			$scope.selectedSlice = 0;
			$scope.shouldShowPie = true;
			$scope.sliceAnimState = 'show';
			$scope.slices = [
				{ index: 1, title: 'Favorites', icon: 'star' },
				{ index: 2, title: 'RSS', icon: 'radio-waves' },
				{ index: 3, title: 'Search', icon: 'ios7-search-strong' },
				{ index: 4, title: 'Categories', icon: 'android-sort' },
				{ index: 5, title: 'Opinions', icon: 'person-stalker' },
				{ index: 6, title: 'Horoscope', icon: 'aperture' },
				{ index: 7, title: 'Weather', icon: 'ios7-partlysunny' },
				{ index: 8, title: 'Share', icon: 'android-share' }
			];
			$scope.onSliceClick = function ($event, $index) {
				var el = angular.element($event.target);
				if (el) {
					if ($ihCache.get('isLastSliceClicked')) {
						$ihCache.put('isLastSliceClicked', false);
						return;
					}

					$scope.title = $scope.slices[$index].title;
					$scope.selectedSlice = $index + 1; // starting from 1		
				}
			};

			/* hack: on last slice wrapper click, trigger first slice click */
			$scope.onSliceWrapperClick = function ($event, $index) {
				var el = angular.element($event.target),
					isLastSliceClicked = el.attr('class').indexOf('ihPieSliceInner-8_8') !== -1,
					isIconClicked = el.attr('class').indexOf('icon') !== -1;

				if (isLastSliceClicked) {
					$ihCache.put('isLastSliceClicked', true);
				}
				if ($index == 7 && !isIconClicked) {
					$timeout(function() {
						angular.element(document.querySelector('.ihPieSliceInner-1_8')).triggerHandler('click');
					}, 0);
				}
			};

			$scope.$on('$destroy', function() {
				$scope.modal.remove();
			});
			$scope.$on('modal.hidden', function() {
				$scope.sliceAnimState = 'hide';
				$scope.selectedSlice = 0;
				$ihPieSrvc.clearResults($scope);
				$timeout(function() {
					$scope.shouldShowPie = false;
				}, 200, false);
			});
			$scope.$on('modal.removed', function() {
				console.log('in modal.removed');
			});
			$scope.$on('modal.shown', function() {
				$scope.shouldShowPie = true;
				$scope.sliceAnimState = 'show';
				$scope.title = 'Menu';
			});

			$scope.noResultsFlag = false;
			$scope.search = function (query) {
				$ihPieSrvc.getSearchData($scope, query);
			};

			$scope.$watch('selectedSlice', function(newValue, oldValue){
				// Check if value has changes
				if(newValue === oldValue || newValue === 0){
					return;
				}

				$scope.results = [];
				switch (newValue) {
					case 1: // Favorites
						$ihPieSrvc.clearResults($scope);
						$ihPieSrvc.getFavoritesData($scope);
						break;
					case 2: // RSS
						$ihPieSrvc.clearResults($scope);
						$ihPieSrvc.getRSSData($scope);
						break;
					case 3: // Search
						$ihPieSrvc.clearResults($scope);
						$ihPieSrvc.showSearchInput($scope);
						break;
					case 4: // Categories
						$ihPieSrvc.clearResults($scope);
						$ihPieSrvc.getCategoriesData($scope);
						break;
					case 5: // Opinions
						$ihPieSrvc.clearResults($scope);
						$ihPieSrvc.getOpinionsData($scope);
						break;
					case 6: // Horoscope
						$ihPieSrvc.clearResults($scope);
						$ihPieSrvc.getHoroscopeData($scope);
						break;
					case 7: // Weather
						$ihPieSrvc.clearResults($scope);
						$ihPieSrvc.getWeatherData($scope);
						break;
					default:
						$ihPieSrvc.clearResults($scope);
						break;
				}
			});
		}
	};
});

directModule.directive('ihSplashScreen', function ($ihREST, $timeout, $state, $ihUtil, $ihCache, $ihHomepageSrvc) {
	return {
		restrict: 'E',
		template: '<div class="ihSplash ihNoScrollX ihNoScrollY" ng-show="showLoading === true"><i class="icon ion-loading-c"></i></div>',
		link: function($scope, element, attrs) {
			var state = $state,
				$el = angular.element(element),
				articlesCache = $ihCache.get('articlesObj');
			$scope.showLoading = true;

			/* Show splash for 1s */
			$timeout(function () {
				$ihREST.loadHomepageData().then(function (data) {
					var articles = $ihHomepageSrvc.buildArticlesObj(data);

					// cash articles object to prevent page reload
					if (!articlesCache || shouldRefreshCache) {
						$ihCache.put('splashShown', true);
						$ihCache.put('articlesObj', articles);
					}

					var $splash = angular.element($el.children()[0]);
					$splash.addClass('ihOpacity0');
					$scope.$broadcast('ihSplashScreenShown');

					/* Dismiss splash after 500ms */
					$timeout(function () {
						$scope.showLoading = false;
					}, 300);
				}, function () {
					$ihCache.put('splashShown', false);
					$scope.showLoading = false;

					state.go('app.error');
				});
			}, 1000);
		}
	};
});