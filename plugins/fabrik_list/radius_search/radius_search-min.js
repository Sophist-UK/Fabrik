var FbListRadiusSearch=new Class({Extends:FbListPlugin,options:{prefilter:true,prefilterDistance:1000,prefilterDone:false},initialize:function(a){this.parent(a);window.addEvent("fabrik.loaded",function(){this.listform=this.listform.getElement(".radus_search");if(typeOf(this.options.value)==="null"){this.options.value=0}this.fx=new Fx.Slide(this.listform.getElement(".radius_search_options"));this.listform.getElements("input[name^=radius_search_active]").addEvent("click",function(f){switch(f.target.get("value")){case"1":this.fx.slideIn();break;case"0":this.fx.slideOut();break}}.bind(this));var b=this.listform.getElements("input[name^=radius_search_active]").filter(function(e){return e.checked===true});if(b[0].get("value")==="0"){this.fx.slideOut()}this.element.getElements("input[name^=radius_search_type]").addEvent("click",function(f){this.toggleFields(f)}.bind(this));this.options.value=this.options.value.toInt();if(typeOf(this.listform)==="null"){return}var c=this.listform.getElement(".radius_search_distance");var d=this.listform.getElement(".slider_output");this.mySlide=new Slider(this.listform.getElement(".fabrikslider-line"),this.listform.getElement(".knob"),{onChange:function(e){c.value=e;d.set("text",e+this.options.unit)}.bind(this),steps:this.options.steps}).set(0);this.mySlide.set(this.options.value);c.value=this.options.value;d.set("text",this.options.value);if(!this.options.prefilterDone){if(geo_position_js.init()){geo_position_js.getCurrentPosition(function(e){this.setGeoCenter(e)}.bind(this),function(f){this.geoCenterErr(f)}.bind(this),{enableHighAccuracy:true})}}}.bind(this))},setGeoCenter:function(a){this.geocenterpoint=a;this.geoCenter(a);this.prefilter()},prefilter:function(){if(this.options.prefilter){this.fx.slideIn();this.mySlide.set(this.options.prefilterDistance);this.listform.getElements("input[name^=radius_search_active]").filter(function(a){return a.get("value")==="1"}).getLast().checked=true;this.listform.getElements("input[value=mylocation]").checked=true;this.list.submit("filter")}},geoCenter:function(a){if(typeOf(a)==="null"){alert(Joomla.JText._("PLG_VIEW_RADIUS_NO_GEOLOCATION_AVAILABLE"))}else{this.listform.getElement("input[name=radius_search_lat]").value=a.coords.latitude.toFixed(2);this.listform.getElement("input[name=radius_search_lon]").value=a.coords.longitude.toFixed(2)}},geoCenterErr:function(a){fconsole("geo location error="+a.message)},toggleActive:function(a){},toggleFields:function(a){switch(a.target.get("value")){case"latlon":this.listform.getElement(".radius_search_place_container").hide();this.listform.getElement(".radius_search_coords_container").show();break;case"mylocation":this.listform.getElement(".radius_search_place_container").hide();this.listform.getElement(".radius_search_coords_container").hide();this.setGeoCenter(this.geocenterpoint);break;case"place":this.listform.getElement(".radius_search_place_container").show();this.listform.getElement(".radius_search_coords_container").hide();break}},clearFilter:function(){this.listform.getElements("input[name^=radius_search_active]").filter(function(a){return a.get("value")==="0"}).getLast().checked=true}});