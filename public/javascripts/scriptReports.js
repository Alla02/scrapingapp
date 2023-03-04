$(document).ready(function () {
    $(function(){
        $("#selectBrandReports").on("change", function() {
            var idBrand = $("#selectBrandReports option:selected").val();
            //console.log("idBrand ", idBrand);
            $.ajax({
                url: "/modelsListReport",
                type: "POST",
                data: jQuery.param({idBrand: idBrand}),
                dataType: "json"
            }).done(function (data) {
                //console.log(data);
                $("#selectModelReports").find("option").remove().end();
                $("#selectModelReports").append('<option value="0"></option>');
                for (var i in data) {
                    $("#selectModelReports").append("<option value="+data[i].id+">" + data[i].name + "</option>");
                }
            });
        });
        $("#selectModelReports").on("change", function() {
            var idModel = $("#selectModelReports option:selected").val();
            //console.log("idModel ", idModel);
            $.ajax({
                url: "/modificationsListReport",
                type: "POST",
                data: jQuery.param({idModel: idModel}),
                dataType: "json"
            }).done(function (data) {
                //console.log(data);
                $("#selectModificationReports").find("option").remove().end();
                $("#selectModificationReports").append('<option value="0"></option>');
                for (var i in data) {
                    $("#selectModificationReports").append("<option value="+data[i].id+">" + data[i].name + " " + data[i].engineName+ "</option>");
                }
            });
        });
        /*
        $("#selectModificationReports").on("change", function() {
            var idModification = $("#selectModificationReports option:selected").val();
            //console.log("idModel ", idModel);
            $.ajax({
                url: "/carsListReport",
                type: "POST",
                data: jQuery.param({idModification: idModification}),
                dataType: "json"
            }).done(function (data) {
                //console.log(data);
                $("#selectModificationReports").find("option").remove().end();
                $("#selectModificationReports").append('<option value="0"></option>');
                for (var i in data) {
                    $("#selectModificationReports").append("<option value="+data[i].id+">" + data[i].name + " " + data[i].engineName+ "</option>");
                }
            });
        });*/
    });
});

function getReport() {
    var idBrand = $("#selectBrandReports").val();
    var idModel = $("#selectModelReports").val();
    var idModification = $("#selectModificationReports").val();
    //console.log(idBrand, idModel, idModification);
    var properties = [];
    $("input:checkbox:checked").each(function(){
        properties.push($(this).val());
    });
    var cl=[]
    cl= [  { title: "Бренд", data: 'brandName' },
    { title: "Модель",data: 'modelName' },
    { title: "Модификация",data: 'modifName' },
    { title: "Тип двигателя",data: 'engineName' }]
    console.log("col1 ",cl.length, cl);
    console.log(properties);
    if ( $.fn.dataTable.isDataTable('#tableReports4') ) {
        $('#tableReports4').DataTable().destroy();
        $('#tableReports4').empty();
      }
    if (properties.length!=0){
        $.ajax({
            type: "POST",
            url: "/getReportProperties",
            data: jQuery.param({idBrand: idBrand, idModel:idModel, idModification: idModification, properties:JSON.stringify(properties.join()) }),
            dataType: "json"
        }).done(function (res) {
            document.getElementById("modelTable").style.display='none';
            document.getElementById("modificationTable").style.display='none';
            document.getElementById("carsTable").style.display='none';
            document.getElementById("propertiesTable").style.display='block';
            console.log(res);
            console.log("col2 ",cl.length, cl);
            for (var i=0; i<properties.length; i++){
                var p= "propName"; var v ="value";
                p =p+i
                v = v+i
                console.log(p,v,res[0][p]);
                cl.push({title: res[0][p], data: v})
            }
            console.log("col3 ",cl.length,cl);
            $('#addRows').children("tr").remove();
            $('#addRows2').children("tr").remove();
            $('#addRows3').children("tr").remove();
            $('#addRows4').children("tr").remove();
            $('#tableReports4').DataTable( {
                destroy: true,
                clear: true,
                empty: true,
                data: res,
                columns: cl,
                dom: 'Bfrtip',
                buttons: [
                    'copy', 'csv', 'excel', 'pdf', 'print'
                ],
                "lengthMenu": [ [-1, 10], ["Все", 10] ],
                "language": {
                    "lengthMenu": "Показывать по _MENU_ записей на странице",
                    "search": "Поиск:",
                    "zeroRecords": "Поиск не дал результатов",
                    "info": "Страница _PAGE_ из _PAGES_",
                    "infoEmpty": "Записи не найдены",
                    "infoFiltered": "(всего записей _MAX_)",
                    "paginate": {
                        "first": "Первая",
                        "last": "Последняя",
                        "next": "Следующая",
                        "previous": "Предыдущая"
                    },
                }
            });
        })
    }
    else {
        $.ajax({
            type: "POST",
            url: "/getReport",
            data: jQuery.param({idBrand: idBrand, idModel:idModel, idModification: idModification }),
            dataType: "json"
        }).done(function (res) {
            console.log(res[0].que);
            console.log(res);
            if (res[0].que === 1) {
                document.getElementById("modelTable").style.display='block';
                document.getElementById("modificationTable").style.display='none';
                document.getElementById("carsTable").style.display='none';
                document.getElementById("propertiesTable").style.display='none';
                $('#addRows').children("tr").remove();
                $('#addRows2').children("tr").remove();
                $('#tableReports').DataTable( {
                    destroy: true,
                    data: res,
                    columns: [
                        { title: "Бренд", data: 'brandName' },
                        { title: "Модель",data: 'modelName' },
                    ],
                    dom: 'Bfrtip',
                    buttons: [
                        'copy', 'csv', 'excel', 'pdf', 'print'
                    ],
                    "lengthMenu": [ [-1, 10], ["Все", 10] ],
                    "language": {
                        "lengthMenu": "Показывать по _MENU_ записей на странице",
                        "search": "Поиск:",
                        "zeroRecords": "Поиск не дал результатов",
                        "info": "Страница _PAGE_ из _PAGES_",
                        "infoEmpty": "Записи не найдены",
                        "infoFiltered": "(всего записей _MAX_)",
                        "paginate": {
                            "first": "Первая",
                            "last": "Последняя",
                            "next": "Следующая",
                            "previous": "Предыдущая"
                        },
                    }
                });
            }
            if (res[0].que === 2) {
                document.getElementById("modelTable").style.display='none';
                document.getElementById("modificationTable").style.display='block';
                document.getElementById("carsTable").style.display='none';
                document.getElementById("propertiesTable").style.display='none';
                $('#addRows').children("tr").remove();
                $('#addRows2').children("tr").remove();
                $('#tableReports2').DataTable( {
                    destroy: true,
                    data: res,
                    columns: [
                        { title: "Бренд", data: 'brandName' },
                        { title: "Модель",data: 'modelName' },
                        { title: "Модификация",data: 'modifName' },
                        { title: "Привод",data: 'engineName' }
                    ],
                    dom: 'Bfrtip',
                    buttons: [
                        'copy', 'csv', 'excel', 'pdf', 'print'
                    ],
                    "lengthMenu": [ [-1, 10], ["Все", 10] ],
                    "language": {
                        "lengthMenu": "Показывать по _MENU_ записей на странице",
                        "search": "Поиск:",
                        "zeroRecords": "Поиск не дал результатов",
                        "info": "Страница _PAGE_ из _PAGES_",
                        "infoEmpty": "Записи не найдены",
                        "infoFiltered": "(всего записей _MAX_)",
                        "paginate": {
                            "first": "Первая",
                            "last": "Последняя",
                            "next": "Следующая",
                            "previous": "Предыдущая"
                        },
                    }
                });
            }
            if (res[0].que === 3) {
                document.getElementById("modelTable").style.display='none';
                document.getElementById("modificationTable").style.display='none';
                document.getElementById("carsTable").style.display='block';
                document.getElementById("propertiesTable").style.display='none';
                $('#tableReports3').DataTable( {
                    destroy: true,
                    data: res,
                    columns: [
                        { title: "Бренд", data: 'brandName' },
                        { title: "Модель",data: 'modelName' },
                        { title: "Модификация",data: 'modifName' },
                        { title: "Привод",data: 'engineName' },
                        { title: "Тип",data: 'typeName' },
                        { title: "Снаряженная масса",data: 'curb_weight' },
                        { title: "Полная масса",data: 'full_weight' },
                        { title: "Длина",data: 'full_length' },
                        { title: "Ширина",data: 'full_width' },
                        { title: "Высота",data: 'full_height' },
                    ],
                    dom: 'Bfrtip',
                    buttons: [
                        'copy', 'csv', 'excel', 'pdf', 'print'
                    ],
                    "lengthMenu": [ [-1, 10], ["Все", 10] ],
                    "language": {
                        "lengthMenu": "Показывать по _MENU_ записей на странице",
                        "search": "Поиск:",
                        "zeroRecords": "Поиск не дал результатов",
                        "info": "Страница _PAGE_ из _PAGES_",
                        "infoEmpty": "Записи не найдены",
                        "infoFiltered": "(всего записей _MAX_)",
                        "paginate": {
                            "first": "Первая",
                            "last": "Последняя",
                            "next": "Следующая",
                            "previous": "Предыдущая"
                        },
                    }
                });
            }
            /*
            $('#tableReports2').DataTable( {
                destroy: true,
                data: res,
                columns: [
                    { title: "Модель", data: 'modelName' },
                    { title: "Модификация",data: 'modeifName' },
                    { title: "Привод",data: 'engineName' },
                    { title: "Тип",data: 'typeName' },
                    { title: "Name",data: 'curb_weight' },
                    { title: "Name",data: 'full_weight' },
                    { title: "Длина",data: 'full_length' },
                    { title: "Ширина",data: 'full_width' },
                    { title: "Высота",data: 'full_height' },
                    { title: "Name",data: 'value_null' },
                    { title: "Name",data: 'valOfPropName' }
                ],
                "lengthMenu": [ [-1, 10], ["Все", 10] ],
                "language": {
                    "lengthMenu": "Показывать по _MENU_ записей на странице",
                    "search": "Поиск:",
                    "zeroRecords": "Поиск не дал результатов",
                    "info": "Страница _PAGE_ из _PAGES_",
                    "infoEmpty": "Записи не найдены",
                    "infoFiltered": "(всего записей _MAX_)",
                    "paginate": {
                        "first": "Первая",
                        "last": "Последняя",
                        "next": "Следующая",
                        "previous": "Предыдущая"
                    },
                }
            });*/
        })
    }
}



