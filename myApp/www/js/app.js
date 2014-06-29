// Ionic Starter App

var appModule = angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'starter.directives', 'toaster']);

appModule.run(function($ionicPlatform) {
	$ionicPlatform.ready(function() {
		// Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
		// for form inputs)
		if(window.cordova && window.cordova.plugins.Keyboard) {
			cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
		}
		if(window.StatusBar) {
			// org.apache.cordova.statusbar required
			StatusBar.styleDefault();
		}
	});
});

appModule.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
	//enable Cross-Domain requests
	$httpProvider.defaults.useXDomain = true;
	delete $httpProvider.defaults.headers.common['X-Requested-With'];

	$stateProvider
		.state('app', {
			url: "/app",
			abstract: true,
			templateUrl: "templates/menu.html",
			controller: 'AppCtrl'
		})
		.state('app.error', {
			url: "/error",
			views: {
				'menuContent' :{
					templateUrl: "templates/error.html",
					controller: 'ErrorCtrl'
				}
			}
		})
		.state('app.search', {
			url: "/search",
			views: {
				'menuContent' :{
					templateUrl: "templates/search.html",
					controller: 'SearchCtrl'
				}
			}
		})
		.state('app.opinions', {
			url: "/opinions",
			views: {
				'menuContent' :{
					templateUrl: "templates/opinions.html",
					controller: 'OpinionsCtrl'
				}
			}
		})
		.state('app.favorites', {
			url: "/favorites",
			views: {
				'menuContent' :{
					templateUrl: "templates/favorites.html",
					controller: 'FavoritesCtrl'
				}
			}
		})
		.state('app.rss', {
			url: "/rss",
			views: {
				'menuContent' :{
					templateUrl: "templates/rss.html",
					controller: 'RSSCtrl'
				}
			}
		})
		.state('app.categories', {
			url: "/categories",
			views: {
				'menuContent' :{
					templateUrl: "templates/categories.html",
					controller: 'CategoriesCtrl'
				}
			}
		})
		.state('app.category', {
			url: "/categories/:categoryName",
			views: {
				'menuContent' :{
					templateUrl: "templates/category.html",
					controller: 'CategoryCtrl'
				}
			}
		})
		.state('app.articles', {
			url: "/articles",
			views: {
				'menuContent' :{
					templateUrl: "templates/articles.html",
					controller: 'ArticlesCtrl'
				}
			}
		})
		.state('app.article', {
			url: "/articles/:articleId",
			views: {
				'menuContent' :{
					templateUrl: "templates/article.html",
					controller: 'ArticleCtrl'
				}
			}
		});
  // if none of the above states are matched, use this as the fallback
	$urlRouterProvider.otherwise('/app/articles');

});

