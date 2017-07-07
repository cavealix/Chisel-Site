var prep_map, videos;
var instagram_access_token = '2319371178.64ffe15.33ea64b338fc491f845c21810178e9f1';
var prep_icons = [
  {"img": "/static/imgs/google_icons/ic_restaurant_black_36dp/web/ic_restaurant_black_36dp_2x.png",
  "title": "Food", "alt": "food-btn", "type": "restaurant"},
  {"img": "/static/imgs/google_icons/ic_store_mall_directory_black_36dp/web/ic_store_mall_directory_black_36dp_2x.png",
  "title": "Gear Shops", "alt": "gear-shop-icon", "type": "clothing_store"},
  {"img": "/static/imgs/google_icons/ic_local_bar_black_36dp/web/ic_local_bar_black_36dp_2x.png",
  "title": "Pubs", "alt": "pubs-btn", "type": "bar"},
  {"img": "/static/imgs/google_icons/ic_hotel_black_36dp/web/ic_hotel_black_36dp_2x.png",
  "title": "Lodging", "alt": "lodging-btn", "type": "lodging"},
  {"img": "/static/imgs/google_icons/ic_local_gas_station_black_36dp/web/ic_local_gas_station_black_36dp_2x.png",
  "title": "Gas", "alt": "gas-btn", "type": "gas_station"},
  {"img": "/static/imgs/google_icons/ic_flight_black_36dp/web/ic_flight_black_36dp_2x.png",
  "title": "airfare", "alt": "airfare-btn", "type": "airport"},
  {"img": "/static/imgs/google_icons/ic_change_history_black_36dp/web/ic_change_history_black_36dp_2x.png",
  "title": "Camp", "alt": "camp-btn", "type": "campground"},
  {"img": "/static/imgs/google_icons/ic_local_hospital_black_36dp/web/ic_local_hospital_black_36dp_2x.png",
  "title": "Hospital", "alt": "hospital-btn", "type": "hospital"}];
var info_icons = [
  {"img": "/static/imgs/google_icons/ic_info_black_36dp/web/ic_info_black_36dp_2x.png",
  "title": "Info", "alt": "info-icon", "id": "info"},
  {"img": "/static/imgs/google_icons/ic_show_chart_black_36dp/web/ic_show_chart_black_36dp_2x.png",
  "title": "Elevation", "alt": "elevation-icon", "id": "elevation"},
  {"img": "/static/imgs/google_icons/ic_cloud_black_36dp/web/ic_cloud_black_36dp_2x.png",
  "title": "Forecast", "alt": "forecast-icon", "id": "forecast"}
  ];

// Main ////////////////////////////////////////////////////
var main = function(trail) {
  setTrailMap(trail);
  setPrepMap(trail);
  setChart(trail);

  // Instantiate Knockout VM
  VM = new ViewModel(trail);
  ko.applyBindings(VM);

  // Initiate Masterslider
  var slider = new MasterSlider();
  slider.setup('masterslider' , {
      width:1024,
      height:580,
      space:0,
      fillMode:'fit',
      speed:25,
      preload:'0',
      view:'mask',
      loop:true
  });
     
  slider.control('arrows');  
  slider.control('bullets');
}

// VIEW MODEL ////////////////////////////////////////////////////
var ViewModel = function(trail) {
  var self = this;

  //Create Prep Nav Btns
  self.prep_btns = ko.observableArray([]);
  prep_icons.forEach( function(icon) {
    self.prep_btns.push( new iconButton(icon) );
  });

  //Create Info Btns
  self.info_btns = ko.observableArray([]);
  info_icons.forEach( function(icon) {
    self.info_btns.push( new iconButton(icon) );
  });
  self.current_info_btn = ko.observable( info_icons[0] );

  self.placeArray = ko.observableArray([]);
  self.currentPlace = ko.observable( self.placeArray()[0] );

  self.forecast = ko.observableArray([]);

  self.videos = ko.observableArray([]);
  self.currentVideo = ko.observable();

  self.queryInsta = function(trail) {
    
    //dummy data for testing
    trail = {'lat': 29.5590826, 'lng': -98.6743756};
    //url = 'https://api.instagram.com/v1/users/2319371178/media/recent?access_token=2319371178.64ffe15.33ea64b338fc491f845c21810178e9f1';
    var userid = '2319371178';
    var token = '2319371178.64ffe15.33ea64b338fc491f845c21810178e9f1';

    $.ajax({
      url: 'https://api.instagram.com/v1/media/search?lat='+trail.lat+'&lng='+trail.lng, // or /users/self/media/recent for Sandbox
      dataType: 'jsonp',
      type: 'GET',
      data: {access_token: instagram_access_token},
      success: function(data){
        console.log(data);
        for( x in data.data ){

        }
      },
      error: function(data){
        console.log(data); // send the error notifications to console
      }
    });
  };

  self.getForecast = function(trail) {

    // FORECAST
    var xmlhttp = new XMLHttpRequest();
    //query OpenWeatherMap by geolocation
    var url = "http://api.openweathermap.org/data/2.5/forecast/daily?lat="+trail.lat+"&lon="+trail.lon+"&mode=json&units=imperial&cnt=7&APPID=1088269cadd02d84dba9b274fc7bc097";
      
    xmlhttp.onreadystatechange=function() {
      if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        myFunction(xmlhttp.responseText);
      }
    }
    xmlhttp.open("GET", url, true);
    xmlhttp.send();

    function myFunction(response) {
      var arr = JSON.parse(response);
        for (var i = 0; i < arr.list.length; i++) {
          self.forecast.push( new Day(arr.list[i]) )
        };
    }
  };

  self.toggle = function(iconButton) {

    $('#info-title').innerHTML = iconButton.title;

    $('#'+self.current_info_btn().id).collapse('hide');

    $('#'+iconButton.id).collapse('show');

    self.current_info_btn(iconButton);
  };

  self.search = function(iconButton) {

    //Clear previous results
    self.clearMap();

    //Create bounds object for scaling map to search results
    var bounds = new google.maps.LatLngBounds;
    var trailhead = new google.maps.LatLng(trail.lat,trail.lon);
    
    var request = {
      keyword: iconButton.type,
      location: trailhead,
      radius: 10000
    };

    //Perform Nearby Search
    service = new google.maps.places.PlacesService(prep_map);
    service.nearbySearch(request, callback);
    
    function callback(results, status) {
      if (status !== google.maps.places.PlacesServiceStatus.OK) {
        console.error(status);
        return;
      }
      for (var i = 0, result; result = results[i]; i++) {
        self.placeArray().push( new Place(result) );
        //Fit map to results
        bounds.extend(result.geometry.location);   
      }
      //Include trailhead in map resize
      prep_map.fitBounds(bounds.extend(trailhead));
    }
  };

  self.selectPlace = function(place) {
    self.currentPlace(place);
    self.currentPlace().bounce();
    self.openMenu();
    self.distance();
  };

  self.distance = function(trail) {
    
    var request = 'http://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins='
      +trail.lat+','+trail.lon+'&destinations=place_id:'+self.currentPlace().id+'&key=AIzaSyB9HruWNEZUBfdIyuBEehLKI0whMeX_bAQ';
  };

  self.clearMap = function() {
    for (var i = 0; i < self.placeArray().length; i++) {
        self.placeArray()[i].clear();
    }
    //empty list to save memory
    self.placeArray = ko.observableArray([]);
    self.closeMenu();
  };

  self.openMenu = function() {
      $('.menu').animate({
        left: "0px"
      }, 200);
  };

  self.closeMenu = function() {
      $('.menu').animate({
        left: "-285px"
      }, 200);
  };

  //Automatically 'select' and show restaurants
  self.search( self.prep_btns()[0] );
  //Query weather forecast
  self.getForecast(trail);
  self.queryInsta(trail);
  //Query Youtube
  //self.queryYoutube(trail);
}

// Button Object ///////////////////////////////////////////
var iconButton = function(icon) {
  var self = this;

  self.img = ko.observable(icon.img);
  self.title = ko.observable(icon.title);
  self.class = ko.observable(icon.class);
  self.alt = ko.observable(icon.alt);
  self.type = icon.type;
  self.id = icon.id;
}

// Day Object ///////////////////////////////////////////
var Day = function(day) {
  var self = this;

  self.img   =  ko.observable("http://openweathermap.org/img/w/" + day.weather[0].icon + ".png");
  self.avg   =  ko.observable(day.temp.day + '°F');
  self.range =  ko.observable(day.temp.max + ' - ' + day.temp.min + '°F');
  self.desc  =  ko.observable(day.weather[0].description);
}

// Place Object ///////////////////////////////////////////
var Place = function(place) {
  var self = this;

  self.name = ko.observable(place.name);
  self.id = ko.observable(place.place_id);
  self.rating = ko.observable(place.rating);
  self.address = ko.observable(place.formatted_address);
  self.phone = ko.observable(place.formatted_phone_number);

  var marker = new google.maps.Marker({
      map: prep_map,
      title: place.name,
      position: place.geometry.location,
      icon: {
        url: 'http://maps.gstatic.com/mapfiles/circle.png',
        anchor: new google.maps.Point(12, 12),
        scaledSize: new google.maps.Size(10, 17)
      }
  });

  var infowindow = new google.maps.InfoWindow({
    content: place.name
  });

  //Trigger 'Select Place' KO event
  google.maps.event.addListener(marker, 'click', function() { 
      VM.selectPlace(self);
  });

  self.clear = function() {
    marker.setMap(null);
  };

  this.bounce = function() {
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout( function() { 
          marker.setAnimation(null); 
      }, 1500);
  };
}

// Video Object ///////////////////////////////////////////
var Video = function(video) {
  var self = this;

  self.title = ko.observable(video.title);
  self.url = ko.observable(video.url);
  self.description = ko.observable(video.description);
  self.thumbnails = ko.observable(video.thumbnails.medium);
}

// Instagram Photo Object /////////////////////////////////
var Video = function(pic) {
  var self = this;

  self.type = pic.type;
  self.tags = pic.tags;
  self.caption = pic.caption;
  self.username = pic.user.username;
  self.profile_picture = pic.user.profile_picture;
  self.thumbnail = pic.images.thumbnail.url;
  self.low_res_pic = pic.images.low_resolution.url;
  self.std_res_pic = pic.images.standard_resolution.url;
}

//Set Elevation Chart
function setChart(trail) {
  google.charts.load('current', {packages: ['corechart', 'line']});
  google.charts.setOnLoadCallback(drawBackgroundColor);

  function drawBackgroundColor() {

      var data = new google.visualization.DataTable();
      data.addColumn('number', 'Distance');
      data.addColumn('number', 'Elevation');

      chart_matrix = [];
      for (var i = 0; i < trail.elevation.length-1; i++) {
        cell = [trail.cumulative_distance[i], trail.elevation[i]];
        chart_matrix.push(cell);
      }

      data.addRows(chart_matrix);

      var options = {
        hAxis: {
          title: 'Distance (mi)'
        },
        vAxis: {
          title: 'Elevation (ft)'
        },
        backgroundColor: '#ffffff',
        legend: 'none'
      };

      var chart = new google.visualization.LineChart(document.getElementById('elevation'));
      chart.draw(data, options);
  }
}

// Set Prep Map
function setPrepMap(trail) {

  var trailhead = new google.maps.LatLng(trail.lat,trail.lon);
  prep_map = new google.maps.Map(document.getElementById('prep_map'), {
    center: trailhead,
    zoom: 15,
    scrollwheel: false
  });

  /* Add trailhead marker */
  var marker = new google.maps.Marker({
    position: trailhead,
    map: prep_map,
    title: trail.name
  });
}

// SET TRAIL MAP
function setTrailMap(trail) {  

  var trailhead = new google.maps.LatLng(trail.lat,trail.lon);
  var map = new google.maps.Map(document.getElementById('trail_map'), {
    center: trailhead,
    zoom: 15,
    scrollwheel: false,
    mapTypeId: 'terrain'
  });

  /* Add trailhead marker */
  var marker = new google.maps.Marker({
    position: trailhead,
    map: map,
    title: trail.name
  });

  //Create polyline from JSON data
  var path = new Array();
  for(var i=0; i < trail.coords.length; i++){
      //Tokenise the coordinates
      coord = trail.coords[i];
      path.push(new google.maps.LatLng(coord.lat, coord.lon));
  }

  //Fit map bounds to trail
  var bounds = new google.maps.LatLngBounds;
  for(var i=0; i < path.length; i+=25){
    bounds.extend(path[i]); 
  }
  //Incude last coord point
  bounds.extend(path[path.length-1]);
  //Include trailhead and fit map
  map.fitBounds(bounds.extend(trailhead));

  //Set Trail
  var trail = new google.maps.Polyline({
      path: path,
      map: map,
      geodesic: true,
      strokeColor: 'orange',
      strokeOpacity: 1.0,
      strokeWeight: 3
  });

}

function mapError() {
    alert('Google Maps failed to load');
}