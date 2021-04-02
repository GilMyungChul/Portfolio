/*** 드래그 플러그인 제작
  ====================== ver 1.0 ======================
    * 2021-03-12
      - 전체적으로 코드 수정 [간결화, 간소화] & 유저가 추가로 작업 가능한 함수 기능 추가
      - 최소값, 최대값 표시
  ====================== ver 1.0 ======================
    * 2021-02-03 
      - 드래그 이벤트 플러그인 제작
    * 2021-02-16 ~ 23
      - 스탭(이동간격)을 사용한 드래그 추가
    * 2021-02-24 ~ 03-03
      - 문자열 드래그 추가
    * 2021-03-10
      - 텍스트, 간격 배열 수정
    * 2021-03-12
      - 문자의 경우 눈금자 설정 기능 추가
***/

function drag (opt) {

    // 제어할 오브젝트
    this.targetDrag = opt.targetDrag,                       // 적용할 오브젝트

    // 문자 설정 값
    this.typeOf = opt.typeOf || 'number';                   // 숫자, 문자인지 설정 || default : 'number'
    this.lang = opt.lang;                                   // 표현할 문자 배열 설정
    this.langPoint = opt.langPoint || false;

    // 숫자 설정 값
    this.min = opt.min;                                     // 최소값 설정
    this.max = opt.max;                                     // 최대값 설정
    this.start = opt.start || this.min;                  // 시작지점 설정 (이동간격이 '1'인 경우) || default : this.min
    this.end = opt.end || this.max;                      // 끝지점 설정 (이동간격이 '1'인 경우) || default : this.max
    this.interval = opt.interval || 1;                      // 이동간격 || default : 1

    // 사용자 지정 function
    this.userStartSet = function() {};
    this.userEndSet = function() {};
    this.userMoveSet = function() {};
    this.userInterface = function() {};

    if(opt.userSet){
        if (opt.userSet.userInterface != "undefined") {
            this.userInterface = opt.userSet.userInterface;
        }

        if (opt.userSet.userStartSet != 'undefined') {
            this.userStartSet = opt.userSet.userStartSet;
        }

        if (opt.userSet.userMoveSet != 'undefined') {
            this.userMoveSet = opt.userSet.userMoveSet;
        }

        if (opt.userSet.userEndSet != 'undefined') {
            this.userEndSet = opt.userSet.userEndSet;
        }
    };
    
    this.pageXY = function(e) {
        var pageX = e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0].pageX : e.originalEvent.pageX;                  // 마우스 X좌표
        var pageY = e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0].pageY : e.originalEvent.pageY;                  // 마우스 Y좌표Y
        var pageXY = new Array(pageX, pageY);               // X,Y 좌표를 배열로 저장

        return pageXY;                                      // STUDY :: 값을 리턴하지 않으면 undefined
    };
    
    this.XX;                                                // 마우스 X좌표 이벤트 적용 시, 값 업데이트
    this.YY;                                                // 마우스 Y좌표 이벤트 적용 시, 값 업데이트

    this.startX;                                            // 최소 : 최소값 이하로 넘어가지 않도록 설정
    this.endX;                                              // 최대 : 최대값 이상으로 넘어가지 않도록 설정
    this.moveX;                                             // 마우스 죄표값에 따라 변경되는 이동 값
    this.valueX;                                            // 최대; 최소값의 값
    this.intervalX = new Array();                           // 간격 배열
    this.clickX;

    this.obj = $(this.targetDrag);
    this.totalW;
    this.offsetL;

    this.targetEvent = false;                               // 마우스 다운 시 다운 여부 확인
    this.targetClickEvent = false;                          // 마우스 클릭 시 클릭 여부 확인

    this.init();
}

drag.prototype = {
    init : function() {

        this.typeOfSet();
        this.eventBox();
        this.userInterface();
        
    },

    typeOfSet : function() {
        if (this.typeOf == 'number') {
            this.numberSet();
        } else if (this.typeOf == 'string') {
            this.stringSet();
        }
    },

    numberSet : function() {
        
        if (this.interval != 1) {

            var isIntegerChk = Number.isInteger((this.max - this.min)/this.interval);

            // 드래그 간격 배열로 저장
            if (isIntegerChk === true) {
                var isIntegerChk = Number.isInteger(this.interval);
                
                if (isIntegerChk === true) {
                    for (var i = this.min; i <= this.max; i = i + this.interval) {
                        this.intervalX.push(parseInt(i));
                    }
                } else {
                    for (var i = this.min; i <= this.max; i = i + this.interval) {
                        this.intervalX.push(i.toFixed(1));
                    }
                }
            } else {
                var isIntegerChk = Number.isInteger(this.interval);
                console.log(isIntegerChk);

                if (isIntegerChk === true) {
                    for (var i = this.min; i <= this.max; i = i + this.interval) {
                        this.intervalX.push(i);
                    }
                } else {
                    for (var i = this.min; i <= this.max; i = i + this.interval) {
                        this.intervalX.push(i.toFixed(1));
                    }
                }
                
            }
            
            // this.max = this.end != 'unfinded' ? this.intervalX[this.intervalX.length - 1] : this.max;
            // this.min = this.start != 'unfinded' ? this.intervalX[1] : this.min

            console.log(this.intervalX, this.end, this.max);
            console.log(this.start, this.min);
            
        }

        this.startX = this.start != 'unfinded' ? 0 : (this.start - this.min) / (this.max - this.min) * 100;
        this.endX = this.end != 'unfinded' ? 100 : (this.end - this.min) / (this.max - this.min) * 100;

        this.obj.find('.line').css({'left': this.startX + '%', 'right': 100 - this.endX + '%'});
        this.obj.find('.minPoint').css('left', this.startX + '%').find('.pointView').text(this.min);
        this.obj.find('.maxPoint').css('left', this.endX + '%').find('.pointView').text(this.max);

        this.obj.find('.dfMin span').text(this.min);
        this.obj.find('.dfMax span').text(this.max);
    },

    stringSet : function() {

        this.obj.find('.minPoint').css('left', 0 + '%')
        this.obj.find('.maxPoint').css('left', 100 + '%')

        this.intervalX = this.lang

        if (this.langPoint === true) {
            for (var i = 1; i <= this.lang.length; i++) {
                var numSet = (100 / (this.lang.length - 1) * (i - 1)).toFixed(1);
                var elementObj = '<span class="stringObj" data-string="' + this.lang[i - 1] + '" style="left:' + numSet + '%;"><i>' + this.lang[i - 1] + '</i></span>';
                this.obj.find('.lineBar').append(elementObj);
            }

            this.obj.find('.minPoint').attr('data-string', this.lang[0]);
            this.obj.find('.maxPoint').attr('data-string', this.lang[this.lang.length - 1]);
            this.obj.find('.line').remove();
            this.obj.find('.pointView').remove();
        } else {
            this.obj.find('.line').css({'left': 0 + '%', 'right': 0 + '%'});
            this.obj.find('.minPoint').find('.pointView').text(this.lang[0]);
            this.obj.find('.maxPoint').find('.pointView').text(this.lang[this.lang.length - 1]);
            this.obj.find('.dfMin span').text(this.lang[0]);
            this.obj.find('.dfMax span').text(this.lang[this.lang.length - 1]);
        }

        // console.log(this.intervalX);
    },

    eventBox : function() {
        var _this = this;

        $(_this.targetDrag).find('.point').on('mousedown', _this, _this.startAction).on('touchstart', _this, _this.startAction);
        $(_this.targetDrag).find('.lineBar').on('click', _this, _this.clickAction);
        $(document)
            .on('mouseup', _this, function(e) {_this.endAction(e)})
            .on('mousemove', _this, function(e) {_this.moveAction(e)})
            .on('touchend', _this, function(e) {_this.endAction(e)})
            .on('touchmove', _this, function(e) {_this.moveAction(e)});
    },

    startAction : function(e) {
        var _this = e.data;

        _this.obj = $(this);
        _this.targetEvent = true;
        _this.dragEvSet(e);
    },

    moveAction : function(e) {
        var _this = e.data;

        _this.dragEvSet(e);
    },

    endAction : function(e) {
        var _this = e.data;

        _this.targetEvent = false;
    },

    clickAction : function(e) {
        var _this = e.data;

        _this.obj = $(this);
        _this.targetClickEvent = true;
        _this.dragEvSet(e);
    },
    
    dragEvSet : function(e) {
        var _this = e.data;

        _this.dragAcSet(e);
        if (_this.targetEvent === true) {
            _this.dragMoveAction(e);
            _this.overValue(e);
            _this.userMoveSet(e);
        } else if (_this.targetClickEvent === true) {
            _this.dragClickAction(e);
            _this.userMoveSet(e);
        }
    },

    dragAcSet : function(e) {
        var _this = e.data;

        _this.totalW = $(_this.targetDrag).find('.DragBox').innerWidth();
        _this.offsetL = $(_this.targetDrag).find('.DragBox').offset().left;
        
        _this.XX = (_this.pageXY(e)[0] - _this.offsetL) / _this.totalW * 100;
        _this.moveX = _this.intervalX.length > 1 ? Math.round(_this.XX / (100 / (_this.intervalX.length - 1))) * (100 / (_this.intervalX.length - 1)) : _this.XX;
        _this.valueX = _this.intervalX.length > 1 ? _this.intervalX[Math.round(_this.XX / (100 / (_this.intervalX.length - 1)))] : parseInt((_this.max - _this.min) * _this.XX / 100);
    },

    // 숫자 드래그
    dragMoveAction : function(e) {
        var _this = e.data;

        // console.log('this.XX : ', _this.XX, '/', 'this.moveX', _this.moveX, '/', 'intervalX.length', _this.intervalX.length);
        _this.obj[0].style.left = _this.moveX + '%';

        if (_this.langPoint === false) {
            _this.obj[0].children[0].innerHTML = _this.valueX;

            if (_this.obj[0].classList[1] == 'minPoint') {
                _this.obj[0].nextElementSibling.children[0].style.left = _this.moveX + '%';
            } else if (_this.obj[0].classList[1] == 'maxPoint') {
                _this.obj[0].previousElementSibling.children[0].style.right = 100 - _this.moveX + '%';
            }
        } else {
            // console.log(_this.obj[0].attributes);
            _this.obj[0].attributes[1].value = _this.valueX;
        }
    },

    overValue : function(e) {
        var _this = e.data;

        if (_this.moveX > 100) {
            _this.moveX = 100;
            _this.valueX = _this.typeOf === 'number' ? _this.max : _this.lang[_this.intervalX.length - 1];
            _this.obj[0].previousElementSibling.children[0].style.right = 100 - _this.moveX + '%';
        } else if (_this.moveX < 0) {
            _this.moveX = 0;
            _this.valueX = _this.typeOf === 'number' ? _this.min : _this.lang[0];
            _this.obj[0].nextElementSibling.children[0].style.left = _this.moveX + '%';
        }
        
        _this.obj[0].style.left = _this.moveX + '%';

        if (_this.langPoint === false) {
            _this.obj[0].children[0].innerHTML = _this.valueX;
        } else {
            _this.obj[0].attributes[1].value = _this.valueX;
        }
    },

    dragClickAction : function(e) {
        var _this = e.data;

        if (_this.XX < 50) {
            // console.log('min');
            _this.obj[0].previousElementSibling.style.left = _this.moveX + '%';
            if (_this.langPoint === false) {
                _this.obj[0].children[0].style.left = _this.moveX + '%';
                _this.obj[0].previousElementSibling.children[0].innerHTML = _this.valueX;
            } else {
                _this.obj[0].previousElementSibling.attributes[1].value = _this.valueX;
            }
        } else if (_this.XX >= 50) {
            // console.log('max');
            _this.obj[0].nextElementSibling.style.left = _this.moveX + '%';
            if (_this.langPoint === false) {
                _this.obj[0].children[0].style.right = 100 - _this.moveX + '%';
                _this.obj[0].nextElementSibling.children[0].innerHTML = _this.valueX;
            } else {
                _this.obj[0].nextElementSibling.attributes[1].value = _this.valueX;
            }
        }

        _this.targetClickEvent = false;
    }
}
