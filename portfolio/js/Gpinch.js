// 'use strict'

/*** 핀치줌 플러그인 제작
  ====================== ver 1.0 ======================
    * 2021-06-21
      - pinch zoom  / hover zoom 완료
***/

(function($){

    var plugin = {};

    // 사용자가 정의하는 변수 저장
    var defaults = {
        mode: 'pinch',                                                  // pinch zoom mode : 'pinch' , 'hover'
        scaleValue: 1.5,                                                // pinch scale Value : 1.5 (default)
        transition_Duration: 0.5,                                       // pinch transition Duration

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
            
            pinch.evtTypeStart = document.ontouchstart !== null ? 'mousedown' : 'touchstart';                                                                // 모바일, PC 구분 시작 이벤트
            pinch.evtTypeMove = document.ontouchstart !== null ? 'mousemove' : 'touchmove';                                                                  // 모바일, PC 구분 무브 이벤트
            pinch.evtTypeEnd = document.ontouchstart !== null ? 'mouseup' : 'touchend';                                                                      // 모바일, PC 구분 끝 이벤트
            
            pinch.modeValue = pinch.setting.mode == 'pinch' ? pinch.evtTypeStart : 'mouseenter';
            
            pinch.container;
            pinch.targetItem = el.find('.pinch-item');

            pinch.targetImg = pinch.targetItem.find('> img')
            pinch.targetUrl = pinch.targetImg.attr('src');

            pinch.imgWidth = pinch.targetImg.width();
            pinch.imgHeight = pinch.targetImg.height();

            pinch.obj;

            pinch.cnt = 0;
            pinch.evtMoveChk = false;

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
            pinch.pageX = e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0].pageX : e.originalEvent.pageX;
            pinch.pageY = e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0].pageY : e.originalEvent.pageY;

            el.pageX = pinch.pageX - pinch.targetItem.offset().left;
            el.pageY = pinch.pageY - pinch.targetItem.offset().top;
        };

        // 클릭 시, 기준점 설정
        var benchmarkSetup = function(e) {
            locationSetup(e);
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
                    .off(pinch.evtTypeMove).on(pinch.evtTypeMove, evtMoveValue);
            } 
        };

        var evtZoomValue = function(e) {
            locationSetup(e);
            benchmarkSetup(e);

            pinch.cnt ++;
            
            if (pinch.modeValue == pinch.evtTypeStart) {
                if(pinch.cnt > 1) {clearTimeout(clickTimer);}
                clickTimer = setTimeout(function(){
                    if (pinch.cnt > 1) {
                        evtPinchZoom(e);
                    }

                    pinch.cnt = 0;
                }, 200)
                
            } else { evtEnterZoom(e); };
            
            pinch.targetImg[0].style.transitionDuration = pinch.setting.transition_Duration + 's';
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
            
            pinch.targetImg.css({
                'width': pinch.container.width() * pinch.setting.scaleValue,
                'height': pinch.container.height() * pinch.setting.scaleValue,
                'position': 'absolute',
                'left': - el.pageX * (pinch.setting.scaleValue - 1),
                'top': - el.pageY * (pinch.setting.scaleValue - 1)
            });

            pinch.evtZoomChk = false;
            if (!pinch.evtZoomChk) {pinch.targetImg.on(pinch.evtTypeMove, evtMoveValue);}
        };

        var pinch_off = function() {
            pinch.targetItem.removeClass('pinch_on');
            pinch.targetImg.css({
                'width': pinch.container.width(),
                'height': pinch.container.height(),
                'position': 'relative',
                'left': 0,
                'top': 0
            });
            
            pinch.targetImg.off(pinch.evtTypeMove, evtMoveValue);
        };

        var evtEnterZoom = function(e) {
            pinch.targetItem.addClass('hover_on');

            console.log(pinch.modeValue)

            pinch.container.css({
                'visibility': 'visible', 
                'background-image': 'url(' + pinch.targetUrl + ')',
                'width': pinch.imgWidth * pinch.setting.scaleValue,
                'height': pinch.imgHeight * pinch.setting.scaleValue,
                'left': - el.pageX,
                'top': - el.pageY
            });

            pinch.evtMoveChk = true;
            if (pinch.evtMoveChk) {evtMoveValue(e);}
        };

        var evtLeaveZoom = function() {
            pinch.targetItem.removeClass('hover_on');

            pinch.evtMoveChk = false;

            pinch.container.css({
                'visibility': '', 
                'background-image': '',
                'width': pinch.imgWidth,
                'height': pinch.imgHeight,
                'left': 0,
                'top': 0
            });
        };
        
        var evtMoveValue = function(e) {
            locationSetup(e);

            pinch.obj = pinch.modeValue == 'mouseenter' ? pinch.container : pinch.targetImg;
            el.pageX = pinch.modeValue == 'mouseenter' ? el.pageX : el.pageX * (pinch.setting.scaleValue - 1);
            el.pageY = pinch.modeValue == 'mouseenter' ? el.pageY : el.pageY * (pinch.setting.scaleValue - 1);
            pinch.targetImg[0].style.transitionDuration = 0 + 's';
            pinch.obj.css({
                'left': - el.pageX,
                'top': - el.pageY
            });
        };

        $(window).load(function(){init();})

        return this;

    }

})(jQuery);
