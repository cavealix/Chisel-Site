import json

#import the db library from GAE
from google.appengine.ext import db

#Create Park DB
class Park(db.Model):
    name = db.StringProperty(required = True)
    lat = db.FloatProperty()
    lon = db.FloatProperty()
    type = db.StringProperty()
    state = db.StringProperty()

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
    position = db.GeoPtProperty()
    coords = db.ListProperty(db.GeoPt)

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
            'coords' : path
        }