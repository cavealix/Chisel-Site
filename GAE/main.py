import logging, json, urllib

# Flask
from flask import Flask, render_template, url_for, request, \
    redirect, flash, jsonify, make_response

#from flask_oauth import OAuth

# 3rd Party Modules
from modules.gpxjson import gpxToJson
from modules.getElevate import getElevate
from modules.haversine import haversine
from modules.youtubeLocationSearch import youtube_search
from modules.allEqual import allEqual

# import the db library from GAE
from google.appengine.ext import db
from DBclasses import Place, Trail, User, Sphere, POI, Trip, Photo, Video, Loadout

import googlemaps
from googlemaps import elevation, places
gmaps = googlemaps.Client(key='AIzaSyC9OHhxzexIo2nYScmEqSM4Rsqp9mRSflI')

from classes.youtube import locationSearchOptions

# Oauth/Security
#from security.oauth2client.client import flow_from_clientsecrets
#from security.oauth2client.client import FlowExchangeError
#import httplib2, requests, random, string
#from security import cookies
#from security import fboauth
#from security import goauth

app = Flask(__name__)

#Login -------------------------------------------------
@app.route('/login')
def login():
    return render_template('firebaselogin.html')

#API -------------------------------------------------
@app.route('/parksJSON')
#@cross_origin()
def parksJSON():
    parks = db.GqlQuery("select * from Place")
    return jsonify(Parks=[p.serialize for p in parks])

#Park API 
@app.route('/parkAPI/<place_id>')
def parkAPI(place_id):
    trails = Trail.gql(
            "where place_id = :place_id",
            place_id=place_id).fetch(limit=None)
    logging.info(trails)
    logging.info('HI')
    return jsonify( Trails=[t.serialize for t in trails] )

@app.route('/trailAPI/<int:trail_id>', methods=['Get', 'Post'])
def trailAPI(trail_id):
    if request.method == 'Post':
        trail = Trail.get_by_id(trail_id)
    
        #edit data
        data = request.json['data']
    
        total_elevation_change = 0
        for i in range(0,len(data['elevation'])-1):
            leg = abs(data['elevation'][i]-abs(data['elevation'][i+1]))
            total_elevation_change = total_elevation_change + leg
    
        trail.elevation = data['elevation']
        trail.total_elevation_change = total_elevation_change
    
        #save changes
        trail.put()

    return redirect( url_for('map'))

@app.route('/tripAPI/<int:trail_id>', methods=['Get'])
def tripAPI(trail_id):
    trail = Trail.get_by_id(trail_id)
    
    trips = trail.trips

    return jsonify( Trips=[t.serialize for t in trips])

#Sphere API
@app.route('/sphereAPI/<int:sphere_id>')
def sphereAPI(sphere_id):
    sphere = Sphere.get_by_id(sphere_id)
    return jsonify(sphere=sphere.serialize)


#Home -------------------------------------------------
@app.route('/', methods=['Get'])
def home():
    #parks = db.GqlQuery("select * from Place")
    #return render_template('home.html', parks=parks)

    return redirect( url_for('map'))

#List Parks
@app.route('/parks', methods=['Get'])
def parks():
    parks = db.GqlQuery("select * from Park")
    return render_template('parks.html', parks=parks)

@app.route('/map', methods=['Get'])
def map():
    return render_template('map.html', page='map')


#Park Page-------------------------------------------------
@app.route('/parks/<int:park_id>/', methods=['Get'])
def park(park_id):
    park = Place.get_by_id(park_id)
    trails = Trail.gql("where park_id = :park_id", park_id=park_id).fetch(limit=None)
    return render_template('park.html', park=park, trails=trails)

#Add Park
@app.route('/addPark', methods=['Get', 'Post'])
def addPark():
    if request.method == 'POST':
        #Enforce Access
        #uid_cookie = request.cookies.get('uid')
        #if uid_cookie != '' and uid_cookie != None \
        #        and cookies.check_secure_val(uid_cookie):
        #    user_id = uid_cookie.split('|')[0]
        newPark = Park(
            name=request.form['name'], 
            lat=float(request.form['lat']),
            lon=float(request.form['lon']),
            type=request.form['type'],
            state=request.form['state']
        )
        newPark.put()
        
        #notify user
        #flash('New park created')
        return redirect(url_for('parks'))
    #Get
    else:
        return render_template('addPark.html')

#Edit Park
@app.route('/editPark/<int:park_id>', methods=['Get', 'Post'])
def editPark(park_id):
    #Post
    if request.method == 'POST':
        park = Place.get_by_id(park_id)
        park.name = request.form['name']
        park.type = request.form['type']
        park.state = request.form['state']
        park.photo = request.form['photo']
        park.put()
        return redirect( url_for('park', park_id=park.key().id() ))
    #Get
    else:
        park = Place.get_by_id(park_id)
        park_json = json.dumps(park.serialize)
        return render_template('editPark.html', park=park, park_json=park_json)

#Delete Park
@app.route('/parks/<int:park_id>/delete', methods=['Get', 'Post'])
def deletePark(park_id):
    #Post
    if request.method == 'POST':
        park = Park.get_by_id(park_id)
        park.delete()
        return redirect( url_for('parks') )
    #Get
    else:
        park = Park.get_by_id(park_id)
        return render_template('deletePark.html', park=park)


#POIs-------------------------------------------------
@app.route('/pois/add', methods=['Post'])
def addPoi():

    #print(request.json['data'])

    data = request.json['data']

    park = Place.get_by_id(data['park_id'])

    position = data['position']
    position = db.GeoPt( position['lat'], position['lng'] )

    
    #for poi in data:
    poi = POI(
        park = park,
        type = data['type'],
        position = position,
        icon_url = data['icon'],
        sphere_embed = data['sphere_embed'],
        description = data['description']
    )
    poi.put()

    return json.dumps({ 'status':'OK', 'id': poi.key().id() });

@app.route('/pois/delete', methods=['Post'])
def deletePoi():

    print(request.json['data'])

    poi_id = request.json['data']

    poi = POI.get_by_id(poi_id)

    db.delete(poi)

    return json.dumps({ 'status':'OK' });
    

#Trip Page -------------------------------------------------
@app.route('/addTrip/<int:trail_id>', methods=['Get', 'Post'])
def addTrip(trail_id):
    if request.method == 'POST':

        trail = Trail.get_by_id(trail_id)

        #add Spheres
        urls = request.form.getlist('sphere_url')
        embeds = request.form.getlist('embed_code')

        #Store spheres if present
        if urls != [] and urls != ['']:
            for x in xrange(len(urls)):
                string = urls[x].split('@')[1]
                string = string.split(',')
                lat = string[0]
                lng = string[1]
                position = db.GeoPt(float(lat), float(lng))
                sphere = Sphere(
                    trail = trail,
                    embed_code = embeds[x].split('"')[1],
                    position = position
                )
                sphere.put()

        #Save Trip
        trip = Trip(
            trail = trail,
            highlights = request.form['highlights'],
            warnings = request.form['warnings']
        )
        trip.put()

        #Save Photo
        photo = Photo(
            trip = trip,
            url = request.form['photo']
        )
        photo.put()

        #Save Video
        video = Video(
            trip = trip,
            video = request.form['video']
        )
        video.put()

        return redirect ( url_for('map'))

    else:
        trail = Trail.get_by_id(trail_id);
        return render_template('addTrip.html', trail=trail)


#Trail Page -------------------------------------------------
@app.route('/verifyTrail/<int:trail_id>', methods=['Get', 'Post'])
def verifyTrail(trail_id):
    if request.method == 'Post':
        return redirect ( url_for('map'))
    else:
        trail = Trail.get_by_id(trail_id);

        return render_template('verifyTrail.html', trail=trail)

#Add Trail
@app.route('/addTrail', methods=['Get', 'Post'])
def addTrail():
    #Post
    if request.method == 'POST':

        #Place Info
        place = json.loads(request.form['place'])
        place_id = place['place_id']

        #Check if place in DB
        place_search = Place.gql('WHERE place_id = :place_id', place_id=place_id).get()
        #Add place to DB if not found
        if (place_search == None):

            for x in place['address_components']:
                if 'administrative_area_level_1' in x['types']:
                    state = x['long_name']
                    abr_state = x['short_name']
                    print state

                if 'country' in x['types']:
                    country = x['long_name']
                    abr_country = x['short_name']
                    print country

                if 'National Park' in place['name']:
                    place_type = 'National Park'
                elif 'State Park' or 'State Natural Area' in place['name']:
                    place_type = 'State Park'
                elif 'National Forrest' in place['name']:
                    place_type = 'National Forrest'
                elif 'Reserve' or 'Reservation' in place['name']:
                    place_type = 'Reservation'
                else:
                    place_type = place['types'][0]

            location = place['geometry']['location']
            location = db.GeoPt(float(location['lat']), float(location['lng']))

            photos = [] 

            options = locationSearchOptions('', 25, location, '1mi')
            videos = youtube_search(options)
            video_ids = []
            for video in videos:
                video_ids.append(video['id']['videoId'])
            print(video_ids)


            newPlace = Place(
                name = place['name'],
                place_id = place['place_id'],
                location = location,
                address = place['formatted_address'],
                phone = place['formatted_phone_number'],
                mapUrl = place['url'],
                place_type = place_type,
                place_tags = place['types'],
                state = state,
                abr_state = abr_state,
                country = country,
                abr_country = abr_country,
                trailMiles = 0,
                weekday_text = place['opening_hours']['weekday_text'],
                video_ids = video_ids
                )
            print newPlace
            newPlace.put()
            place = newPlace
        else:
            place = place_search


        #Trail info
        gpx = gpxToJson(request.files['gpx'])
        coords =  gpx['coords']
        elevation = gpx['elevation']
        activities = request.form.getlist('activity')
        cumulative_distance = [0.0]
        total_distance = 0
        for i in range(1,len(coords)-1):
            leg = haversine(coords[i].lon, coords[i].lat, coords[i+1].lon, coords[i+1].lat)
            cumulative_distance.append(total_distance + leg)
            total_distance = total_distance + leg
        #Ensure cumulative distance list same length as coords
        cumulative_distance.append(total_distance)
        total_elevation_change = 0
        for i in range(0,len(elevation)-1):
            leg = abs(elevation[i]-abs(elevation[i+1]))
            total_elevation_change = total_elevation_change + leg

        #if all elevation = 0, set = [] and query via js if found []
        if allEqual(elevation):
            elevation = []

        #Save Trail
        newTrail = Trail(
            park = place,
            name= request.files['gpx'].filename.replace('.GPX',''), 
            place_id=place_id,
            position=coords[0],
            coords= coords,
            elevation=elevation,
            cumulative_distance = cumulative_distance,
            total_distance = round(total_distance, 2),
            total_elevation_change = total_elevation_change,
            activities = activities
        )
        newTrail.put()

        #Add to cumulative trail miles in park
        place.trailMiles = place.trailMiles + int(round(newTrail.total_distance))
        place.activities = place.activities + activities
        place.put()

        

        return redirect( url_for('editTrail', trail_id=newTrail.key().id()) )
    #Get
    else:
        return render_template('addTrail.html')

#Edit Trail
@app.route('/editTrail/<int:trail_id>', methods=['Get', 'Post'])
def editTrail(trail_id):
    #Post
    if request.method == 'POST':

        #edit data
        elev = json.loads(request.form['elev'])

        #old trail info
        trail = Trail.get_by_id(trail_id)

        trail.seasons = request.form.getlist('season')
        trail.name = request.form['name']

        #if elevation being added, analize
        if trail.elevation == []:
            total_elevation_change = 0
            for i in range(0,len(elev)-1):
                leg = abs(elev[i]-abs(elev[i+1]))
                total_elevation_change = total_elevation_change + leg
            trail.elevation = elev
            trail.total_elevation_change = round(total_elevation_change)

        trail.put()

        #Save Photo Sphere
        urls = request.form.getlist('sphere_url')
        embeds = request.form.getlist('embed_code')

        #Store spheres if present
        if urls != [] and urls != ['']:
            for x in xrange(len(urls)):
                string = urls[x].split('@')[1]
                string = string.split(',')
                lat = string[0]
                lng = string[1]
                position = db.GeoPt(float(lat), float(lng))
                sphere = Sphere(
                    trail = trail,
                    embed_code = embeds[x].split('"')[1],
                    position = position
                )
                print sphere
                sphere.put()

        return redirect( url_for('map' ))
    #Get
    else:
        #park = Park.get_by_id(park_id)
        trail = Trail.get_by_id(trail_id)
        trail_json = json.dumps(trail.serialize)
        return render_template('editTrail.html', trail=trail, trail_json=trail_json)

#Delete Trail
@app.route('/parks/<int:park_id>/<int:trail_id>/delete', methods=['Get', 'Post'])
def deleteTrail(park_id, trail_id):
    #Post
    if request.method == 'POST':
        trail = Trail.get_by_id(trail_id)
        trail.delete()
        return redirect( url_for('park', park_id=park_id) )
    #Get
    else:
        park = Park.get_by_id(park_id)
        trail = Trail.get_by_id(trail_id)
        return render_template('deleteTrail.html', park=park, trail=trail)


@app.errorhandler(500)
def server_error(e):
    # Log the error and stacktrace.
    logging.exception('An error occurred during a request.')
    return 'An internal error occurred.', 500 