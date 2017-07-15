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
      scrollwheel: false,
      zoom: 4
    });

    VM = new ViewModel();
    ko.applyBindings(VM);
}

// View Model /////////////////////////////////////////////////

var ViewModel = function() {
    var self = this;

    self.parkList = ko.observableArray([]);
    self.trailList = ko.observableArray([]);

    self.currentContent = ko.observable();
    self.currentPlace = ko.observable();
    self.currentTrail = ko.observable();
    //Position for forecast and place search queries for content/trails/parks
    self.currentPosition = ko.observable();

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

// API CALLS //////////////////////////////////////////

    //Determine platform and get content id from url
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

    //Query Flickr by photo_id
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

                if (data.photo.location != null) {
                    var location = data.photo.location;
                    var position = {lat: parseFloat(location.latitude), lng: parseFloat(location.longitude)}; 

                    //Set as new position for weather/place queries
                    self.currentPosition( position );
                    self.getForecast();
                    self.show('prep-icons');

                    self.currentContent(new Content(position, 'photo'));
                    self.centerMap(self.currentContent().position);
                    self.zoom();

                    //find nearby trails
                    self.findTrails(self.currentContent().position);
                }
                else {
                    alert('Content is not geo-tagged');
                    //(Find by tags, name, etc)
                }
            }
            else{
                alert('AJAX flickrSearch request failed');
            } 
        });
    };

    //Query youtube by video_id
    self.youtubeSearch = function(video_id) {
        
        var url = "https://www.googleapis.com/youtube/v3/videos?id="+video_id+"&part=recordingDetails,snippet&key=AIzaSyC9OHhxzexIo2nYScmEqSM4Rsqp9mRSflI";
        
        $.getJSON( url, {
          format: "json"
        })
        .done(function( data ) {
            var video = data.items[0];

            if (video.recordingDetails != null){
                //set location
                var location = video.recordingDetails.location;
                var position = {lat: location.latitude, lng: location.longitude}
                var title = video.snippet.title;

                //Set as new position for weather/place queries
                self.currentPosition( position );
                self.getForecast();
                self.show('prep-icons');

                self.currentContent(new Content(position, title));
                self.centerMap(self.currentContent().position);
                self.zoom();
            }
            else {
                alert('Content is not geo-tagged');
                //(Find by tags, name, etc)
            }

        })
        .error( function() {
            alert('AJAX youtubeSearch request failed');
        });
    };

    //Query forcast by location
    self.getForecast = function() {

        //Reset forecast
        //self.hide('forecast');
        self.forecast.removeAll();

        //Use currentPosition for query
        var position = ( self.currentPosition() );

        // FORECAST
        var xmlhttp = new XMLHttpRequest();
        //query OpenWeatherMap by geolocation
        var url = "http://api.openweathermap.org/data/2.5/forecast/daily?lat="+position.lat()+"&lon="+position.lng()+"&mode=json&units=imperial&cnt=7&APPID=1088269cadd02d84dba9b274fc7bc097";
          
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

        //Show forecast section
        self.show('forecast');
    };

    //Use 'nearbySearch' to query est. near currentContent by iconButton type
    self.search = function(iconButton) {

        //if photo btn, query Flickr
        if (iconButton.type == 'photos'){

        } 
        //else search Google places
        else{
            //Clear previous results
            self.clearSearchResults();
      
            var request = {
              keyword: iconButton.type,
              location: self.currentPosition(),
              radius: 25000
            };

            //Perform Nearby Search
            service = new google.maps.places.PlacesService(map);
            service.nearbySearch(request, callback);

            //Create bounds object for scaling map to search results
            var bounds = new google.maps.LatLngBounds;
      
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
              //Include currentPosition in map resize
              map.fitBounds(bounds.extend(self.currentPosition()));
            }
        }

        //FOR NOW - clear trails and show results in relation to park
        self.clearTrails();
        
    };

    //Clear and remove previous search results
    self.clearSearchResults = function() {
      for (var i = 0; i < self.placeArray().length; i++) {
          self.placeArray()[i].clear();
      }
      //empty list to save memory
      self.placeArray.removeAll();
      self.closeMenu();
    };

    //Use gmaps 'Radar' Search to find tour companies
    self.guideSearch =function(content) {
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

    //Query DB for trails with place id
    self.listTrails = function(place_id) {

        self.clearTrails();
        //Query and show trails within park
        url = "http://localhost:8080/parkAPI/" + place_id;//.id;
        console.log(url);
        $.getJSON( url, {
          format: "json"
        })
        .done(function( data ) {

            console.log(data);

            var park = new Park( data.Place );
            //self.switchPlace( place );

            data.Trails.forEach( function(trail) {
                self.trailList.push( new Trail(trail, place_id) );
                });

            //Before trailList is reset, fit map to Park and Trails
            var bounds = self.trailList();
            //bounds.push(park);
            self.bounds(bounds);

            self.filteredList( self.trailList() );

            //Use park location until specific trail is selected
            self.currentPosition( park.position );
            self.getForecast();
        })
        .error( function() {
            alert('Trails AJAX request failed');
        });
    };

    //Clear all trails on map
    self.clearTrails = function() {
        // Remove trail markers and paths from map
        for (var i = 0; i < self.trailList().length; i++) {
            self.trailList()[i].clear();
        }

        self.trailList( [] );
    };

// VIEW //////////////////////////////////////////////

    //Add marker for each result from guideSearch
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
        self.centerMap(place.position)
        place.bounce();
        if (place.type != 'Trail') {
            //self.clearTrails();
            //self.listTrails(place);
        }
        if (place.type == 'Trail') {
            self.zoom();
        }
    };

    //Highlight trail to distinguish from the rest
    self.selectTrail = function(trail){
        //reset previous selected trail
        if (self.currentTrail() != null){
            self.currentTrail().reset();    
        }
        
        //bound map to beginning/end/and middle of trail

        //Set as new position for weather/place queries
        self.currentPosition( trail.position );

        //Set selected trail as currentTrail for binding
        self.currentTrail(trail);
        self.currentTrail().highlight();
        self.currentTrail().bounce();
        
        //Show trail data
        self.show('trail-info');
        self.show('elevation');
    };

    //Center Map around entered position
    self.centerMap = function(position) {

        map.setCenter(position);
    };

    //Zoom map to level 12
    self.zoom = function() {

        map.setZoom(12);
    };

    //For each location in list, extend bounds
    self.bounds = function(list) {
        
        var bounds = new google.maps.LatLngBounds;
        for (var i = 0; i < list.length; i++) {
            bounds.extend(list[i].bound);
        }
        //fit map to bounds
        map.fitBounds(bounds);
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

    //Show (uncollapse) div by entered id
    self.show = function(id){
        $('#'+id).collapse('show');
    };

    //Hide (collapse) div by entered id
    self.hide = function(id){
        $('#'+id).collapse('hide');
    };

    //Clear map of park location icons
    self.clearMap = function() {
        // Removes the markers from the map
        for (var i = 0; i < self.parkList().length; i++) {
            self.parkList()[i].clear();
        }
    };

    //Clear all icons and set to initial state
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

    //Call marker.set() for each object in list
    self.setMarkers = function(list) {
        // Sets the markers on the map
        for (var i = 0; i < list.length; i++) {
            list[i].set();
        }
    };

    //Open info menu
    self.openMenu = function() {
        $('.menu').animate({
          left: "0px"
        }, 200);
    };

    //Close info menu
    self.closeMenu = function() {
        $('.menu').animate({
          left: "-285px"
        }, 200);
    };
}

// Trail //////////////////////////////////////////////////////

var Trail = function(data, park_id) {
    var self = this;

    self.id = data.id;
    self.name = ko.observable(data.name);
    self.type = ko.observable('Trail'); //Treck, Ski Route, Off Road
    self.place_id = data.place_id;
    //self.address = "http://localhost:8080/parks/" + park_id + "/" + data.id;
    self.position = new google.maps.LatLng(data.lat, data.lon);
    self.bound = new google.maps.LatLng(data.lat, data.lon);
    self.cumulative_distance = ko.observable(data.cumulative_distance);
    self.total_distance = ko.observable(data.total_distance);
    self.total_elevation_change = ko.observable(data.total_elevation_change);
    self.start_elevation = ko.observable(data.start_elevation);
    self.end_elevation = ko.observable(data.end_elevation);

    //Create Marker object
    var marker = new google.maps.Marker({
        position: self.position,
        map: map,
        title: data.name,
        animation: google.maps.Animation.DROP,
        icon: {
            url: 'http://maps.google.com/intl/en_us/mapfiles/ms/micons/orange-dot.png'
          }
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

    //Trigger 'Set Path' KO event
    google.maps.event.addListener(marker, 'click', function() { 
        VM.selectTrail(self);
    });

    //Trigger 'Set Path' KO event
    google.maps.event.addListener(trail, 'click', function() { 
        VM.selectTrail(self);
    });

    this.highlight = function(){
        marker.setOptions({})

        trail.setOptions({strokeColor: 'gray'});
        trail.setOptions({strokeWeight: 5});
    };

    this.reset = function(){
        trail.setOptions({strokeColor: 'orange'});
        trail.setOptions({strokeWeight: 3});
    };

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

// Park ///////////////////////////////////////////////////////
var Park = function(data) {
    var self = this;

    self.id = data.id;
    self.place_id = data.place_id;
    self.name = ko.observable(data.name);
    self.position = new google.maps.LatLng(data.lat, data.lon);
    self.state = data.state;
    self.type = 'State Park';//data.type;
    //self.activities = ko.observableArray(data.activities);
    //self.address = "http://localhost:8080/parks/" + data.id;

    var markerUrl;
    switch (self.type ) {
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
        position: self.position,
        map: map,
        title: self.name(),
        icon: {
          url: markerUrl
        },
        animation: google.maps.Animation.DROP
    });

    //Trigger 'Switch Park' KO event
    google.maps.event.addListener(marker, 'click', function() { 
        VM.currentPosition( self.position );
        VM.getForecast();
        
        //VM.switchPlace(self);

        VM.closeMenu();
        VM.hide('trail-info');
        VM.listTrails( self.place_id );
        self.bounce();
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

// Content Object /////////////////////////////////////////////
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

    self.set = function() {
        marker.setMap(map);
    };
}

// Photo Object ///////////////////////////////////////////////
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

// Video Object ///////////////////////////////////////////////
var Video = function(video) {
  var self = this;

  self.position = ko.observable( video.recordingDetails.location );
  self.title = ko.observable(video.title);
  self.url = ko.observable(video.url);
  self.description = ko.observable(video.description);
  self.thumbnails = ko.observable(video.thumbnails.medium);
}

// Day Object /////////////////////////////////////////////////
var Day = function(day) {
  var self = this;

  self.img   =  ko.observable("http://openweathermap.org/img/w/" + day.weather[0].icon + ".png");
  self.avg   =  ko.observable(day.temp.day + '°F');
  self.range =  ko.observable(day.temp.max + ' - ' + day.temp.min + '°F');
  self.desc  =  ko.observable(day.weather[0].description);
}

// Place Object ///////////////////////////////////////////////
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

// Circle Object //////////////////////////////////////////////
var Circle = function(position, radius){
    var circle = new google.maps.Circle({
      center:position,
      radius:radius,
      strokeColor:"orange-dot",
      strokeOpacity:0.8,
      strokeWeight:2,
      fillColor:"#7D7D7D",
      fillOpacity:0.4
    });

    this.set = function(){
        circle.setMap(map);
    };

    this.clear = function(){
        circle.setMap(null);
    };
}

//Event listener for finding content from map page
document.getElementById('search_submit').onclick = function() {
    VM.stripURL(document.getElementById('url').value);
};

//Event listener for finding content from map page
document.getElementById('submit_park_id').onclick = function() {
    VM.listTrails(document.getElementById('park_id').value);
    //Clear all previous search results
    VM.clearSearchResults();

    VM.show('prep-icons');
};

function initAutocomplete() {

  // Create the search box and link it to the UI element.
  var input = document.getElementById('pac-input');
  var searchBox = new google.maps.places.SearchBox(input);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  // Bias the SearchBox results towards current map's viewport.
  map.addListener('bounds_changed', function() {
    searchBox.setBounds(map.getBounds());
  });

  var markers = [];
  // Listen for the event fired when the user selects a prediction and retrieve
  // more details for that place.
  searchBox.addListener('places_changed', function() {
    var places = searchBox.getPlaces();
    if (places.length == 0) {
      return;
    }

    var place = places[0];
    console.log('place = '+place);
    //Get place details
    var service = new google.maps.places.PlacesService(map);

    service.getDetails({
      placeId: place.id
    }, function(place, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        var marker = new google.maps.Marker({
          map: map,
          position: place.geometry.location
        });
        console.log(place);
      }
    });

    //save place to global variable
    document.getElementById('place').value = JSON.stringify(places[0]);

    //Get Instagram place id
    //var fid = instaLocationSearch(places[0]);
    //document.getElementById('fid').value = fid;

    // Clear out the old markers.
    markers.forEach(function(marker) {
      marker.setMap(null);
    });
    markers = [];

    // For each place, get the icon, name and location.
    var bounds = new google.maps.LatLngBounds();
    places.forEach(function(place) {
      if (!place.geometry) {
        console.log("Returned place contains no geometry");
        return;
      }
      var icon = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25)
      };

      // Create a marker for each place.
      markers.push(new google.maps.Marker({
        map: map,
        icon: icon,
        title: place.name,
        position: place.geometry.location
      }));

      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });

    map.fitBounds(bounds);
  });
}

function instaLocationSearch(place) {
  
  var location = JSON.parse(JSON.stringify(place.geometry.location));
  $.ajax({
    url: 'https://api.instagram.com/v1/locations/search?lat='+location.lat+'&lng='+location.lng, // or /users/self/media/recent for Sandbox
    dataType: 'jsonp',
    type: 'GET',
    data: {access_token: instagram_access_token},
    success: function(data){
      for( x in data.data ){
        //console.log('xname = '+data.data[x].name+' placename = '+place.name);
        if(data.data[x].name == place.name){
          //console.log(data.data[x].id);
          console.log(data.data[x]);
          return JSON.stringify(data.data[x].place_id);
        }
      }
      return 'null';
    },
    error: function(data){
      console.log(data); // send the error notifications to console
    }
  });
}

function mapError() {
    alert('Google Maps failed to load');
}