// This example adds a search box to a map, using the Google Place Autocomplete
// feature. People can enter geographical searches. The search box will return a
// pick list containing a mix of places and predicted search terms.

// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">
var instagram_access_token = '2319371178.64ffe15.33ea64b338fc491f845c21810178e9f1';


function initAutocomplete() {

  var map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 0, lng: 0},
    zoom: 1,
    mapTypeId: 'roadmap',
    scrollWheel: false
  });

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
