#import the db library from GAE
from google.appengine.ext import db

#Create Park DB
class Park(db.Model):
    name = db.StringProperty(required = True)

class Trail(db.Model):
    name = db.StringProperty(required = True)
    park_key = db.IntegerProperty(required = True)