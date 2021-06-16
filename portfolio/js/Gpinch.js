(function($){

    var plugin = {};

    // 사용자가 정의하는 변수 저장
    var defaults = {
        mode: 'pinch',                                                  // pinch zoom mode : 'pinch' , 'hover'
        scaleValue: 1.5,                                                // pinch scale Value : 1.5 (default)
        transition_Duration: 0.5,                                         // pinch transition Duration

        swiper: false,                                                  // swiper 여부
    };


    $.fn.Gpinch = function(option) {

        if(this.length == 0) return this;

		// support mutltiple elements
		if(this.length > 1){
			this.each(function(){$(this).Gpinch(options)});
			return this;
		}

        // 변수들 저장할 공간 생성
        var pinch = {};

        // 적용 대상 설정
        var el = this;
        plugin.el = this;
        

        var init = function() {
            // 플러그인이 보유한 변수, 유저들이 정한 변수들 생성
            pinch.setting = $.extend({}, defaults, option);

            pinch.evtZoomChk = true;

            pinch.modeValue = pinch.setting.mode == 'pinch' ? 'click' : 'mouseenter';

            pinch.evtTypeStart = document.ontouchstart !== null ? 'mousedown' : 'touchstart';                                                                // 모바일, PC 구분 시작 이벤트
            pinch.evtTypeMove = document.ontouchstart !== null ? 'mousemove' : 'touchmove';                                                                  // 모바일, PC 구분 무브 이벤트
            pinch.evtTypeEnd = document.ontouchstart !== null ? 'mouseup' : 'touchend';                                                                      // 모바일, PC 구분 끝 이벤트

            pinch.container;
            pinch.targetItem = el.find('.pinch-item');

            pinch.targetImg = pinch.targetItem.find('> img')
            pinch.targetUrl = pinch.targetImg.attr('src');

            pinch.imgWidth = pinch.targetImg.width();
            pinch.imgHeight = pinch.targetImg.height();

            pinch.cnt = 0;

            setup();
            eventBox();
        };

        var setup = function() {

            if (pinch.setting.mode == 'pinch') { pinchSet(); } 
            else if (pinch.setting.mode == 'hover') { hoverSet(); }

            pinch.container.css({'width': pinch.imgWidth, 'height': pinch.imgHeight, 'position': 'absolute', 'left': 0, 'top': 0});
            pinch.targetItem.css({'width': pinch.imgWidth, 'height': pinch.imgHeight});

        };

        // 클릭 시, 좌표값 생성
        var locationSetup = function(e) {
            el.pageX = e.originalEvent.pageX - pinch.targetImg.offset().left;
            el.pageY = e.originalEvent.pageY - pinch.targetImg.offset().top;
        };

        // 클릭 시, 기준점 설정
        var benchmarkSetup = function(e) {
            locationSetup(e);

            el.topLeft = pinch.imgWidth/2 > el.pageX && pinch.imgHeight/2 > el.pageY ? '0 0' : false;
            el.topRight = pinch.imgWidth/2 < el.pageX && pinch.imgHeight/2 > el.pageY ? '100% 0' : false;
            el.bottomLeft = pinch.imgWidth/2 > el.pageX && pinch.imgHeight/2 < el.pageY ? '0 100%' : false;
            el.bottomRight = pinch.imgWidth/2 < el.pageX && pinch.imgHeight/2 < el.pageY ? '100% 100%' : false;
        }

        // pinch 이용 시, 모드 세팅
        var pinchSet = function() {
            pinch.targetImg.wrap('<div class="pinch-container"></div>');
            pinch.container = el.find(
                '.pinch-container'
            );
        };

        // hover 이용 시, 모드 세팅
        var hoverSet = function() {
            pinch.targetItem.append('<div class="hover-container"></div>');
            pinch.container = el.find(
                '.hover-container'
            );
        };

        var eventBox = function() {
            pinch.targetImg
                .off(pinch.modeValue).on(pinch.modeValue, evtZoomValue)
            
            if (pinch.modeValue == 'mouseenter') {
                pinch.container
                    .off('mouseleave').on('mouseleave', evtLeaveZoom)
                    .off(pinch.evtTypeMove).on(pinch.evtTypeMove, evtMoveValue)
            } else {
                
            }
        };

        var evtZoomValue = function(e) {
            locationSetup(e);
            benchmarkSetup(e);
            
            pinch.cnt ++;
            if (pinch.modeValue == 'click') {
                if(pinch.cnt > 1) {clearTimeout(clickTimer);}
                clickTimer = setTimeout(function(){
                    if (pinch.cnt > 1) {
                        evtPinchZoom(e);
                    }

                    pinch.cnt = 0;
                }, 200)
                
            } else {evtEnterZoom(e);};

            pinch.targetImg[0].style.transitionDuration = pinch.setting.transition_Duration + 's';

            if (pinch.imgWidth/2 > el.pageX && pinch.imgHeight/2 > el.pageY) { pinch.targetImg[0].style.transformOrigin = el.topLeft; }
            else if (pinch.imgWidth/2 < el.pageX && pinch.imgHeight/2 > el.pageY) { pinch.targetImg[0].style.transformOrigin = el.topRight; }
            else if (pinch.imgWidth/2 > el.pageX && pinch.imgHeight/2 < el.pageY) { pinch.targetImg[0].style.transformOrigin = el.bottomLeft; }
            else if (pinch.imgWidth/2 < el.pageX && pinch.imgHeight/2 < el.pageY) { pinch.targetImg[0].style.transformOrigin = el.bottomRight; };

        };

        var evtPinchZoom = function() {
            if (pinch.evtZoomChk) {
                pinch_on();
            } else {
                pinch.evtZoomChk = true;
                pinch_off();
            }
        };

        var pinch_on = function() {
            pinch.targetItem.addClass('pinch_on');
            pinch.targetImg.css('transform', 'scale(' + pinch.setting.scaleValue + ')');

            pinch.evtZoomChk = false;
        };

        var pinch_off = function() {
            pinch.targetImg.css('transform', 'scale(1)');
            pinch.targetItem.removeClass('pinch_on');

            pinch.targetImg[0].style.left = 0;
            pinch.targetImg[0].style.top = 0;
        };

        var evtEnterZoom = function() {
            pinch.targetItem.addClass('hover_on');
            console.log(el.pageX);
            pinch.container.css({
                'visibility': 'visible', 
                'background-image': 'url(' + pinch.targetUrl + ')',
                'transform': 'scale(' + pinch.setting.scaleValue + ')',
                'left': 0,
                'top': 0
            });
        };

        var evtLeaveZoom = function() {
            console.log('mouseleave');
            pinch.targetItem.removeClass('hover_on');
            pinch.container.css({
                'visibility': '', 
                'background-image': '',
                'transform': 'scale(1)'
            });
        };
        
        var evtMoveValue = function(e) {
            locationSetup(e);

            
            el.pageX = e.originalEvent.pageX;
            el.pageY = e.originalEvent.pageY;

            pinch.position_x = el.pageX - pinch.container.offset().left;
            pinch.position_y = el.pageY - pinch.container.offset().top;
            
            // pinch.container.css({
            //     'background-position-x': - pinch.position_x,
            //     'background-position-y': - pinch.position_y
            // });
        };

        $(window).load(function(){init();})

        return this;

    }

})(jQuery);
