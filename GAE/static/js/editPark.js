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

  var park = new Park(park_json);

  //Create/show saved POIs 
  for (var i = 0; i < park.pois.length; i++) {
    var poi = park.pois[i];
    self.poiList().push( new POI(park, poi.position, poi.type, poi.icon, poi.sphere_embed, poi.description ));
  };
  
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

    var poi = new POI(park, e.latLng, type, icon, '', '' );
    self.poiList.push( poi );

    //save 
    $.ajax({
      url: '/pois/add',
      type: 'POST',
      contentType: 'application/json;charset=UTF-8',
      data: JSON.stringify({'data': poi}),
      success: function(response) {
          console.log(response);
      },
      error: function(error) {
          console.log(error);
      }
    });
  });

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

// POI Object ///////////////////////////////////////////
var POI = function(park, position, type, icon, sphere_embed, description) {
  var self = this;

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