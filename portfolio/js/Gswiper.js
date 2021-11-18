'use strict'

/*** 스와이프 플러그인 제작
    ====================== ver 0.0 ======================
        * 2021-03-12 
        - swiper 플러그인 제작
    ====================== ver 1.0 ======================
        * 2021-03-31
        - 'horizontal', 'vertical' 스와이프 적용
        - 인디케이터 종류 2가지 추가 ('number', 'bar')
        * 2021-04-02
        - object clone에 마진값 추가
        - 마진값 추가로 인한 이벤트 적용값 수정
    ====================== ver 1.1 ======================
        * 2021-04-07
        - 스와이프 영역에 보여지는 object의 개수를 사용자가 지정할 수 있도록 설정
        - 스와이프 영역에 보여지는 object의 개수만큼 clone 생성 그에 따른 적용값 설정
        - 사용자가 css로 지정하는 width, height값을 제외한 스크립트로 지정하는 값이 없을 때, 자동적으로 상황에 맞게 설정 
    ====================== ver 1.1 ======================
        * 2021-04-07
        - autoPlay 추가
        - 인디케이터, 버튼을 통한 다른 객체가 동시에 스와이프 기능 추가
        * 2021-05-25
        - 2개가 동시에 스와이프 되는 조건 설정
        - mouseenter / mouseleave로 autoPlay 컨트롤
    ====================== ver 1.1 ======================
        * 2021-08-27
        - 일부 소스 변경
    ====================== ver 1.2 ======================
        * 2021-11-08
        - 'mergeTarget' 존재하는 경우 스와이프 오류 수정
        * 2021-11-09
        - 'mergeTarget' 존재하는 경우 서로 다르게 스와이프는 가능하며, button, indicator 클릭 시, 부모의 index의 따라 자식도 동일하게 스와이프 적용
        - autoplay 버그수정 (event : 'mouseenter', 'mouseleave')
        * 2021-11-10
        - autoPlay 시, button & indicator의 영향 안받게 설정
        - button 중복 클릭 방지
***/

function Gswiper (opt) {
    
    this.evtTypeStart = document.ontouchstart !== null ? 'mousedown' : 'touchstart';                                                                // 모바일, PC 구분 시작 이벤트
    this.evtTypeMove = document.ontouchstart !== null ? 'mousemove' : 'touchmove';                                                                  // 모바일, PC 구분 무브 이벤트
    this.evtTypeEnd = document.ontouchstart !== null ? 'mouseup' : 'touchend';                                                                      // 모바일, PC 구분 끝 이벤트

    this.pageXY = function(e) {
        var pageX = e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0].pageX : e.originalEvent.pageX;                               // swiper X축
        var pageY = e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0].pageY : e.originalEvent.pageY;                               // swiper Y축
        var pageXY = new Array(pageX, pageY);

        return pageXY;
    };
    
    this.targetName = opt.targetName;                                                                                                               // swiper target
    this.mode = opt.mode || 'horizontal';                                                                                                           // 모드 : 'horizontal' (default), 'vertical'
    this.scrolling = opt.scrolling || false;                                                                                                        // 스크롤을 이용한 스와이프 : false (default)
    this.swiperBtn = opt.swiperBtn == '' ? false : true;                                                                                            // 스와이프 버튼 : true (default), false
    this.indicator = opt.indicator == '' ? false : true;                                                                                            // 인디케이터 : true (default), false
    this.indicatorType = this.indicator === true ? ($.type(opt.indicatorType) == 'undefined' ? 'dot' : opt.indicatorType) : false                   // 인디케이터 종류 : 'dot' (default), 'number', 'progress', 'scrollbar'
    this.between = opt.between || 0;                                                                                                                // 스와이프 간 간격
    this.viewIndex = opt.viewIndex || 0;                                                                                                            // 스와이프 시작되는 시점 : 0 (default)
    this.loop = opt.loop || false;                                                                                                                  // 무한 스와이프 : false (default)
    this.swiperSpeed = opt.swiperSpeed || '1s';                                                                                                     // 스와이프 스피드 : 1s (default)
    this.swiperEffect = opt.swiperEffect || 'ease'                                                                                                  // 스와이프 이펙트 : ease (default)
    this.ingSwiperNot = opt.ingSwiperNot || false;                                                                                                  // 스와이프 중 이벤트 막기 : false (default)
    this.itemView = opt.itemView || 1;                                                                                                              // 스와이프 영역에서 한번에 몇개의 스와이프를 노출 할지 결정 : 1 (default)
    this.useCss = opt.useCss || false;                                                                                                              // 사용자가 지정된 css값을 사용하게 설정 : false (default)

    this.moveNotChk = opt.moveNotChk == '' ? false : true;                                                                                          // 스와이프 드래그 막기 : true (default) , false
    this.hoverStop = opt.hoverStop == '' ? false : true;                                                                                            // 'mouseenter'로 autoplay 막기 : true (default) , false
    
    this.mergeTarget = opt.mergeTarget || false;                                                                                                    // 동시 스와이프 : 부모 스와이프
    this.mergeObj;                                                                                                                                  // 동시 스와이프 : 부모 스와이프에 자식 스와이프 데이터값 추가
    this.mergeDotHidden = opt.mergeDotHidden || 'hidden';                                                                                           // 동시 스와이프 : 자식 스와이프 인디케이터 숨김 : 'hidden' (default), 'visible'
    this.mergeBtnHidden = opt.mergeBtnHidden || 'hidden';                                                                                           // 동시 스와이프 : 자식 스와이프 좌/우 버튼 숨김 : 'hidden' (default), 'visible'
    
    this.autoPlay = opt.autoPlay || false;                                                                                                          // 자동 롤링 : false (default) , true
    this.autoPlayTime = opt.autoPlayTime || 600;                                                                                                    // 자동 롤링 타임 : 1000 (default)
    this.autoPlaySet;
    
    this.autoHeight = opt.autoHeight || false;                                                                                                      // 스와이프 높이 컨텐츠에 맞게 조정 : false (default), true
    this.valueOther = opt.valueOther || false;                                                                                                      // width, height 각 스와이프 오브젝트 마다 다른 경우 : true (default), false
    
    this.swiperWrapper = this.targetName.closest('.swiper-wrap');
    this.swiperItem = this.targetName.find('.swiper-item');

    this.swiperWidth = this.swiperItem.width();
    this.swiperHeight = this.swiperItem.height();

    this.prevBtn = opt.prevBtn || true;                                                                                                             // prev 버튼 설정
    this.nextBtn = opt.nextBtn || true;                                                                                                             // next 버튼 설정
    
    this.indicatorDot;
    this.indicatorNum;
    this.indicatorProgress;
    this.indicatorScrollbar;
    
    this.pageX;
    this.pageY;

    this.moveX;
    this.moveY;
    this.moveXY;
    
    this.swiperWH;
    
    this.swiperLength = this.targetName[0].childElementCount;
    this.cloneLength;

    this.offsetX = this.swiperWrapper.offset().left;
    this.offsetY = this.swiperWrapper.offset().top;
    this.offsetXY = this.mode === 'horizontal' ? this.offsetX : this.offsetY;
    
    this.curX
    this.curY
    this.curXY;
    
    this.curNavi;

    this.prevIndex;
    this.curIndex;
    this.nextIndex;

    this.firstIndex = 0;
    this.lastIndex = this.swiperLength - 1;

    this.swiperItemLT = this.mode === 'horizontal' ? 'margin-left' : 'margin-top';
    this.swiperItemRB = this.mode === 'horizontal' ? 'margin-right' : 'margin-bottom';

    this.transition_Duration = this.swiperSpeed;
    this.transition_Property = this.mode == 'horizontal' ? 'left' : 'top';
    this.transition_Effect = this.swiperEffect;

    this.eventMoveChk = false;
    this.eventClickChk = false;
    this.eventMouseUpChk = false; 
    this.transitionIng = false;
    this.autoPlayChk = true;
    
    this.init();
}

/**
 * swiperWidth / swiperHeight = x
 * between = y
 * index = a
 * length = b
 */

Gswiper.prototype = {
    init : function() {
        // set default width value
        this.initWH();

        // basics setting (swiper, indicator, button)
        this.commonSet();

        // 'horizontal', 'vertical', 'scroll'
        this.initMode();

        // event list
        this.eventBox();

        // auto rolling
        this.autoPlayInit();

        // simultaneous swipe
        if (this.mergeTarget) {
            this.mergeTarget.mergeObj = this;
        }
    },

    // set default width value
    initWH : function() {
        
        if(!this.useCss) {
            if (this.mode === 'horizontal') {
                this.swiperWidth = this.itemView > 1 ? (this.swiperWrapper.width() - 2 * this.between * (this.itemView - 1)) / this.itemView : this.swiperWrapper.width();
                this.swiperHeight = this.swiperWrapper.height();
            } else if (this.mode === 'vertical') {
                this.swiperWidth = this.swiperWrapper.width();
                this.swiperHeight = this.itemView > 1 ? (this.swiperWrapper.height()) - 2 * this.between  * (this.itemView - 1) / this.itemView : this.swiperWrapper.height();
            }
        }

        this.swiperWH = this.mode === 'horizontal' ? this.swiperWidth : this.swiperHeight;
        $('.swiper-item', this.targetName).css({'width': this.swiperWidth, 'height': this.swiperHeight});
        $('.swiper-item', this.targetName).css(this.swiperItemLT, this.between + 'px');
        $('.swiper-item', this.targetName).css(this.swiperItemRB, this.between + 'px');
    },

    // basics setting (swiper, indicator, button)
    commonSet : function() {
        // add parent element to swipe
        this.targetName.wrap('<div class="swiper-cont"></div>');

        // swipe items set
        this.swiperItemSet();

        // swipe indicator set
        if (this.indicator === true) {
            this.swiperIndicatorSet();
        };

        // swipe button set
        if (this.swiperBtn === true) {
            this.swiperBtnSet();
        } else {
            this.swiperWrapper.find('.swiper-btn > button').css({'display': 'none', 'opacity': 0, 'z-index': -1});
        };
    },

    // swipe items set
    swiperItemSet : function() {

        for (var i = 0; i <= this.swiperLength; i++) {
            this.swiperItem.eq(i).attr('swiper-data', i);
        }

        // clone for 'loop'
        if (this.loop === true) {
            for (var i = this.itemView; i > 0; i--) {
                var fIndex = this.itemView - i;
                var firstClone = this.swiperItem.not('.clone').eq(fIndex).clone().addClass('clone').removeAttr('swiper-data');
                firstClone.appendTo(this.targetName);
            }
            
            for (var i = 0; i < this.itemView; i++) {
                var lIndex = - (i + 1);
                var lastClone = this.swiperItem.not('.clone').eq(lIndex).clone().addClass('clone').removeAttr('swiper-data');
                lastClone.prependTo(this.targetName);
            }
        }

        this.swiperItem.removeClass('active').not('.clone').eq(this.viewIndex).addClass('active');
    },

    // swipe button set
    swiperBtnSet : function() {
        this.nextBtn = this.nextBtn === true ? this.swiperWrapper.find('.next-btn') : $(this.nextBtn);
        this.prevBtn = this.prevBtn === true ? this.swiperWrapper.find('.prev-btn') : $(this.prevBtn);
        

        if (this.mergeTarget && this.mergeBtnHidden == 'hidden') {
            this.swiperWrapper.find('.swiper-btn > button').css({'z-index' : -1, 'opacity' : 0});
        }
    },

    // swipe indicator set
    swiperIndicatorSet : function() {
        this.swiperWrapper.find('.swiper-indicator').append('<ul class="indicator-list"></ul>');

        // indicator type : dot
        if (this.indicatorType === 'dot') {

            for (var i = 0; i <= this.swiperLength - 1; i++) {
                this.indicatorDot = '<li class="indicator-items" indicator-data="' + i + '">' + (i + 1) + '</li>';
                this.swiperWrapper.find('.indicator-list').append(this.indicatorDot);
            }

            // hide your child`s swipe indicator when using a concurrent swipe
            if (this.mergeTarget && this.mergeDotHidden == 'hidden') {
                $(this.swiperWrapper).find('.indicator-list').css({'z-index' : -1, 'opacity' : 0});
            }
        } 

        // indicator type : number
        else if (this.indicatorType === 'number') {

            if (this.mode === 'horizontal') {
                this.indicatorNum = '<li class="indicator-num"><span class="indicator-cur">' + this.viewIndex + '</span> / <span class="indicator-max">' + this.swiperLength + '</span></li>';
            } else {
                this.indicatorNum = '<li class="indicator-num"><span class="indicator-cur">' + this.viewIndex + '</span><br> / <br><span class="indicator-max">' + this.swiperLength + '</span></li>';
            }
            
            this.swiperWrapper.find('.indicator-list').append(this.indicatorNum);
        }

        // indicator type : progress
        else if(this.indicatorType === 'progress') {
            
            if (this.mode === 'horizontal') {
                this.indicatorProgress = '<li class="indicator-progress" style="width:' + (100 / this.swiperLength * (this.itemView + 1)) + '%">' + (this.itemView + 1) + '</li>';
            } else {
                this.indicatorProgress = '<li class="indicator-progress" style="height:' + (100 / this.swiperLength * (this.itemView + 1)) + '%">' + (this.itemView + 1) + '</li>';
            }

            this.swiperWrapper.find('.indicator-list').addClass('progress-list');
            this.targetName.parents('.swiper-wrap').find('.indicator-list.progress-list').append(this.indicatorProgress);
        }

        // indicator type : scrollbar
        else if(this.indicatorType === 'scrollbar') {

            if (this.mode === 'horizontal') {
                this.indicatorScrollbar = '<li class="indicator-scrollbar" style="width:' + 100 / this.swiperLength + '%;left:' + (100 / this.swiperLength) * this.itemView + '%;"></li>'
            } else {
                this.indicatorScrollbar = '<li class="indicator-scrollbar" style="height:' + 100 / this.swiperLength + '%;top:' + (100 / this.swiperLength) * this.itemView + '%;"></li>'
            }

            this.swiperWrapper.find('.indicator-list').addClass('scrollbar-list');
            this.targetName.parents('.swiper-wrap').find('.indicator-list.scrollbar-list').append(this.indicatorScrollbar);
        }
        
        this.indicatorDot = this.swiperWrapper.find('.indicator-items');
        this.indicatorNum = this.swiperWrapper.find('.indicator-num');
        this.indicatorProgress = this.swiperWrapper.find('.indicator-progress');
        this.indicatorScrollbar = this.swiperWrapper.find('.indicator-scrollbar');
    },

    // mode set
    initMode : function() {
        this.cloneLength = $(this.targetName).find('.clone').length;
        var _cloneLength = this.loop === true ? this.cloneLength / 2 : 0;

        this.moveX = - this.swiperWidth * (this.viewIndex + _cloneLength) - 2 * this.between * (this.viewIndex + _cloneLength) - this.between;
        this.moveY = - this.swiperHeight * (this.viewIndex + _cloneLength) - 2 * this.between * (this.viewIndex + _cloneLength) - this.between;

        if (this.indicator === true) {
            this.indicatorDot.removeClass('active').eq(this.viewIndex).addClass('active');
            this.indicatorNum.find('.indicator-cur').html(this.viewIndex + 1);
        }

        if (this.mode === 'horizontal') {
            this.horizontalSet();
        } else if (this.mode === 'vertical') {
            this.verticalSet();
        }
    },

    // horizontal swipe set
    horizontalSet : function() {
        this.targetName.css({'width': (this.swiperWidth + this.between * 2) * (this.swiperLength + this.cloneLength) + 'px' , 'height': this.swiperHeight + 'px'});
        this.targetName.css('left', this.moveX + 'px');
    },

    // vertical swipe set
    verticalSet : function() {
        this.targetName.css({'width': this.swiperWidth + 'px' , 'height': (this.swiperHeight + this.between * 2) * (this.swiperLength + this.cloneLength) + 'px'});
        this.targetName.css('top', this.moveY + 'px');
    },

    // event list
    eventBox : function() {
        var _this = this;
        
        $(_this.targetName)
            .unbind(_this.evtTypeStart).bind(_this.evtTypeStart, _this, function(e){_this.eventDown(e)})
            .unbind(_this.evtTypeMove).bind(_this.evtTypeMove, _this, function(e){_this.eventMove(e)})
            .unbind(_this.evtTypeEnd).bind(_this.evtTypeEnd, _this, function(e){_this.eventUp(e)});
        
        if (_this.swiperBtn) {
            _this.nextBtn.bind('click', _this, function(e){
                _this.autoPlayChk = false;
                clearTimeout(_this.autoPlaySet);
                if (!_this.eventClickChk) { _this.nextBtnClick(e); }
            });
    
            _this.prevBtn.bind('click', _this, function(e){
                _this.autoPlayChk = false;
                clearTimeout(_this.autoPlaySet);
                if (!_this.eventClickChk) { _this.prevBtnClick(e); }
            });
        }
        
        $(_this.indicatorDot).bind('click', _this, function(e){
            _this.autoPlayChk = false;
            clearTimeout(_this.autoPlaySet);
            _this.naviClick(e, $(this));
        });

        $(window).bind('resize', function(){_this.windowResize();})
        
    },

    // window resize set
    windowResize : function() {
        this.initWH();
        this.initMode();
    },

    // auto height set
    autoHeightInit : function() {
        if (this.autoHeight) {
            if (this.mode == 'horizontal') {
                var _swiperHeight = this.targetName.find('.swiper-item').not('.clone').eq(this.curIndex).height();
                this.swiperWrapper.css({'height': _swiperHeight}).find('.swiper-cont').css({'height': _swiperHeight});
            } else {
                var _swiperWidth = this.targetName.find('.swiper-item').not('.clone').eq(this.curIndex).width();
                this.swiperWrapper.css({'width': _swiperWidth}).find('.swiper-cont').css({'width': _swiperWidth});
            }
        }
    },

    // auto rolling set
    autoPlayInit : function() {
        var _this = this;
        if (_this.autoPlay && _this.autoPlayChk) {
            _this.autoPlaySet = setTimeout(function(){_this.autoPlayEvent()}, _this.autoPlayTime);
        }
    },

    // auto rolling value set
    autoPlayEvent : function() {
        var _this = this;
        
        _this.curX = _this.targetName[0].offsetLeft;
        _this.curY = _this.targetName[0].offsetTop;
        _this.curXY = _this.mode === 'horizontal' ? _this.curX : _this.curY;

        _this.prevIndex = _this.viewIndex - 1;
        _this.curIndex = _this.viewIndex;
        _this.nextIndex = _this.viewIndex + 1;

        _this.nextBtnValue(_this, true);
        _this.swiperEndChk(_this, true);
    },

    // var locPageXY                                                                 클릭 시, 마우스 및 터치 좌표값
    // var curPageXY                                                                 무브 시, 마우스 및 터치 좌표값

    // mousedown, touchstart
    eventDown : function(e) {
        var _this = e.data;

        _this.eventMouseUpChk = false;
        _this.eventMoveChk = true;
        _this.transitionIng = true;

        _this.pageX = _this.pageXY(e)[0];
        _this.pageY = _this.pageXY(e)[1];
        
        _this.objectDataValue(e);
        clearTimeout(_this.autoPlaySet);
    },

    // mousemove, touchmove
    eventMove : function(e) {
        var _this = e.data;
        if (_this.eventMoveChk === true) {
            if (!_this.moveNotChk) {
                e.preventDefault();
            } else {
                _this.pageDragValue(e);
            }
        }
    },

    // mouseup, touchend
    eventUp : function(e) {
        var _this = e.data;

        _this.eventMouseUpChk = true;
        if (_this.eventMouseUpChk === true) {_this.eventMouseUpValue(e);};

        _this.eventMoveChk = false;
        _this.swiperEndChk(e);
    },

    // next button
    nextBtnClick : function(e) {
        var _this = e.data;

        if (_this.mergeObj) {
            $(_this.mergeObj.nextBtn).trigger('click');
        } 

        _this.eventClickChk = true;
        _this.transitionIng = true;

        _this.objectDataValue(e);
        _this.nextBtnValue(e);
        _this.swiperEndChk(e);
    },

    // prev button
    prevBtnClick : function(e) {
        var _this = e.data;

        if (_this.mergeObj) {
            $(_this.mergeObj.prevBtn).trigger('click');
        } 

        _this.eventClickChk = true;
        _this.transitionIng = true;

        _this.objectDataValue(e);
        _this.prevBtnValue(e);
        _this.swiperEndChk(e);
    },

    // indicator
    naviClick : function(e, _indicator) {
        var _this = e.data;

        _this.curNavi = parseInt(_indicator.index());

        if (_this.mergeObj) {
            $(_this.mergeObj.indicatorDot).eq(_this.curNavi).trigger('click');
        }

        _this.eventClickChk = true;
        _this.transitionIng = true;

        clearTimeout(_this.autoPlaySet);

        _this.objectDataValue(e);
        _this.naviClickValue(_this);
        _this.swiperEndChk(e);
    },

    // swipe data value
    objectDataValue : function(e) {
        var _this = e.data;

        _this.curX = $(_this.targetName).position().left;                                                // Number(_this.targetName[0].style.left.replace(/px/g, ''))
        _this.curY = $(_this.targetName).position().top;                                                 // Number(_this.targetName[0].style.top.replace(/px/g, ''))
        _this.curXY = _this.mode === 'horizontal' ? _this.curX : _this.curY;

        _this.prevIndex = _this.viewIndex - 1;
        _this.curIndex = _this.viewIndex;
        _this.nextIndex = _this.viewIndex + 1;
    },

    // return for move value 30per not over
    eventMouseUpValue : function(e) {
        var _this = e.data;
        
        var _locPageXY = _this.mode === 'horizontal' ? _this.pageX : _this.pageY;                        // 마우스 다운 좌표값
        var _curPageXY = _this.mode === 'horizontal' ? _this.pageXY(e)[0] : _this.pageXY(e)[1];          // 마우스 무브 후 업 좌표값
        var _direction = _locPageXY > _curPageXY ? 'next' : 'prev';                                      // 좌&우 이동 감지

        if (_direction == 'next') {
            if (_curPageXY - _this.offsetXY > (_locPageXY - _this.offsetXY) * 0.7) {
                _this.moveXY = _this.curXY;
            }
        } else if (_direction == 'prev') {
            if (_curPageXY - _this.offsetXY < (_locPageXY - _this.offsetXY) / 0.7) {
                _this.moveXY = _this.curXY;
            }
        }

        _this.targetName.css(_this.transition_Property, _this.moveXY);
        _this.targetName[0].style.transitionDuration = '0.5s';
        
    },

    // swipe end check, auto rolling return value
    swiperEndChk : function(e, _obj) {
        if (_obj) {
            var _this = e;
        } else {
            var _this = e.data;
        }

        $(_this.targetName).bind("transitionend webkitTransitionEnd", _this, function(e) {
            _this.transitionIng = false;
            $(_this.targetName).unbind("transitionend webkitTransitionEnd");
            
            if (_this.loop === true) {
                var _cloneLength = _this.cloneLength / 2;
                
                if (_this.curIndex == -1) {
                    _this.moveXY = - _this.swiperWH * (_this.lastIndex + _cloneLength) - 2 * _this.between * (_this.lastIndex + _cloneLength) - _this.between;
                    _this.transition_Duration = '0s';
                    _this.curIndex = _this.lastIndex;
                } else if (_this.curIndex == _this.swiperLength) {
                    _this.moveXY = - _this.swiperWH * (_this.firstIndex + _cloneLength) - 2 * _this.between * (_this.firstIndex + _cloneLength) - _this.between;
                    _this.transition_Duration = '0s';
                    _this.curIndex = _this.firstIndex;
                }
            } else {
                if (_this.curIndex == _this.firstIndex) {
                    _this.curIndex = - _this.firstIndex;
                } else if (_this.curIndex == _this.lastIndex) {
                    _this.curIndex = _this.lastIndex;
                }
            };

            if (_this.autoPlay) {
                if (_this.hoverStop) {
                    $(_this.targetName)
                    .bind('mouseenter', function(e){ _this.autoPlayChk = false; })
                    .bind('mouseleave', function(e){ 
                        _this.autoPlayChk = true;
                        clearTimeout(_this.autoPlaySet);
                        _this.autoPlayInit(e);
                    });
                }
            }
            
            if (!_this.loop && _this.autoPlay) {
                
                if (_this.curIndex == _this.lastIndex) {
                    _this.moveXY = -_this.between;
                    _this.transition_Duration = '0s';
                    _this.curIndex = 0;
                    _this.indexValue(e);
                }
            };

            _this.viewIndex = _this.curIndex;
            _this.objectDataValue(e);
            _this.swiperMoveValue(_this);
            
            if (_this.autoPlayChk) {
                _this.autoPlayInit(e);
            } else {
                clearTimeout(_this.autoPlaySet);
            };

            _this.eventClickChk = false;
        });
        
    },

    // move common value set
    pageDragValue : function(e) {
        var _this = e.data;

        var locPageXY = _this.mode === 'horizontal' ? _this.pageX : _this.pageY;
        var curPageXY = _this.mode === 'horizontal' ? _this.pageXY(e)[0] : _this.pageXY(e)[1];

        if (curPageXY < locPageXY) {
            _this.nextEventValue(e)
        } else if (curPageXY > locPageXY) {
            _this.prevEventValue(e)
        }

        _this.swiperMoveValue(_this);
        _this.indexValue(_this);
        
    },

    // next move value set
    nextEventValue : function(e) {
        var _this = e.data;

        var _locPageXY = _this.mode === 'horizontal' ? _this.pageX : _this.pageY;
        var _curPageXY = _this.mode === 'horizontal' ? _this.pageXY(e)[0] : _this.pageXY(e)[1];
        
        if (_curPageXY - _this.offsetXY < (_locPageXY - _this.offsetXY) * 0.7) {
            _this.transition_Duration = _this.swiperSpeed;
            _this.moveXY = _this.curXY - _this.swiperWH - (_this.between * 2);
            _this.curIndex = _this.nextIndex;

            if (_this.loop === false) {
                if (_this.curIndex > _this.lastIndex) {
                    _this.moveXY = _this.curXY;
                    _this.curIndex = _this.viewIndex;
                } else {
                    _this.viewIndex = _this.nextIndex;
                }
            }

        } else {
            _this.transition_Duration = '0s';
            _this.moveXY = _this.curXY - ((_locPageXY - _this.offsetXY) - (_curPageXY - _this.offsetXY));
            _this.curIndex = _this.viewIndex;
        }
    },

    // prev move value set
    prevEventValue : function(e) {
        var _this = e.data;

        var _locPageXY = _this.mode === 'horizontal' ? _this.pageX : _this.pageY;
        var _curPageXY = _this.mode === 'horizontal' ? _this.pageXY(e)[0] : _this.pageXY(e)[1];

        if ( _curPageXY - _this.offsetXY > (_locPageXY - _this.offsetXY) / 0.7) {
            _this.transition_Duration = _this.swiperSpeed;
            _this.moveXY = _this.curXY + _this.swiperWH + (_this.between * 2);
            _this.curIndex = _this.prevIndex;

            if (_this.loop === false) {
                if (_this.curIndex < 0) {
                    _this.moveXY = _this.curXY;
                    _this.curIndex = _this.viewIndex;
                } else {
                    _this.viewIndex = _this.prevIndex;
                }
            }

        } else {
            _this.transition_Duration = '0s';
            _this.moveXY = _this.curXY + ((_curPageXY - _this.offsetXY) - (_locPageXY  - _this.offsetXY));
            _this.curIndex = _this.viewIndex;
        }
    },

    // next button value set
    nextBtnValue : function(e, _obj) {
        if (_obj) {
            var _this = e;
        } else {
            var _this = e.data;
        }

        _this.moveXY = _this.curXY - _this.swiperWH - (_this.between * 2);
        _this.curIndex = _this.nextIndex;
        _this.transition_Duration = _this.swiperSpeed;

        if(_this.mergeObj) {
            if (_this.mergeObj.curIndex != _this.curIndex) {
                _this.mergeObj.curIndex = _this.curIndex;
                _this.mergeObj.moveXY = _this.moveXY;
                $(_this.mergeObj.targetName).css('left', _this.moveXY)
            }
        }
        
        if (_this.loop === false) {
            if (_this.curIndex > _this.lastIndex) {
                _this.moveXY = _this.curXY;
                _this.curIndex = _this.viewIndex;
            } else {
                _this.viewIndex = _this.nextIndex;
            }
        }
        
        _this.swiperMoveValue(_this);
        _this.indexValue(_this);
    },

    // prev button value set
    prevBtnValue : function(e) {
        var _this = e.data;

        _this.moveXY = _this.curXY + _this.swiperWH + (_this.between * 2);
        _this.curIndex = _this.prevIndex;
        _this.transition_Duration = _this.swiperSpeed;

        if(_this.mergeObj) {
            if (_this.mergeObj.curIndex != _this.curIndex) {
                _this.mergeObj.curIndex = _this.curIndex;
                _this.mergeObj.moveXY = _this.moveXY;
                $(_this.mergeObj.targetName).css('left', _this.moveXY)
            }
        }

        if (_this.loop === false) {
            if (_this.curIndex < 0) {
                _this.moveXY = _this.curXY;
                _this.curIndex = _this.viewIndex;
            } else {
                _this.viewIndex = _this.prevIndex;
            }
        }
        
        _this.swiperMoveValue(_this);
        _this.indexValue(_this);
    },

    // indicator value set
    naviClickValue : function(e) {
        var _this = e;
        var _cloneLength = _this.loop === true ? _this.cloneLength / 2 : 0;

        var _curNavi = _this.itemViewSwiper > 1 ? _this.curNavi * _this.itemViewSwiper : _this.curNavi
        
        // var _valueAdd = _valueArray.reduce((a , b) => a + b);                                     // 배열 안 객체 합계
        _this.moveXY = - _this.swiperWH * (_curNavi + _cloneLength) - _this.between * ( (2 * _curNavi) + (2 * _cloneLength) + 1 );

        _this.transition_Duration = _this.swiperSpeed;
        _this.curIndex = _this.curNavi;

        _this.swiperMoveValue(e);
        _this.indexValue(e);

        _this.viewIndex = _this.curIndex + 1;
    },

    // swipe move 
    swiperMoveValue : function(e) {
        var _this = e;

        _this.targetName.css(_this.transition_Property, _this.moveXY + 'px');
        _this.targetName[0].style.transitionProperty = _this.transition_Property;
        _this.targetName[0].style.transitionDuration = _this.transition_Duration;

        _this.autoHeightInit(e);
    },

    // swipe indicator move
    indexValue : function(e) {
        var _this = e;
        
        var _locIndex;
        if (_this.curIndex > _this.lastIndex && _this.loop === true) {
            _locIndex = _this.firstIndex;
        } else if (_this.curIndex < 0 && _this.loop === true) {
            _locIndex = _this.lastIndex;
        } else {
            _locIndex = _this.curIndex;
        };

        if (_this.mergeObj) { $(_this.mergeObj.swiperItem).removeClass('active').not('.clone').eq(_locIndex).addClass('active'); };
        $(_this.swiperItem).removeClass('active').not('.clone').eq(_locIndex).addClass('active');

        // 'dot' value
        if (_this.indicatorType === 'dot') {
            $(_this.indicatorDot).removeClass('active').eq(_locIndex).addClass('active');

        } 
        // 'number' value
        else if (_this.indicatorType === 'number') {
            $(_this.indicatorNum).find('.indicator-cur').html(_locIndex + 1);

        } 
        // 'progress' value
        else if (_this.indicatorType === 'progress') {
            $(_this.indicatorProgress)[0].style.transitionDuration = _this.transition_Duration;

            // 'horizontal' , 'vertical'
            if (_this.mode === 'horizontal') {
                $(_this.indicatorProgress)[0].style.transitionProperty = 'width';
                $(_this.indicatorProgress)[0].style.width = 100 / _this.swiperLength * (_locIndex + 1) + '%';
            } else {
                $(_this.indicatorProgress)[0].style.transitionProperty = 'height';
                $(_this.indicatorProgress)[0].style.height = 100 / _this.swiperLength * (_locIndex + 1) + '%';
            }
            
        }
        // 'scrollbar' value
        else if (_this.indicatorType === 'scrollbar') {
            $(_this.indicatorScrollbar)[0].style.transitionDuration = _this.transition_Duration;

            // 'horizontal' , 'vertical'
            if (_this.mode === 'horizontal') {
                $(_this.indicatorScrollbar)[0].style.left = 100 / _this.swiperLength * _locIndex + '%';
            } else {
                $(_this.indicatorScrollbar)[0].style.top = 100 / _this.swiperLength * _locIndex + '%';
            }
        }

        _this.viewIndex = _this.curIndex;
    }

}
