var map, google, VM, parksData, content_url;

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
  "title": "Hospital", "alt": "hospital-btn", "type": "hospital"},
  {"img": "/static/imgs/google_icons/ic_camera_alt_black_36dp/web/ic_camera_alt_black_36dp_2x.png",
  "title": "Photos", "alt": "photos-btn", "type": "photos"}];
var info_icons = [
  {"img": "/static/imgs/google_icons/ic_info_black_36dp/web/ic_info_black_36dp_2x.png",
  "title": "Info", "alt": "info-icon", "id": "info"},
  {"img": "/static/imgs/google_icons/ic_show_chart_black_36dp/web/ic_show_chart_black_36dp_2x.png",
  "title": "Elevation", "alt": "elevation-icon", "id": "elevation"},
  {"img": "/static/imgs/google_icons/ic_cloud_black_36dp/web/ic_cloud_black_36dp_2x.png",
  "title": "Forecast", "alt": "forecast-icon", "id": "forecast"}
  ];

function initMap() {

    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 38.9776681,lng: -96.847185},
      zoom: 4

    });

    VM = new ViewModel();
    ko.applyBindings(VM);
}

// Trail //////////////////////////////////////////////////////

var Trail = function(data, park_id) {
    var self = this;

    self.id = data.id;
    self.type = 'Trail';
    self.address = "http://localhost:8080/parks/" + park_id + "/" + data.id;
    self.name = ko.observable(data.name);
    self.lon = ko.observable(data.lon);
    self.lat = ko.observable(data.lat);
    self.bound = new google.maps.LatLng(data.lat, data.lon);

    var marker = new google.maps.Marker({
        position: {lat: data.lat, lng: data.lon},
        map: map,
        title: data.name,
        animation: google.maps.Animation.DROP,
        icon: {
            url: 'http://maps.google.com/intl/en_us/mapfiles/ms/micons/orange-dot.png'
          }
    });

    //Current Weather
    self.current_img = ko.observable();
    self.current_avg = ko.observable();
    self.current_conditions = ko.observable();
    self.current_wind = ko.observable();

    //Query Current Weather
    var weather_query = "http://api.openweathermap.org/data/2.5/weather?lat="+data.lat+"&lon="+data.lon+"&APPID=1088269cadd02d84dba9b274fc7bc097&units=imperial";
    $.getJSON( weather_query, {
      format: "json"
    })
    .done(function( data ) {
      self.current_img =  "http://openweathermap.org/img/w/" + data.weather[0].icon + ".png";
      self.current_avg = Math.round(data.main.temp)+'°F'; 
      self.current_conditions = data.weather[0].description;
      self.current_wind = "Wind " + data.wind.speed + " MPH";
    })
    .error( function() {
        alert('AJAX weather request failed');
    });

    //Trigger 'Set Path' KO event
    google.maps.event.addListener(marker, 'click', function() { 
        VM.switchPlace(self);
    });

    //Create polyline from JSON data
    var path = new Array();
    for(var i=0; i < data.coords.length; i++){
        //Tokenise the coordinates
        coord = data.coords[i];
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

    this.clear = function() {
        marker.setMap(null);
        trail.setMap(null);
    };

    this.set = function() {
        //marker.setMap(map);
        trail.setMap(map);
    };

    this.zoom = function() {
        map.setZoom(13);
    };

    this.center = function() {
        map.setCenter(marker.getPosition());
    };

    this.bounce = function() {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout( function() { 
            marker.setAnimation(null); 
        }, 1500);
    };
}

var Park = function(data) {
    var self = this;

    self.id = data.id;
    self.type = data.type;
    self.address = "http://localhost:8080/parks/" + data.id;
    self.name = ko.observable(data.name);
    self.bound = new google.maps.LatLng(data.lat, data.lon);
    self.lat = ko.observable(data.lat);
    self.activities = ko.observableArray(data.activities);
    self.state = data.state;

    var markerUrl;
    switch (data.type ) {
        case 'State Park':
            markerUrl = 'http://maps.google.com/intl/en_us/mapfiles/ms/micons/blue-dot.png';
            break;
        case 'Nat\'l Park':
            markerUrl = 'http://maps.google.com/intl/en_us/mapfiles/ms/micons/red-dot.png';
            break;
        case 'BLM':
            markerUrl = 'http://maps.google.com/intl/en_us/mapfiles/ms/micons/green-dot.png';
            break;
        case 'City Park':
            markerUrl = 'http://maps.google.com/intl/en_us/mapfiles/ms/micons/purple-dot.png';
    }

    var marker = new google.maps.Marker({
        position: {lat: data.lat, lng: data.lon},
        map: map,
        title: data.name,
        icon: {
          url: markerUrl
        },
        animation: google.maps.Animation.DROP
    });

    //Trigger 'Switch Park' KO event
    google.maps.event.addListener(marker, 'click', function() { 
        VM.switchPlace(self);
    });

    //Current Weather
    self.current_img = ko.observable();
    self.current_avg = ko.observable();
    self.current_conditions = ko.observable();
    self.current_wind = ko.observable();

    //Query Current Weather
    var weather_query = "http://api.openweathermap.org/data/2.5/weather?lat="+data.lat+"&lon="+data.lon+"&APPID=1088269cadd02d84dba9b274fc7bc097&units=imperial";
    $.getJSON( weather_query, {
      format: "json"
    })
    .done(function( data ) {
      self.current_img =  "http://openweathermap.org/img/w/" + data.weather[0].icon + ".png";
      self.current_avg = Math.round(data.main.temp)+'°F'; 
      self.current_conditions = data.weather[0].description;
      self.current_wind = "Wind " + data.wind.speed + " MPH";
    })
    .error( function() {
        alert('AJAX weather request failed');
    });

    this.bounce = function() {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout( function() { 
            marker.setAnimation(null); 
        }, 1500);
    };

    this.center = function() {
        map.setCenter(marker.getPosition());
    };

    this.clear = function() {
        marker.setMap(null);
    };

    this.set = function() {
        marker.setMap(map);
    };
}

// View Model /////////////////////////////////////////////////

var ViewModel = function() {
    var self = this;

    self.parkList = ko.observableArray([]);
    self.trailList = ko.observableArray([]);

    self.currentContent = ko.observable();
    self.currentPlace = ko.observable();

    self.placeArray = ko.observableArray([]);
    self.filteredList = ko.observableArray( self.parkList() );
    self.videos = ko.observableArray([]);
    
    self.forecast = ko.observableArray([]);
    self.park_types = ['Nat\'l Park', 'State Park', 'BLM', 'Nat\'l Forrest', 'City Park'];
    self.states = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MI","MA","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
    //self.activities = ['Hike', 'Bike', 'Camp', 'Pets', 'Climb', 'Swim', 'Offroad', 'Ski', 'Sail'];

    var infoWindow = new google.maps.InfoWindow();
    var service = new google.maps.places.PlacesService(map);

    //Query parks in DB
    /*$.getJSON( "http://localhost:8080/parksJSON", {
      format: "json"
    })
    .done(function( data ) {

      data.Parks.forEach( function(park){
        self.parkList.push( new Park(park) );
        });

      //Display initial park list below map
      self.filteredList( self.parkList() );
    })
    .error( function() {
        alert('parks AJAX request failed');
    });*/

    self.stripURL = function(url) {
        //check if youtube video
        if (url.includes('youtube')){
            var video_id = url.split('watch?v=')[1];
            video_id = video_id.split('&')[0];
            //console.log(video_id);
            self.youtubeSearch(video_id);
        }
        //check if flickr photo
        else if (url.includes('flickr')){
            var parts = url.split('/');
            //console.log(parts);
            var photo_id = parts[parts.length-1];
            //console.log(photo_id);

            self.flickrSearch(photo_id);
        }
    };

    self.flickrSearch = function(photo_id){
        
        var url = 'https://api.flickr.com/services/rest/?method=flickr.photos.geo.getLocation&api_key=3affae96f735ec3e200682d77d67eadb&photo_id='+photo_id;
        //console.log(url);
        
        $.getJSON( url, {
          format: "json"
        })
        .done(function( data ) {
            console.log(data);
        })
        .error( function(data) {
            if (data.status == 200){
                data = data.responseText;
                data = data.replace('jsonFlickrApi(', '');
                data = data.replace(')','');
                data = JSON.parse(data);

                var location = data.photo.location;
                var position = {lat: parseFloat(location.latitude), lng: parseFloat(location.longitude)}; 

                self.currentContent(new Content(position, 'photo'));
                self.centerMap(self.currentContent().position);
                self.zoom();

                //search for tour companies
                self.getForecast(location);
                self.show('prep-icons');
                self.show('forecast');

                //find nearby trails
                self.findTrails(self.currentContent().position);
            }
            else{
                alert('AJAX flickrSearch request failed');
            } 
        });
    };

    self.youtubeSearch = function(video_id) {
        
        var url = "https://www.googleapis.com/youtube/v3/videos?id="+video_id+"&part=recordingDetails,snippet&key=AIzaSyC9OHhxzexIo2nYScmEqSM4Rsqp9mRSflI";
        
        $.getJSON( url, {
          format: "json"
        })
        .done(function( data ) {
            //console.log(data);
            //place marker
            self.youtubeMarker(data.items[0]);
        })
        .error( function() {
            alert('AJAX youtubeSearch request failed');
        });
    };

    self.youtubeMarker = function(video) {
        if (video.recordingDetails != null){
            //set location
            var location = video.recordingDetails.location;
            var position = {lat: location.latitude, lng: location.longitude}
            var title = video.snippet.title;

            self.currentContent(new Content(position, title));
            self.centerMap(self.currentContent().position);
            self.zoom();

            //search for tour companies
            self.getForecast(location);
            self.show('prep-icons');
            self.show('forecast');

            //find nearby trails
            self.findTrails(self.currentContent().position);
        }
        else {
            alert('Content is not geo-tagged');
        }   
    };

    self.findTrails = function(position) {
        $.ajax({
            url: 'https://trailapi-trailapi.p.mashape.com/', // The URL to the API. You can get this in the API page of the API you intend to consume
            type: 'GET', // The HTTP Method, can be GET POST PUT DELETE etc
            data: {
                lat: location.lat,
                limit:15,
                lon: location.lng
            }, // Additional parameters here
            dataType: 'json',
            success: function(data) { console.log((data)); },
            error: function(err) { alert(err); },
            beforeSend: function(xhr) {
            xhr.setRequestHeader("X-Mashape-Authorization", "50DlSbXy5Pmsh3OljMdfWI6ApsNHp1DQYKEjsnf77ATvEBikmb"); // Enter here your Mashape key
            }
        });
    };

    self.getForecast = function(location) {

        // FORECAST
        var xmlhttp = new XMLHttpRequest();
        //query OpenWeatherMap by geolocation
        var url = "http://api.openweathermap.org/data/2.5/forecast/daily?lat="+location.latitude+"&lon="+location.longitude+"&mode=json&units=imperial&cnt=7&APPID=1088269cadd02d84dba9b274fc7bc097";
          
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

        //if photo btn, query Flickr
        if (iconButton.type == 'photos'){

        } 
        //else search Google places
        else{
            //Clear previous results
            self.clearSearchResults();

            //Create bounds object for scaling map to search results
            var bounds = new google.maps.LatLngBounds;
      
            var request = {
              keyword: iconButton.type,
              location: self.currentContent().position,
              radius: 25000
            };

            //Perform Nearby Search
            service = new google.maps.places.PlacesService(map);
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
              map.fitBounds(bounds.extend(self.currentContent().position));
            }
        }
    };

    self.clearSearchResults = function() {
      for (var i = 0; i < self.placeArray().length; i++) {
          self.placeArray()[i].clear();
      }
      //empty list to save memory
      self.placeArray.removeAll();
      self.closeMenu();
    };

    self.guideSearch =function(video) {
        var location = video.recordingDetails.location;
        var request = {
          location: {lat: location.latitude, lng: location.longitude},
          radius: 50000,
          keyword: 'tour'
        };
        service.radarSearch(request, callback);
      

      function callback(results, status) {
        if (status !== google.maps.places.PlacesServiceStatus.OK) {
          console.error(status);
          return;
        }
        for (var i = 0, result; result = results[i]; i++) {
          self.addMarker(result);
        }
      }
    };

    self.addMarker = function(place) {
      var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        icon: {
          url: 'https://developers.google.com/maps/documentation/javascript/images/circle.png',
          anchor: new google.maps.Point(10, 10),
          scaledSize: new google.maps.Size(10, 17)
        }
      });

      google.maps.event.addListener(marker, 'click', function() {
        service.getDetails(place, function(result, status) {
          if (status !== google.maps.places.PlacesServiceStatus.OK) {
            console.error(status);
            return;
          }
          infoWindow.setContent(result.name);
          infoWindow.open(map, marker);
        });
      });
    };

    //User clicks on park marker
    self.switchPlace = function(place) {
        self.currentPlace(place);
        self.openMenu();
        //self.zoom();
        //self.bounds();
        //place.center();
        place.bounce();
        if (place.type != 'Trail') {
            self.clearTrails();
            self.listTrails(place);
        }
        if (place.type == 'Trail') {
            self.zoom();
        }
    };

    self.centerMap = function(position) {

        map.setCenter(position);
    };

    self.zoom = function() {

        map.setZoom(12);
    };

    self.bounds = function(list) {
        //For each location in list, extend bounds
        var bounds = new google.maps.LatLngBounds;
        for (var i = 0; i < list.length; i++) {
            bounds.extend(list[i].bound);
        }
        //fit map to bounds
        map.fitBounds(bounds);
    };

    self.listTrails = function(park) {
        self.clearTrails();
        //Query and show trails within park
        url = "http://localhost:8080/parkAPI/" + park.id;
        $.getJSON( url, {
          format: "json"
        })
        .done(function( data ) {

          data.Trails.forEach( function(trail) {
            self.trailList.push( new Trail(trail, park.id) );
            });

          //Before trailList is reset, fit map to Park and Trails
          var bounds = self.trailList();
          bounds.push(park);
          self.bounds(bounds);

          self.filteredList( self.trailList() );
        })
        .error( function() {
            alert('Trails AJAX request failed');
        });
    };

    //User selects filter, display relevant parks
    self.filterType = function(park_type) {
        self.clearMap();
        //clear previous filter results
        self.filteredList([]);
        //setTimeout(self.setMarkers, 1000);
        for (var i = 0; i < self.parkList().length; i++) {
            if ( self.parkList()[i].type == park_type ){
                self.filteredList.push( self.parkList()[i] );
            }
        }
        
        self.setMarkers( self.filteredList() );
    };

    //User selects filter, display relevant State and results
    self.filterState = function(state) {
        self.clearMap();
        //clear previous filter results
        self.filteredList([]);
        //setTimeout(self.setMarkers, 1000);
        for (var i = 0; i < self.parkList().length; i++) {
            if ( self.parkList()[i].state == state ){
                self.filteredList.push( self.parkList()[i] );
            }
        }
        
        self.setMarkers( self.filteredList() );
    };

    self.show = function(id){
        $('#'+id).collapse('show');
    };

    self.hide = function(id){
        $('#'+id).collapse('hide');
    };

    self.setPath = function(trail) {
        // Set trail path
        trail.set();
    };

    self.clearTrails = function() {
        // Remove trail markers and paths from map
        for (var i = 0; i < self.trailList().length; i++) {
            self.trailList()[i].clear();
        }

        self.trailList( [] );
    };

    self.clearMap = function() {
        // Removes the markers from the map
        for (var i = 0; i < self.parkList().length; i++) {
            self.parkList()[i].clear();
        }
    };

    self.resetMap = function() {
        //reset map position
        self.clearMap();
        self.clearTrails();
        self.filteredList( self.parkList() );
        self.setMarkers(self.filteredList());
        self.closeMenu();
        map.setCenter({lat: 38.9776681,lng: -96.847185});
        map.setZoom(4);

        //clear content variable
        self.currentContent(null);
        //hide geo-specific location
        self.hide('prep-icons');
        self.hide('forecast');
        //empty previous results
        self.forecast.removeAll();
        self.clearSearchResults();
    };

    self.setMarkers = function(list) {
        // Sets the markers on the map
        for (var i = 0; i < list.length; i++) {
            list[i].set();
        }
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
}

// Content Object ///////////////////////////////////////
var Content = function(position, title){
    var self = this;

    self.position = position;

    var marker = new google.maps.Marker({
        position: position,
        map: map,
        title: title,
        icon: { url: '/static/imgs/google_icons/ic_room_black_36dp/web/ic_room_black_36dp_1x.png' },
        animation: google.maps.Animation.DROP
    });

    self.clear = function() {
      marker.setMap(null);
    };
}

// Photo Object ///////////////////////////////////////////
var Photo = function(photo, platform) {
    var self = this;

    self.platform = ko.observable(platform);
    var location = photo.location;
    self.position = ko.observable({lat: location.latitude, lng: location.longitude});

    var marker = new google.maps.Marker({
        position: position,
        map: map,
        title: title,
        icon: { url: 'http://maps.gstatic.com/mapfiles/circle.png' },
        animation: google.maps.Animation.DROP
    });

    self.clear = function() {
      marker.setMap(null);
    };

    self.currentIcon = function(){
        marker.setIcon('/static/imgs/google_icons/ic_room_black_36dp/web/ic_room_black_36dp_1x.png');
    };

    self.resultIcon = function(){
        marker.setIcon('http://maps.gstatic.com/mapfiles/circle.png');
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
      map: map,
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
      VM.switchPlace(self);
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

//Event listener for finding videos from map page
document.getElementById('search_submit').onclick = function() {
    VM.stripURL(document.getElementById('url').value);
};

function mapError() {
    alert('Google Maps failed to load');
}