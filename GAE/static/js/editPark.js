

// Main ////////////////////////////////////////////////////
var main = function(park_json) {

  // Instantiate Knockout VM
  VM = new ViewModel(park_json);
  ko.applyBindings(VM);
}

var ViewModel = function(park_json) {
  var self = this;

  self.pois = ko.observableArray([]);

  map = new google.maps.Map(document.getElementById('map'), {
    center: new google.maps.LatLng(park_json.lat, park_json.lon),
    zoom: 15,
    scrollwheel: false
  });

  map.addListener('click', function(e) {
    var poi_type = document.getElementById('poi_type');
    var type = poi_type.options[poi_type.selectedIndex].value;

    console.log(type);

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

    console.log(icon);

    self.pois.push( new POI(e.latLng, type, icon ))
  });

  //self.newPoi = function(latLng, map) {
  //  var marker = new google.maps.Marker({
  //    position: latLng,
  //    map: map
  //  });
  //}

  var park = new Park(park_json);

}


// Park Object ///////////////////////////////////////////
var Park = function(park_json) {
  var self = this;

  self.name = ko.observable(park_json.name);
  self.place_id = park_json.place_id;
  self.position = new google.maps.LatLng(park_json.lat, park_json.lon);

  var marker = new google.maps.Marker({
      map: map,
      title: self.name,
      position: self.position
  });

  var infowindow = new google.maps.InfoWindow({
    content: self.name
  });

  //Trigger 'Select Place' KO event
  google.maps.event.addListener(marker, 'click', function() { 
      
  });

  self.clear = function() {
    marker.setMap(null);
  };

}

// POI Object ///////////////////////////////////////////
var POI = function(position, type, icon) {
  var self = this;

  self.type = type;
  self.position = position;
  //self.icon = poi.icon_url;
  //self.description = poi.description;



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
}