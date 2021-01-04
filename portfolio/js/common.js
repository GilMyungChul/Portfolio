$(function(){
    var oneCycle = 360;
    var list = $('.code-list li').length;
    var listCycle = oneCycle / list;

    for (var i = 0; i <= list; i++){
        $('.code-list li').eq(i).css('transform', 'rotate(' + i*Math.round(listCycle) + 'deg)').attr('data-color', i);
    }

    $('.code-list li').click(function(){
        var colorCode = $(this).css('background-color');
        $('.color-content').css('background-color', colorCode);
    })
})