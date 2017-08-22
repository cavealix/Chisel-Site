var map;

// Main ////////////////////////////////////////////////////
var main = function(trail_json) {


  map = new google.maps.Map(document.getElementById('map'), {
    center: new google.maps.LatLng(trail_json.lat, trail_json.lon),
    zoom: 15,
    scrollwheel: false
  });

  // Instantiate Knockout VM
  VM = new ViewModel(trail_json);
  ko.applyBindings(VM);


}

var ViewModel = function(trail_json) {
  var self = this;

  self.poiList = ko.observableArray([]);

  var trail = new Trail(trail_json);

  //Google elevation API
  self.queryElevation = function( trail ){
      var elevator = new google.maps.ElevationService;

      elevator.getElevationAlongPath({
        'path': trail.path,
        'samples': 512
      }, function(results, status) {
        if (status === 'OK') {
          // Retrieve the first result
          if (results) {
            // Open the infowindow indicating the elevation at the clicked position.
            
            //console.log(results);
            trail.elevation = results;
            console.log(trail.elevation);


            var elevation = new Array();
            results.forEach(function(e){
              elevation.push(e.elevation);
            });
            document.getElementById('elev').value = JSON.stringify(elevation);

            //console.log(elevation);

            google.charts.load('current', {packages: ['corechart', 'line']});
            google.charts.setOnLoadCallback(drawBasic);

            function drawBasic() {
              var data = new google.visualization.DataTable();
              data.addColumn('number', 'X');
              data.addColumn('number', 'Elevation (m)');

              var interval = trail.total_distance() / 512;
              //console.log('interval = ' + interval);

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


          } else {
            alert('No results found');
          }
        } else {
          alert('Elevation service failed due to: ' + status);
        }
      });
  };

  self.save = function( trail ){
    //save 
    $.ajax({
      url: '/trailAPI/' + trail.id,
      type: 'POST',
      contentType: 'application/json;charset=UTF-8',
      data: JSON.stringify({'data': trail}),
      success: function(response) {
          console.log(response);
          //Set db id 
      },
      error: function(error) {
          console.log(error);
      }
    });
  };

  if (trail.elevation = []){
    self.queryElevation(trail);
    console.log(trail.elevation);
  }
  
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
    self.elevation = data.elevation;

    //set bounds to include all of trail
    var end = data.coords[data.coords.length-1];
    end = new google.maps.LatLng(end.lat, end.lon);
    var bounds = [self.position, end];

    self.cumulative_distance = ko.observableArray(data.cumulative_distance);
    self.total_distance = ko.observable(data.total_distance);
    self.total_elevation_change = ko.observable(data.total_elevation_change);
    self.start_elevation = ko.observable(data.elevation[0]);
    self.end_elevation = ko.observable(data.elevation[data.elevation.length-1]);
    self.activities = ko.observable(data.activities);
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