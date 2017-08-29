
function init() {

  VM = new ViewModel();
  ko.applyBindings(VM);
    
}

var ViewModel = function() {
  var self = this;

  self.photoList = ko.observableArray([]);

  //Query parks according to filter criteria
  self.queryParks = function() {
      //Query parks in DB
      $.getJSON( "/parksJSON", {
        format: "json"
      })
      .done(function( data ) {

        data.Parks.forEach( function(park){
          self.photoList.push( new Photo(park) );
        });
        
      })
      .error( function() {
          alert('parks AJAX request failed');
      });
  };

    self.queryParks();

}


// Photo Object /////////////////////////////////////////////////
var Photo = function(park){
  self = this;

  self.src = park.photo;
  self.alt = photo.name;
  self.content = photo.name;
}