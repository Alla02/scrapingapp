
//раскрытие список (слайдер)
$(document).ready(function () {
    $(".serviceList").click(function () {
        var otherMenuItems = $(".serviceList").not($(this));
        otherMenuItems.next('.slide').slideUp();
        otherMenuItems.find('.caret').removeClass("fa fa-caret-up");
        otherMenuItems.find('.caret').addClass("fa fa-caret-down");

        $(this).find('.caret').toggleClass("fa fa-caret-down fa fa-caret-up");
        $(this).next('.slide').slideToggle("slow");
    });
});


//скрываем поля
function UserRegister(a) {
    var label = a.value;
    var sel = document.getElementById("SelectTypeReg");
    var val = sel.options[sel.selectedIndex].text;
    if (val=="Преподаватель") {
        document.getElementById("selectGroup").style.display='none';
        document.getElementById("selectStudent").style.display='none';
        document.getElementById("selectifCanView").style.display='none';
    }
    else {
        document.getElementById("selectGroup").style.display='block';
        if (val=="Куратор") {
            document.getElementById("selectStudent").style.display='none';
            document.getElementById("studyGroup").setAttribute("multiple","multiple");
            document.getElementById("selectifCanView").style.display='none';
        }
        if (val=="Студент") {
            document.getElementById("studyGroup").removeAttribute("multiple");
            document.getElementById("selectStudent").style.display='none';
            document.getElementById("selectifCanView").style.display='block';
        }
        if (val=="Родитель") {
            document.getElementById("studyGroup").removeAttribute("multiple");
            document.getElementById("selectStudent").style.display='block';
            document.getElementById("selectifCanView").style.display='none';
        }
    }
}

function updateProperty() {
    var name = $("#name").val();//имя характеристики
    var propertyType = $("#selectType").val();//тип характеристики
    var url = window.location.pathname;
    var propertyId_ = url.substring(url.lastIndexOf('/') +1);
    console.log(name, propertyType, propertyId_);
    $.ajax({
        type: "POST",
        url: "/updateProperty",
        data: jQuery.param({name: name, propertyType: propertyType, idProperty:propertyId_}),
    }).done(function (res) {
        console.log(res);
        if (propertyType === 'Ссылка') {
            $.ajax({
                type: "POST",
                url: "/updateCarPropertyLink",
                data: jQuery.param({idProperty:propertyId_, name: name}),
            }).done(function (url) {
                window.location.href = url
                //window.location.replace(url);
                console.log('done link');
            });
        }
        else {
            $.ajax({
                type: "POST",
                url: "/updateCarPropertyValues",
                data: jQuery.param({propertyType: propertyType, idProperty:propertyId_}),
            }).done(function (url) {
                window.location.href = url
                //window.location.replace(url);
                console.log('done');
            });
        }
    });
}





