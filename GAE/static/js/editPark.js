var map;

// Main ////////////////////////////////////////////////////
var main = function(park_json) {


  map = new google.maps.Map(document.getElementById('map'), {
    center: new google.maps.LatLng(park_json.lat, park_json.lon),
    zoom: 15,
    scrollwheel: false
  });

  // Instantiate Knockout VM
  VM = new ViewModel(park_json);
  ko.applyBindings(VM);


}

var ViewModel = function(park_json) {
  var self = this;

  self.poiList = ko.observableArray([]);
  self.trailList = ko.observableArray([]);

  var park = new Park(park_json);
  
  //create new POI
  map.addListener('click', function(e) {
    var poi_type = document.getElementById('poi_type');
    var type = poi_type.options[poi_type.selectedIndex].value;
    var icon;
    switch(type) {
      case "info":
        icon = "/static/imgs/google_icons/ic_info_black_36dp/web/ic_info_black_36dp_1x.png";
        break;
      case "restroom":
        icon = "/static/imgs/google_icons/ic_wc_black_36dp/web/ic_wc_black_36dp_1x.png";
        break;
      case "outhouse":
        icon = "/static/imgs/google_icons/ic_wc_black_36dp/web/ic_wc_black_36dp_1x.png";
        break;
      case "showers":
        icon = "/static/imgs/google_icons/ic_pets_black_36dp/web/ic_pets_black_36dp_1x.png";
        break;
      case "campsite":
        icon = "/static/imgs/google_icons/ic_change_history_black_36dp/web/ic_change_history_black_36dp_1x.png";
        break;
      case "group_campsite":
        icon = "/static/imgs/google_icons/ic_change_history_black_36dp/web/ic_change_history_black_36dp_1x.png";
        break;
      case "overlook":
        icon = "/static/imgs/google_icons/ic_terrain_black_36dp/web/ic_terrain_black_36dp_1x.png";
        break;
      case "historical_marker":
        icon = "/static/imgs/google_icons/ic_info_black_36dp/web/ic_info_black_36dp_1x.png";
        break;
      case "water":
        icon = "/static/imgs/google_icons/ic_local_drink_black_36dp/web/ic_local_drink_black_36dp_1x.png";
        break;
      case "picnic_area":
        icon = "/static/imgs/google_icons/ic_beach_access_black_36dp/web/ic_beach_access_black_36dp_1x.png";
        break;
      case "playground":
        icon = "/static/imgs/google_icons/ic_child_care_black_36dp/web/ic_child_care_black_36dp_1x.png";
        break;
      case "dog_station":
        icon = "/static/imgs/google_icons/ic_pets_black_36dp/web/ic_pets_black_36dp_1x.png";
    }

    var poi = new POI(park, '', e.latLng, type, icon, '', '' );
    self.poiList.push( poi );

    //save 
    $.ajax({
      url: '/pois/add',
      type: 'POST',
      contentType: 'application/json;charset=UTF-8',
      data: JSON.stringify({'data': poi}),
      success: function(response) {
          console.log(response);
          //Set db id 
          console.log(response.id);
          poi.id = JSON.parse(response).id;
          console.log(poi);
      },
      error: function(error) {
          console.log(error);
      }
    });
  });

  //Trails by park.place_id
  self.queryTrails = function( park ) {
        //Query and show trails within selected park
        url = "/parkAPI/" + park.place_id;//.id;
        //console.log(url);
        $.getJSON( url, {
          format: "json"
        })
        .done(function( data ) {

            //console.log(data);

            //park = new Park( data.Place );
            //self.switchPlace( place );

            data.Trails.forEach( function(trail) {
              self.trailList.push( new Trail(trail, park.place_id) );
            });

            //Before trailList is reset, fit map to Park and Trails
            var bounds = self.trailList();
            bounds.push( park );
            //bounds.push( self.poiList() );
            self.bounds(bounds);

            //self.filteredList( self.trailList() );

            //Use park location until specific trail is selected
            //self.destination( park );
            //self.getForecast();

            //query for nearby flickr photos
            //self.flickrPhotoSearch( park.name );
        })
        .error( function() {
            alert('Trails AJAX request failed');
        });
  };

  //Delete POI
  self.deletePOI = function(poi) {
    //delete from db
    $.ajax({
      url: '/pois/delete',
      type: 'POST',
      contentType: 'application/json;charset=UTF-8',
      data: JSON.stringify({'data': poi.id}),
      success: function(response) {
          console.log(response);
      },
      error: function(error) {
          console.log(error);
      }
    });

    //remove from view
    poi.clear();
    self.poiList.remove(poi);
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


  //Create/show saved POIs 
  for (var i = 0; i < park.pois.length; i++) {
    var poi = park.pois[i];
    self.poiList().push( new POI(park, poi.id, poi.position, poi.type, poi.icon, poi.sphere_embed, poi.description ));
  };

  //query for existing trails
  self.queryTrails( park );

}


// Park Object ///////////////////////////////////////////
var Park = function(park_json) {
  var self = this;

  self.id = park_json.id;
  self.name = ko.observable(park_json.name);
  self.place_id = park_json.place_id;
  self.position = new google.maps.LatLng(park_json.lat, park_json.lon);
  self.pois = park_json.pois;

  var marker = new google.maps.Marker({
      map: map,
      title: self.name,
      position: self.position
  });

  var infowindow = new google.maps.InfoWindow({
    content: self.name
  });

  self.clear = function() {
    marker.setMap(null);
  };
}

// Trail //////////////////////////////////////////////////////
var Trail = function(data) {
    var self = this;

    self.id = data.id;
    self.name = ko.observable(data.name);
    self.type = ko.observable('Trail'); //Treck, Ski Route, Off Road
    self.place_id = data.place_id;
    //self.address = "http://localhost:8080/parks/" + park_id + "/" + data.id;
    self.position = new google.maps.LatLng(data.lat, data.lon);

    var seasons = '';
    //put season list into 1 line
    data.seasons.forEach(function(season){
      seasons = seasons + ', ' + season;
    });

    self.seasons= ko.observable( seasons );

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

  var marker = new google.maps.Marker({
    map: map,
    title: self.type,
    position: position,
    icon: {
      url: icon
    }
  });

  //Select POI to delete
  google.maps.event.addListener(marker, 'click', function() { 
      VM.deletePOI(self);
  });

  self.clear = function() {
    marker.setMap(null);
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