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

directModule.directive('ihPie', function ($compile, $timeout, $ihCache, $ihPieSrvc, $ihUtil, $ihPopupUtil, $rootScope, $state, $location) {
	return {
		restrict: 'E',
		templateUrl: 'templates/pie.html',
		link: function($scope, element, attrs) {
			var state = $state;
			$scope.$on('$stateChangeStart', onStateChangeStart);
			$scope.selectedSlice = 0;
			$scope.title = 'תפריט';
			$scope.noResultsFlag = false;
			$scope.connErrorFlag = false;
			$scope.shouldShowPie = true;
			$scope.showLoading = false;
			$scope.showSearchInput = false;
			$scope.showShareOptions = false;
			$scope.showFullResult = false;
			$scope.fullResultText = '';
			$scope.sliceAnimState = 'show';
			$scope.showBackLink = false;
			$scope.backLinkText = '';
			$scope.slices = [
				{ index: $ihPieSrvc.SLICE_INDEXES.favorites, title: 'מועדפים', icon: 'star' },
				{ index: $ihPieSrvc.SLICE_INDEXES.rss, title: 'מבזקים', icon: 'radio-waves' },
				{ index: $ihPieSrvc.SLICE_INDEXES.search, title: 'חיפוש', icon: 'ios7-search-strong' },
				{ index: $ihPieSrvc.SLICE_INDEXES.categories, title: 'קטגוריות', icon: 'android-sort' },
				{ index: $ihPieSrvc.SLICE_INDEXES.opinions, title: 'דעות', icon: 'person-stalker' },
				{ index: $ihPieSrvc.SLICE_INDEXES.horoscope, title: 'הורוסקופ', icon: 'aperture' },
				{ index: $ihPieSrvc.SLICE_INDEXES.weather, title: 'מזג האוויר', icon: 'ios7-partlysunny' },
				{ index: $ihPieSrvc.SLICE_INDEXES.share, title: 'שיטוף', icon: 'android-share' }
			];
			$scope.shareOptions = [
				{ index: $ihPieSrvc.SHARE_OPTIONS.facebook, title: 'Facebook', icon: 'ion-social-facebook' },
				{ index: $ihPieSrvc.SHARE_OPTIONS.twitter, title: 'Twitter', icon: 'ion-social-twitter' },
				{ index: $ihPieSrvc.SHARE_OPTIONS.whatsApp, title: 'WhatsApp', icon: 'ihIconWhatsApp' }
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
				if ($index == $ihPieSrvc.SLICE_INDEXES.weather && !isIconClicked) {
					$timeout(function() {
						angular.element(document.querySelector('.ihPieSliceInner-1_8')).triggerHandler('click');
					}, 0);
				}
			};

			function onStateChangeStart(e, toState, toParams, fromState, fromParams) {
				e.preventDefault();

				var artId = toParams.articleId || '',
					opId = toParams.opinionId || '';

				$scope.sliceAnimState = 'hide';
				$scope.selectedSlice = $ihPieSrvc.SLICE_INDEXES.none;
				$ihPieSrvc.clearResults($scope);

				$timeout(function() {
					$scope.shouldShowPie = false;
					$ihPopupUtil.hideModal($rootScope);

					switch (toState.name) {
						case 'app.article':
							$location.path('/app/articles/' + artId);
							break;
						case 'app.opinion':
							$location.path('/app/opinions/' + opId);
							break;
					}

					// remove state change listener
					$scope.$$listeners.$stateChangeStart = [];
				}, 500, true);
			}

			$scope.$on('$destroy', function() {
				$scope.modal.remove();
			});
			$scope.$on('modal.hidden', function() {
				$scope.sliceAnimState = 'hide';
				$scope.selectedSlice = $ihPieSrvc.SLICE_INDEXES.none;
				$ihPieSrvc.clearResults($scope);
				$scope.shouldShowPie = false;
				$scope.$$listeners.$stateChangeStart = [];
				// $timeout(function() {
				// }, 300, false);
			});
			$scope.$on('modal.removed', function() {
				console.log('in modal.removed');
			});
			$scope.$on('modal.shown', function() {
				$scope.shouldShowPie = true;
				$scope.sliceAnimState = 'show';
				// $scope.title = 'תפריט';
				$scope.$on('$stateChangeStart', onStateChangeStart);
			});

			$scope.search = function (query) {
				$ihPieSrvc.getSearchData($scope, query);
			};

			$scope.showSingleResult = function (item) {
				if ($scope.selectedSlice === $ihPieSrvc.SLICE_INDEXES.horoscope) {
					$ihPieSrvc.showFullHoroscope($scope, item);
				}
			};

			$scope.goBack = function () {
				$ihPieSrvc.goBack($scope);
			};

			$scope.goToCategory = function (key) {
				$ihPieSrvc.goToCategory($scope, key);
			};

			$scope.onShareOptionClick = function (index) {
				$ihPieSrvc.onShareOptionClick($scope, index);
			};

			$scope.hideModal = function ($event) {
				var $el = angular.element($event.target);

				/* Check if we clicked on empty space */
				if ($el.hasClass('ihPieBodyContainer') || $el.hasClass('pane') || $el.hasClass('ihPieWrapper') ||
						$el.hasClass('ihPieHeaderContainer') || $el.hasClass('ihPieResultsContainerUl')) {
					$scope.sliceAnimState = 'hide';
					$scope.selectedSlice = $ihPieSrvc.SLICE_INDEXES.none;
					$ihPieSrvc.clearResults($scope);

					$timeout(function() {
						$scope.shouldShowPie = false;
						$ihPopupUtil.hideModal($rootScope);
					}, 500, true);

				}
			};

			$scope.$watch('selectedSlice', function(newValue, oldValue){
				// Check if value has changes
				if(newValue === oldValue){
					return;
				}

				if (newValue === $ihPieSrvc.SLICE_INDEXES.none) {
					$scope.title = 'תפריט';
					return;
				}

				if (newValue !== $ihPieSrvc.SLICE_INDEXES.search && newValue !== $ihPieSrvc.SLICE_INDEXES.share) {
					$ihPieSrvc.showLoading($scope);
				}
				$timeout(function () {
					switch (newValue) {
						case $ihPieSrvc.SLICE_INDEXES.favorites:
							$ihPieSrvc.clearResults($scope);
							$ihPieSrvc.getFavoritesData($scope);
							break;
						case $ihPieSrvc.SLICE_INDEXES.rss:
							$ihPieSrvc.clearResults($scope);
							$ihPieSrvc.getRSSData($scope);
							break;
						case $ihPieSrvc.SLICE_INDEXES.search:
							$ihPieSrvc.clearResults($scope);
							$ihPieSrvc.showSearchInput($scope);
							break;
						case $ihPieSrvc.SLICE_INDEXES.categories:
							$ihPieSrvc.clearResults($scope);
							$ihPieSrvc.getCategoriesData($scope);
							break;
						case $ihPieSrvc.SLICE_INDEXES.opinions:
							$ihPieSrvc.clearResults($scope);
							$ihPieSrvc.getOpinionsData($scope);
							break;
						case $ihPieSrvc.SLICE_INDEXES.horoscope:
							$ihPieSrvc.clearResults($scope);
							$ihPieSrvc.getHoroscopeData($scope);
							break;
						case $ihPieSrvc.SLICE_INDEXES.weather:
							$ihPieSrvc.clearResults($scope);
							$ihPieSrvc.getWeatherData($scope);
							break;
						case $ihPieSrvc.SLICE_INDEXES.share:
							$ihPieSrvc.clearResults($scope);
							$ihPieSrvc.showShareOptions($scope);
							break;
						default:
							$ihPieSrvc.clearResults($scope);
							break;
					}
				}, 300);
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