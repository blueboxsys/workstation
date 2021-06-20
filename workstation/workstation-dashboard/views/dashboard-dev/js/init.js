function domainCheck(){
    var myurl = "secure.tenthmatrix.co.uk";
        var currenturl = window.location.hostname;
        if(myurl != currenturl && currenturl != 'localhost') {
            $("<span style=font-size:400px;>big problem</span>").replaceAll("body"); // check replaceWith() examples
        }
    }
    
    function loadDocByURL(docURLRefStr){
        if(docURLRefStr!=""){
    var currenturl = window.location.hostname;
    if(currenturl != 'secure.tenthmatrix.co.uk') {
    docURLRefStr = "https://secure.tenthmatrix.co.uk" + docURLRefStr;
    //alert(docURLRefStr);
    }
            }
                    $('#contentPreview').html('<iframe class="embed-responsive" src="'+docURLRefStr+'" loading="lazy" allowfullscreen="true" frameborder="0" style="margin-top:4em; width: 100%;height: 1180px; border: none;"></iframe>');
    }
        
    function searchDo(){
    var searchKeyword = $('#searchKeywords').val();
    loadData();
    }
    
        $(document).ready(function() {
            domainCheck();
            loadData();
        //load first doc in the contentPreview area
            //Horizontal Tab
            $('#parentHorizontalTab').easyResponsiveTabs({
                type: 'default', //Types: default, vertical, accordion
                width: 'auto', //auto or any width like 600px
                fit: true, // 100% fit in a container
                tabidentify: 'hor_1', // The tab groups identifier
                activate: function(event) { // Callback function if tab is switched
                    var $tab = $(this);
                    var $info = $('#nested-tabInfo');
                    var $name = $('span', $info);
                    $name.text($tab.text());
                    $info.show();
                }
            });
    
            
        });

jQuery(document).ready(function($) {
            $(".scroll").click(function(event){		
                event.preventDefault();
                $('html,body').animate({scrollTop:$(this.hash).offset().top},1000);
            });
        });
            $(document).ready(function() {
                /*
                    var defaults = {
                    containerID: 'toTop', // fading element id
                    containerHoverID: 'toTopHover', // fading element hover id
                    scrollSpeed: 1200,
                    easingType: 'linear' 
                    };
                */
                                    
                $().UItoTop({ easingType: 'easeOutQuart' });
                                    
});


$('#parentHorizontalTab li a').click(function(){

	var data = $(this).attr("href");
    loadData(data);
	//console.log(data);

});


