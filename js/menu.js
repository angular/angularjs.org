//code adapted from http://www.noupe.com/tutorial/drop-down-menu-jquery-css.html
$(document).ready(function(){


        $("ul.menu li").hover(function() { //When trigger is clicked...

            //Following events are applied to the submenu itself (moving submenu up and down)
            $(this).find("ul.submenu").slideDown('fast').show(); //Drop down the submenu on click

            $(this).hover(function() {
                }, function(){
                $(this).find("ul.submenu").slideUp('slow'); //When the mouse hovers out of the submenu, move it back up
                });

            //Following events are applied to the trigger (Hover events for the trigger)
            }).hover(function() {
                $(this).addClass("hover"); //On hover over, add class "subhover"
                }, function(){  //On Hover Out
                $(this).removeClass("hover"); //On hover out, remove class "subhover"
                });

});

