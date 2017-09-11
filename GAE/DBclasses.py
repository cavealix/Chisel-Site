import json

#import the db library from GAE
from google.appengine.ext import db

#CREATE User DB
class User(db.Model):
    first_name = db.StringProperty()
    last_name = db.StringProperty()
    pw = db.StringProperty()


#Create Park DB
class Place(db.Model):
    name = db.StringProperty(required = True)
    place_id = db.StringProperty()
    location = db.GeoPtProperty()
    address = db.StringProperty()
    phone = db.StringProperty()
    mapUrl = db.StringProperty()
    place_type = db.StringProperty()
    place_tags = db.StringListProperty()
    fid = db.StringProperty()
    state = db.StringProperty()
    abr_state = db.StringProperty()
    country = db.StringProperty()
    abr_country = db.StringProperty()
    photo = db.StringProperty()
    trailMiles = db.IntegerProperty()
    activities = db.StringListProperty()

    @property 
    def serialize(self):
        #returns data in serializable format

        pois = []
        for poi in self.pois:
            pois.append(poi.serialize)

        trails = []

        for trail in self.trails:
            trails.append(trail.serialize)

        activities = {i:self.activities.count(i) for i in self.activities}


        return {
            'id' : self.key().id(),
            'name' : self.name,
            'place_id' : self.place_id,
            'address' : self.address,
            'phone' : self.phone,
            'place_type' : self.place_type,
            'mapUrl' : self.mapUrl,
            'lat' : self.location.lat,
            'lon' : self.location.lon,
            'state': self.state,
            'abr_state': self.abr_state,
            'country': self.country,
            'photo': self.photo,
            'pois': pois,
            'trailMiles': self.trailMiles,
            'numberTrails': len(trails),
            'activities': activities

        }

class POI(db.Model):
    park = db.ReferenceProperty(Place, collection_name='pois')
    type = db.StringProperty()
    position = db.GeoPtProperty()
    icon_url = db.StringProperty()
    sphere_embed = db.StringProperty()
    description = db.StringProperty()

    @property 
    def serialize(self):
        return { 
            'id': self.key().id(),
            'type': self.type,
            'position': {'lat': self.position.lat, 'lng': self.position.lon},
            'icon': self.icon_url,
            'sphere_embed': self.sphere_embed,
            'description': self.description            
        }


class Trail(db.Model):
    park = db.ReferenceProperty(Place, collection_name='trails')
    name = db.StringProperty(required = True)
    place_id = db.StringProperty()
    park_key = db.Key()
    position = db.GeoPtProperty()
    coords = db.ListProperty(db.GeoPt)
    elevation = db.ListProperty(float)
    cumulative_distance = db.ListProperty(float)
    total_distance = db.FloatProperty()
    total_elevation_change = db.FloatProperty()
    activities = db.StringListProperty()
    seasons = db.StringListProperty()

    #Booleans
    camping = db.BooleanProperty()
    pointToPoint = db.BooleanProperty()

    @property 
    def serialize(self):
        #returns data in serializable format
        path = []
        for coord in self.coords:
            pt = {'lat': coord.lat, 'lon': coord.lon}
            path.append(pt)

        spheres = []
        for photo in self.photo_spheres:
            spheres.append(photo.serialize)

        return {
            'id' : self.key().id(),
            'name' : self.name,
            'type' : 'Trail',
            'place_id' : self.place_id,
            
            'lat' : self.position.lat,
            'lon' : self.position.lon,
            'coords' : path,
            'cumulative_distance' : self.cumulative_distance,
            'total_distance' : self.total_distance,
            'elevation' : self.elevation,
            'total_elevation_change' : self.total_elevation_change,
            'activities' : self.activities,
            'seasons' : self.seasons,
            'photo_spheres' : spheres
        }


class Trip(db.Model):
    trail = db.ReferenceProperty(Trail, collection_name='trips')
    highlights = db.TextProperty()
    warnings = db.TextProperty()

class Loadout(db.Model):

    trip = db.ReferenceProperty(Trip, collection_name='loadouts')
    #apparel
    headwear = db.StringListProperty()
    tops = db.StringListProperty()
    bottoms = db.StringListProperty()
    footwear = db.StringListProperty()

    #provisions
    water = db.StringProperty()
    food = db.StringListProperty()

    #gear
    gear = db.StringListProperty()

    #pack
    weight = db.IntegerProperty()
    pack = db.IntegerProperty()

    #content
    photos = db.StringListProperty()
    videos = db.StringListProperty()


class Sphere(db.Model):
    trail = db.ReferenceProperty(Trail, collection_name='photo_spheres')
    trip = db.ReferenceProperty(Trip, collection_name='photo_spheres')
    embed_code = db.StringProperty()
    position = db.GeoPtProperty()

    @property
    def serialize(self):
        return {
            'embed_code' : self.embed_code,
            'position' : {'lat': self.position.lat, 'lng': self.position.lon}
        }

class Photo(db.Model):
    trip = db.ReferenceProperty(Trip, collection_name='photos')
    url = db.StringProperty()

class Video(db.Model):
    trip = db.ReferenceProperty(Trip, collection_name='videos')
    url = db.StringProperty()

    