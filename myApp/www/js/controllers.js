var ctrlModule = angular.module('starter.controllers', []);

ctrlModule.controller('AppCtrl', function($scope, $ihUtil) {
	if (!$ihUtil.getObjectFromLocalStorage('favoritesObj')) {
		$ihUtil.setObjectToLocalStorage('favoritesObj', {});
	}
});

ctrlModule.controller('ArticlesCtrl',
	function($scope, $q, $state, $ihUtil, $ihHomepageSrvc, $ihREST, $ihCache, $ionicListDelegate, toaster) {
	var state = $state,
		articlesCache = $ihCache.get('articlesObj'),
		splashShown = $ihCache.get('splashShown'),
		favoritesCache = $ihUtil.getObjectFromLocalStorage('favoritesObj');

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
			$ihUtil.showLoading();
			$ihREST.loadHomepageData().then(function (data) {
				var articles = $ihHomepageSrvc.buildArticlesObj(data);

				$scope.articles = articles;
				$ihHomepageSrvc.animateRSS();

				// cash articles object to prevent page reload
				if (!articlesCache || shouldRefreshCache) {
					$ihCache.put('articlesObj', articles);
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

	$scope.$on('ihSplashScreenShown', function(event, args) {
		var newArticlesCache = $ihCache.get('articlesObj');
		$scope.articles = newArticlesCache;
		$ihHomepageSrvc.animateRSS();
	});

	$scope.doRefresh = function() {
		_init(state, true).finally(function () {
			$scope.$broadcast('scroll.refreshComplete');
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

ctrlModule.controller('ArticleCtrl', function($scope, $stateParams, $state, $q, $ihUtil, $ihArticleSrvc, $ihREST, $compile) {
	var artId = $stateParams.articleId;
	var state = $state;

	function _init(state) {
		var deferred = $q.defer();

		$ihUtil.showLoading();
		$ihREST.loadArticleData(artId).then(function (data) {

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

	_init(state).finally(function () {
		$ihREST.loadArticleComment(artId).then(function (data) {
			$scope.comments = data.comments;
		}, function () {
			// TODO: display a comment error message
		});
	});
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

ctrlModule.controller('SearchCtrl', function($scope, $state, $q, $ihUtil, $ihREST, $ihSearchSrvc, $ihCache, $ihPopupUtil) {
	var state = $state,
		searchCache = $ihCache.get('searchObj');

	$scope.search = function (query) {
		_searchIH(state, query);
	};
	$scope.searchQuery = '';

	$scope.showModal = function() {
		$ihPopupUtil.showModal($scope);
	};

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

ctrlModule.controller('OpinionCtrl', function($scope, $stateParams, $state, $q, $ihUtil, $ihArticleSrvc, $ihOpinionsSrvc, $ihREST) {
	var opId = $stateParams.opinionId;
	var state = $state;

	function _init(state) {
		var deferred = $q.defer();

		$ihUtil.showLoading();
		$ihREST.loadOpinionData(opId).then(function (data) {

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

	_init(state).finally(function () {
		$ihREST.loadArticleComment(opId).then(function (data) {
			$scope.comments = data.comments;
		}, function () {
			// TODO: display a comment error message
		});
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

	$scope.showTabLoading = function () {
		$ihUtil.delayCacheLoad(function (){}, 500);
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