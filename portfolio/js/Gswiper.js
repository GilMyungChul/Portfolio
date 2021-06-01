'use strict'

/*** 스와이프 플러그인 제작
  ====================== ver 0.0 ======================
    * 2021-03-12 
      - swiper slide 플러그인 제작
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
      - 인디케이터, 버튼을 통한 동시 스와이프 추가
    * 2021-05-25
      - 2개 이상의 동시 스와이프 기능 추가
      - mouseenter / mouseleave로 autoPlay 컨트롤
***/

function Gswiper (opt) {
    
    this.evtTypeStart = document.ontouchstart !== null ? 'mousedown' : 'touchstart';                                                                // 모바일, PC 구분 시작 이벤트
    this.evtTypeMove = document.ontouchstart !== null ? 'mousemove' : 'touchmove';                                                                  // 모바일, PC 구분 무브 이벤트
    this.evtTypeEnd = document.ontouchstart !== null ? 'mouseup' : 'touchend';                                                                      // 모바일, PC 구분 끝 이벤트

    this.pageXY = function(e) {
        var pageX = e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0].pageY : e.originalEvent.pageX;                               // swiper X축
        var pageY = e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0].pageY : e.originalEvent.pageY;                               // swiper Y축
        var pageXY = new Array(pageX, pageY);

        return pageXY;
    };
    
    this.targetName = opt.targetName;                                                                                                               // swiper target
    this.mode = opt.mode || 'horizontal';                                                                                                           // 모드 : 'horizontal' (default), 'vertical'
    this.scrolling = opt.scrolling || false;                                                                                                        // 스크롤을 이용한 스와이프 : 'false' (default)
    this.swiperBtn = opt.swiperBtn == '' ? false : true;                                                                                            // 스와이프 버튼 : 'true' (default), 'false'
    this.indicator = opt.indicator == '' ? false : true;                                                                                            // 인디케이터 : 'true' (default), 'false'
    this.indicatorType = this.indicator === true ? ($.type(opt.indicatorType) == 'undefined' ? 'dot' : opt.indicatorType) : false                   // 인디케이터 종류 : 'dot' (default), 'number', 'bar'
    this.between = opt.between || 0;                                                                                                                // 스와이프 간 간격
    this.viewIndex = opt.viewIndex || 0;                                                                                                            // 스와이프 시작되는 시점 : 0 (default)
    this.loop = opt.loop || false;                                                                                                                  // 무한 스와이프 : false (default)
    this.swiperSpeed = opt.swiperSpeed || '1s';                                                                                                     // 스와이프 스피드 : 1s (default)
    this.swiperEffect = opt.swiperEffect || 'ease'                                                                                                  // 스와이프 이펙트 : ease (default)
    this.ingSwiperNot = opt.ingSwiperNot || false;                                                                                                  // 스와이프 중 이벤트 막기 : false (default)
    this.itemView = opt.itemView || 1;                                                                                                              // 스와이프 영역에서 한번에 몇개의 스와이프를 노출 할지 결정 : 1 (default)
    this.itemViewSwiper = this.itemView > 1 ? (opt.itemViewSwiper > this.itemView ? this.itemView : opt.itemViewSwiper) : 1;                        // 노출되는 스와이프가 2개 이상이 경우 스와이프가 되는 개수 결정 : this.itemView (default)
    
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
    this.swiperItem = this.targetName.find('.slide-item');

    if (this.mode === 'horizontal') {
        this.swiperWidth = this.itemView > 1 ? (this.swiperWrapper.width() - 2 * this.between * (this.itemView - 1)) / this.itemView : this.swiperWrapper.width();
        this.swiperHeight = this.swiperWrapper.height();
    } else if (this.mode === 'vertical') {
        this.swiperWidth = this.swiperWrapper.width();
        this.swiperHeight = this.itemView > 1 ? (this.swiperWrapper.height()) - 2 * this.between  * (this.itemView - 1) / this.itemView : this.swiperWrapper.height();
    }

    this.prevBtn;
    this.nextBtn;
    
    this.indicatorDot;
    this.indicatorNum;
    this.indicatorBar;
    
    this.pageX;
    this.pageY;

    this.moveX;
    this.moveY;
    this.moveXY;
    
    this.swiperWH = this.mode === 'horizontal' ? this.swiperWidth : this.swiperHeight;
    
    this.swiperLength = this.targetName[0].childElementCount;
    this.cloneLength;

    this.offsetX = this.swiperWrapper.offset().left;
    this.offsetY = this.swiperWrapper.offset().top;
    this.offsetXY = this.mode === 'horizontal' ? this.offsetX : this.offsetY;
    
    this.curX = this.targetName.position().left;
    this.curY = this.targetName.position().top;
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
        // 기본 세팅 (스와이프, 버튼, 네비게이션)
        this.commonSet();

        // 'horizontal', 'vertical', 'scroll' 세팅
        this.initMode();

        // 이벤트 적용 목록
        this.eventBox();

        // 자동롤링
        this.autoPlayInit();

        // 동시 스와이프
        if (this.mergeTarget) {
            this.mergeTarget.mergeObj = this;
        }
    },

    // 기본 HTML 세팅
    commonSet : function() {
        // 적용된 스와이프에 부모요소 추가
        this.targetName.wrap('<div class="swiper-cont"></div>');

        // 스와이프 아이템 세팅
        this.swiperItemSet();

        // 스와이프 인디케이터 세팅
        if (this.indicator === true) {this.swiperIndicatorSet();};

        // 스와이프 버튼
        if (this.swiperBtn === true) {
            this.swiperBtnSet();
        } else {
            this.swiperWrapper.find('.swiper-btn > button').css({'display': 'none', 'opacity': 0, 'z-index': -1});
        };
    },

    // 스와이프 아이템 세팅
    swiperItemSet : function() {
        this.swiperItem.css({'width': this.swiperWidth, 'height': this.swiperHeight});
        this.swiperItem.css(this.swiperItemLT, this.between + 'px');
        this.swiperItem.css(this.swiperItemRB, this.between + 'px');
        this.swiperItem.eq(this.viewIndex - 1).addClass('active');

        for (var i = 0; i <= this.swiperLength; i++) {
            this.swiperItem.eq(i).attr('slide-data', i);
        }

        // 'loop'의 경우 클론
        if (this.loop === true) {
            for (var i = this.itemView; i > 0; i--) {
                var fIndex = this.itemView - i; 
                var first = i - (this.itemView + 1);
                var firstClone = this.swiperItem.not('.clone').eq(fIndex).clone().addClass('clone').attr('slide-data', first);
                firstClone.appendTo(this.targetName);
            }
            
            for (var i = 0; i < this.itemView; i++) {
                var lIndex = - (i + 1);
                var last = i + this.swiperLength + 1;
                var lastClone = this.swiperItem.not('.clone').eq(lIndex).clone().addClass('clone').attr('slide-data', last);
                lastClone.prependTo(this.targetName);
            }
        }
    },

    // 스와이프 버튼 세팅
    swiperBtnSet : function() {
        this.prevBtn = this.swiperWrapper.find('.prev-btn');
        this.nextBtn = this.swiperWrapper.find('.next-btn');

        if (this.mergeTarget && this.mergeBtnHidden == 'hidden') {
            this.swiperWrapper.find('.swiper-btn > button').css({'z-index' : -1, 'opacity' : 0});
        }
    },

    // swiper indicator 세팅
    swiperIndicatorSet : function() {
        this.targetName.parents('.swiper-wrap').find('.swiper-indicator').append('<ul class="indicator-list"></ul>');

        // 인디케이터 타입 : dot
        if (this.indicatorType === 'dot') {
            for (var i = 0; i <= this.swiperLength - 1; i++) {
                this.indicatorDot = '<li class="indicator-items" indicator-data="' + i + '">' + (i + 1) + '</li>';
                this.targetName.parents('.swiper-wrap').find('.indicator-list').append(this.indicatorDot);
            }

            // 'dot' 인디케이터 클래스 추가
            this.swiperWrapper.find('> .indicator-items').eq(this.viewIndex).addClass('active');

            // 동시 스와이프를 사용할 때, 자식의 스와이프 인디케이터 숨김
            if (this.mergeTarget && this.mergeDotHidden == 'hidden') {
                $(this.swiperWrapper).find('.indicator-list').css({'z-index' : -1, 'opacity' : 0});
            }
        } 

        // 인디케이터 타입 : number
        else if (this.indicatorType === 'number') {
            if (this.mode === 'horizontal') {
                this.indicatorNum = '<li class="indicator-num"><span class="indicator-cur">' + this.viewIndex + '</span> / <span class="indicator-max">' + this.swiperLength + '</span></li>';
            } else {
                this.indicatorNum = '<li class="indicator-num"><span class="indicator-cur">' + this.viewIndex + '</span><br> / <br><span class="indicator-max">' + this.swiperLength + '</span></li>';
            }
            
            this.targetName.parents('.swiper-wrap').find('.indicator-list').append(this.indicatorNum);
        }

        // 인디케이터 타입 : bar
        else if(this.indicatorType === 'bar') {
            this.viewIndex = this.viewIndex > 0 ? this.viewIndex : 1;
            
            if (this.mode === 'horizontal') {
                this.indicatorBar = '<li class="indicator-bar" style="width:' + (100 / this.swiperLength * this.viewIndex) + '%">' + this.viewIndex + '</li>';
            } else {
                this.indicatorBar = '<li class="indicator-bar" style="height:' + (100 / this.swiperLength * this.viewIndex) + '%">' + this.viewIndex + '</li>';
            }

            this.swiperWrapper.find('.indicator-list').addClass('bar-list');
            this.targetName.parents('.swiper-wrap').find('.indicator-list.bar-list').append(this.indicatorBar);
        }

        this.indicatorDot = this.swiperWrapper.find('.indicator-items');
        this.indicatorNum = this.swiperWrapper.find('.indicator-num')
        this.indicatorBar = this.swiperWrapper.find('.indicator-bar')
    },

    // 모드 세팅
    initMode : function() {
        this.viewIndex = this.viewIndex > 1 ? this.viewIndex - 1 : 0;
        this.cloneLength = this.loop === true ? 1 : 0;
        var itemView = this.loop === true ? (this.itemView > 1 ? 1 : 0) : (this.itemView > 1 ? -1 : 0)

        // console.log('cloneLength :', this.cloneLength, '|| viewIndex :', this.viewIndex);
        this.moveX = - this.swiperWidth * (this.viewIndex + this.cloneLength + itemView) - this.between * (2 * this.viewIndex + 2 * this.cloneLength + 1 + 2 * itemView);
        this.moveY = - this.swiperHeight * (this.viewIndex + this.cloneLength + itemView) - this.between * (2 * this.viewIndex + 2 * this.cloneLength + 1 + 2 * itemView);
        
        this.cloneLength = $(this.targetName).find('.clone').length;

        this.swiperItem.removeClass('active').not('.clone').eq(this.viewIndex).addClass('active');

        if (this.indicator === true) {
            this.indicatorDot.removeClass('active').eq(this.viewIndex).addClass('active');
            this.indicatorNum.find('.indicator-cur').html(this.viewIndex + 1)
        }

        if (this.mode === 'horizontal') {
            this.horizontalSet();
        } else if (this.mode === 'vertical') {
            this.verticalSet();
        }
    },

    // horizontal swiper 세팅
    horizontalSet : function() {
        this.targetName.css({'width': (this.swiperWidth + this.between * 2) * (this.swiperLength + this.cloneLength) + 'px' , 'height': this.swiperHeight + 'px'});
        this.targetName.css('left', this.moveX + 'px');
    },

    // vertical swiper 세팅
    verticalSet : function() {
        this.targetName.css({'width': this.swiperWidth + 'px' , 'height': (this.swiperHeight + this.between * 2) * (this.swiperLength + this.cloneLength) + 'px'});
        this.targetName.css('top', this.moveY + 'px');
    },

    eventBox : function() {
        var _this = this;

        $(_this.targetName)
            .off(_this.evtTypeStart).on(_this.evtTypeStart, _this, function(e){_this.eventDown(e)})
            .off(_this.evtTypeMove).on(_this.evtTypeMove, _this, function(e){_this.eventMove(e)})
            .off(_this.evtTypeEnd).on(_this.evtTypeEnd, _this, function(e){_this.eventUp(e)});

        $(_this.swiperWrapper)
            .off('mouseenter').on('mouseenter', _this, function(e){_this.mouseEnter(e)})
            .off('mouseleave').on('mouseleave', _this, function(e){_this.mouseLeave(e)});
            
        if (_this.swiperBtn === true) {
            _this.nextBtn.on('click', _this, function(e){_this.nextBtnClick(e)});
            _this.prevBtn.on('click', _this, function(e){_this.prevBtnClick(e)});
        }

        if (_this.indicator === true) {
            $(_this.indicatorDot).on('click', _this, _this.naviClick);
        }
        
    },

    autoHeightInit : function() {
        if (this.autoHeight) {
            if (this.mode == 'horizontal') {
                var swiperHeight = this.targetName.find('.slide-item').not('.clone').eq(this.curIndex).height();
                this.swiperWrapper.css({'height': swiperHeight}).find('.swiper-cont').css({'height': swiperHeight});
            } else {
                var swiperWidth = this.targetName.find('.slide-item').not('.clone').eq(this.curIndex).width();
                this.swiperWrapper.css({'width': swiperWidth}).find('.swiper-cont').css({'width': swiperWidth});
            }
        }
    },

    // 자동 롤링 init
    autoPlayInit : function() {
        var _this = this;
        if (_this.autoPlay == true) {
            _this.autoPlaySet = setTimeout(function(){_this.autoPlayEvent()}, _this.autoPlayTime);
        }
    },

    // 자동 롤링 이벤트 세팅값
    autoPlayEvent : function() {
        var _this = this;
        
        _this.curX = parseInt(_this.targetName.position().left);
        _this.curY = parseInt(_this.targetName.position().top);
        _this.curXY = _this.mode === 'horizontal' ? _this.curX : _this.curY;

        _this.prevIndex = _this.viewIndex - 1;
        _this.curIndex = _this.viewIndex;
        _this.nextIndex = _this.viewIndex + 1;

        _this.nextBtnValue(_this, true);
        _this.swiperEndChk(_this, true);
    },

    // var locPageXY = _this.mode === 'horizontal' ? _this.pageX : _this.pageY;                                     클릭 시, 마우스 및 터치 좌표값
    // var curPageXY = _this.mode === 'horizontal' ? _this.pageXY(e)[0] : _this.pageXY(e)[1];                       무브 시, 마우스 및 터치 좌표값

    // 마우스, 터치 다운
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

    // 마우스, 터치 무브
    eventMove : function(e) {
        var _this = e.data;
        if (_this.eventMoveChk === true) {_this.pageDragValue(e);}
    },

    // 마우스, 터치 업
    eventUp : function(e) {
        var _this = e.data;

        _this.eventMouseUpChk = true;
        if (_this.eventMouseUpChk === true) {_this.eventMouseUpValue(e);};

        _this.eventMoveChk = false;
        _this.swiperEndChk(e);
    },

    // '다음'버튼
    nextBtnClick : function(e) {
        var _this = e.data;
        
        if (_this.mergeObj) {
            if (_this.viewIndex != _this.mergeObj.viewIndex) {
                console.log(_this.mergeObj.curX)
                _this.mergeObj.curX = - _this.mergeObj.swiperWidth * (_this.viewIndex + (_this.mergeObj.cloneLength)/2) - 2 * _this.mergeObj.between * (_this.viewIndex + (_this.mergeObj.cloneLength)/2) - _this.mergeObj.between;
                _this.mergeObj.targetName.css(_this.mergeObj.transition_Property, _this.mergeObj.curX + 'px').find('> div').not('.clone').removeClass('active').eq(_this.viewIndex + 1).addClass('active');
                _this.mergeObj.targetName[0].style.transitionProperty = _this.mergeObj.transition_Property;
                _this.mergeObj.targetName[0].style.transitionDuration = _this.mergeObj.transition_Duration;

                $(_this.mergeObj.indicatorDot).removeClass('active').eq(_this.viewIndex + 1).addClass('active');
            } else {
                $(_this.mergeObj.nextBtn).trigger('click');
            }
        } 

        _this.eventClickChk = true;
        _this.transitionIng = true;
        _this.objectDataValue(e);

        if (_this.mergeTarget) {
            _this.nextIndex = parseInt(_this.curX / - _this.swiperWidth) - 1;
        }

        if (_this.eventClickChk === true) {_this.nextBtnValue(e);}

        _this.eventClickChk = false;
        _this.swiperEndChk(e);
    },

    // '이전'버튼
    prevBtnClick : function(e) {
        var _this = e.data;

        if (_this.mergeObj) {
            if (_this.viewIndex != _this.mergeObj.viewIndex) {
                _this.mergeObj.curX = - _this.mergeObj.swiperWidth * (_this.viewIndex + (_this.mergeObj.cloneLength)/2 - 2) - 2 * _this.mergeObj.between * (_this.viewIndex + (_this.mergeObj.cloneLength)/2 - 2) - _this.mergeObj.between;
                _this.mergeObj.targetName.css(_this.mergeObj.transition_Property, _this.mergeObj.curX + 'px').find('> div').not('.clone').removeClass('active').eq(_this.viewIndex - 1).addClass('active');
                _this.mergeObj.targetName[0].style.transitionProperty = _this.mergeObj.transition_Property;
                _this.mergeObj.targetName[0].style.transitionDuration = _this.mergeObj.transition_Duration;

                $(_this.mergeObj.indicatorDot).removeClass('active').eq(_this.viewIndex - 1).addClass('active');
            } else {
                $(_this.mergeObj.prevBtn).trigger('click');
            }
        } 

        _this.eventClickChk = true;
        _this.transitionIng = true;
        _this.objectDataValue(e);

        if (_this.mergeTarget) {
            _this.prevIndex = parseInt(_this.curX / - _this.swiperWidth) - 3;
        }
        
        if (_this.eventClickChk === true) {_this.prevBtnValue(_this);}

        _this.eventClickChk = false;
        _this.swiperEndChk(e);
    },

    // 인디케이터
    naviClick : function(e) {
        var _this = e.data;

        _this.curNavi = parseInt($(this).index());

        if (_this.mergeObj) {
            $(_this.mergeObj.indicatorDot).eq(_this.curNavi).trigger('click');
        }

        _this.eventClickChk = true;
        _this.transitionIng = true;
        _this.objectDataValue(e);

        if (_this.eventClickChk === true) {_this.naviClickValue(_this);};
        
        _this.swiperEndChk(e);
    },

    // autoPlay 중시
    mouseEnter : function() {
        this.autoPlayChk = false;
    },

    // autoPlay 시작
    mouseLeave : function() {
        this.autoPlayChk = true;
        this.autoPlayInit();
    },

    // 스와이프 데이터 값
    objectDataValue : function(e) {
        var _this = e.data;
        
        _this.curX = parseInt(_this.targetName.position().left);
        _this.curY = parseInt(_this.targetName.position().top);
        _this.curXY = _this.mode === 'horizontal' ? _this.curX : _this.curY;

        _this.prevIndex = _this.viewIndex - 1;
        _this.curIndex = _this.viewIndex;
        _this.nextIndex = _this.viewIndex + 1;
        
        // console.log('_this.prevIndex : ' + _this.prevIndex , '\n_this.curIndex : ' + _this.curIndex , '\n_this.nextIndex : ' + _this.nextIndex , '\n_this.firstIndex : ' + _this.firstIndex , '\n_this.viewIndex : ' + _this.viewIndex , '\n_this.lastIndex : ' + _this.lastIndex);
    },

    // 드래그의 30%로 넘어가지 않으면 다시 스와이프 제자리로 설정
    eventMouseUpValue : function(e) {
        var _this = e.data;
        
        var locPageXY = _this.mode === 'horizontal' ? _this.pageX : _this.pageY;                        // 마우스 다운 좌표값
        var curPageXY = _this.mode === 'horizontal' ? _this.pageXY(e)[0] : _this.pageXY(e)[1];          // 마우스 무브 후 업 좌표값
        var direction = locPageXY > curPageXY ? 'next' : 'prev';                                        // 좌/우 이동 감지

        if (direction == 'next') {
            if (curPageXY - _this.offsetXY > (locPageXY - _this.offsetXY) * 0.7) {
                _this.moveXY = _this.curXY;
            }
        } else if (direction == 'prev') {
            if (curPageXY - _this.offsetXY < (locPageXY - _this.offsetXY) / 0.7) {
                _this.moveXY = _this.curXY;
            }
        }

        _this.targetName.css(_this.transition_Property, _this.moveXY);
        _this.targetName[0].style.transitionDuration = '0.5s';
        
    },

    // 스와이퍼 끝나는 시점 체크 & 자동 스와이퍼 실행
    swiperEndChk : function(e, _obj) {

        if (_obj) {
            var _this = e;
        } else {
            var _this = e.data;
        }
        
        $(_this.targetName).on("transitionend webkitTransitionEnd", _this, function(e) {
            _this.transitionIng = false;
            $(_this.targetName).off("transitionend webkitTransitionEnd");

            // console.log('스와이프 끝');
            if (_this.loop === true) {
                // _this.moveXY = _this.itemView > 1 ? : - x * (2 + b) - y * (5 + b * 2) : - x * (1 + b) - y * (3 + b * 2)
                if (_this.curIndex == -1) {
                    _this.moveXY = _this.itemView > 1 ? - _this.swiperWH * (_this.lastIndex + 2) - _this.between * (5 + _this.lastIndex * 2) : - _this.swiperWH * (_this.lastIndex + 1) - _this.between * (3 + _this.lastIndex * 2);
                    _this.transition_Duration = '0s';
                    _this.curIndex = _this.lastIndex;
                } else if (_this.curIndex == _this.swiperLength) {
                    _this.moveXY = _this.itemView > 1 ? - _this.swiperWH * (_this.firstIndex + 2) - _this.between * (5 + _this.firstIndex * 2) : - _this.swiperWH * (_this.firstIndex + 1) - _this.between * (3 + _this.firstIndex * 2);
                    _this.transition_Duration = '0s';
                    _this.curIndex = _this.firstIndex;
                }
            } else {
                if (_this.curIndex == _this.firstIndex) {
                    _this.curIndex = - _this.firstIndex;
                } else if (_this.curIndex == _this.lastIndex) {
                    _this.curIndex = _this.lastIndex;
                }
            } 
            
            if (_this.loop === false && _this.autoPlay === true) {
                
                if (_this.curIndex == _this.lastIndex) {
                    _this.moveXY = -_this.between;
                    _this.transition_Duration = '0s';
                    _this.curIndex = 0;
                    _this.indexValue(e);
                }
            }
            
            _this.viewIndex = _this.curIndex;
            _this.objectDataValue(e);
            _this.swiperMoveValue(_this);

            if (_this.autoPlayChk === true) {
                _this.autoPlayInit(e);
            } else {
                clearTimeout(_this.autoPlaySet);
            }
        })
    },

    // 드래그 공통 값 세팅
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

    // 드래그 '다음' 값 세팅
    nextEventValue : function(e) {
        var _this = e.data;

        var locPageXY = _this.mode === 'horizontal' ? _this.pageX : _this.pageY;
        var curPageXY = _this.mode === 'horizontal' ? _this.pageXY(e)[0] : _this.pageXY(e)[1];
        
        if (curPageXY - _this.offsetXY < (locPageXY - _this.offsetXY) * 0.7) {
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
            _this.moveXY = _this.curXY - ((locPageXY - _this.offsetXY) - (curPageXY - _this.offsetXY));
            _this.curIndex = _this.viewIndex;
        }
    },

    // 드래그 '이전' 값 세팅
    prevEventValue : function(e) {
        var _this = e.data;

        var locPageXY = _this.mode === 'horizontal' ? _this.pageX : _this.pageY;
        var curPageXY = _this.mode === 'horizontal' ? _this.pageXY(e)[0] : _this.pageXY(e)[1];

        if ( curPageXY - _this.offsetXY > (locPageXY - _this.offsetXY) / 0.7) {
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
            _this.moveXY = _this.curXY + ((curPageXY - _this.offsetXY) - (locPageXY  - _this.offsetXY));
            _this.curIndex = _this.viewIndex;
        }
    },

    // '다음' 버튼 값 세팅
    nextBtnValue : function(e, _obj) {
        if (_obj) {
            var _this = e;
        } else {
            var _this = e.data;
        }

        _this.moveXY = _this.curXY - _this.swiperWH - (_this.between * 2);
        _this.curIndex = _this.nextIndex;
        _this.transition_Duration = _this.swiperSpeed;
        
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

    // '이전' 버튼 값 세팅
    prevBtnValue : function(e) {
        var _this = e;

        _this.moveXY = _this.curXY + _this.swiperWH + (_this.between * 2);
        _this.curIndex = _this.prevIndex;
        _this.transition_Duration = _this.swiperSpeed;

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

    // 인디케이터 값 세팅
    naviClickValue : function(e) {
        var _this = e;
        var cloneLength = _this.loop === true ? _this.cloneLength / 2 : 0;
        var num = _this.itemView % 2 ? 'odd' : 'even';                                              // 'odd' 홀수 / 'even' 짝수
        var itemView = num == 'even' ? (_this.itemView > 2 ? _this.itemView / 2 : 0) : parseInt(_this.itemView / 2);
        
        // var _valueAdd = _valueArray.reduce((a , b) => a + b);                                   // 배열 안 객체 합계
        // - _this.swiperWH * _this.curNavi - _this.swiperWH * _this.cloneLength - 2 * _this.between * _this.curNavi - 2 * _this.between * _this.cloneLength - _this.between
        _this.moveXY = - _this.swiperWH * (_this.curNavi + cloneLength) - _this.between * ( (2 * _this.curNavi) + (2 * cloneLength) + 1 ) + _this.swiperWH * itemView + 2 * _this.between * itemView;

        _this.transition_Duration = _this.swiperSpeed;
        _this.curIndex = _this.curNavi;

        _this.swiperMoveValue(e);
        _this.indexValue(e);

        _this.viewIndex = _this.curIndex + 1;
    },

    // 스와이퍼 무브 기능 최종 값 적용
    swiperMoveValue : function(e) {
        var _this = e;

        _this.targetName.css(_this.transition_Property, _this.moveXY + 'px');
        _this.targetName[0].style.transitionProperty = _this.transition_Property;
        _this.targetName[0].style.transitionDuration = _this.transition_Duration;

        _this.autoHeightInit(e);
    },

    // 스와이퍼 인디케이터 최종 값 적용
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
        
        $(_this.swiperItem).removeClass('active').not('.clone').eq(_locIndex).addClass('active');

        // 'dot' 값
        if (_this.indicatorType === 'dot') {
            $(_this.indicatorDot).removeClass('active').eq(_locIndex).addClass('active');

        } 
        // 'number' 값
        else if (_this.indicatorType === 'number') {
            $(_this.indicatorNum).find('.indicator-cur').html(_locIndex + 1);

        } 
        // 'bar' 값
        else if (_this.indicatorType === 'bar') {
            
            $(_this.indicatorBar)[0].style.transitionDuration = _this.transition_Duration;

            // 'horizontal' , 'vertical' 구분
            if (_this.mode === 'horizontal') {
                $(_this.indicatorBar)[0].style.transitionProperty = 'width';
                $(_this.indicatorBar)[0].style.width = 100 / _this.swiperLength * (_locIndex + 1) + '%';
            } else {
                $(_this.indicatorBar)[0].style.transitionProperty = 'height';
                $(_this.indicatorBar)[0].style.height = 100 / _this.swiperLength * (_locIndex + 1) + '%';
            }
            
        };

        _this.viewIndex = _this.curIndex;

    }

}
