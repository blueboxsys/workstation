var xhrStatus;

var pageSize = 100,
    totalNum = 0,
    totalDisplayedNum = 0,
    checkAllFlag = false;
var start = 0,
    end = pageSize,
    collectionNameStr = '',
    statusFieldNameStr = '',
    statusFieldValStr = '';
var accessRightCode = parseInt(access_right);
var complete = false,
    completeScroll = false;

var displayedViewStr = "list",
    uniqueId = "";

function generateHeading(e, upperCase) {
    if (typeof upperCase == 'undefined' && upperCase == '') {
        var upperCase = false;
    }
    var patt = /[^A-Za-z0-9]/g;
    var result = e.replace(patt, ' ');
    result = result.replace(/\s+/g, ' ');
    if (upperCase == true) {
        result = result.toUpperCase();
    } else {
        result = result.substr(0, 1).toUpperCase() + result.substr(1);
    }
    return result;
}

function __changeView(val, template) {
    $('.viewClass').removeClass('active');
    $('#' + val).addClass("active");
    displayedViewStr = val;
    if (displayedViewStr == "grid") {
        localStorage.setItem(template, 'grid')
        $(".row").next().addClass("tableGridView");
        $("<div class='iframeblkinvoice' id='sidebar'><iframe id='showpdf' src=''> </iframe></div>").insertAfter('#display_content_div')
    } else {
        localStorage.setItem(template, 'list')
        $(".row").next().removeClass("tableGridView");
        $(".iframeblkinvoice").remove();
    }
    refresh_data();
}

function redraw_table() {
    $('#table-breakpoint').basictable('destroy');
    $('#display_more_btn').hide();
    $('#img_loading_div').show();
    end = start + pageSize;
    load_data();
}

function filter_by_status(valNum) {
    totalDisplayedNum = 0;
    if (valNum == "all") {
        statusFieldValStr = "";
    } else {
        statusFieldValStr = valNum;
    }
    $("#documents_data").html('');
    start = 0;
    redraw_table();
}

function setSelectedAs(valNum) {
    var selected = '';
    $('.check').each(function() {
        if ($(this).is(":checked")) {
            if (selected == '') {
                selected = $(this).val();
            } else {
                selected += "," + $(this).val();
            }
        }
    });

    if (selected != '') {
        $("#selectedRows").val(selected);
        $.ajax({
            type: "POST",
            dataType: "json",
            url: backendDirectory + "/api_change_status",
            data: { "collection": collectionNameStr, "selected_values": $("#selectedRows").val(), "status": valNum, "status_field": statusFieldNameStr },
            success: function(response) {
                if (response.success) {
                    checkAllFlag = false;
                    $('.check_all').prop("checked", false);
                    $('.check').prop("checked", false);
                    refresh_data();
                } else if (response.error) {
                    __alertModalBox(response.error);
                }
            }
        });
    } else {
        __alertModalBox('Please select some items before performing action!');
    }
}

function searchKeyword(e) {
    var searchField = $("#" + e).val();
    if (searchField != "") {
        totalDisplayedNum = 0;
        $("#documents_data").html('');
        $("#" + e).removeClass("errorPlaceHolder");
        searchStr = searchField;
        start = 0;
        redraw_table();
    } else {
        $("#" + e).addClass("errorPlaceHolder");
        $("#" + e).attr("placeholder", "Please enter search term here");
        $("#" + e).focus();
    }
}

$(document).ready(function() {
    $('#table').basictable();

    $('#display_more_btn').hide();
    $('#img_loading_div').show();
    load_data();

    $("#searchBtn").click(function() {
        searchKeyword('searchField');
    });

    $('#searchField').keypress(function(e) {
        if (e.which == 13) {
            searchKeyword('searchField');
        }
    });
    $("#searchBtn").click(function() {
        searchKeyword('searchField');
    });

    $(window).scroll(function() {
        if ($(window).scrollTop() == $(document).height() - $(window).height()) {
            if (complete == false && completeScroll == false) {
                load_more();
            }
        }
    });
});

function set_check_all(e) {
    if ($(e).is(":checked")) {
        checkAllFlag = true;
        $('.check_all').prop("checked", true);
        $('.check').prop("checked", true);
    } else {
        checkAllFlag = false;
        $('.check_all').prop("checked", false);
        $('.check').prop("checked", false);
    }
}

function timeConverter(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = month + ' ' + date + ' ' + year + ', ' + hour + ':' + min;
    return time;
}

function refresh_data() {
    totalDisplayedNum = 0;
    searchStr = "";
    $(".searchFieldClass").val("");
    $("#selectedRows").val('');
    $("#documents_data").html('');
    start = 0;
    redraw_table();
}

function load_more() {
    if (start == 0) {
        start = end + 1;
    } else {
        start = end;
    }
    redraw_table();
}

function delete_selection() {
    $('#globalDeletionPrompt').modal('hide');
    var selected_rows = $("#selectedRows").val();
    if (selected_rows != "" && collectionNameStr != "") {
        $.ajax({
            type: "POST",
            dataType: "json",
            url: backendDirectory + "/delete",
            data: { "collection": collectionNameStr, "selected_values": $("#selectedRows").val() },
            success: function(response) {
                if (response.success) {
                    checkAllFlag = false;
                    $('.check_all').prop("checked", false);
                    $('.check').prop("checked", false);
                    totalDisplayedNum = 0;
                    refresh_data();
                } else if (response.error) {
                    __alertModalBox(response.error);
                }
            }
        });
    } else {
        __alertModalBox('Please select some items to delete!');
    }
}

function delete_multiple_rows() {
    var selected = '';
    $('.check').each(function() {
        if ($(this).is(":checked")) {
            if (selected == '') {
                selected = $(this).val();
            } else {
                selected += "," + $(this).val();
            }
        }
    });

    if (selected != '') {
        $("#selectedRows").val(selected);
        $('#globalDeletionPrompt').modal('show');
    } else {
        __alertModalBox('Please select some items to delete!');
    }
}

function delete_single_row(uniqueValue) {
    $("#selectedRows").val(uniqueValue);
    if (uniqueValue != "") {
        $('#globalDeletionPrompt').modal('show');
    } else {
        __alertModalBox('Please select some items to delete!');
    }
}

function load_data() {
    completeScroll = true;
    $(".alert").remove();
    var jsonRow = backendDirectory + "/api_fetch_list?start=" + start + "&limit=" + pageSize + "&templateStr=" + templateStr + "&s=" + searchStr;
    if (statusFieldNameStr != "" && statusFieldValStr != "") {
        jsonRow += "&findFieldName=" + statusFieldNameStr + "&findFieldValue=" + statusFieldValStr;
    }
    if (xhrStatus) xhrStatus.abort();
    xhrStatus = $.getJSON(jsonRow, function(html) {
        console.log("html",html)
        if (html.error) {
            complete = true;
            $(".topOptionsClass").hide();
            $("#table-breakpoint").before('<div class="alert alert-danger">' + html.error + '</div>');
        } else {
            var editorPage = "javascript:void(0)";

            if (html.total) {
                totalNum = parseInt(html.total);
            } else {
                totalNum = 0;
            }
            if (html.iTotalRecordsReturned) {
                totalDisplayedNum = totalDisplayedNum + parseInt(html.iTotalRecordsReturned);
            }
            if (totalDisplayedNum > 0 && totalNum > 0) {
                //alert(totalDisplayedNum);
                $(".display_records_count").html("Showing " + totalDisplayedNum + " out of " + totalNum);
                $(".display_records_count").show();
            } else {
                $(".display_records_count").show();
            }
            if (typeof html.display_columns !== 'undefined' && html.display_columns !== null && html.display_columns != "" && start == 0) {
                var headFootStr = "";
                if (typeof html.uniqueField !== 'undefined' && html.uniqueField !== null && accessRightCode > 0) {
                    headFootStr = '<th class="hidden-xs"><input type="checkbox" class="check_all" onClick="set_check_all(this);"></th>';
                }

                if (displayedViewStr == "list") {
                    $.each(html.display_columns, function(i, row) {
                        headFootStr += "<th>" + generateHeading(row) + "</th>";
                    });

                } else {
                    var grid_column_heading_count = 0;
                    $.each(html.display_columns, function(i, row) {
                        if (grid_column_heading_count < 4) {
                            var GenerateHeading = generateHeading(row)
                            if (GenerateHeading != " id") {
                                headFootStr += "<th>" + GenerateHeading + "</th>";
                                grid_column_heading_count += 1;
                            }

                        }
                    });
                    if (html.display_columns.length > 4) {
                        headFootStr += "<th>Action</th>";
                    }
                }
                $(".headFootClass").html("<tr>" + headFootStr + "</tr>");
            }
            if (typeof html.table !== 'undefined' && html.table !== null && html.table != "" && start == 0) {
                collectionNameStr = html.table;
                if (typeof html.page_title !== 'undefined' && html.page_title !== null && html.page_title != "") {
                    $("#pageMainHeading").html(html.page_title);
                    $("#breadcrumbTitle").html(html.page_title);
                } else {
                    $("#pageMainHeading").html(generateHeading(html.table) + " <small>LIST VIEW</small>");
                    $("#breadcrumbTitle").html(generateHeading(html.table));
                }
            }
            if (typeof html.enable_search !== 'undefined' && html.enable_search !== null && (html.enable_search == true || html.enable_search == "true") && start == 0) {
                $(".form-inline").show();
            }
            if (typeof html.editor !== 'undefined' && html.editor !== null && html.editor != "") {

                if(collectionNameStr == "internship_applications"){
                    editorPage = backendDirectory + "/internship_application";
                }
                else{
                    editorPage = backendDirectory + "/" + html.editor;
                }
                // collectionNameStr
                console.log("editorPage",editorPage)

                $(".editorLink").attr("href", editorPage);
                $(".editorLink").show();
            }
            var show_first_pdf_flag = true
            if (html.aaData.length > 0) {
                var contentHtml = "";
                $.each(html.aaData, function(i, row) {
                    contentHtml += "<tr>";
                    var uniqueFieldVal = "";
                    if (typeof html.uniqueField !== 'undefined' && html.uniqueField !== null && row.hasOwnProperty(html.uniqueField) == true) {
                        uniqueFieldVal = row[html.uniqueField];
                    }

                    if (show_first_pdf_flag) {
                        show_first_pdf_flag = false
                        show_first_pdf(uniqueFieldVal)
                    }

                    if (accessRightCode >= 1) {
                        $("#deleteActionDiv").show();
                        if (checkAllFlag) {
                            contentHtml += '<td class="hidden-xs"><input type="checkbox" class="check" checked value="' + row._id + '"></td>';
                        } else {
                            contentHtml += '<td class="hidden-xs"><input type="checkbox" class="check" value="' + row._id + '"></td>';
                        }
                    }

                    if (typeof html.display_columns !== 'undefined' && html.display_columns !== null && html.display_columns != "") {
                        if (displayedViewStr == "list") {
                            console.log(row["Code"])
                            $.each(html.display_columns, function(k, col) {
                                if (col != "Action") {
                                    if (row.hasOwnProperty(col) == true && (col == "Modified" || col == "modified_timestamp" || col == "modified" || col == "Created" || col == "created_timestamp" || col == "start_timestamp" || col == "end_timestamp" || col == "created")) {
                                        contentHtml += "<td>" + timeConverter(row[col]) + "</td>";
                                    } else if (row.hasOwnProperty(col) == true && (col == "Status" || col == "status" || col == "active")) {
                                        statusFieldNameStr = col;
                                        if (accessRightCode >= 1) {
                                            $("#statusActionDiv").show();
                                        }
                                        if (typeof html.table !== 'undefined' && html.table !== null && html.table == "email_queue") {
                                            contentHtml += "<td>" + row[col] + "</td>";
                                        } else {
                                            if (row[col] == 1 || row[col] == "1") {
                                                contentHtml += '<td><span class="label label-success">Active</span></td>';
                                            } else if (row[col] == 0 || row[col] == "0") {
                                                contentHtml += '<td><span class="label label-danger">Inactive</span></td>';
                                            } else {
                                                contentHtml += '<td><span class="label label-warning">' + row[col] + '</span></td>';
                                            }
                                        }
                                    } else if (row.hasOwnProperty(col)) {
                                        try {
                                            if (row[col].search("/cv/") >= 0) {
                                                contentHtml += "<td><a href=" + row[col] + " title='Download' target='_blank'>Download<span class='fa fa-download'></span></a></td>";
                                            } else {
                                                contentHtml += "<td><a href=" + editorPage + '?' + html.uniqueField + '=' + uniqueFieldVal + " title='Edit'>" + row[col] + "</a></td>";
                                            }
                                        } catch (error) {
                                            contentHtml += "<td><a href=" + editorPage + '?' + html.uniqueField + '=' + uniqueFieldVal + " title='Edit'>" + row[col] + "</a></td>";
                                        }
                                        // contentHtml+="<td>"+row[col]+"</td>";
                                        // contentHtml += "<td><a href=" + editorPage + '?' + html.uniqueField + '=' + uniqueFieldVal + " title='Edit'>" + row[col] + "</a></td>";
                                    } else {
                                        contentHtml += "<td></td>";
                                    }
                                }
                            });
                        } else {
                            var grid_column_heading_count = 0;
                            $.each(html.display_columns, function(k, col) {
                                if (col != "Action") {
                                    if (grid_column_heading_count < 4 && col != "_id") {
                                        if (row.hasOwnProperty(col) == true && (col == "Modified" || col == "modified_timestamp" || col == "modified" || col == "Created" || col == "created_timestamp" || col == "start_timestamp" || col == "end_timestamp" || col == "created")) {
                                            contentHtml += "<td>" + timeConverter(row[col]) + "</td>";
                                        } else if (row.hasOwnProperty(col) == true && (col == "Status" || col == "status" || col == "active")) {
                                            statusFieldNameStr = col;
                                            if (accessRightCode >= 1) {
                                                $("#statusActionDiv").show();
                                            }
                                            if (typeof html.table !== 'undefined' && html.table !== null && html.table == "email_queue") {
                                                contentHtml += "<td>" + row[col] + "</td>";
                                            } else {
                                                if (row[col] == 1 || row[col] == "1") {
                                                    contentHtml += '<td><span class="label label-success">Active</span></td>';
                                                } else if (row[col] == 0 || row[col] == "0") {
                                                    contentHtml += '<td><span class="label label-danger">Inactive</span></td>';
                                                } else {
                                                    contentHtml += '<td><span class="label label-warning">' + row[col] + '</span></td>';
                                                }
                                            }
                                        } else if (row.hasOwnProperty(col)) {
                                            // contentHtml+="<td>"+row[col]+"</td>";
                                            contentHtml += "<td><a href='javascript:void(0);' data-id=" + row['_id'] + " onclick='tdclick(this);'>" + row[col] + "</a></td>";
                                        } else {
                                            contentHtml += "<td></td>";
                                        }
                                        grid_column_heading_count += 1
                                    }
                                }
                            });
                        }


                    } else {
                        $.each(row, function(j, rowDetails) {
                            if (typeof html.uniqueField !== 'undefined' && html.uniqueField !== null && html.uniqueField == j) {
                                uniqueFieldVal = rowDetails;
                            }
                            contentHtml += "<td>" + rowDetails + "</td>";
                        });
                    }
                    if (typeof html.uniqueField !== 'undefined' && html.uniqueField !== null && uniqueFieldVal != "") {
                        if (accessRightCode == 0) {
                            contentHtml += '<td class="actions-list"><!--<a href="javascript:void(0)" onClick="alert(\'Sorry you do not have access to this option!\');"><i class="fa fa-pencil"></i></a>--></td>';
                        } else {
                            contentHtml += '<td class="actions-list"><a href="' + editorPage + '?' + html.uniqueField + '=' + uniqueFieldVal + '" title="Edit"><i class="fa fa-pencil"></i></a>&nbsp;<a href="javascript:void(0)" onClick="delete_single_row(\'' + row._id + '\')" title="Delete"><i class="fa fa-trash"></i></a></td>';
                        }
                    }
                    contentHtml += "</tr>";
                    uniqueId = uniqueFieldVal;
                });
                $("#documents_data").append(contentHtml);

                if (html.total && html.iTotalRecordsReturned && html.iTotalRecordsReturned == html.total) {
                    complete = true;
                } else {
                    complete = false;
                }
            } else {
                complete = true;
                $("#table-breakpoint").before('<div class="alert alert-danger alert-dismissable"><button class="close" aria-hidden="true" data-dismiss="alert" type="button">??</button>No more records found!</div>');
            }
            //initialize table
            $('#table-breakpoint').basictable({
                breakpoint: 751
            });
        }

        if (end < totalNum) {
            $('#display_more_btn').show();
        }
        $('#img_loading_div').hide();
        completeScroll = false;
    });
}

// show first pdf from the list
function show_first_pdf(uniqueId) {
    var xhttp = new XMLHttpRequest();
    xhttp.responseType = 'blob';
    let collection_name = collectionNameStr
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var file = new Blob([xhttp.response], { type: 'application/pdf' });
            var fileURL = URL.createObjectURL(file);
            $("#showpdf").attr("src", fileURL);
        }
    };
    if (collection_name == "invoices") {
        collection_name = "invoice"
    }
    // xhttp.open("GET", backendDirectory + "/invoice/" + uniqueId, true);
    xhttp.open("GET", backendDirectory + "/" + collection_name + "/" + uniqueId, true);
    xhttp.send();
}

// show pdf in iframe on click
function tdclick(invoiceId) {
    var click_val = $(invoiceId).attr("data-id")
    let collection_name = collectionNameStr
    var xhttp = new XMLHttpRequest();
    xhttp.responseType = 'blob';
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // console.log(xhttp.response)
            // var url = URL.createObjectURL(xhttp.response);
            // $("#showpdf").attr("src",url);

            var file = new Blob([xhttp.response], { type: 'application/pdf' });
            var fileURL = URL.createObjectURL(file);
            $("#showpdf").attr("src", fileURL);
        }
    };
    if (collection_name == "invoices") {
        collection_name = "invoice"
    }
    xhttp.open("GET", backendDirectory + "/" + collection_name + "/" + click_val, true);
    xhttp.send();
};