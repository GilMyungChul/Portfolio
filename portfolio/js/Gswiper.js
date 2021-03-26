'use strict'

/*** 드래그 플러그인 제작
  ====================== ver 0.0 ======================
    * 2021-03-12 
      - swiper slide 플러그인 제작
    * 2021-03-17
      - drag, click, navi 이벤트 슬라이드 적용
    * 2021-03-24
      - 'transitionend webkitTransitionEnd' 슬라이드 감지 이벤트 추가
    * 2021-03-26
      - drag, click, navi 이벤트 value값 정리 및 적용  
      
***/

function Gswiper (opt) {

    this.pageXY = function(e) {
        var pageX = e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0].pageX : e.originalEvent.pageX;
        var pageY = e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0].pageY : e.originalEvent.pageY;
        var pageXY = new Array(pageX, pageY);

        return pageXY;
    };
    
    this.targetName = opt.targetName;                                                                                                               // swiper target
    this.mode = opt.mode || 'horizontal';                                                                                                           // 모드 : 'horizontal' (default), 'vertical', 'scroll'
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
    
    this.swiperWrapper = this.targetName.parents('.swiper-wrap');
    this.slideItem = this.targetName.find('.slide-item');

    this.prevBtn;
    this.nextBtn;
    
    this.indicatorItem;
    
    this.pageX;
    this.pageY;

    this.moveX;
    this.moveY;
    
    this.slideWidth = this.slideWidth === false ? parseInt(this.swiperWrapper.innerWidth()) : this.slideWidth;
    this.slideHeight = this.slideHeight === false ? parseInt(this.swiperWrapper.innerHeight()) : this.slideHeight;
    
    this.slideLength = this.targetName[0].childElementCount;
    this.cloneLength;

    this.offsetLeft = this.swiperWrapper.offset().left;
    this.offsetTop = this.swiperWrapper.offset().top;

    this.curSlide;
    this.curNavi;
    this.curIndex;
    this.nextIndex;
    this.prevIndex;
    this.curX;
    this.curY;

    this.firstIndex = 0;
    this.lastIndex = this.slideLength - 1;

    this.transition_Duration = this.slideSpeed;
    this.transition_Property = this.mode == 'horizontal' ? 'left' : 'top';
    this.transition_Effect = this.slideEffect;

    this.eventMoveChk = false;
    this.eventClickChk = false;
    this.eventMouseUpChk = false;
    this.transitionIng = false;

    this.init();
}

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

    },

    // 기본 HTML 세팅
    defaultset : function() {
        
        this.swiperWrapper.find('.swiper-cont').css({'width': this.slideWidth, 'height': this.slideHeight});

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
        for (var i = 0; i <= this.slideLength; i++) {
            this.slideItem.eq(i).attr('slide-data', i);
        }

        if (this.loop === true) {
            var firstClone = this.slideItem.eq(this.slideLength - 1).clone().addClass('clone').attr({'data-clone': this.slideLength - 1, 'slide-data': -1});
            var lastClone = this.slideItem.eq(0).clone().addClass('clone').attr({'data-clone': 0, 'slide-data': this.slideLength});
            lastClone.appendTo(this.targetName);
            firstClone.prependTo(this.targetName);
        }

        // 활성화 아이템 클래스 추가
        this.slideItem.eq(this.viewIndex).addClass('active');
    },

    // 슬라이드 버튼 세팅
    slideBtnSet : function() {
        this.prevBtn = this.swiperWrapper.find('.prev-btn');
        this.nextBtn = this.swiperWrapper.find('.next-btn');
    },

    // 슬라이드 인디케이터 세팅
    slideIndicatorSet : function() {

        this.targetName.parents('.swiper-wrap').find('.swiper-indicator').append('<ul class="indicator-list"></ul>');

        for (var i = 0; i <= this.slideLength - 1; i++) {
            this.indicatorItem = '<li class="indicator-items" indicator-data="' + i + '">' + (i + 1) + '</li>';
            this.targetName.parents('.swiper-wrap').find('.indicator-list').append(this.indicatorItem);
        }

        // 활성화 인디케이터 클래스 추가
        this.swiperWrapper.find('.indicator-items').eq(this.viewIndex).addClass('active');

        this.indicatorItem = this.swiperWrapper.find('.indicator-items');
    },

    // 모드 세팅
    modeSet : function() {
        var viewIndex = this.viewIndex > 0 ? this.viewIndex - 1 : 0;
        this.cloneLength = this.loop === true ? 1 : 0;

        // console.log(this.viewIndex , this.cloneLength, this.between)

        this.moveX = - this.slideWidth * (this.cloneLength + viewIndex) - this.between * 2 * (viewIndex + this.cloneLength);
        this.moveY = - this.slideHeight * (this.cloneLength + viewIndex) - this.between * 2 * (viewIndex + this.cloneLength);
        
        this.cloneLength = $(this.targetName).find('.clone').length;

        this.slideItem.removeClass('active').not('.clone').eq(viewIndex).addClass('active');
        if (this.indicator === true) {
            this.indicatorItem.removeClass('active').eq(viewIndex).addClass('active');
        }

        if (this.mode === 'horizontal') {
            this.horizontalSet();
        } else if (this.mode === 'vertical') {
            this.verticalSet();
        } else if (this.mode === 'scroll') {
            console.log('scroll');
        };
    },

    // horizontal slide 세팅
    horizontalSet : function() {
        this.slideItem.css({'margin-left': this.between + 'px', 'margin-right': this.between + 'px'});
        this.targetName.css({'width': (this.slideWidth * (this.slideLength + this.cloneLength)) + (this.between * 2 * (this.slideLength + this.cloneLength)) + 'px' , 'height': this.slideHeight + 'px'});
        this.targetName.css('left', this.moveX + 'px');
    },

    verticalSet : function() {
        this.slideItem.css({'margin-top': this.between + 'px', 'margin-bottom': this.between + 'px'});
        this.targetName.css({'width': this.slideWidth + 'px' , 'height': (this.slideHeight * (this.slideLength + this.cloneLength)) + (this.between * 2 * (this.slideLength + this.cloneLength)) + 'px'});
        this.targetName.css('top', this.moveY + 'px');
    },

    eventList : function() {
        var _this = this;

        $(_this.targetName)
            .on('mousedown', _this, _this.eventDown)
            .on('touchstart', _this, _this.eventDown);

        $(_this.targetName)
            .on('mousemove', _this, function(e){_this.eventMove(e)})
            .on('touchmove', _this, function(e){_this.eventMove(e)})
            .on('mouseup', _this, function(e){_this.eventUp(e)})
            .on('touchend', _this, function(e){_this.eventUp(e)});
            
        if (_this.slideBtn === true) {
            _this.nextBtn.on('click', _this, _this.nextBtnClick);
            _this.prevBtn.on('click', _this, _this.prevBtnClick);
        }

        if (_this.indicator === true) {$(_this.indicatorItem).on('click', _this, _this.naviClick);}
    },

    // 마우스, 터치 다운
    eventDown : function(e) {
        var _this = e.data;
        
        _this.eventMouseUpChk = false;
        _this.startEventValue(e);
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

        _this.endEventValue(e);
    },

    nextBtnClick : function(e) {
        var _this = e.data;
        
        _this.nextBtn = $(this);
        _this.startEventValue(e);
        if (_this.eventClickChk === true) {_this.nextBtnValue(e);}
        _this.endEventValue(e);
    },

    prevBtnClick : function(e) {
        var _this = e.data;
        
        _this.prevBtn = $(this);
        _this.startEventValue(e);
        if (_this.eventClickChk === true) {_this.prevBtnValue(e);}
        _this.endEventValue(e);
    },

    naviClick : function(e) {
        var _this = e.data;

        _this.curNavi = parseInt($(this).index());
        _this.startEventValue(e);
        if (_this.eventClickChk === true) {_this.naviClickValue(e);};
        _this.endEventValue(e);
    },

    // 슬라이드 시작
    startEventValue : function(e) {
        var _this = e.data;

        _this.eventMoveChk = true;
        _this.eventClickChk = true;
        _this.transitionIng = true;
        
        _this.objectDataValue(e);
    },

    // 슬라이드 중간
    moveEventValue : function(e) {
        var _this = e.data;
    },

    // 슬라이드 끝
    endEventValue : function(e) {
        var _this = e.data;

        _this.eventMoveChk = false;
        _this.eventClickChk = false;

        _this.eventLoopCheck(e);
    },

    // 슬라이드 데어터 값
    objectDataValue : function(e) {
        var _this = e.data;
        _this.pageX = _this.pageXY(e)[0];
        _this.pageY = _this.pageXY(e)[1];

        _this.curX = parseInt(_this.targetName[0].style.left);

        _this.prevIndex = _this.viewIndex - 1;
        _this.nextIndex = _this.viewIndex + 1;

        console.log(_this.prevIndex , _this.viewIndex , _this.nextIndex)
    },

    // 드래그의 50%로 넘어가지 않으면 다시 슬라이드 제자리로 설정
    eventMouseUpValue : function(e) {
        var _this = e.data;
        
        if ( _this.pageXY(e)[0] - _this.offsetLeft > (_this.pageX - _this.offsetLeft) * 0.6 && _this.pageXY(e)[0] - _this.offsetLeft < (_this.pageX - _this.offsetLeft) / 0.6 ) {
            console.log('30% 넘지 않았다');
            console.log(_this.curIndex, _this.curX);
            _this.moveX = _this.curX;
            _this.targetName.css('left', _this.moveX);
            _this.targetName[0].style.transitionDuration = '0.5s';
        } 
        
    },

    // 무한루프 값에 따른 설정 값
    eventLoopCheck : function(e) {
        var _this = e.data;
        
        $(_this.targetName).on("transitionend webkitTransitionEnd", _this, function(e) {
            _this.transitionIng = false;
            $(_this.targetName).off("transitionend webkitTransitionEnd");

            if (_this.loop === true) {
                if (_this.curIndex == -1) {
                    _this.moveX = -(_this.slideWidth * _this.lastIndex) - (_this.between * _this.lastIndex * 2) - _this.slideWidth;
                    _this.transition_Duration = '0s';
                    _this.curIndex = _this.lastIndex;
                    _this.activeClassValue(e);
                } else if (_this.curIndex == _this.slideLength) {
                    _this.moveX = -(_this.slideWidth * _this.firstIndex) - (_this.between * _this.firstIndex * 2) - _this.slideWidth;
                    _this.transition_Duration = '0s';
                    _this.curIndex = _this.firstIndex;
                    _this.activeClassValue(e);
                }
            } 

            if (_this.loop === false) {
                console.log(_this.curIndex);
                if (_this.curIndex <= _this.firstIndex) {
                    _this.moveX = -(_this.slideWidth * _this.firstIndex) - (_this.between * _this.firstIndex * 2) - _this.slideWidth;
                    _this.curIndex = _this.firstIndex;
                    _this.activeClassValue(e);
                } else if (_this.curIndex >= _this.lastIndex) {
                    _this.moveX = -(_this.slideWidth * _this.lastIndex) - (_this.between * _this.lastIndex * 2) - _this.slideWidth;
                    _this.curIndex = _this.lastIndex;
                    _this.activeClassValue(e);
                }
            }

            _this.slideMoveValue(e);
        })
    },

    // 드래그시, 필요한 값 세팅
    pageDragValue : function(e) {
        var _this = e.data;

        if (_this.pageXY(e)[0]< _this.pageX) {
            _this.nextEventValue(e)
        } else if (_this.pageXY(e)[0]> _this.pageX) {
            _this.prevEventValue(e)
        }
        
        _this.slideMoveValue(e);
        
    },

    nextEventValue : function(e) {
        var _this = e.data;

        if (_this.pageXY(e)[0] - _this.offsetLeft < (_this.pageX - _this.offsetLeft) * 0.6) {
            _this.transition_Duration = _this.slideSpeed;
            _this.moveX = _this.curX - _this.slideWidth - (_this.between * 2);
            _this.curIndex = _this.nextIndex - 1;

            _this.viewIndex = _this.nextIndex;
        } else {
            _this.transition_Duration = '0s';
            _this.moveX = _this.curX - ((_this.pageX - _this.offsetLeft) - (_this.pageXY(e)[0] - _this.offsetLeft));
            _this.curIndex = _this.viewIndex - 1;
        }
    },

    prevEventValue : function(e) {
        var _this = e.data;

        if ( _this.pageXY(e)[0] - _this.offsetLeft > (_this.pageX - _this.offsetLeft) / 0.6) {
            _this.transition_Duration = _this.slideSpeed;
            _this.moveX = _this.curX + _this.slideWidth + (_this.between * 2);
            _this.curIndex = _this.prevIndex - 1;

            _this.viewIndex = _this.prevIndex
        } else {
            _this.transition_Duration = '0s';
            _this.moveX = _this.curX + ((_this.pageXY(e)[0] - _this.offsetLeft) - (_this.pageX - _this.offsetLeft));
            _this.curIndex = _this.viewIndex - 1;
        }
    },

    nextBtnValue : function(e) {
        var _this = e.data;

        _this.moveX = _this.curX - _this.slideWidth - (_this.between * 2);
        _this.curIndex = _this.nextIndex - 1;
        _this.transition_Duration = _this.slideSpeed;
        
        _this.slideMoveValue(e);

        _this.viewIndex = _this.nextIndex;
    },

    prevBtnValue : function(e) {
        var _this = e.data;

        _this.moveX = _this.curX + _this.slideWidth + (_this.between * 2);
        _this.curIndex = _this.prevIndex - 1;
        _this.transition_Duration = _this.slideSpeed;

        _this.slideMoveValue(e);

        _this.viewIndex = _this.prevIndex;
    },

    // 네비게이션 클릭시, 필요한 값 세팅
    naviClickValue : function(e) {
        var _this = e.data;
        var cloneLength = _this.cloneLength - 1;

        _this.moveX = - (_this.slideWidth * _this.curNavi) - (_this.between * 2 * _this.curNavi) - (_this.slideWidth * cloneLength);
        _this.transition_Duration = _this.slideSpeed;
        _this.curIndex = _this.curNavi;

        _this.slideMoveValue(e);

        _this.viewIndex = _this.curIndex + 1;
    },

    // 드래그, 버튼, 네비게이션 값을 받아 슬라이드 동작
    slideMoveValue : function(e) {
        var _this = e.data;

        _this.targetName.css('left', _this.moveX + 'px');
        _this.targetName[0].style.transitionProperty = _this.transition_Property;
        _this.targetName[0].style.transitionDuration = _this.transition_Duration;
        _this.activeClassValue(e);
    },

    activeClassValue : function(e) {
        var _this = e.data;
        
        _this.slideItem.removeClass('active').not('.clone').eq(_this.curIndex).addClass('active');
        if (_this.indicator === true) {
            _this.indicatorItem.removeClass('active').eq(_this.curIndex).addClass('active');
        }

    }

}
