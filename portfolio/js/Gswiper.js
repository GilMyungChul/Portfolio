'use strict'

/*** 스와이퍼 플러그인 제작
  ====================== ver 0.0 ======================
    * 2021-03-12 
      - swiper slide 플러그인 제작
  ====================== ver 1.0 ======================
    * 2021-03-31
      - 'horizontal', 'vertical' 슬라이드 적용
      - 인디케이터 종류 2가지 추가 ('number', 'bar')
    * 2021-04-02
      - object clone에 마진값 추가
      - 마진값 추가로 인한 이벤트 적용값 수정
  ====================== ver 1.1 ======================
    * 2021-04-07
      - 스와이프 영역에 보여지는 object의 개수를 사용자가 지정할 수 있도록 설정
      - 스와이프 영역에 보여지는 object의 개수만큼 clone 생성 그에 따른 적용값 설정
      - 사용자가 css로 지정하는 width, height값을 제외한 스크립트로 지정하는 값이 없을 때, 자동적으로 상황에 맞게 설정 
***/

function Gswiper (opt) {
    
    this.evtTypeStart = document.ontouchstart !== null ? 'mousedown' : 'touchstart';
    this.evtTypeMove = document.ontouchstart !== null ? 'mousemove' : 'touchmove';
    this.evtTypeEnd = document.ontouchstart !== null ? 'mouseup' : 'touchend';

    this.pageXY = function(e) {
        var pageX = e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0].pageY : e.originalEvent.pageX;
        var pageY = e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0].pageY : e.originalEvent.pageY;
        var pageXY = new Array(pageX, pageY);

        return pageXY;
    };
    
    this.targetName = opt.targetName;                                                                                                               // swiper target
    this.mode = opt.mode || 'horizontal';                                                                                                           // 모드 : 'horizontal' (default), 'vertical'
    this.scrolling = opt.scrolling || false;                                                                                                        // 스크롤을 이용한 슬라이드 : 'false' (default)
    this.slideBtn = opt.slideBtn == '' ? false : true;                                                                                              // 슬라이드 버튼 : 'true' (default), 'false'
    this.indicator = opt.indicator == '' ? false : true;                                                                                            // 인디케이터 : 'true' (default), 'false'
    this.indicatorType = this.indicator === true ? ($.type(opt.indicatorType) == 'undefined' ? 'dot' : opt.indicatorType) : false                   // 인디케이터 종류 : 'dot' (default), 'number', 'bar'
    this.between = opt.between || 0;                                                                                                                // 슬라이드 간 간격
    this.viewIndex = opt.viewIndex || 0;                                                                                                            // 슬라이드 시작되는 시점 : 0 (default)
    this.slideWidth = opt.slideWidth || false;                                                                                                      // 슬라이드 width
    this.slideHeight = opt.slideHeight || false;                                                                                                    // 슬라이드 height
    this.loop = opt.loop || false;                                                                                                                  // 무한 스와이퍼 : false (default)
    this.slideSpeed = opt.slideSpeed || '1s';                                                                                                       // 슬라이드 스피드 : 1s (default)
    this.slideEffect = opt.slideEffect || 'ease'                                                                                                    // 슬라이드 이펙트 : ease (default)
    this.ingSlideNot = opt.ingSlideNot || false;                                                                                                    // 슬라이드 중 이벤트 막기 : false (default)
    this.itemView = opt.itemView || 1;                                                                                                              // 슬라이드 영역에서 한번에 몇개의 슬라이드를 노출 할지 결정 : 1 (default)
    this.itemViewSlide = this.itemView > 1 ? (opt.itemViewSlide > this.itemView ? this.itemView : opt.itemViewSlide) : 1;                           // 노출되는 슬라이드가 2개 이상이 경우 슬라이드가 되는 개수 결정 : this.itemView (default)

    this.autoPlay = opt.autoPlay || false;                                                                                                          // 자동 스와이프 : false (default) , true
    this.autoPlayTime = opt.autoPlayTime || 600;                                                                                                    // 자동 스와이프 슬라이드 타임 : 1000 (default)
    this.autoPlaySet;

    this.swiperWrapper = this.targetName.parents('.swiper-wrap');
    this.slideItem = this.targetName.find('.slide-item');

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
    
    if (this.mode === 'horizontal') {
        this.slideWidth = this.slideWidth === false ? (this.itemView > 1 ? parseInt(this.swiperWrapper.innerWidth() / this.itemView) + 2 * this.between : this.swiperWrapper.innerWidth()) : this.slideWidth;
        this.slideHeight = this.slideHeight === false ? this.swiperWrapper.innerHeight() : this.slideHeight;
    } else {
        this.slideWidth = this.slideWidth === false ? this.swiperWrapper.innerWidth() : this.slideWidth;
        this.slideHeight = this.slideHeight === false ? (this.itemView > 1 ? parseInt(this.swiperWrapper.innerHeight() / this.itemView) + 2 * this.between : this.swiperWrapper.innerHeight()) : this.slideHeight;
    }
    
    this.slideWH = this.mode === 'horizontal' ? this.slideWidth : this.slideHeight;
    
    this.slideLength = this.targetName[0].childElementCount;
    this.cloneLength;

    this.offsetX = this.swiperWrapper.offset().left;
    this.offsetY = this.swiperWrapper.offset().top;
    this.offsetXY = this.mode === 'horizontal' ? this.offsetX : this.offsetY;

    this.curSlide;
    this.curNavi;
    this.curIndex;
    this.nextIndex;
    this.prevIndex;

    this.curX;
    this.curY;
    this.curXY;

    this.firstIndex = 0;
    this.lastIndex = this.slideLength - 1;

    this.slideItemLT = this.mode === 'horizontal' ? 'margin-left' : 'margin-top';
    this.slideItemRB = this.mode === 'horizontal' ? 'margin-right' : 'margin-bottom';

    this.transition_Duration = this.slideSpeed;
    this.transition_Property = this.mode == 'horizontal' ? 'left' : 'top';
    this.transition_Effect = this.slideEffect;

    this.eventMoveChk = false;
    this.eventClickChk = false;
    this.eventMouseUpChk = false;
    this.transitionIng = false;

    this.init();
}

/**
 * slideWidth / slideHeight = x
 * between = y
 * index = a
 * length = b
 */

Gswiper.prototype = {
    init : function() {

        // 적용된 슬라이드에 부모요소 추가
        this.targetName.wrap('<div class="swiper-cont"></div>');

        // 기본 세팅 (슬라이드, 버튼, 네비게이션)
        this.defaultset();

        // 'horizontal', 'vertical', 'scroll' 세팅
        this.modeSet();

        // 이벤트 적용 목록
        this.eventList();

        // 자동롤링
        this.autoPlayInit();

    },

    // 기본 HTML 세팅
    defaultset : function() {
        
        var slideWidth = this.mode === 'horizontal' ? (this.itemView > 1 ? this.slideWidth * this.itemView + this.between  * 2 * (this.itemView - 1) : this.slideWidth) : this.slideWidth;
        var slideHeight = this.mode === 'vertical' ? (this.itemView > 1 ? this.slideHeight * this.itemView + this.between  * 2 * (this.itemView - 1) : this.slideHeight) : this.slideHeight;
        
        this.swiperWrapper.css({'width': slideWidth, 'height': slideHeight}).find('.swiper-cont').css({'width': slideWidth, 'height': slideHeight});

        // 슬라이드 아이템 세팅
        this.slideItemSet();

        // 슬라이드 인디케이터 세팅
        if (this.indicator === true) {this.slideIndicatorSet();};

        // 슬라이드 버튼
        if (this.slideBtn === true) {this.slideBtnSet();};
    },

    // 슬라이드 아이템 세팅
    slideItemSet : function() {

        this.slideItem.css({'width': this.slideWidth, 'height': this.slideHeight});
        this.slideItem.css(this.slideItemLT, this.between + 'px');
        this.slideItem.css(this.slideItemRB, this.between + 'px');

        for (var i = 0; i <= this.slideLength; i++) {
            this.slideItem.eq(i).attr('slide-data', i);
        }

        // 'loop'의 경우 클론
        if (this.loop === true) {

            for (var i = this.itemView; i > 0; i--) {
                var fIndex = this.itemView - i; 
                var first = i - (this.itemView + 1);
                // console.log(this.targetName, fIndex, first);
                var firstClone = this.slideItem.not('.clone').eq(fIndex).clone().addClass('clone').attr('slide-data', first);
                firstClone.appendTo(this.targetName);
            }
            
            for (var i = 0; i < this.itemView; i++) {
                var lIndex = - (i + 1);
                var last = i + this.slideLength + 1;
                // console.log(this.targetName, lIndex, last);
                var lastClone = this.slideItem.not('.clone').eq(lIndex).clone().addClass('clone').attr('slide-data', last);
                lastClone.prependTo(this.targetName);
            }
            
        }

        // 활성화 아이템 클래스 추가
        this.slideItem.not('.clone').eq(this.viewIndex - 1).addClass('active');
        
    },

    // 슬라이드 버튼 세팅
    slideBtnSet : function() {
        this.prevBtn = this.swiperWrapper.find('.prev-btn');
        this.nextBtn = this.swiperWrapper.find('.next-btn');
    },

    // 슬라이드 인디케이터 세팅
    slideIndicatorSet : function() {

        this.targetName.parents('.swiper-wrap').find('.swiper-indicator').append('<ul class="indicator-list"></ul>');

        // 인디케이터 타입 : dot
        if (this.indicatorType === 'dot') {
            for (var i = 0; i <= this.slideLength - 1; i++) {
                this.indicatorDot = '<li class="indicator-items" indicator-data="' + i + '">' + (i + 1) + '</li>';
                this.targetName.parents('.swiper-wrap').find('.indicator-list').append(this.indicatorDot);
            }

            // 'dot' 인디케이터 클래스 추가
            this.swiperWrapper.find('> .indicator-items').eq(this.viewIndex).addClass('active');

        } 
        // 인디케이터 타입 : number
        else if (this.indicatorType === 'number') {
            if (this.mode === 'horizontal') {
                this.indicatorNum = '<li class="indicator-num"><span class="indicator-cur">' + this.viewIndex + '</span> / <span class="indicator-max">' + this.slideLength + '</span></li>';
            } else {
                this.indicatorNum = '<li class="indicator-num"><span class="indicator-cur">' + this.viewIndex + '</span><br> / <br><span class="indicator-max">' + this.slideLength + '</span></li>';
            }
            
            this.targetName.parents('.swiper-wrap').find('.indicator-list').append(this.indicatorNum);
        }
        // 인디케이터 타입 : bar
        else if(this.indicatorType === 'bar') {
            this.viewIndex = this.viewIndex > 0 ? this.viewIndex : 1;
            
            if (this.mode === 'horizontal') {
                this.indicatorBar = '<li class="indicator-bar" style="width:' + (100 / this.slideLength * this.viewIndex) + '%">' + this.viewIndex + '</li>';
            } else {
                this.indicatorBar = '<li class="indicator-bar" style="height:' + (100 / this.slideLength * this.viewIndex) + '%">' + this.viewIndex + '</li>';
            }

            this.swiperWrapper.find('.indicator-list').addClass('bar-list');
            this.targetName.parents('.swiper-wrap').find('.indicator-list.bar-list').append(this.indicatorBar);
        }

        this.indicatorDot = this.swiperWrapper.find('.indicator-items');
        this.indicatorNum = this.swiperWrapper.find('.indicator-num')
        this.indicatorBar = this.swiperWrapper.find('.indicator-bar')
    },

    // 모드 세팅
    modeSet : function() {
        this.viewIndex = this.viewIndex > 1 ? this.viewIndex - 1 : 0;
        this.cloneLength = this.loop === true ? 1 : 0;
        var itemView = this.loop === true ? (this.itemView > 1 ? 1 : 0) : (this.itemView > 1 ? -1 : 0)

        // console.log('cloneLength :', this.cloneLength, '|| viewIndex :', this.viewIndex);
        this.moveX = - this.slideWidth * (this.viewIndex + this.cloneLength + itemView) - this.between * (2 * this.viewIndex + 2 * this.cloneLength + 1 + 2 * itemView);
        this.moveY = - this.slideHeight * (this.viewIndex + this.cloneLength + itemView) - this.between * (2 * this.viewIndex + 2 * this.cloneLength + 1 + 2 * itemView);
        
        this.cloneLength = $(this.targetName).find('.clone').length;

        this.slideItem.removeClass('active').not('.clone').eq(this.viewIndex).addClass('active');

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

    // horizontal slide 세팅
    horizontalSet : function() {
        this.targetName.css({'width': (this.slideWidth + this.between * 2) * (this.slideLength + this.cloneLength) + 'px' , 'height': this.slideHeight + 'px'});
        this.targetName.css('left', this.moveX + 'px');
    },

    verticalSet : function() {
        this.targetName.css({'width': this.slideWidth + 'px' , 'height': (this.slideHeight + this.between * 2) * (this.slideLength + this.cloneLength) + 'px'});
        this.targetName.css('top', this.moveY + 'px');
    },

    eventList : function() {
        var _this = this;

        $(_this.targetName)
            .off(_this.evtTypeStart).on(_this.evtTypeStart, _this, function(e){_this.eventDown(e)})
            .off(_this.evtTypeMove).on(_this.evtTypeMove, _this, function(e){_this.eventMove(e)})
            .off(_this.evtTypeEnd).on(_this.evtTypeEnd, _this, function(e){_this.eventUp(e)});
            
        if (_this.slideBtn === true) {
            _this.nextBtn.on('click', _this, function(e){_this.nextBtnClick(e)});
            _this.prevBtn.on('click', _this, function(e){_this.prevBtnClick(e)});
        }

        if (_this.indicator === true) {$(_this.indicatorDot).on('click', _this, function(e){_this.naviClick(e)});}
        
    },

    autoPlayInit : function() {
        var _this = this;
        if (_this.autoPlay == true) {
            _this.autoPlaySet = setTimeout(function(){_this.autoPlayEvent()}, _this.autoPlayTime);
        }
    },

    autoPlayEvent : function() {
        var _this = this;
        
        _this.curX = parseInt(_this.targetName[0].style.left);
        _this.curY = parseInt(_this.targetName[0].style.top);
        _this.curXY = _this.mode === 'horizontal' ? _this.curX : _this.curY;

        _this.prevIndex = _this.viewIndex - 1;
        _this.curIndex = _this.viewIndex;
        _this.nextIndex = _this.viewIndex + 1;

        _this.nextBtnValue(_this, true);
        _this.eventLoopCheck(_this, true);
    },

    // var locPageXY = _this.mode === 'horizontal' ? _this.pageX : _this.pageY;                                     클릭 시, 마우스 및 터치 좌표값
    // var curPageXY = _this.mode === 'horizontal' ? _this.pageXY(e)[0] : _this.pageXY(e)[1];                       무브 시, 마우스 및 터치 좌표값

    // 마우스, 터치 다운
    eventDown : function(e) {
        var _this = e.data;
        
        _this.eventMouseUpChk = false;
        _this.eventMoveChk = true;
        _this.transitionIng = true;
        
        _this.objectDataValue(e);
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
        _this.eventLoopCheck(e);
    },

    nextBtnClick : function(e) {
        var _this = e.data;
        
        _this.nextBtn = $(this);
        _this.eventClickChk = true;
        _this.transitionIng = true;

        _this.objectDataValue(e);

        if (_this.eventClickChk === true) {_this.nextBtnValue(e);}

        _this.eventClickChk = false;
        _this.eventLoopCheck(e);
    },

    prevBtnClick : function(e) {
        var _this = e.data;
        
        _this.prevBtn = $(this);
        _this.eventClickChk = true;
        _this.transitionIng = true;

        _this.objectDataValue(e);
        
        if (_this.eventClickChk === true) {_this.prevBtnValue(_this);}

        _this.eventClickChk = false;
        _this.eventLoopCheck(e);
    },

    naviClick : function(e) {
        var _this = e.data;

        _this.curNavi = parseInt($(this).index());

        _this.transitionIng = true;
        _this.objectDataValue(e);

        if (_this.eventClickChk === true) {_this.naviClickValue(_this);};
        
        _this.eventLoopCheck(e);
    },

    // 슬라이드 데어터 값
    objectDataValue : function(e) {
        var _this = e.data;

        _this.pageX = _this.pageXY(e)[0];
        _this.pageY = _this.pageXY(e)[1];
        
        _this.curX = parseInt(_this.targetName[0].style.left);
        _this.curY = parseInt(_this.targetName[0].style.top);
        _this.curXY = _this.mode === 'horizontal' ? _this.curX : _this.curY;

        _this.prevIndex = _this.viewIndex - 1;
        _this.curIndex = _this.viewIndex;
        _this.nextIndex = _this.viewIndex + 1;
        
        // console.log('_this.prevIndex : ' + _this.prevIndex , '\n_this.curIndex : ' + _this.curIndex , '\n_this.nextIndex : ' + _this.nextIndex , '\n_this.firstIndex : ' + _this.firstIndex , '\n_this.viewIndex : ' + _this.viewIndex , '\n_this.lastIndex : ' + _this.lastIndex);
    },

    // 드래그의 50%로 넘어가지 않으면 다시 슬라이드 제자리로 설정
    eventMouseUpValue : function(e) {
        var _this = e.data;

        var locPageXY = _this.mode === 'horizontal' ? _this.pageX : _this.pageY;
        var curPageXY = _this.mode === 'horizontal' ? _this.pageXY(e)[0] : _this.pageXY(e)[1];

        if ( curPageXY - _this.offsetXY > (locPageXY - _this.offsetXY) * 0.7 && curPageXY - _this.offsetXY < (locPageXY - _this.offsetXY) / 0.7 ) {
            console.log('X축 50% 넘지 않았다');
            _this.moveXY = _this.curXY;
        }
        
        _this.targetName.css(_this.transition_Property, _this.moveXY);
        _this.targetName[0].style.transitionDuration = '0.5s';
    },

    // 무한루프 값에 따른 설정 값
    eventLoopCheck : function(e, _obj) {

        if (_obj) {
            var _this = e;
        } else {
            var _this = e.data;
        }
        
        $(_this.targetName).on("transitionend webkitTransitionEnd", _this, function(e) {
            _this.transitionIng = false;
            $(_this.targetName).off("transitionend webkitTransitionEnd");

            console.log('슬라이드 끝');
            if (_this.loop === true) {
                // _this.moveXY = _this.itemView > 1 ? : - x * (2 + b) - y * (5 + b * 2) : - x * (1 + b) - y * (3 + b * 2)
                if (_this.curIndex == -1) {
                    _this.moveXY = _this.itemView > 1 ? - _this.slideWH * (_this.lastIndex + 2) - _this.between * (5 + _this.lastIndex * 2) : - _this.slideWH * (_this.lastIndex + 1) - _this.between * (3 + _this.lastIndex * 2);
                    _this.transition_Duration = '0s';
                    _this.curIndex = _this.lastIndex;
                } else if (_this.curIndex == _this.slideLength) {
                    _this.moveXY = _this.itemView > 1 ? - _this.slideWH * (_this.firstIndex + 2) - _this.between * (5 + _this.firstIndex * 2) : - _this.slideWH * (_this.firstIndex + 1) - _this.between * (3 + _this.firstIndex * 2);
                    _this.transition_Duration = '0s';
                    _this.curIndex = _this.firstIndex;
                }
            } else {
                if (_this.curIndex == _this.firstIndex) {
                    _this.curIndex = _this.firstIndex;
                } else if (_this.curIndex == _this.lastIndex) {
                    _this.curIndex = _this.lastIndex;
                }
            }
            
            _this.viewIndex = _this.curIndex;
            _this.objectDataValue(e);
            _this.slideMoveValue(_this);
            _this.autoPlayInit(e);
        })
    },

    // 드래그시, 필요한 값 세팅
    pageDragValue : function(e) {
        var _this = e.data;

        var locPageXY = _this.mode === 'horizontal' ? _this.pageX : _this.pageY;
        var curPageXY = _this.mode === 'horizontal' ? _this.pageXY(e)[0] : _this.pageXY(e)[1];

        

        if (curPageXY < locPageXY) {
            _this.nextEventValue(e)
        } else if (curPageXY > locPageXY) {
            _this.prevEventValue(e)
        }
        
        _this.slideMoveValue(_this);
        _this.indexValue(_this);
        
    },

    nextEventValue : function(e) {
        var _this = e.data;

        var locPageXY = _this.mode === 'horizontal' ? _this.pageX : _this.pageY;
        var curPageXY = _this.mode === 'horizontal' ? _this.pageXY(e)[0] : _this.pageXY(e)[1];
        
        if (curPageXY - _this.offsetXY < (locPageXY - _this.offsetXY) * 0.7) {
            _this.transition_Duration = _this.slideSpeed;
            _this.moveXY = _this.curXY - _this.slideWH - (_this.between * 2);
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

    prevEventValue : function(e) {
        var _this = e.data;

        var locPageXY = _this.mode === 'horizontal' ? _this.pageX : _this.pageY;
        var curPageXY = _this.mode === 'horizontal' ? _this.pageXY(e)[0] : _this.pageXY(e)[1];

        if ( curPageXY - _this.offsetXY > (locPageXY - _this.offsetXY) / 0.7) {
            _this.transition_Duration = _this.slideSpeed;
            _this.moveXY = _this.curXY + _this.slideWH + (_this.between * 2);
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

    nextBtnValue : function(e, _obj) {

        if (_obj) {
            var _this = e;
        } else {
            var _this = e.data;
        }
        

        _this.moveXY = _this.curXY - _this.slideWH - (_this.between * 2);
        _this.curIndex = _this.nextIndex;
        _this.transition_Duration = _this.slideSpeed;
        
        if (_this.loop === false) {
            if (_this.curIndex > _this.lastIndex) {
                _this.moveXY = _this.curXY;
                _this.curIndex = _this.viewIndex;
            } else {
                _this.viewIndex = _this.nextIndex;
            }
        }
        
        _this.slideMoveValue(_this);
        _this.indexValue(_this);
    },

    prevBtnValue : function(e) {
        var _this = e;

        _this.moveXY = _this.curXY + _this.slideWH + (_this.between * 2);
        _this.curIndex = _this.prevIndex;
        _this.transition_Duration = _this.slideSpeed;

        if (_this.loop === false) {
            if (_this.curIndex < 0) {
                _this.moveXY = _this.curXY;
                _this.curIndex = _this.viewIndex;
            } else {
                _this.viewIndex = _this.prevIndex;
            }
        }
        
        _this.slideMoveValue(_this);
        _this.indexValue(_this);
    },

    // 네비게이션 클릭시, 필요한 값 세팅
    naviClickValue : function(e) {
        var _this = e;
        _this.cloneLength = _this.loop === true ? 1 : 0;
        

        // _this.moveXY = _this.itemView > 1 ? - x * (a + 2) - y * (2a + 5) : - x * (a + 1) - y * (2a + 3)
        _this.moveXY = _this.itemView > 1 ? - _this.slideWH * (_this.curNavi + 2) - _this.between * (2 * _this.curNavi + 5) : - _this.slideWH * (_this.curNavi + 1) - _this.between * (2 * _this.curNavi + 3);

        console.log(_this.moveXY, _this.itemView);
        _this.transition_Duration = _this.slideSpeed;
        _this.curIndex = _this.curNavi;

        _this.slideMoveValue(e);
        _this.indexValue(e);

        _this.viewIndex = _this.curIndex + 1;
    },

    // 드래그, 버튼, 네비게이션 값을 받아 슬라이드 동작
    slideMoveValue : function(e) {
        var _this = e;

        _this.targetName.css(_this.transition_Property, _this.moveXY + 'px');
        _this.targetName[0].style.transitionProperty = _this.transition_Property;
        _this.targetName[0].style.transitionDuration = _this.transition_Duration;
    },

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
        
        $(_this.slideItem).removeClass('active').not('.clone').eq(_locIndex).addClass('active');

        if (_this.indicatorType === 'dot') {
            $(_this.indicatorDot).removeClass('active').eq(_locIndex).addClass('active');

        } else if (_this.indicatorType === 'number') {
            $(_this.indicatorNum).find('.indicator-cur').html(_locIndex + 1);

        } else if (_this.indicatorType === 'bar') {
            
            $(_this.indicatorBar)[0].style.transitionDuration = _this.transition_Duration;

            // 'horizontal' , 'vertical' 구분
            if (_this.mode === 'horizontal') {
                $(_this.indicatorBar)[0].style.transitionProperty = 'width';
                $(_this.indicatorBar)[0].style.width = 100 / _this.slideLength * (_locIndex + 1) + '%';
            } else {
                $(_this.indicatorBar)[0].style.transitionProperty = 'height';
                $(_this.indicatorBar)[0].style.height = 100 / _this.slideLength * (_locIndex + 1) + '%';
            }
            
        };

        _this.viewIndex = _this.curIndex;

    }

}
