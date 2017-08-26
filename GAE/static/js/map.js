var map, google, VM, parksData, content_url;

//List of btns for querying nearby places and park info
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
  "title": "Airfare", "alt": "airfare-btn", "type": "airport"},
  {"img": "/static/imgs/google_icons/ic_change_history_black_36dp/web/ic_change_history_black_36dp_2x.png",
  "title": "Camp", "alt": "camp-btn", "type": "campground"},
  {"img": "/static/imgs/google_icons/ic_local_hospital_black_36dp/web/ic_local_hospital_black_36dp_2x.png",
  "title": "Hospital", "alt": "hospital-btn", "type": "hospital"},
  //{"img": "/static/imgs/google_icons/ic_info_black_36dp/web/ic_info_black_36dp_2x.png",
  //"title": "POIs", "alt": "pois-btn", "type": "pois"},
  {"img": "/static/imgs/google_icons/ic_camera_alt_black_36dp/web/ic_camera_alt_black_36dp_2x.png",
  "title": "Photos", "alt": "photos-btn", "type": "photos"}];


function initMap() {

    map = new google.maps.Map(document.getElementById('map'), {
      //center: {lat: 38.9776681,lng: -96.847185},
      //Texas
      center:{lat: 31.4082791, lng: -99.3872106},
      scrollwheel: false,
      zoom: 6
    });

    VM = new ViewModel();
    ko.applyBindings(VM);

    VM.queryParks('State', 'TX');
    
}

// View Model /////////////////////////////////////////////////

var ViewModel = function() {
    var self = this;

    self.parkList = ko.observableArray([]);
    self.trailList = ko.observableArray([]);
    self.photoSphereList = ko.observableArray([]);
    self.poiList = ko.observableArray([]);
    self.photoList = ko.observableArray([]);

    //Currently selected location (Parks/Trails)
    self.destination = ko.observable();


    //Current model selections
    self.currentPlace = ko.observable();
    self.currentTrail = ko.observable();
    self.currentPhoto = ko.observable();

    self.resultArray = ko.observableArray([]);
    self.filteredList = ko.observableArray( self.parkList() );
    
    self.currentWeather = ko.observable();
    self.forecast = ko.observableArray([]);
    self.park_types = ko.observableArray(['Nat\'l Park', 'State Park', 
        'BLM', 'Nat\'l Forrest', 'City Park']);
    self.states = ko.observableArray(["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI",
        "ID","IL","IN","IA","KS","KY","LA","ME","MD","MI","MA","MN","MS","MO","MT","NE","NV",
        "NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
        "VA","WA","WV","WI","WY"]);
    self.activities = ['Hike', 'Bike', 'Camp', 'Pets', 'Climb', 'Swim', 'Offroad', 'Ski', 'Sail'];

    var infoWindow = new google.maps.InfoWindow();
    var service = new google.maps.places.PlacesService(map);

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
            //var parts = url.split('/');
            //console.log(parts);
            var photo_id = /[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]/.exec(url);
            //console.log(photo_id);

            self.flickrSearch(photo_id);
        }
    };

    //Query Flickr by photo_id
    self.flickrSearch = function(photo_id){
        
        var url = 'https://api.flickr.com/services/rest/?method=flickr.photos.geo.getLocation'+
            '&api_key=3affae96f735ec3e200682d77d67eadb&photo_id='+photo_id;
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
                console.log(data);

                if (data.photo.location != null) {
                    var location = data.photo.location;
                    var position = new google.maps.LatLng( location.latitude, location.longitude );
                    //(Need to get photo caption/description for use as title)
                    var title = 'Flickr Photo';

                    //Set as new position for weather/place queries
                    //self.currentPosition( position );

                    self.destination(new Content(position, title));
                    self.centerMap(self.destination().position);
                    self.zoom();

                    self.queryTrails(self.destination().position);

                    self.getForecast();
                    self.show('prep-icons');

                    //self.videosByLocation();

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

    //Query Flickr by for neaby photos
    //Requires OAuth sign-in
    self.flickrQueryByLocation = function( position ){
        
        var url = 'https://api.flickr.com/services/rest/?method=flickr.photos.geo.photosForLocation'+
            '&api_key=3affae96f735ec3e200682d77d67eadb&lat='+position.lat+'&lon='+position.lng;
        console.log(url);
        
        $.getJSON( url, {
          format: "json"
        })
        .done(function( data ) {
            console.log(data);
        })
        .error( function(data) {
            alert('flickrQueryByLocation failed');
            console.log(data);
        });
    };

    // Changes XML to JSON
    self.xmlToJson = function(xml) {
      
      // Create the return object
      var obj = {};
    
      if (xml.nodeType == 1) { // element
        // do attributes
        if (xml.attributes.length > 0) {
        obj["@attributes"] = {};
          for (var j = 0; j < xml.attributes.length; j++) {
            var attribute = xml.attributes.item(j);
            obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
          }
        }
      } else if (xml.nodeType == 3) { // text
        obj = xml.nodeValue;
      }
    
      // do children
      if (xml.hasChildNodes()) {
        for(var i = 0; i < xml.childNodes.length; i++) {
          var item = xml.childNodes.item(i);
          var nodeName = item.nodeName;
          if (typeof(obj[nodeName]) == "undefined") {
            obj[nodeName] = self.xmlToJson(item);
          } else {
            if (typeof(obj[nodeName].push) == "undefined") {
              var old = obj[nodeName];
              obj[nodeName] = [];
              obj[nodeName].push(old);
            }
            obj[nodeName].push(self.xmlToJson(item));
          }
        }
      }
      return obj;
    };

    self.flickrPhotoSearch = function( text ){

      $.ajax({
        url: 'https://api.flickr.com/services/rest/?method=flickr.photos.search'+
          '&api_key=3affae96f735ec3e200682d77d67eadb&text='+text(),
        type: 'GET', // The HTTP Method, can be GET POST PUT DELETE etc
        data: {
        }, // Additional parameters here
        success: function(data) { 
          var photos = self.xmlToJson(data).rsp.photos.photo;

          //create photo objects, (photos.length) for full list
          for (var i = 0; i < 10; i++) {
            self.photoList.push( new Photo( photos[i]['@attributes'] ) );
          };

          //self.currentPhoto(self.photoList()[0]);
          //console.log(self.currentPhoto());
          //document.getElementById('flickr-photo').src = self.photoList()[self.photoIndex].url();

        },
        error: function(err) { 
            alert(err); 
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
                var position = new google.maps.LatLng( location.latitude, location.longitude );
                var title = video.snippet.title;

                //Set as new position for weather/place queries                

                self.destination(new Content(position, title));
                self.centerMap(self.currentContent().position);
                self.zoom();

                self.getForecast();
                self.show('prep-icons');
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

    self.videosByLocation = function() {
      var url = 'https://www.googleapis.com/youtube/v3/search';
      var position = ( self.destination().position );

      $.getJSON( url, {
          format: "json",
          type: 'video',
          q: 'camping',
          lactionRadius: '10mi',
          location: toString(position.lat)+','+toString(position.lng)
        })
        .done(function( data ) {
            console.log(data);

        })
        .error( function() {
            alert('AJAX videoSearch request failed');
            console.log(data);
        });
    };

    //Query forecast by location
    self.getForecast = function( destination ) {

        //Reset forecast
        //self.hide('forecast');
        self.forecast.removeAll();

        //Use currentPosition for query
        var position = destination.position;

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

        var d = new Date();
        var weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
        function myFunction(response) {
          var arr = JSON.parse(response);
            for (var i = 0; i < arr.list.length; i++) {

              var index = d.getDay() + i;
              if (index >= 7){
                index -= 7;
              }
              //seperate current weather
              if (i == 0) {
                self.currentWeather( new Day(arr.list[i], weekday[index] ));
              }
              else{
                self.forecast.push( new Day(arr.list[i], weekday[index] ));
              }
            };
        }

        //Show forecast section
        self.show('forecast');
    };

    //Use 'nearbySearch' to query est. near currentContent by iconButton type
    self.search = function(iconButton) {

        //if photo btn, query Flickr
        if (iconButton.type == 'photos'){
            //show flickr photos
            self.show('myCarousel');
        }
        //toggle park pois
        else if (iconButton.type == 'pois'){
            self.poiList().forEach(function(poi){
            poi.toggle();
          });
        }
        //else search Google places
        else{
            //Clear previous results
            self.clearSearchResults();

            var request = {
              keyword: iconButton.type,
              location: self.destination().position,
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
                self.resultArray().push( new Result(result) );
                //Fit map to results
                bounds.extend(result.geometry.location);   
              }
              //Include currentPosition in map resize
              map.fitBounds(bounds.extend( self.destination().position ));
              //self.destination(  );
            }
        }

        //FOR NOW - clear trails and show results in relation to park
        self.clearTrails();
        self.hide('trail-info');
        self.hide('elevation');
        self.hide('myCarousel');
        self.clearList(self.poiList());
        self.clearList(self.photoSphereList());   
    };

    self.getDistance = function( result ) {
        var origin1 = result.position;
        var destinationA = self.destination().position;

        var service = new google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
          {
            origins: [origin1],
            destinations: [destinationA],
            travelMode: 'DRIVING',
            //transitOptions: TransitOptions,
            //drivingOptions: DrivingOptions,
            unitSystem: google.maps.UnitSystem.IMPERIAL, //google.maps.UnitSystem.METRIC
            avoidHighways: false,
            avoidTolls: false,
          }, callback);

        function callback(response, status) {
          // See Parsing the Results for
          // the basics of a callback function.

          var distance = response.rows[0].elements[0].distance.text;
          var duration = response.rows[0].elements[0].duration.text;
          
          //Place distance and duration into result object observable
          result.distanceFromDestination(distance);
          result.durationFromDestination(duration);
        }
    };

    //Clear and remove previous search results
    self.clearSearchResults = function() {
      for (var i = 0; i < self.resultArray().length; i++) {
          self.resultArray()[i].clear();
      }
      //empty list to save memory
      self.resultArray.removeAll();
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

    //Trails by park.place_id
    self.queryTrails = function( park ) {
        //Query and show trails within selected park
        url = "/parkAPI/" + park.place_id;//.id;
        //console.log(url);
        $.getJSON( url, {
          format: "json"
        })
        .done(function( data ) {

            data.Trails.forEach( function(trail) {
              self.trailList.push( new Trail(trail, park.place_id) );
            });

            //Show park and trail markers
            var bounds = [];
            bounds.push.apply(bounds,self.trailList());
            bounds.push( park );
            //adjust map bounds
            self.bounds(bounds);

            self.filteredList( self.trailList() );

            //Use park location until specific trail is selected
            self.destination( park );

            //query for nearby flickr photos
            self.flickrPhotoSearch( park.name );
        })
        .error( function() {
            alert('Trails AJAX request failed');
        });
    };

    //Query parks according to filter criteria
    self.queryParks = function(park_type, state) {
        //Query parks in DB
        $.getJSON( "/parksJSON", {
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
        });
    };

    self.chartElevation = function( trail ){
        var elevation = trail.elevation;

        google.charts.load('current', {packages: ['corechart', 'line']});
        google.charts.setOnLoadCallback(drawBasic);

        function drawBasic() {
          var data = new google.visualization.DataTable();
          data.addColumn('number', 'Distance (mi)');
          data.addColumn('number', 'Elevation (m)');

          var interval = trail.total_distance() / 512;
          console.log('interval = ' + interval);

          elevation.forEach(function(e,i){
            data.addRows([[i*interval, e*3.28084]]);
          });


          var options = {
            hAxis: {
              title: 'Distance (mi)'
            },
            vAxis: {
              title: 'Elevation (ft)'
            }
          };

          var chart = new google.visualization.LineChart(document.getElementById('elevation'));
          chart.draw(data, options);
        }
    };


// VIEW //////////////////////////////////////////////

    //Clear all trails on map
    self.clearTrails = function() {
        // Remove trail markers and paths from map
        for (var i = 0; i < self.trailList().length; i++) {
            self.trailList()[i].clear();
        }

        self.trailList( [] );
    };

    //Clear all Parks on map
    self.clearParks = function() {
      // Remove trail markers and paths from map
      for (var i = 0; i < self.parkList().length; i++) {
          self.parkList()[i].clear();
      }

      self.parkList( [] );

      // Remove POIs from map
      self.clearList(self.poiList);
      self.poiList( [] );
    };

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
    self.selectResult = function(search_result) {
        self.currentPlace(search_result);
        self.openMenu();
        search_result.bounce();
    };

    //Query DB for trails with place id
    self.selectPark = function(park) {

      //clear all previous info
      self.clearList(self.resultArray());
      self.resultArray.removeAll();
      
      //remove photo spheres from map
      for (var i = 0; i < self.photoSphereList().length; i++) {
        self.photoSphereList()[i].clear();
      };
      self.photoSphereList.removeAll();
      //clear previous forecast
      self.forecast.removeAll();
      //clear previous trails
      self.clearTrails();
      //clear previous pois
      self.clearList( self.poiList() );

      //query trails for park
      self.queryTrails( park );
      //query weather
      self.getForecast( park );
      
      //Create/show saved POIs 
      for (var i = 0; i < park.pois.length; i++) {
        var poi = park.pois[i];
        self.poiList().push( new POI(park, poi.id, poi.position, poi.type, poi.icon, poi.sphere_embed, poi.description ));
      };

      //set park as selected destination
      self.destination( self );
      park.bounce();

      //adjust UI
      self.hide('elevation');
      self.hide('trail-info');
      self.hide('photo_sphere_canvas');
      self.show('prep-icons');
      self.show('list');
      self.closeMenu();
    };

    //Highlight trail to distinguish from the rest
    self.selectTrail = function(trail){
        //reset previous selected trail
        if (self.currentTrail() != null){
            self.currentTrail().reset();
        }
        
        //bound map to beginning/end/and middle of trail

        //Set as new position for weather/place queries
        self.destination( trail );

        //Set selected trail as currentTrail for binding
        self.currentTrail(trail);
        self.currentTrail().highlight();
        self.currentTrail().bounce();

        //Close photo sphere canvas
        self.hide('photo_sphere_canvas');

        //remove photo spheres from map
        for (var i = 0; i < self.photoSphereList().length; i++) {
          self.photoSphereList()[i].clear();
        };
        self.photoSphereList.removeAll();

        //Create photo sphere markers
        for (var i = 0; i < trail.photo_spheres.length; i++) {
          self.photoSphereList().push( new Photo_Sphere(trail.photo_spheres[i]) );
        };

        self.chartElevation( trail );

        console.log(trail);
        
        //Show trail data
        self.show('elevation');
        self.show('trail-info');
        

        //fit map to trail bounds, self.bounds designed for 
        //  taking parks and trails
        //map.fitBounds(trail.bounds);
    };

    //Reveal Photo Sphere
    self.selectPhotoSphere = function(photo_sphere) {
      if (photo_sphere != ''){
        self.show('photo_sphere_canvas');
        document.getElementById('photo_sphere').src = photo_sphere.embed_code;  
      }      
    };

    //clear all markers/icons in list from map
    self.clearList = function(list) {
      for (var i = 0; i < list.length; i++) {
          list[i].clear();
        };

      list = [];    
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
            bounds.extend(list[i].position);
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
        //Clear all content on map
        self.clearMap();
        self.clearTrails();
        self.clearParks();

        self.poiList().forEach(function(poi){
          poi.clear;
        });
        self.clearList(self.poiList());

        //clear destination variable
        self.destination().clear();
        self.destination(null);

        //Reset to intial map view
        self.closeMenu();
        //map.setCenter({lat: 38.9776681,lng: -96.847185});
        //map.setZoom(4);

        //Texas
        map.setCenter({lat: 31.4082791, lng: -99.3872106});
        map.setZoom(6);

        //hide geo-specific location
        self.hide('prep-icons');
        self.hide('forecast');
        self.hide('trail-info');
        self.hide('elevation');
        self.hide('myCarousel');

        //empty previous results
        self.forecast.removeAll();
        self.clearSearchResults();

        VM.queryParks('State', 'TX');
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
var Trail = function(data) {
    var self = this;

    self.id = data.id;
    self.name = ko.observable(data.name);
    self.type = ko.observable('Trail'); //Treck, Ski Route, Off Road
    self.place_id = data.place_id;
    self.position = new google.maps.LatLng(data.lat, data.lon);

    //set bounds to include all of trail
    var end = data.coords[data.coords.length-1];
    end = new google.maps.LatLng(end.lat, end.lon);
    var bounds = [self.position, end];

    self.cumulative_distance = ko.observableArray(data.cumulative_distance);
    self.total_distance = ko.observable(data.total_distance);
    
    self.elevation = data.elevation;
    self.total_elevation_change = ko.observable(data.total_elevation_change);
    self.start_elevation = ko.observable(Math.round(data.elevation[0]));
    self.end_elevation = ko.observable(Math.round(data.elevation[data.elevation.length-1]));
    self.flights = ko.observable(Math.round(data.total_elevation_change/10));
    
    //Calculations
    var avgGrade = data.total_elevation_change/(data.total_distance*5280/2);
    self.avgGrade = ko.observable((avgGrade*100).toFixed(1));
    var work = (280.5 * Math.pow(avgGrade,5) - 58.7 * Math.pow(avgGrade,4) - 76.8 * Math.pow(avgGrade,3) + 51.9 * Math.pow(avgGrade,2) + 19.6 * avgGrade + 2.5)/2.5;
    self.workRatio = ko.observable(work.toFixed(2));
    self.flat_equivalent = ko.observable((work*self.total_distance()).toFixed(2));

    self.seasons = ko.observableArray(data.seasons);

    self.activities = ko.observableArray(data.activities);
    self.photo_spheres = data.photo_spheres;
    
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

    self.path = path;

    //Define Trail path
    var trail = new google.maps.Polyline({
        path: path,
        map: map,
        geodesic: true,
        strokeColor: 'orange',
        strokeOpacity: 1.0,
        strokeWeight: 3
    });

    //Select trail
    google.maps.event.addListener(marker, 'click', function() { 
        VM.selectTrail(self);
        //Hide list of other trails
        VM.hide('list');
    });

    //Select trail
    google.maps.event.addListener(trail, 'click', function() { 
        VM.selectTrail(self);
        //Hide list of other trails
        VM.hide('list');
    });

    //Set highlight options
    this.highlight = function(){
        //marker.setOptions({})

        trail.setOptions({strokeColor: 'gray'});
        trail.setOptions({strokeWeight: 5});
    };

    //Reset trail to original options
    this.reset = function(){
        trail.setOptions({strokeColor: 'orange'});
        trail.setOptions({strokeWeight: 3});
    };

    //Remove trail path and marker
    this.clear = function() {
        marker.setMap(null);
        trail.setMap(null);
    };

    //Set trail path
    this.set = function() {
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

var Photo_Sphere = function(data) {
  var self = this;

  self.embed_code = data.embed_code;
  self.position = data.position;

  var marker = new google.maps.Marker({
        position: self.position,
        map: map,
        title: 'photo_sphere',
        icon: {
          url: 'http://maps.gstatic.com/mapfiles/circle.png',
          anchor: new google.maps.Point(12, 12),
          scaledSize: new google.maps.Size(10, 17)
        }
        //animation: google.maps.Animation.DROP
    });

    //Trigger 'Photo Sphere' pop up
    google.maps.event.addListener(marker, 'click', function() { 
        //alert(self.embed_code);
        VM.selectPhotoSphere(self);
    });

    this.clear = function() {
        marker.setMap(null);
    };

    this.set = function() {
        marker.setMap(map);
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
    self.type = 'State Park';
    self.pois = data.pois;
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
      VM.selectPark( self );
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

// POI Object ///////////////////////////////////////////
var POI = function(park, id, position, type, icon, sphere_embed, description) {
  var self = this;

  self.id = id;
  self.park_id = park.id;
  self.type = type;
  self.position = position;
  self.icon = icon;
  self.sphere_embed = sphere_embed;
  self.description = description;
  self.markerState = true;

  var marker = new google.maps.Marker({
    map: map,
    title: self.description,
    position: position,
    icon: {
      url: icon
    }
  });

  //Select POI to display photoSphere if present
  google.maps.event.addListener(marker, 'click', function() { 
    if (self.sphere_embed != '' && self.sphere_embed != null){
      VM.selectPhotoSphere(self.sphere_embed);
      VM.show('photo_sphere_canvas');
    }
  });

  self.clear = function() {
    marker.setMap(null);
  };

  self.toggle = function() {
    //console.log(marker.setMap);
    if (self.markerState) {
      marker.setMap(null);
      self.markerState = false;
    }
    else {
      marker.setMap('map');
      self.markerState = true;
    }
  };

  self.serialize = function() {
    return {
      'park_id': self.park_id,
      'type': self.type, 
      'position': self.position,
      'icon': self.icon,
      'sphere_embed': self.sphere_embed,
      'description': self.description
    }
  }
}

// Content Object /////////////////////////////////////////////
var Content = function(position, title){
    var self = this;

    self.name = ko.observable( title );
    self.position = position;

    var marker = new google.maps.Marker({
        position: position,
        map: map,
        title: title,
        icon: { url: '/static/imgs/google_icons/ic_room_black_36dp/web/ic_room_black_36dp_1x.png' },
        animation: google.maps.Animation.DROP
    });

    //Trigger 'Switch Park' KO event
    google.maps.event.addListener(marker, 'click', function() { 
        VM.centerMap( position );
        VM.closeMenu();
    });

    self.clear = function() {
      marker.setMap(null);
    };

    self.set = function() {
        marker.setMap(map);
    };
}

// Search Result Object ///////////////////////////////////////
var Result = function(search_result) {
  var self = this;

  self.name = ko.observable(search_result.name);
  self.position = search_result.geometry.location;
  self.id = ko.observable(search_result.place_id);
  self.rating = ko.observable(search_result.rating);
  self.address = ko.observable(search_result.formatted_address);
  self.phone = ko.observable(search_result.formatted_phone_number);
  self.distanceFromDestination = ko.observable();
  self.durationFromDestination = ko.observable();

  var marker = new google.maps.Marker({
      map: map,
      title: search_result.name,
      position: search_result.geometry.location,
      icon: {
        url: 'http://maps.gstatic.com/mapfiles/circle.png',
        anchor: new google.maps.Point(12, 12),
        scaledSize: new google.maps.Size(10, 17)
      }
  });

  var infowindow = new google.maps.InfoWindow({
    content: search_result.name
  });

  //Trigger 'Select Place' KO event
  google.maps.event.addListener(marker, 'click', function() { 
      VM.selectResult(self);
      VM.getDistance( self );
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

// Day Object /////////////////////////////////////////////////
var Day = function(day, weekday) {
  var self = this;

  self.weekday = ko.observable(weekday);
  self.img   =  ko.observable("http://openweathermap.org/img/w/" + day.weather[0].icon + ".png");
  self.avg   =  ko.observable(Math.round(day.temp.day) + '°F');
  self.range =  ko.observable(Math.round(day.temp.min) + ' - ' + Math.round(day.temp.max) + '°F');
  self.desc  =  ko.observable(day.weather[0].description);
}

// Photo Object /////////////////////////////////////////////////
var Photo = function(photo){
  self = this;

  self.src = 'https://farm'+photo.farm+'.staticflickr.com/'+photo.server+'/'+photo.id+'_'+photo.secret+'.jpg';
  self.alt = photo.title;
  self.content = photo.title;
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
}

//Enable Bootstrap Tool Tips


//Event listener for finding park from map page
//document.getElementById('submit_park_id').onclick = function() {
//    VM.selectPark(document.getElementById('park_id').value);
//    //Clear all previous search results
//    VM.clearSearchResults();
//
//    VM.show('prep-icons');
//}

function mapError() {
    alert('Google Maps failed to load');
}