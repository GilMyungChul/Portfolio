'use strict'

/*** 드래그 플러그인 제작
  ====================== ver 0.0 ======================
    * 2021-03-12 
      - swiper slide 플러그인 제작
***/

function Gswiper (opt) {
    
    this.targetName = opt.targetName;                               // swiper target
    this.mode = opt.mode || 'horizontal';                           // 모드 : 'horizontal' (default), 'vertical', 'scroll'
    this.swiperBtn = opt.swiperBtn || true;                         // 슬라이드 버튼 : 'true' (default), 'false'
    this.navigator = opt.navigator || true;                         // 네비게이션 : 'true' (default), 'false'
    this.between = opt.between || false;                            // 슬라이드 간 간격
    this.startIndex = opt.startIndex || 0;                          // 슬라이드 시작되는 시점 : 0 (default)
    
    this.swiperCont;
    this.swiperItem = this.targetName.find('.swiperItem');

    this.prevBtn;
    this.nextBtn;
    this.slideBtn;
    
    this.naviList;
    this.naviItems;

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

    if (this.between === false) {
        this.between = parseInt(this.swiperItem.css('margin-left')) * 2;
    };
    
    this.itemWidth = parseInt(this.swiperItem.outerWidth());
    this.itemHeight = parseInt(this.swiperItem.outerHeight());
    this.itemLength = this.targetName[0].childElementCount;

    this.curSwiper;
    this.curNavi;

    this.eventMoveChk = false;
    this.eventClickChk = false;

    this.init();
}

Gswiper.prototype = {
    init : function() {

        this.HTMLset();
        this.modeSet();

        this.eventList();
    },

    HTMLset : function() {
        this.swiperCont = '<div class="swiperCont"></div>';
        this.naviList = '<ul class="naviList"></ul>';
        
        this.targetName.wrap(this.swiperCont);

        for (var i = 0; i <= this.itemLength; i++) {
            this.swiperItem.eq(i).attr('swiper-data', i);
        }

        this.swiperItem.eq(this.startIndex).addClass('active');
    },

    // 기본값 세팅
    modeSet : function() {

        this.objNameSet();

        if (this.mode === 'horizontal') {
            this.horizontalSet();
        } else if (this.mode === 'vertical') {
            console.log('vertical');
        } else if (this.mode === 'scroll') {
            console.log('scroll');
        };
    },

    // 사용될 오브젝트 세팅
    objNameSet : function() {
        this.swiperCont = this.targetName.closest('.swiperCont');

        if (this.swiperBtn === true) {this.slideBtnSet();};
        if (this.navigator === true) {this.slideNaviSet();};

        this.naviItems = this.swiperCont.siblings('.swiperNavi').find('.naviItems');
        this.naviItems.eq(this.startIndex).addClass('active');
    },

    // 슬라이드 버튼 세팅
    slideBtnSet : function() {
        this.slideBtn = this.swiperCont.siblings('.swiperBtn').find('.slideBtn');
        this.prevBtn = this.swiperCont.siblings('.swiperBtn').find('.prevBtn');
        this.nextBtn = this.swiperCont.siblings('.swiperBtn').find('.nextBtn');
    },

    // 슬라이드 네비게이션 세팅
    slideNaviSet : function() {
        this.targetName.parents('.swiperWrap').find('.swiperNavi').append(this.naviList);

        for (var i = 0; i <= this.itemLength - 1; i++) {
            this.naviItems = '<li class="naviItems" navi-data="' + i + '">' + i + '</li>';
            this.targetName.parents('.swiperWrap').find('.naviList').append(this.naviItems);
        }
    },

    // horizontal slide 세팅
    horizontalSet : function() {
        this.swiperItem.css({'margin-left': this.between/2 + 'px', 'margin-right': this.between/2 + 'px'});
        this.targetName.css({'width': (this.itemWidth + this.between) * this.itemLength + 'px' , 'height': this.itemHeight + 'px'})
    },

    eventList : function() {
        var _this = this;

        $(_this.targetName)
            .on('mousedown', _this, _this.eventDown)
            .on('touchstart', _this, _this.eventDown);

        $(document)
            .on('mousemove', _this, function(e){_this.eventMove(e)})
            .on('touchmove', _this, function(e){_this.eventMove(e)})
            .on('mouseup', _this, function(e){_this.eventUp(e)})
            .on('touchend', _this, function(e){_this.eventUp(e)});
            
        $(_this.slideBtn)
            .on('click', _this, _this.btnClick);
            
        $(_this.naviItems)
            .on('click', _this, _this.naviClick);
    },

    // 마우스, 터치 다운
    eventDown : function(e) {
        var _this = e.data;
        _this.pageX = _this.pageXY(e)[0];
        _this.eventMoveChk = true;

        _this.currentObjValue(e);
    },

    // 마우스, 터치 무브
    eventMove : function(e) {
        var _this = e.data;
        if (_this.eventMoveChk === true) {
            _this.dragValue(e);
        }
    },

    // 마우스, 터치 업
    eventUp : function(e) {
        var _this = e.data;
        _this.eventMoveChk = false;
    },

    btnClick : function(e) {
        var _this = e.data;
        _this.eventClickChk = true;
        _this.currentObjValue(e);
        _this.btnClickValue(e);
    },

    naviClick : function(e) {
        var _this = e.data;
        _this.eventClickChk = true;
        _this.currentObjValue(e);
        _this.naviClickValue(e);
    },

    // 현재 슬라이드 적용 된 오브젝트 선별
    currentObjValue : function(e) {
        var _this = e.data;
        _this.curSwiper = _this.targetName.find('.swiperItem.active').attr('swiper-data');
        _this.curNavi = _this.swiperCont.siblings('.swiperNavi').find('.naviItems.active').attr('navi-data');
        console.log(_this.curSwiper, _this.curNavi);
    },

    // 드래그시, 필요한 값 세팅
    dragValue : function(e) {
        var _this = e.data;
        console.log(_this.pageXY(e)[0], _this.pageX);
    },

    // 버튼 클릭시, 필요한 값 세팅
    btnClickValue : function(e) {
        var _this = e.data;
        if (_this.prevBtn[0].className == $(this)[0].className) {
            console.log('prev');
        } else if (_this.nextBtn[0].className == $(this)[0].className) {
            console.log('next');
        }
    },

    // 네비게이션 클릭시, 필요한 값 세팅
    naviClickValue : function(e) {
        var _this = e.data;
    },

    // 드래그, 버튼, 네비게이션 값을 받아 슬라이드 동작
    slideMoveValue : function(e) {
        var _this = e.data;
    }
}
