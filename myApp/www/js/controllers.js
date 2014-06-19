var ctrlModule = angular.module('starter.controllers', []);

ctrlModule.controller('AppCtrl', function($scope, $ihUtil) {
	if (!$ihUtil.getObjectFromLocalStorage('favoritesObj')) {
		$ihUtil.setObjectToLocalStorage('favoritesObj', {});
	}
});

ctrlModule.controller('ArticlesCtrl',
	function($scope, $q, $state, $ihUtil, $ihHomepageSrvc, $ihREST, $ihCache, $ionicListDelegate, $timeout, $compile, toaster) {
	var state = $state,
		articlesCache = $ihCache.get('articlesObj'),
		favoritesCache = $ihUtil.getObjectFromLocalStorage('favoritesObj');

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

	_init(state);

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
			$scope.article = article;

			// var markup = article.content.html;
			// var domEl = angular.element();
			// angular.element(domEl).html($compile(markup)($scope));

			// var element = angular.element(article.content.html);
			// $compile(element.contents())($scope);
			// console.log('done');

			// var el = $compile(article.content.html)($scope);
			// $element.append(el);

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
			$scope.categories = categoriesCache;
			deferred.resolve();
		} else {
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

	$scope.errorTitle = 'אופס! משהו קרה פה..';
	$scope.errorText = $ihCache.get('errorText') || defaultErrorText;
});

ctrlModule.controller('SearchCtrl', function($scope, $state, $q, $ihUtil, $ihREST, $ihCategorySrvc, $ihPopupUtil) {
	var state = $state;

	$scope.search = function (query) {
		_searchIH(state, query);
	};

	$scope.showModal = function () {
		$ihPopupUtil.showModal($scope);
	};

	function _searchIH(state, query) {
		var deferred = $q.defer();

		if (!query) { return; }

		$ihUtil.showLoading();
		$ihREST.loadSearchResults(query).then(function (data) {

			$scope.results = $ihCategorySrvc.buildCategoryObj(data.results);

			deferred.resolve();
			$ihUtil.hideLoading();
		}, function () {
			deferred.reject();
			$ihUtil.hideLoading();

			state.go('app.error');
		});

		return deferred.promise;
	}
});

ctrlModule.controller('FavoritesCtrl', function($scope, $ihCache, $ihUtil, $ihFavoritesSrvc, toaster) {
	var favoritesCache = $ihUtil.getObjectFromLocalStorage('favoritesObj'),
		articlesCache = $ihCache.get('articlesObj');

	$scope.noFavoritesTitle = 'לא נמצאו מועדפים';
	$scope.noFavoritesMsg = 'ניתן להיסיף למועדפים על ידי ביצוע סוואיפ על הכתבה';

	$scope.noResultsFlag = favoritesCache && !Object.keys(favoritesCache).length;
	$scope.favorites = angular.copy(favoritesCache);

	$scope.onDeleteFavorite = function (favId) {
		$scope.favToRetain = favoritesCache[favId];
		delete $scope.favorites[favId];
		delete favoritesCache[favId];
		$ihFavoritesSrvc.removeFromFavorites( articlesCache, parseInt(favId, 10) );
		if (!Object.keys(favoritesCache).length) {
			$scope.noResultsFlag = true;
		}

		toaster.pop('success', 'כתבה נשמרה במועדפים. לחץ על ההודעה זו כדי לבטל', null, null, null, function () {
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
