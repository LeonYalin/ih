var servModule = angular.module('starter.services', []);

servModule.factory('$ihCONSTS', function(){
	var url = {
		webDomain: 'http://www.israelhayom.co.il/',
		apiDomain: 'http://api.app.israelhayom.co.il/',
		key: '?key=nas987nh34',
		limit: '&limit=15',
		q: '&q=',
		lang: {
			en: '&lang=en',
			he: '&lang=he'
		},
		callback: '&callback=JSON_CALLBACK'
	};
	url.homepage = url.apiDomain + 'homepage/android' + url.key + url.callback;
	url.rss = url.apiDomain + 'content/newsflash' + url.key + url.callback;
	url.article = url.apiDomain + 'content/article/';
	url.comments = url.apiDomain + 'comment/';
	url.categories = url.apiDomain + 'category' + url.key + url.callback;
	url.category = url.apiDomain + 'category/';
	url.search = url.apiDomain + 'search' + url.key + url.callback + url.lang.he + url.q;

	return {
		url: url,
		imageSizes: {
			default: '125x125',
			thumbnail: 'thumbnail',
			medium: 'medium',
			large: 'large',
			s_100x70: '100x70',
			s_125x125: '125x125',
			s_237x98: '237x98',
			s_251x170: '251x170',
			s_296x122: '296x122',
			s_270x182: '270x182',
			s_324x192: '324x294',
			s_324x294: '324x294',
			s_433x295: '433x295',
			s_490x301: '490x301'
		}
	};
});

servModule.factory('$ihCache', function($cacheFactory) {
	return $cacheFactory('data');
});

servModule.factory('$ihGlobalObj', function($cacheFactory) {
	return $cacheFactory('data');
});

servModule.factory('$ihUtil', function($ionicLoading, $ionicPopup, $ihCONSTS, $window){
	return {
		showLoading: function () {
			$ionicLoading.show({
				template: '<i class="icon ion-loading-c"></i> טוען...'
			});
		},
		hideLoading: function () {
			$ionicLoading.hide();
		},
		getWindowWidth: function () { return $window.innerWidth; },
		getWindowHeight: function () { return $window.innerHeight; },
		getFromLocalStorage: function (key) {return $window.localStorage.getItem(key); },
		setToLocalStorage: function (key, value) { return $window.localStorage.setItem(key, value); },
		getObjectFromLocalStorage: function (key) { return angular.fromJson($window.localStorage.getItem(key)); },
		setObjectToLocalStorage: function (key, value) { return $window.localStorage.setItem(key, angular.toJson(value)); },
		getFromSessionStorage: function (key) { return $window.sessionStorage.getItem(key); },
		setToSessionStorage: function (key, value) { return $window.sessionStorage.setItem(key, value); }
	};
});

servModule.factory('$ihPopupUtil', function($ionicPopup, $timeout){
	return {
		showPopup: function ($scope) {
			var myPopup = $ionicPopup.show({
				template: '<input type="password" ng-model="data.wifi">',
				title: 'Enter Wi-Fi Password',
				subTitle: 'Please use normal things',
				scope: $scope,
				buttons: [
					{ text: 'Cancel' },
					{
						text: '<b>Save</b>',
						type: 'button-positive',
						onTap: function(e) {
							return 'success result data' + e;
						}
					},
				]
			});
			myPopup.then(function(res) {
				console.log('Tapped!', res);
			});
			$timeout(function() {
				myPopup.close(); //close the popup after 3 seconds for some reason
			}, 3000);
		}

	};
});

servModule.factory('$ihHomepageSrvc', function($ihCONSTS, $ihUtil, $timeout){
	return {
		/**
		* Each image url looks like: "sites/default/files/styles/[DEFAULT]/public/images/articles/2014/05/28/14012838254935_b.jpg"
		* We need to modify the url so it will look like:
		* "http://www.israelhayom.co.il/sites/default/files/styles/237x98/public/images/articles/2014/05/28/14012838254935_b.jpg"
		* To achieve this we need to first replace the "[DEFAULT]" with relevant image size,
		* and then add http://www.israelhayom.co.il/ to the beginning of the link
		*/
		fixImagePath: function (arr, size) {
			if (!arr) return;

			var imgSize = size ? size : $ihCONSTS.imageSizes.default,
				imagePath = '';
			angular.forEach(arr, function(item) {
				for (var i = 0; i < item.images.length; i++) {
					imagePath = item.images[i].path;
					imagePath = imagePath.replace('[DEFAULT]', imgSize);
					imagePath = $ihCONSTS.url.webDomain + imagePath;

					item.images[i].path = imagePath;
				}
			});
		},
		checkFavorites: function (arr) {
			if (!arr) return;

			var favoritesObj = $ihUtil.getObjectFromLocalStorage('favoritesObj');
			angular.forEach(favoritesObj, function (item) {
				for (var i = 0; i < arr.length; i++) {
					if (item.nid === arr[i].nid) {
						arr[i].inFavorites = true;
					}
				}
			});
		},
		/* Get only elements that contain RSS */
		filterByRSS: function (arr) {
			if (!arr) return;

			return arr.filter(function (elem) {
				return elem.type === 'newsflash';
			});
		},
		/* delete huge raw & tokened strings for better performance */
		buildSingleArticle: function (arr) {
			if (!arr) return;

			return arr.map(function(item) {
				var el = angular.copy(item);
				delete el.content.raw;
				delete el.content.tokened;

				return el;
			});
		},
		buildArticlesObj: function (data) {
			if (!data) return;

			var articlesObj = {
				primary: this.buildSingleArticle(data.primary),
				secondary: this.buildSingleArticle(data.secondary),
				news: this.buildSingleArticle(data.news)
			};

			this.fixImagePath(articlesObj.primary, 'large');
			this.fixImagePath(articlesObj.secondary);
			this.fixImagePath(articlesObj.news);
			articlesObj.rss = this.filterByRSS(data.excluded);

			this.checkFavorites(articlesObj.secondary);
			this.checkFavorites(articlesObj.news);

			return articlesObj;
		},
		createKFAnimation: function(animName, contWidth) {
			var kfAnimation = document.createElement('style'),
				prefixes = ['-webkit-', '-moz-', '-ms-', '-o-', ''],
				rule = '',
				windowWidth = $ihUtil.getWindowWidth(),
				translOffset = contWidth + windowWidth;

			kfAnimation.type = 'text/css';

			angular.forEach(prefixes, function(prefix) {
				rule = document.createTextNode('@' + prefix + 'keyframes ' + animName + ' {'+
				'from { ' + prefix + 'transform: translate3d(-' + windowWidth + 'px, 0px, 0px); }'+
				'to { ' + prefix + 'transform: translate3d(' + translOffset +  'px, 0px, 0px); }'+
				'}');
				kfAnimation.appendChild(rule);
			});

			document.getElementsByTagName("head")[0].appendChild(kfAnimation);
		},
		animateRSS: function() {
			var self = this;

			$timeout(function () {
				var $rssContainer = document.querySelector('.ihRSSContainer'),
					$rssContainerWidth = $rssContainer.offsetWidth,
					$elem = angular.element($rssContainer),
					animName = 'ihMarquee',
					windowWidth = $ihUtil.getWindowWidth(),
					finalWidth = $rssContainerWidth + (2 * windowWidth), /* + 2*window width because slide offset*/
					rowReadCoeff = parseInt(windowWidth / 40, 10), /* every 50 seconds user reads a row */
					animDur = parseInt(finalWidth / windowWidth, 10) * rowReadCoeff;

				self.createKFAnimation(animName, $rssContainerWidth);
				$elem.css({
					visibility: 'visible',
					WebkitAnimation : animName + ' ' + animDur + 's linear infinite',
				});
			}, 1000);
		}
	};
});

servModule.factory('$ihFavoritesSrvc', function(){
	return {
		/* Get only elements that are in hebrew */
		removeFromFavorites: function (artCacheObj, favId) {
			if (!artCacheObj) return;
			var item;

			for (var prop in artCacheObj) {
				if (prop === 'rss') continue; // we don't want to check RSS

				for (var i = 0; i < artCacheObj[prop].length; i++) {
					item = artCacheObj[prop][i];
					if (item.nid == favId) {
						delete item.inFavorites;
					}
				}
			}
		}
	};
});

servModule.factory('$ihRSSSrvc', function(){
	return {
		/* Get only elements that are in hebrew */
		buildRSSObj: function (rssArr) {
			if (!rssArr) return;
			var rssObj = [];

			angular.forEach(rssArr, function(item) {
				rssObj.push({
					text: item.content.title,
					date: item.date
				});
			});

			return rssObj;
		}
	};
});

servModule.factory('$ihCategoriesSrvc', function(){
	return {
		/* Get only elements that are in hebrew */
		filterByLangHeb: function (catObj) {
			if (!catObj) return;

			var retObj = {};

			for (var catName in catObj) {
				var catProps = catObj[catName];
				if (catProps.lang === 'he') {
					retObj[catName] = catProps;
				}
			}

			return retObj;
		}
	};
});

servModule.factory('$ihCategorySrvc', function($ihCONSTS, $ihHomepageSrvc){
	return {
		/* delete huge raw & tokened strings for better performance */
		buildSingleCategory: function (arr) {
			if (!arr) return;

			return arr.map(function(item) {
				var el = angular.copy(item);
				delete el.content.raw;
				delete el.content.tokened;

				return el;
			});
		},
		buildCategoryObj: function (data) {
			if (!data) return;

			var categoryObj = data;
			$ihHomepageSrvc.fixImagePath(categoryObj);

			return categoryObj;
		}
	};
});


servModule.factory('$ihArticleSrvc', function($ihCONSTS, $ihUtil){
	return {
		fixArticleImagePath: function (arr) {
			if (!arr) return;

			angular.forEach(arr, function(item) {
				imagePath = item.path;
				imagePath = imagePath.replace('[DEFAULT]', $ihCONSTS.imageSizes.large);
				imagePath = $ihCONSTS.url.webDomain + imagePath;

				item.path = imagePath;
			});
		},
		buildArticleHtml: function (articleObj, raw) {
			if (!articleObj) return;

			var rawHtml = angular.copy(raw.body),
				padding = 20,
				width = $ihUtil.getWindowWidth() - (2 * padding),
				height = parseInt( width * (9/16), 10 ),
				videos = articleObj.videos,
				images = articleObj.images;

			// replace [video] tags with video player directive
			angular.forEach(videos, function (item) {
				var videoDrct = '<ih-besttv-player width="' + width + '" height="' + height + '" vid="' + item.id + '"></ih-besttv-player>';
				rawHtml = rawHtml.replace('[video]', videoDrct);
			});

			var imageRegex = new RegExp(/\<img (.*?)\>/),
				srcRegex = new RegExp(/src="(.*?)"/),
				styleRegex = new RegExp(/style="(.*?)"/),
				imgClass= 'class="full-image"',
				path = '';

			// modify source of each image: replace the "src" attr and delete the "style" attr
			angular.forEach(images, function (item) {
				path = item.path;
				rawHtml = rawHtml.replace(imageRegex, function (match, p1, p2, offset, string) {
					match = match.replace( srcRegex, 'src="' + path + '"');
					match = match.replace( styleRegex, '');
					match = match.replace( 'img', 'img ' + imgClass);

					return match;
				});
			});

			// there are sill images with relative src path. We need to replace the "src" attr with the absolute path
			var srcRelatRegex = new RegExp(/src="\/sites\/default\/files/g),
				srcAbsolFixed = 'http://www.israelhayom.co.il/sites/default/files/styles/large/public';
			rawHtml = rawHtml.replace(srcRelatRegex, imgClass + ' src="' + srcAbsolFixed);

			// remove all "target="_blank" occurences
			var blankRegex = new RegExp(/target="_blank"/g);
			rawHtml = rawHtml.replace(blankRegex, '');

			// replace all "http://www.israelhayom.co.il" with app relative paths: 
			var pathRegex = new RegExp(/http:\/\/www.israelhayom.co.il\/article/g),
				artRelPath = '#/app/articles';
			rawHtml = rawHtml.replace(pathRegex, artRelPath);

			return rawHtml;
		},
		buildArticleObj: function (data) {
			if (!data) return;

			var articleObj = {
				videos: (data.videos && data.videos.items) ? data.videos.items : '',
				author: data.author,
				categories: data.categories,
				images: data.images,
				date: data.date,
				content: {
					intro: data.content.intro,
					title: data.content.title
				}
			};


			this.fixArticleImagePath(articleObj.images);
			// make first image main article image, and remove it from images array
			if (articleObj.images && articleObj.images.length > 0) {
				articleObj.mainImageSrc = articleObj.images[0].path;
				articleObj.images.shift();
			}

			articleObj.content.html = this.buildArticleHtml(articleObj, data.content.raw);

			return articleObj;
		}
	};
});

servModule.factory('$ihREST', function($http, $q, $ihCONSTS){
	return {
		loadData: function (url) {
			var deferred = $q.defer();
			console.log('loadData: attempt to get JSON from server..');

			$http.jsonp(url).success(function(data){
				console.log('loadData: requesting url: ' + url + ' succeded. Data is: ');
				console.log(data);
				deferred.resolve(data);
			}).error(function () {
				console.log('loadData: requesting url: ' + url + ' failed.');
				deferred.reject();
			});

			return deferred.promise;
		},
		loadHomepageData: function(){
			return this.loadData($ihCONSTS.url.homepage);
		},
		loadRSSData: function(){
			return this.loadData($ihCONSTS.url.rss);
		},
		loadArticleData: function (artId) {
			return this.loadData($ihCONSTS.url.article + artId + $ihCONSTS.url.key + $ihCONSTS.url.callback);
		},
		loadArticleComment: function (artId) {
			return this.loadData($ihCONSTS.url.comments + artId + $ihCONSTS.url.key + $ihCONSTS.url.callback);
		},
		loadCategoriesData: function () {
			return this.loadData($ihCONSTS.url.categories);
		},
		loadCategoryData: function (catName) {
			return this.loadData($ihCONSTS.url.category + catName + $ihCONSTS.url.key + $ihCONSTS.url.callback);
		},
		loadSearchResults: function (query) {
			return this.loadData($ihCONSTS.url.search + query);
		}
	};
});