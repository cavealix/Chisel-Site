var map, google, VM;
var parksData = [
    {
        name: 'Zion',
        lon: -113.1833195,
        lat: 37.3222826,
        activities: ['hike', 'camp']
    },
    {
        name: 'Big Bend',
        lon: -103.5675743,
        lat: 29.3345519,
        activities: ['camp', 'pets']
    },{
        name: 'Rocky Mountain',
        lon: -102.480236,
        lat: 39.7219579,
        activities: ['hike', 'pets']
    },{
        name: 'Great Smoky Mountains',
        lon: -83.6713626,
        lat: 35.5812846,
        activities: ['hike']
    },{
        name: 'Cuyahoga Valley',
        lon: -81.5795699,
        lat: 41.2329664,
        activities: ['pets']
    }
];


function initMap() {

    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 38.9776681,lng: -96.847185},
      zoom: 5
    });

    VM = new ViewModel();
    ko.applyBindings(VM);
}

var Park = function(data) {
    var self = this;

    this.name = ko.observable(data.name);
    this.lon = ko.observable(data.lon);
    this.lat = ko.observable(data.lat);
    this.activities = ko.observableArray(data.activities);

    //Current Weather
    this.current_img = ko.observable();
    this.current_avg = ko.observable();
    this.current_conditions = ko.observable();
    this.current_wind = ko.observable();

    var marker = new google.maps.Marker({
        position: {lat: data.lat, lng: data.lon},
        map: map,
        title: data.name,
        animation: google.maps.Animation.DROP
    });

    //this.marker = ko.observable(marker);

    google.maps.event.addListener(marker, 'click', function() { 
        //alert(self.name());
        VM.switchPark(self);
    });

    //Query Current Weather
    var weather_query = "http://api.openweathermap.org/data/2.5/weather?lat="+data.lat+"&lon="+data.lon+"&APPID=1088269cadd02d84dba9b274fc7bc097&units=imperial";
    $.getJSON( weather_query, {
      format: "json"
    })
    .done(function( data ) {
      self.current_img =  "http://openweathermap.org/img/w/" + data.weather[0].icon + ".png";
      self.current_avg = Math.round(data.main.temp)+'°'; 
      self.current_conditions = data.weather[0].description;
      self.current_wind = "Wind " + data.wind.speed + "mph";
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

    this.zoom = function() {
        map.setZoom(8);
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

var ViewModel = function() {
    var self = this;

    self.parkList = ko.observableArray([]);
    self.filteredParks = ko.observableArray([]);
    self.activities = ['pets', 'hike', 'camp'];

    parksData.forEach( function(park){
        self.parkList.push( new Park(park) );
    });

    self.filteredParks( self.parkList() );
    this.currentPark = ko.observable( this.parkList()[0] );

    this.switchPark = function(park) {
        self.currentPark(park);
        self.openMenu();
        park.zoom();
        park.center();
        park.bounce();
    };

    this.filter = function(activity) {
        self.clearMap();
        //clear previous filter results
        self.filteredParks([]);
        //setTimeout(self.setMarkers, 1000);
        for (var i = 0; i < self.parkList().length; i++) {
            if ( self.parkList()[i].activities.indexOf(activity) != -1 ){
                self.filteredParks.push( self.parkList()[i] );
            }
        }
        
        self.setMarkers( self.filteredParks() );
    };

    this.clearMap = function() {
        // Removes the markers from the map
        for (var i = 0; i < self.parkList().length; i++) {
            self.parkList()[i].clear();
        }
    };

    this.resetMap = function() {
        self.filteredParks( self.parkList() );
        self.setMarkers(self.filteredParks());
        self.closeMenu();
        map.setCenter({lat: 38.9776681,lng: -96.847185});
        map.setZoom(5);
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
