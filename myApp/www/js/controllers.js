var ctrlModule = angular.module('starter.controllers', []);

ctrlModule.controller('AppCtrl', function($scope, $rootScope, $ihUtil, $ihPopupUtil) {
	if (!$ihUtil.getObjectFromLocalStorage('favoritesObj')) {
		$ihUtil.setObjectToLocalStorage('favoritesObj', {});
	}

	$rootScope.onHoldShowModal = function ($event) {
		var $el = angular.element($event.target);

		if ($el.hasClass('scroll-content') || $el.hasClass('button')) {
			return;
		} else {
			$rootScope.showModal();
		}
	};
	$rootScope.showModal = function() {
		$ihPopupUtil.showModal($rootScope);
	};
	$rootScope.hideModal = function() {
		$ihPopupUtil.hideModal($rootScope);
	};
});

ctrlModule.controller('ArticlesCtrl',
	function($scope, $q, $state, $ihUtil, $ihHomepageSrvc, $ihREST, $ihCache, $ionicListDelegate, toaster) {
	var state = $state,
		articlesCache = $ihCache.get('articlesObj'),
		splashShown = $ihCache.get('splashShown'),
		favoritesCache = $ihUtil.getObjectFromLocalStorage('favoritesObj');
	$scope.isRefreshing = false;

	if (splashShown === true) {
		$ihUtil.delayCacheLoad(function () {
			$scope.articles = articlesCache;
			$ihHomepageSrvc.animateRSS();
		});
	}
	if (splashShown === false) {
		_init(state);
	}

	function _init(state, shouldRefreshCache) {
		var deferred = $q.defer();

		if (articlesCache && !shouldRefreshCache) {
			$scope.articles = articlesCache;
			$ihHomepageSrvc.animateRSS();
			deferred.resolve();
		} else {
			if (!shouldRefreshCache) { $ihUtil.showLoading(); }
			$ihREST.loadHomepageData().then(function (data) {
				var articles = $ihHomepageSrvc.buildArticlesObj(data);

				$scope.articles = articles;
				$ihHomepageSrvc.animateRSS();

				// cash articles object to prevent page reload
				if (!articlesCache || shouldRefreshCache) {
					$ihCache.put('articlesObj', articles);
				}

				deferred.resolve();
				if (!shouldRefreshCache) { $ihUtil.hideLoading(); }
			}, function () {
				deferred.reject();
				if (!shouldRefreshCache) { $ihUtil.hideLoading(); }

				state.go('app.error');
			});
		}

		return deferred.promise;
	}

	$scope.$on('ihSplashScreenShown', function(event, args) {
		var newArticlesCache = $ihCache.get('articlesObj');
		$scope.articles = newArticlesCache;
		$ihHomepageSrvc.animateRSS();
	});

	$scope.onRefresh = function(isBtnPressed) {
		if (isBtnPressed) { $scope.isRefreshing = true; }
		_init(state, true).finally(function () {
			if (isBtnPressed) {
				$scope.isRefreshing = false;
			} else {
				$scope.$broadcast('scroll.refreshComplete');
			}
		});
	};

	$scope.goToRSS = function () {
		state.go('app.rss');
	};

	$scope.onFavorites = function (item, $event) {
		var el = angular.element($event.target);
		$event.preventDefault();

		if (!item.inFavorites) {
			item.inFavorites = true;
			favoritesCache[item.nid] = item;

			toaster.pop('success', "כתבה נשמרה במועדפים");
		}

		$ionicListDelegate.closeOptionButtons();
	};

	$scope.$on('$destroy', function() {
		$ihUtil.setObjectToLocalStorage('favoritesObj', favoritesCache);
	});

});

ctrlModule.controller('ArticleCtrl', function($scope, $stateParams, $state, $q, $ihUtil, $ihArticleSrvc, $ihREST, $compile, toaster) {
	$scope.artId = $stateParams.articleId;
	var	state = $state,
		favoritesCache = $ihUtil.getObjectFromLocalStorage('favoritesObj');

	function _init(state) {
		var deferred = $q.defer();

		$ihUtil.showLoading();
		$ihREST.loadArticleData($scope.artId).then(function (data) {

			var article = $ihArticleSrvc.buildArticleObj(data);

			/* Compile video directives */
			/* Temporary disable videos as it requires payment on mobile */
			/*
			var $articleHtml = angular.element(document.getElementsByClassName('ihArticleHtml'));
			$articleHtml.html(article.content.html);
			$compile($articleHtml.contents())($scope);
			*/

			$scope.article = article;

			deferred.resolve();
			$ihUtil.hideLoading();
		}, function () {
			deferred.reject();
			$ihUtil.hideLoading();

			state.go('app.error');
		});

		return deferred.promise;
	}

	$scope.onFavoriteClick = function (isInFavorites) {
		if (!isInFavorites) {
			$scope.article.inFavorites = true;
			$ihArticleSrvc.addImageForFavorites($scope.article);
			favoritesCache[$scope.article.nid] = $scope.article;

			toaster.pop('success', "כתבה נשמרה במועדפים");
		} else {
			$scope.article.inFavorites = false;
			delete favoritesCache[$scope.article.nid];

			toaster.pop('success', "כתבה הוסרה ממועדפים");
		}
	};

	$scope.$on('$destroy', function() {
		$ihUtil.setObjectToLocalStorage('favoritesObj', favoritesCache);
	});

	_init(state);

});

ctrlModule.controller('CategoriesCtrl', function($scope, $state, $q, $ihUtil, $ihREST, $ihCategoriesSrvc, $ihCache, $ionicActionSheet) {
	var state = $state,
		categoriesCache = $ihCache.get('categoriesObj');

	function _init(state) {
		var deferred = $q.defer();

		if (categoriesCache) {
			$ihUtil.delayCacheLoad(function () {
				$scope.categories = categoriesCache;
				deferred.resolve();
			});
		} else {
			$ihUtil.delayCacheLoad(function () {
				$ihUtil.showLoading();
				$ihREST.loadCategoriesData().then(function (data) {

					data = $ihCategoriesSrvc.filterByLangHeb(data);
					$scope.categories = angular.copy(data);

					if (!categoriesCache) {
						$ihCache.put('categoriesObj', data);
					}

					deferred.resolve();
					$ihUtil.hideLoading();
				}, function () {
					deferred.reject();
					$ihUtil.hideLoading();

					state.go('app.error');
				});
			});
		}

		return deferred.promise;
	}

	_init(state);

});

ctrlModule.controller('CategoryCtrl', function($scope, $state, $stateParams, $q, $ihUtil, $ihREST, $ihCategorySrvc, $ihCache) {
	var catName = $stateParams.categoryName,
		state = $state;

	function _init(state) {
		var deferred = $q.defer();

		$ihUtil.showLoading();
		$ihREST.loadCategoryData(catName).then(function (data) {

			$scope.categoryName = catName;
			$scope.category = $ihCategorySrvc.buildCategoryObj(data);

			deferred.resolve();
			$ihUtil.hideLoading();
		}, function () {
			deferred.reject();
			$ihUtil.hideLoading();

			// store the error message and go to error page
			$ihCache.put('errorText', 'אירעה שגיאה בעת טעינת קטגוריה: ' + catName);
			state.go('app.error');
		});

		return deferred.promise;
	}

	_init(state);

});

ctrlModule.controller('ErrorCtrl', function($scope, $ihCache) {
	var defaultErrorText = "אירעה שגיאה בעת טעינת נתונים";

	$scope.errorTitle = 'אופס!';
	$scope.errorText = $ihCache.get('errorText') || defaultErrorText;
});

ctrlModule.controller('SearchCtrl', function($scope, $state, $q, $ihUtil, $ihREST, $ihSearchSrvc, $ihCache) {
	var state = $state,
		searchCache = $ihCache.get('searchObj');

	$scope.search = function ($event, query) {
		/*We want ho hide the keyboard by when user presses 'go' button, by triggering focus on element other than input */
		var menuBtn = document.getElementsByClassName('button')[1];
		if (menuBtn) {
			menuBtn.focus();
		}

		_searchIH(state, query);
	};
	$scope.searchQuery = '';

	function _searchIH(state, query) {
		var deferred = $q.defer();

		if (!query) { return; }

		$ihUtil.showLoading();
		$ihREST.loadSearchResults(query).then(function (data) {

			var results = $ihSearchSrvc.buildSearchObj(data.results);
			$scope.results = results;

			if (!searchCache) {
				$ihCache.put('searchObj', {
					results: results,
					searchQuery: query
				});
			}

			deferred.resolve();
			$ihUtil.hideLoading();
		}, function () {
			deferred.reject();
			$ihUtil.hideLoading();

			state.go('app.error');
		});

		return deferred.promise;
	}

	function _init() {
		if (searchCache) {
			$ihUtil.delayCacheLoad(function () {
				$scope.results = searchCache.results;
				$scope.searchQuery = searchCache.searchQuery;
			});
		}
	}
	_init();

});

ctrlModule.controller('FavoritesCtrl', function($scope, $ihCache, $ihUtil, $ihFavoritesSrvc, toaster) {
	var favoritesCache = $ihUtil.getObjectFromLocalStorage('favoritesObj'),
		articlesCache = $ihCache.get('articlesObj');

	$ihUtil.delayCacheLoad(function () {
		$scope.noFavoritesTitle = 'לא נמצאו מועדפים';
		$scope.noFavoritesMsg = 'ניתן להיסיף למועדפים על ידי ביצוע סוואיפ על הכתבה';

		$scope.noResultsFlag = favoritesCache && !Object.keys(favoritesCache).length;
		$scope.favorites = angular.copy(favoritesCache);
	});

	$scope.onDeleteFavorite = function (favId) {
		$scope.favToRetain = favoritesCache[favId];
		delete $scope.favorites[favId];
		delete favoritesCache[favId];
		$ihFavoritesSrvc.removeFromFavorites( articlesCache, parseInt(favId, 10) );
		if (!Object.keys(favoritesCache).length) {
			$scope.noResultsFlag = true;
		}

		toaster.pop('success', 'כתבה נמחקה. לחץ לביטול', null, null, null, function () {
			var favToRetain = angular.copy($scope.favToRetain);
			$scope.favorites[favId] = favToRetain;
			favoritesCache[favId] = favToRetain;

			$scope.noResultsFlag = false;
		});
	};

	$scope.$on('$destroy', function() {
		$ihUtil.setObjectToLocalStorage('favoritesObj', favoritesCache);
		$ihCache.put('articlesObj', articlesCache);
	});

});

ctrlModule.controller('RSSCtrl', function($scope, $ihUtil, $ihREST, $q, $state, $ihCache, $ihRSSSrvc) {
	var state = $state;
	$scope.isRefreshing = false;

	function _init(state) {
		var deferred = $q.defer();

		$ihUtil.showLoading();
		$ihREST.loadRSSData().then(function (data) {

			$scope.rss = $ihRSSSrvc.buildRSSObj(data);

			deferred.resolve();
			$ihUtil.hideLoading();
		}, function () {
			deferred.reject();
			$ihUtil.hideLoading();

			state.go('app.error');
		});

		return deferred.promise;
	}

	_init(state);

	$scope.onRefresh = function(isBtnPressed) {
		if (isBtnPressed) { $scope.isRefreshing = true; }
		_init(state).finally(function () {
			if (isBtnPressed) { $scope.isRefreshing = false; }
		});
	};
});

ctrlModule.controller('OpinionsCtrl', function($scope, $state, $q, $ihREST, $ihCache, $ihUtil, $ihOpinionsSrvc) {
	var state = $state,
		opinionsCache = $ihCache.get('opinionsObj');

	function _init(state) {
		var deferred = $q.defer();

		if (opinionsCache) {
			$ihUtil.delayCacheLoad(function () {
				$scope.opinions = opinionsCache;
				deferred.resolve();
			});
		} else {
			$ihUtil.showLoading();
			$ihREST.loadOpinionsData().then(function (data) {
				var opinions = $ihOpinionsSrvc.buildOpinionsObj(data);
				$scope.opinions = opinions;

				if (!opinionsCache) {
					$ihCache.put('opinionsObj', opinions);
				}

				deferred.resolve();
				$ihUtil.hideLoading();
			}, function () {
				deferred.reject();
				$ihUtil.hideLoading();

				state.go('app.error');
			});
		}

		return deferred.promise;
	}

	_init(state);

});

ctrlModule.controller('OpinionCtrl', function($scope, $stateParams, $state, $q, $ihUtil, $ihArticleSrvc, $ihOpinionsSrvc, $ihREST, toaster) {
	$scope.opId = $stateParams.opinionId;
	var	state = $state,
		favoritesCache = $ihUtil.getObjectFromLocalStorage('favoritesObj');

	function _init(state) {
		var deferred = $q.defer();

		$ihUtil.showLoading();
		$ihREST.loadOpinionData($scope.opId).then(function (data) {

			var opinion = $ihArticleSrvc.buildArticleObj(data);
			opinion.content.intro = $ihOpinionsSrvc.fixOpinionIntro(opinion.content.intro);
			$scope.opinion = angular.copy(opinion);

			deferred.resolve();
			$ihUtil.hideLoading();
		}, function () {
			deferred.reject();
			$ihUtil.hideLoading();

			state.go('app.error');
		});

		return deferred.promise;
	}

	$scope.onFavoriteClick = function (isInFavorites) {
		if (!isInFavorites) {
			$scope.opinion.inFavorites = true;
			$ihArticleSrvc.addImageForFavorites($scope.opinion);
			favoritesCache[$scope.opinion.nid] = $scope.opinion;

			toaster.pop('success', "כתבה נשמרה במועדפים");
		} else {
			$scope.opinion.inFavorites = false;
			delete favoritesCache[$scope.opinion.nid];

			toaster.pop('success', "כתבה הוסרה ממועדפים");
		}
	};

	_init(state);

	$scope.$on('$destroy', function() {
		$ihUtil.setObjectToLocalStorage('favoritesObj', favoritesCache);
	});
});

ctrlModule.controller('WeatherCtrl', function($scope, $state, $q, $ihUtil, $ihREST, $ihWeatherSrvc, $ihCache) {
	var state = $state,
		weatherCache = $ihCache.get('weatherObj');

	function _init(state) {
		var deferred = $q.defer();

		if (weatherCache) {
			$ihUtil.delayCacheLoad(function () {
				$scope.day = weatherCache[0];
				$scope.week = weatherCache[1];
				deferred.resolve();
			});
		} else {
			$ihUtil.showLoading();
			$ihREST.loadWeatherData().then(function (data) {

				$ihWeatherSrvc.prepareWeatherObj(data);

				$scope.day = angular.copy(data[0]);
				$scope.week = angular.copy(data[1]);

				if (!weatherCache) {
					$ihCache.put('weatherObj', data);
				}

				deferred.resolve();
				$ihUtil.hideLoading();
			}, function () {
				deferred.reject();
				$ihUtil.hideLoading();

				state.go('app.error');
			});
		}

		return deferred.promise;
	}

	_init(state);

	$scope.selectedTab = 0;
	$scope.showTabLoading = function (index) {
		$ihUtil.delayCacheLoad(function (){
			$scope.selectedTab = index;
		});
	};

});

ctrlModule.controller('HoroscopeCtrl', function($scope, $state, $q, $ihUtil, $ihREST, $ihHoroscopeSrvc, $ihCache) {
	var state = $state,
		horoscopeCache = $ihCache.get('horoscopeObj');

	function _init(state) {
		var deferred = $q.defer();

		if (horoscopeCache) {
			$ihUtil.delayCacheLoad(function () {
				$scope.week = horoscopeCache;
				deferred.resolve();
			});
		} else {
			$ihUtil.showLoading();
			$ihREST.loadHoroscopeData().then(function (data) {

				var horObj = $ihHoroscopeSrvc.buildHoroscopeObj(data);

				$scope.week = angular.copy(horObj);

				if (!horoscopeCache) {
					$ihCache.put('horoscopeObj', horObj);
				}

				deferred.resolve();
				$ihUtil.hideLoading();
			}, function () {
				deferred.reject();
				$ihUtil.hideLoading();

				state.go('app.error');
			});
		}

		return deferred.promise;
	}

	_init(state);

});