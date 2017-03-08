var map, google, VM, parksData;


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
    self.position = ko.observable(data.position);
    self.lat = ko.observable(data.lat);
    self.activities = ko.observableArray(data.activities);

    var markerUrl;
    switch (data.type ) {
        case 'state':
            markerUrl = 'http://maps.google.com/intl/en_us/mapfiles/ms/micons/blue-dot.png';
            break;
        case 'natl':
            markerUrl = 'http://maps.google.com/intl/en_us/mapfiles/ms/micons/red-dot.png';
            break;
        case 'blm':
            markerUrl = 'http://maps.google.com/intl/en_us/mapfiles/ms/micons/green-dot.png';
            break;
        case 'city':
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
        VM.clearTrails();
        VM.switchPlace(self);
        VM.listTrails(self);
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
};

// View Model ////////////////////////////////////////////////////

var ViewModel = function() {
    var self = this;

    self.parkList = ko.observableArray([]);
    self.trailList = ko.observableArray([]);
    self.filteredList = ko.observableArray( self.parkList() );
    self.currentPlace = ko.observable();
    self.park_types = ['Natl Park', 'State Park', 'BLM', 'Natl Forrest'];

    //Query parks in DB
    $.getJSON( "http://localhost:8080/parksJSON", {
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

    //User clicks on park marker
    this.switchPlace = function(place) {
        self.currentPlace(place);
        self.openMenu();
        self.zoom();
        //self.bounds();
        place.center();
        place.bounce();
    };

    this.zoom = function() {
        map.setZoom(12);
    };

    self.bounds = function() {
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < self.trailList().length; i++) {
            bounds.extend(self.trailList()[i].bound);
        }
        map.fitBounds(bounds);
    };

    this.listTrails = function(park) {
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

          self.filteredList( self.trailList() );
        })
        .error( function() {
            alert('Trails AJAX request failed');
        });
    };

    //User selects filter, display relevant parks
    this.filter = function(activity) {
        self.clearMap();
        //clear previous filter results
        self.filteredList([]);
        //setTimeout(self.setMarkers, 1000);
        for (var i = 0; i < self.parkList().length; i++) {
            if ( self.parkList()[i].activities.indexOf(activity) != -1 ){
                self.filteredList.push( self.parkList()[i] );
            }
        }
        
        self.setMarkers( self.filteredList() );
    };

    this.setPath = function(trail) {
        // Set trail path
        trail.set();
    };

    this.clearTrails = function() {
        // Remove trail markers and paths from map
        for (var i = 0; i < self.trailList().length; i++) {
            self.trailList()[i].clear();
        }

        self.trailList( [] );
    };

    this.clearMap = function() {
        // Removes the markers from the map
        for (var i = 0; i < self.parkList().length; i++) {
            self.parkList()[i].clear();
        }
    };

    this.resetMap = function() {
        self.clearMap();
        self.clearTrails();
        self.filteredList( self.parkList() );
        self.setMarkers(self.filteredList());
        self.closeMenu();
        map.setCenter({lat: 38.9776681,lng: -96.847185});
        map.setZoom(4);
    };

    this.setMarkers = function(list) {
        // Sets the markers on the map
        for (var i = 0; i < list.length; i++) {
            list[i].set();
        }
    };

    this.openMenu = function() {
        $('.menu').animate({
          left: "0px"
        }, 200);
    };

    this.closeMenu = function() {
        $('.menu').animate({
          left: "-285px"
        }, 200);
    };

};

function mapError() {
    alert('Google Maps failed to load');
}
