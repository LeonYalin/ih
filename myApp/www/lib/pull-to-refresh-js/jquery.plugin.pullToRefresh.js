/**
 * pull to refresh
 *
* based off jquery.plugin.pullToRefresh.js (iOS only) by Damien Antipa
*/
(function( $ ){

	$.fn.pullToRefresh = function( options ) {

		var isTouch = !!('ontouchstart' in window),
			cfg = $.extend(true, {
			  message: {
				pull: 'Pull to refresh',
				release: 'Release to refresh',
				loading: 'Loading'
				}
			}, options),
			html = '<div class="ptr-pull-to-refresh">' +
				'<div class="ptr-icon"></div>' +
				'<div class="ptr-message">' +
					'<i class="icon icon_arrow ion-arrow-down-c"></i>' +
					'<i class="icon icon_spinner ion-loading-c"></i>' +
					'<span class="ptr-pull">' + cfg.message.pull + '</span>' +
					'<span class="ptr-release">' + cfg.message.release + '</span>' +
					'<span class="ptr-loading">' + cfg.message.loading + '</span>' +
				  '</div>' +
				'</div>';



		return this.each(function() {
			if (!isTouch) {
				return;
			}

			var e = $(this).prepend(html),
				s = e.find('.ptr-scrollable'),
				content = e.find('.ptr-wrap'),
				ptr = e.find('.ptr-pull-to-refresh'),
				arrow = e.find('.icon_arrow'),
				spinner = e.find('.icon_spinner'),
				pull = e.find('.ptr-pull'),
				release = e.find('.ptr-release'),
				loading = e.find('.ptr-loading'),
				ptrHeight = ptr.outerHeight(),
				arrowDelay = ptrHeight / 3 * 2,
				isActivated = false,
				isScrolling = false,
				isPulling = false,
				isLoading = false,
				isSwiping = null;

			s.defaultTopOffset = s.offset().top; // store default top offset to determine if nedd to show refresher

			var start = null,
				cur   = null,
				delta = null,
				py = 0,
				yy = 0,
				top = null,
				deg = null;
			
			var ptop = -ptrHeight,
				ctop = 0;

			var setStart = function(touch) {
				start = {
					x : touch.pageX,
					y : touch.pageY,
					time : +new Date
				};
			};
			var setCurrent = function(touch) {
				cur = {
					x : touch.pageX,
					y : touch.pageY,
					time : +new Date
				};
				
				setDelta();
			};
			var setDelta = function() {
				delta = {
					x : cur.x - start.x,
					y : cur.y - start.y,
					time : +new Date
				};
			};

			var isOffsetTopExists = function () {
				return s.defaultTopOffset > s.offset().top;
			};
			var isOffsetTopEquealsDefault = function () {
				return s.defaultTopOffset === Math.abs(s.offset().top);
			};

			var animFrId, tmTimeoutId;
			var draw = function() {
				if (cur !== null) {
					animFrId = requestAnimationFrame(draw);
				}

				if ( Math.abs(s.offset().top) - s.defaultTopOffset > ($(window).height() / 2 ) ) {
					cancelAnimationFrame(animFrId);
					return;
				}

				var ty = Math.max(yy, 0);
				ptr.css('-webkit-transform', 'translate3d(0px, ' + ty + 'px, 0px)');
				s.css('-webkit-transform', 'translate3d(0px, ' + ty + 'px, 0px)');
				arrow.css('-webkit-transform', 'rotate('+ deg + 'deg)');

				// if (!isOffsetTopExists() && !isActivated && (delta && delta.y > 0)) {
				// 	console.log(';sdlfs;dj');
				// }
			};


			s.on('touchstart', function (ev) {
				var touch = ev.originalEvent.touches[0] || ev.originalEvent.changedTouches[0];

				isScrolling = null;
				isSwiping   = null;
				
				setStart(touch);
				setCurrent(touch);

				if (isOffsetTopExists()) {
					cancelAnimationFrame(animFrId);
					return;
				} else {
					// draw();
					requestAnimationFrame(draw);

				}
			}).on('touchmove', function (ev) {
				var touch = ev.originalEvent.touches[0] || ev.originalEvent.changedTouches[0];
				
				if (s.get(0).scrollTop > 0) {
					isScrolling = true;
					return;
				}

				if (isScrolling) {
					isScrolling = false;
					isSwiping   = null;
					setStart(touch);
				}

				setCurrent(touch);
				
				// deternine if swiping test has run - one time test
				if (isSwiping === null) {
					isSwiping = !!(isSwiping || Math.abs(delta.x) > Math.abs(delta.y));
				}
				
				// when swiping (horizontal) we do nothing
				if (isSwiping) {
					return;
				}
				
				yy = py + (delta.y * 0.5);

				if (!isPulling) {
					isPulling = true;

					release.hide();
					loading.hide();
					pull.show();
					arrow.show();
					spinner.hide();
				}

				// if (yy <= 0) {
				//     return;
				// }

				// ev.preventDefault();

				if (!isLoading) {
					top = yy * -1;
					if (top < -ptrHeight) {
						deg = 0;
					} else {
						if (top < -arrowDelay) {
							deg = 180 - Math.round(180 / (ptrHeight - arrowDelay) * (-top - arrowDelay));
						} else {
							deg = 180;
						}
					}

					if (-top >= ptrHeight && !isActivated && !isOffsetTopExists()) { // release state
						release.show();
						loading.hide();
						pull.hide();

						isActivated = true;
					} else if (top > -ptrHeight && isActivated) { // pull state
						release.hide();
						loading.hide();
						pull.show();

						isActivated = false;
					}

					// if we are in release state, don't let the results container cross the header line
					if (!isOffsetTopExists() && !isActivated && delta.y > 0) {
						ev.preventDefault();
						return;
					}
				}
			}).on('touchend', function(ev) {

				var touch = ev.originalEvent.touches[0] || ev.originalEvent.changedTouches[0];

				setCurrent(touch);
				yy = py + (delta.y * 0.5);

				if (isActivated || isLoading) {
					cur = null, start = null;
					yy = Math.min(yy, ptrHeight);
					yy = yy > 0 ? ptrHeight : 0;
					py = yy;

					if (isLoading) {
						return;
					}

					isLoading = true;
					isActivated = false;
					isSwiping = null;

					release.hide();
					loading.show();
					pull.hide();
					arrow.hide();
					spinner.show();

					cfg.callback().done(function() {
						isPulling = false;
						isLoading = false;
						ptr.css('-webkit-transform', 'translate3d(0px, 0px, 0px');
						s.css('-webkit-transform', 'translate3d(0px, 0px, 0px');
						delta = null, py = null, yy = null;
					});
				} else {
					cur = null, start = null, delta = null, py = null, yy = null;

					ptr.css('-webkit-transform', 'translate3d(0px, 0px, 0px');
					s.css('-webkit-transform', 'translate3d(0px, 0px, 0px');
				}
				setTimeout(function () {
					cancelAnimationFrame(animFrId);
				}, 50);
			});
		});

	};
})( jQuery );
