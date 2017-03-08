var prep_map;
var prep_icons = [{"img": "/static/imgs/google_icons/ic_restaurant_black_36dp/web/ic_restaurant_black_36dp_2x.png",
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

// Main ////////////////////////////////////////////////////
var main = function(trail) {
  setTrailMap(trail);
  setPrepMap(trail);

  // Instantiate Knockout VM
  VM = new ViewModel(trail);
  ko.applyBindings(VM);

};

// VIEW MODEL ////////////////////////////////////////////////////
var ViewModel = function(trail) {
  var self = this;

  self.prep_btns = ko.observableArray([]);
  prep_icons.forEach( function(icon) {
    self.prep_btns.push( new iconButton(icon) );
  });
  self.placeArray = ko.observableArray([]);
  self.currentPlace = ko.observable( self.placeArray()[0] );

  self.forecast = ko.observableArray([]);


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

  self.search = function(iconButton) {

    //Clear previous results
    self.clearMap();

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
      }
    }
  };

  self.selectPlace = function(place) {
    self.currentPlace(place);
    self.currentPlace().bounce();
    self.openMenu();
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
}

// Button Object ///////////////////////////////////////////
var iconButton = function(icon) {
  var self = this;

  self.img = ko.observable(icon.img);
  self.title = ko.observable(icon.title);
  self.class = ko.observable(icon.class);
  self.alt = ko.observable(icon.alt);
  self.type = icon.type;

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

// Set Prep Map
function setPrepMap(trail) {

  var trailhead = new google.maps.LatLng(trail.lat,trail.lon);
  prep_map = new google.maps.Map(document.getElementById('prep_map'), {
    center: trailhead,
    zoom: 15
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
    zoom: 15
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