import json

#import the db library from GAE
from google.appengine.ext import db

#Create Park DB
class Park(db.Model):
    name = db.StringProperty(required = True)
    lat = db.FloatProperty()
    lon = db.FloatProperty()

    @property 
    def serialize(self):
        #returns data in serializable format
        position = {"lat": self.lat, "lon": self.lon}
        return {
            'id' : self.key().id(),
            'name' : self.name,
            'position' : position
        }

class Trail(db.Model):
    name = db.StringProperty(required = True)
    park_id = db.IntegerProperty(required = True)
    lat = db.FloatProperty()
    lon = db.FloatProperty()

    @property 
    def serialize(self):
        #returns data in serializable format
        position = {"lat": self.lat, "lon": self.lon}
        return {
            'id' : self.key().id(),
            'park_id' : self.park_id,
            'name' : self.name,
            'position' : position
        }