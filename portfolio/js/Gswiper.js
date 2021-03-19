'use strict'

/*** 드래그 플러그인 제작
  ====================== ver 0.0 ======================
    * 2021-03-12 
      - swiper slide 플러그인 제작
    * 2021-03-17
      - drag, click, navi 이벤트 슬라이드 적용
***/

function Gswiper (opt) {
    
    this.targetName = opt.targetName;                               // swiper target
    this.mode = opt.mode || 'horizontal';                           // 모드 : 'horizontal' (default), 'vertical', 'scroll'
    this.slideBtn = opt.slideBtn || true;                           // 슬라이드 버튼 : 'true' (default), 'false'
    this.navigator = opt.navigator || true;                         // 네비게이션 : 'true' (default), 'false'
    this.between = opt.between || 0;                                // 슬라이드 간 간격
    this.viewIndex = opt.viewIndex || 0;                            // 슬라이드 시작되는 시점 : 0 (default)
    this.slideWidth = opt.slideWidth || false;                      // 슬라이드 width
    this.slideHeight = opt.slideHeight || false;                    // 슬라이드 height
    this.loop = opt.loop || false;                                  // 무한 스와이퍼 : false (default)
    this.slideSpeed = opt.slideSpeed || '1s';                       // 슬라이드 스피드 : 1s (default)
    this.slideEffect = opt.slideEffect || 'ease'                    // 슬라이드 이펙트 : ease (default)
    
    this.swiperWrapper = this.targetName.parents('.swiper-wrap');
    this.slideItem = this.targetName.find('.slide-item');

    this.prevBtn;
    this.nextBtn;
    this.slideBtn;
    
    this.naviItem;

    this.pageXY = function(e) {
        var pageX = e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0].pageX : e.originalEvent.pageX;
        var pageY = e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0].pageY : e.originalEvent.pageY;
        var pageXY = new Array(pageX, pageY);

        return pageXY;
    };
    this.pageX;
    this.pageY;

    this.moveX;
    this.moveY;
    
    this.slideWidth = this.slideWidth === false ? parseInt(this.swiperWrapper.innerWidth()) : this.slideWidth;
    this.slideHeight = this.slideHeight === false ? parseInt(this.swiperWrapper.innerHeight()) : this.slideHeight;
    
    this.slideLength = this.targetName[0].childElementCount;

    this.offsetLeft = this.swiperWrapper.offset().left;
    this.offsetTop = this.swiperWrapper.offset().top;

    this.curSlide;
    this.curNavi;
    this.curIndex;
    this.curX;
    this.curY;

    this.transition_Duration = this.slideSpeed;
    this.transition_Property = this.mode == 'horizontal' ? 'left' : 'top';
    this.transition_Effect = this.slideEffect;

    this.eventMoveChk = false;
    this.eventClickChk = false;
    this.eventMouseUpChk = false;

    this.init();
}

Gswiper.prototype = {
    init : function() {

        this.defaultset();
        this.currentObjValue();
        this.modeSet();
        
        this.eventList();
    },

    // 기본 HTML 세팅
    defaultset : function() {
        this.targetName.wrap('<div class="swiper-cont"></div>');
        this.swiperWrapper.find('.swiper-cont').css({'width': this.slideWidth, 'height': this.slideHeight});

        // 슬라이드 아이템 세팅
        this.slideItemSet();

        // 슬라이드 네비게이션 세팅
        if (this.navigator === true) {this.slideNaviSet();};

        // 슬라이드 버튼
        if (this.slideBtn === true) {this.slideBtnSet();};
    },

    // 슬라이드 아이템 세팅
    slideItemSet : function() {
        this.slideItem.css({'width': this.slideWidth, 'height': this.slideHeight});
        for (var i = 0; i <= this.slideLength; i++) {
            this.slideItem.eq(i).attr('slide-data', i);
        }

        var firstClone = this.slideItem.eq(this.slideLength - 1).clone().addClass('clone').attr({'data-clone': this.slideLength - 1, 'slide-data': -1});
        var lastClone = this.slideItem.eq(0).clone().addClass('clone').attr({'data-clone': 0, 'slide-data': this.slideLength});
        lastClone.appendTo(this.targetName);
        firstClone.prependTo(this.targetName);

        // 활성화 아이템 클래스 추가
        this.slideItem.eq(this.viewIndex).addClass('active');
    },

    // 슬라이드 버튼 세팅
    slideBtnSet : function() {
        this.slideBtn = this.swiperWrapper.find('.slide-btn');
        this.prevBtn = this.swiperWrapper.find('.prev-btn');
        this.nextBtn = this.swiperWrapper.find('.next-btn');
    },

    // 슬라이드 네비게이션 세팅
    slideNaviSet : function() {
        this.targetName.parents('.swiper-wrap').find('.swiper-navi').append('<ul class="navi-list"></ul>');

        for (var i = 0; i <= this.slideLength - 1; i++) {
            this.naviItem = '<li class="navi-items" navi-data="' + i + '">' + (i + 1) + '</li>';
            this.targetName.parents('.swiper-wrap').find('.navi-list').append(this.naviItem);
        }

        // 활성화 네비게이션 클래스 추가
        this.swiperWrapper.find('.navi-items').eq(this.viewIndex).addClass('active');

        this.naviItem = this.swiperWrapper.find('.navi-items');
    },

    // 모드 세팅
    modeSet : function() {
        this.moveX = this.between != 0 ? (this.viewIndex != 0 ? - (this.slideWidth * this.viewIndex + (this.between * 2) * this.viewIndex + this.between + this.slideWidth) : - this.between - this.slideWidth) : 0;

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
        var cloneLength = $(this.targetName).find('.clone').length;
        this.slideItem.css({'margin-left': this.between + 'px', 'margin-right': this.between + 'px'});
        this.targetName.css({'width': (this.slideWidth * (this.slideLength + cloneLength)) + (this.between * 2 * (this.slideLength + cloneLength)) + 'px' , 'height': this.slideHeight + 'px'});
        this.targetName.css('left', this.moveX + 'px');
    },

    verticalSet : function() {
        var cloneLength = $(this.targetName).find('.clone').length;
        this.slideItem.css({'margin-top': this.between + 'px', 'margin-bottom': this.between + 'px'});
        this.targetName.css({'width': this.slideWidth + 'px' , 'height': (this.slideHeight * (this.slideLength + cloneLength)) + (this.between * 2 * (this.slideLength + cloneLength)) + 'px'});
        this.targetName.css('top', this.moveX + 'px');
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
            
        $(_this.slideBtn)
            .on('click', _this, _this.btnClick);
            
        $(_this.naviItem)
            .on('click', _this, _this.naviClick);
    },

    // 마우스, 터치 다운
    eventDown : function(e) {
        var _this = e.data;
        _this.pageX = _this.pageXY(e)[0];
        _this.pageY = _this.pageXY(e)[1];
        _this.currentObjValue(e);
        

        _this.eventMoveChk = true;
        _this.eventMouseUpChk = false;
    },

    // 마우스, 터치 무브
    eventMove : function(e) {
        var _this = e.data;
        if (_this.eventMoveChk === true) {
            _this.eventValue(e);
        }
    },

    // 마우스, 터치 업
    eventUp : function(e) {
        var _this = e.data;
        _this.eventMoveChk = false;
        _this.eventMouseUpChk = true;
        if (_this.eventMouseUpChk === true) {_this.eventMouseUpValue(e)};
    },

    // 드래그의 50%로 넘어가지 않으면 다시 슬라이드 제자리로 설정
    eventMouseUpValue : function(e) {
        var _this = e.data;
        
        if ( _this.pageXY(e)[0] - _this.offsetLeft > (_this.pageX - _this.offsetLeft) * 0.6 && _this.pageXY(e)[0] - _this.offsetLeft < (_this.pageX - _this.offsetLeft) / 0.6 ) {
            console.log('30% 넘지 않았다');
            _this.targetName.css('left', _this.curX);
            _this.targetName[0].style.transitionDuration = '0.5s';
        }
        
    },

    btnClick : function(e) {
        var _this = e.data;
        _this.slideBtn = $(this);
        _this.eventClickChk = true;
        _this.currentObjValue(e);

        // 처음 과 마지막에서 버튼 이벤트 비활성화
        // if (_this.slideBtn[0].className == 'slide-btn next-btn' && _this.curSlide == _this.slideLength - 1) {
        //     _this.eventClicdisabledkChk = false;
        // } else if (_this.slideBtn[0].className == 'slide-btn prev-btn' && _this.curSlide <= 0) {
        //     _this.eventClickChk = false;
        // };

        if (_this.eventClickChk === true) {
            _this.btnClickValue(e);
            _this.slideLoop(e);
        };

        _this.eventClickChk = false;
    },

    naviClick : function(e) {
        var _this = e.data;
        _this.eventClickChk = true;
        _this.currentObjValue(e);
        _this.curNavi = parseInt($(this).attr('navi-data'));
        if (_this.eventClickChk === true) {
            _this.naviClickValue(e);
        };

        _this.eventClickChk = false;
    },

    // 현재 슬라이드 적용 된 오브젝트 선별
    currentObjValue : function() {
        var _this = this;
        _this.curSlide = parseInt(_this.targetName.find('.slide-item.active').attr('slide-data'));
        _this.curNavi = parseInt(_this.swiperWrapper.find('.navi-items.active').attr('navi-data'));
        _this.curX = parseInt(_this.targetName[0].style.left);
    },

    // 드래그시, 필요한 값 세팅
    eventValue : function(e) {
        var _this = e.data;

        // _this.curX - _this.slideWidth - (_this.between * 2) // 왼쪽으로 이동 & nextBtn
        // _this.curX + _this.slideWidth + (_this.between * 2) // 오른쪽으로 이동 & prevBtn

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
            _this.curIndex = _this.curSlide + 1;
        } else {
            _this.transition_Duration = '0s';
            _this.moveX = _this.curX - ((_this.pageX - _this.offsetLeft) - (_this.pageXY(e)[0] - _this.offsetLeft));
            _this.curIndex = _this.curSlide;
        }
    },

    prevEventValue : function(e) {
        var _this = e.data;

        if ( _this.pageXY(e)[0] - _this.offsetLeft > (_this.pageX - _this.offsetLeft) / 0.6) {
            _this.transition_Duration = _this.slideSpeed;
            _this.moveX = _this.curX + _this.slideWidth + (_this.between * 2);
            _this.curIndex = _this.curSlide - 1;
        } else {
            _this.transition_Duration = '0s';
            _this.moveX = _this.curX + ((_this.pageXY(e)[0] - _this.offsetLeft) - (_this.pageX - _this.offsetLeft));
            _this.curIndex = _this.curSlide;
        }
    },

    // 버튼 클릭시, 필요한 값 세팅
    btnClickValue : function(e) {
        var _this = e.data;

        _this.moveX = _this.slideBtn[0].className == 'slide-btn next-btn' ? _this.curX - _this.slideWidth - (_this.between * 2) : _this.curX + _this.slideWidth + (_this.between * 2);
        _this.curIndex = _this.slideBtn[0].className == 'slide-btn next-btn' ? _this.curSlide + 1 : _this.curSlide - 1;

        _this.slideMoveValue(e);
    },

    // 네비게이션 클릭시, 필요한 값 세팅
    naviClickValue : function(e) {
        var _this = e.data;

        _this.moveX = _this.curSlide < _this.curNavi ? 
            _this.curX - _this.slideWidth * (_this.curNavi - _this.curSlide) - (_this.between * 2 * (_this.curNavi - _this.curSlide)) : 
            _this.curX + _this.slideWidth * (_this.curSlide - _this.curNavi) + (_this.between * 2 * (_this.curSlide - _this.curNavi));

        _this.curIndex = _this.curNavi;

        _this.slideMoveValue(e);
    },

    // 무한 슬라이드 세팅
    slideLoop : function(e) {
        var _this = e.data;

        // console.log(_this.curSlide , _this.curNavi, _this.slideLength, _this.loop);
        
        if (_this.curSlide >= _this.slideLength - 1) {
            console.log('마지막');
            _this.moveX = _this.loop === true ? - _this.between - _this.slideWidth : - (_this.slideWidth * _this.slideLength - (_this.between * 2) * _this.slideLength);
            _this.curIndex = _this.loop === true ? 0 : _this.slideLength - 1;
            _this.transition_Duration = _this.loop === true ? 0 : _this.slideSpeed;
        } else if (_this.curSlide <= 0) {
            console.log('처음');
            _this.moveX = _this.loop === true ? - (_this.slideWidth * _this.slideLength + (_this.between * 2) * _this.slideLength) : - _this.between - _this.slideWidth;
            _this.curIndex = _this.loop === true ? _this.slideLength - 1 : 0;
            _this.transition_Duration = _this.loop === true ? 0 : _this.slideSpeed;
        }

        _this.slideMoveValue(e);
    },

    // 드래그, 버튼, 네비게이션 값을 받아 슬라이드 동작
    slideMoveValue : function(e) {
        var _this = e.data;

        _this.targetName.css('left', _this.moveX + 'px');
        _this.targetName[0].style.transitionProperty = _this.transition_Property;
        _this.targetName[0].style.transitionDuration = _this.transition_Duration;

        _this.slideItem.removeClass('active').not('.clone').eq(_this.curIndex).addClass('active');
        _this.naviItem.removeClass('active').eq(_this.curIndex).addClass('active');
    }

}
