/*VARIABLES*/
var placeType = ''; /*search keywords for radar search*/
var names = ''; //place names for radar search
var mapContainer = ''; /*where to place map in html*/


var main = function() {
    
};


// SET TRAIL MAP
function initMap(trail) {  

  var trailhead = new google.maps.LatLng(trail.lat,trail.lon);
  var map = new google.maps.Map(document.getElementById('trail_map_canvas'), {
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

  //Handle click event for results
  google.maps.event.addListener(marker, 'click', function() {
    document.getElementById('photo_sphere_canvas').style.zIndex = "1";
    document.getElementById('photo_sphere').src = marker.url;
  });

  map.data.setStyle({
    icon: {
            url: 'http://maps.gstatic.com/mapfiles/circle.png',
            anchor: new google.maps.Point(10, 10),
            scaledSize: new google.maps.Size(10, 17)
          }
  });
};

function mapError() {
    alert('Google Maps failed to load');
};

//$(document).ready(main);