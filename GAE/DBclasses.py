import json

#import the db library from GAE
from google.appengine.ext import db

#CREATE User DB
class User(db.Model):
    first_name = db.StringProperty()
    last_name = db.StringProperty()
    pw = db.StringProperty()


#Create Park DB
class Park(db.Model):
    name = db.StringProperty(required = True)
    lat = db.FloatProperty()
    lon = db.FloatProperty()
    type = db.StringProperty()
    state = db.StringProperty()
    pois = db.StringListProperty()

    @property 
    def serialize(self):
        #returns data in serializable format
        return {
            'id' : self.key().id(),
            'name' : self.name,
            'lat' : self.lat,
            'lon' : self.lon,
            'type': self.type,
            'state': self.state
        }


class Trail(db.Model):
    name = db.StringProperty(required = True)
    park_id = db.IntegerProperty(required = True)
    park_key = db.Key()
    position = db.GeoPtProperty()
    coords = db.ListProperty(db.GeoPt)
    elevation = db.ListProperty(float)
    cumulative_distance = db.ListProperty(float)
    total_distance = db.FloatProperty()
    total_elevation_change = db.FloatProperty()
    start_elevation = db.FloatProperty()
    end_elevation = db.FloatProperty()

    @property 
    def serialize(self):
        #returns data in serializable format
        path = []
        for coord in self.coords:
            pt = {'lat': coord.lat, 'lon': coord.lon}
            path.append(pt)

        return {
            'id' : self.key().id(),
            'park_id' : self.park_id,
            'name' : self.name,
            'lat' : self.position.lat,
            'lon' : self.position.lon,
            'coords' : path,
            'cumulative_distance' : self.cumulative_distance,
            'total_distance' : self.total_distance,
            'elevation' : self.elevation,
            'total_elevation_change' : self.total_elevation_change,
            'start_elevation' : self.start_elevation,
            'end_elevation' : self.end_elevation
            
        }