import json

#import the db library from GAE
from google.appengine.ext import db

#Create Park DB
class Park(db.Model):
    name = db.StringProperty(required = True)
    position = db.GeoPtProperty

    @property 
    def serialize(self):
        #returns data in serializable format
        return {
            'id' : self.key().id(),
            'name' : self.name,
            'position' : str(self.position)
        }

class Trail(db.Model):
    name = db.StringProperty(required = True)
    park_id = db.IntegerProperty(required = True)