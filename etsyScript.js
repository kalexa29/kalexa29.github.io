/*
Based on code found here: 
https://www.etsy.com/developers/documentation/resources/jquery
*/

(function($){
    $(document).ready(function(){
        api_key = "5vxtvch88sxwbm27pj53j5r0";
        terms = "teapot";
        etsyURL = "https://openapi.etsy.com/v2/listings/active.js?keywords="+terms+"&limit=50&offset=0&includes=Images:1&api_key="+api_key;
        
        $('#etsy-images').empty();
        
        $.ajax({
            url: etsyURL,
            dataType: 'jsonp',
            success: function(data) {
                if (data.ok) {
                    $('#etsy-images').empty();
                    if (data.count > 0) {
                        $.each(data.results, function(i,item) {
                            console.log(item);
//                            console.log(item.category_path); //testing
//                            if(item.category_path.length > 1 && item.category_path[0]==="Housewares" && item.category_path[1]==="Kitchen"){
//                                console.log(item.category_path); //testing
//                            }
                            if (item.category_path[0] === 'Housewares' || 
                                item.category_path[0] === 'ceramics_and_pottery' || 
                                item.category_path[0] === 'glass' || 
                                item.category_path[0] === 'vintage') {
                                $("<img/>").attr("src", item.Images[0].url_170x135).appendTo("#etsy-images").wrap("<figure><a href='"+ item.url+"'target='_blank'></a><figcaption>$"+item.price+"</figcaption></figure>");
                                
                            }
                            if (i%4 == 3) {
                                $().appendTo('#etsy-images');
                                
                            }
                        });
                    } else {
                        $('<p>No results.</p>').appendTo('#etsy-images');
                    }
                } else {
                    $('#etsy-images').empty();
                    alert(data.error);
                }
            }
        });
        return false;
    });
})(jQuery);