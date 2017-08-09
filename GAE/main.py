import logging, json, urllib

# Flask
from flask import Flask, render_template, url_for, request, \
    redirect, flash, jsonify, make_response

# 3rd Party Modules
from modules.gpxjson import gpxToJson
from modules.getElevate import getElevate
from modules.haversine import haversine
from modules.youtubeLocationSearch import youtube_search

# import the db library from GAE
from google.appengine.ext import db
from DBclasses import Place, Trail, User, Sphere, POI

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
    return render_template('login.html')

#API -------------------------------------------------
@app.route('/parksJSON')
#@cross_origin()
def parksJSON():
    parks = db.GqlQuery("select * from Place")
    return jsonify(Parks=[p.serialize for p in parks])

#Park API 
@app.route('/parkAPI/<place_id>')
def parkAPI(place_id):
    place = Place.gql('WHERE place_id = :place_id', place_id=place_id).get() #Park.get_by_id(park_id)
    trails = Trail.gql(
            "where place_id = :place_id",
            place_id=place_id).fetch(limit=None)
    logging.info(place)
    logging.info(trails)
    logging.info('HI')
    return jsonify(Place=place.serialize, Trails=[t.serialize for t in trails])

#Trail API
@app.route('/trailAPI/<int:trail_id>')
def trailAPI(trail_id):
    trail = Trail.get_by_id(trail_id)
    return jsonify(Trail=trail.serialize)

@app.route('/sphereAPI/<int:sphere_id>')
def sphereAPI(sphere_id):
    sphere = Sphere.get_by_id(sphere_id)
    return jsonify(sphere=sphere.serialize)

#Add Video
@app.route('/addVideo/<int:park_id>/<int:trail_id>', methods = ['Post'])
def addVideo(park_id, trail_id):
    url = request.form['url']
    if trail_id == None:
        park = Park.get_by_id(park_id)
        park.videos.append(db.Link(url))
        park.put()
        return redirect( url_for('park', park_id = park.key().id() ))
    else:
        trail = Trail.get_by_id(trail_id)
        trail.videos.append(db.Link(url))
        trail.put()
        return redirect( url_for( 'trail', park_id=trail.park_id, trail_id=trail.key().id() ))


#Home -------------------------------------------------
@app.route('/', methods=['Get'])
def home():
    return render_template('home.html')

#List Parks
@app.route('/parks', methods=['Get'])
def parks():
    parks = db.GqlQuery("select * from Park")
    return render_template('parks.html', parks=parks)

@app.route('/map', methods=['Get', 'Post'])
def map():
    if request.method == 'POST':
        #parse url to get video id
        url = str(request.form['url'])
        video_id = url.split('watch?v=')[1]
        video_id = video_id.split('&')[0]
        return render_template('map.html', page='map', video_id=video_id)
    else:
        return render_template('map.html', page='map', url=None)


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
@app.route('/parks/<int:park_id>/edit', methods=['Get', 'Post'])
def editPark(park_id):
    #Post
    if request.method == 'POST':
        park = Park.get_by_id(park_id)
        park.name = request.form['name']
        park.lat = float(request.form['lat'])
        park.lon = float(request.form['lon'])
        park.type = request.form['type']
        park.state = request.form['state']
        park.put()
        return redirect( url_for('park', park_id=park.key().id() ))
    #Get
    else:
        park = Park.get_by_id(park_id)
        return render_template('editPark.html', park=park)

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


#Trail Page -------------------------------------------------
@app.route('/parks/<int:park_id>/<int:trail_id>', methods=['Get'])
def trail(park_id, trail_id):
    park = Park.get_by_id(park_id)
    trail = Trail.get_by_id(trail_id)

    #q = search terms, ex. 'sailing|boating -fishing', | = or, - = not, | must be escaped as %7C
    options = locationSearchOptions('', 5, trail.position, '1mi')

    videos = youtube_search(options)
    #print videos, len(videos)

    trail_json = json.dumps(trail.serialize)
    return render_template('trail.html', park=park, trail=trail, trail_json=trail_json, videos=videos)

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
                elif 'State Park' in place['name']:
                    place_type = 'State Park'
                elif 'National Forrest' in place['name']:
                    place_type = 'National Forrest'
                elif 'Reserve' or 'Reservation' in place['name']:
                    place_type = 'Reservation'
                else:
                    place_type = place['types'][0]

            location = place['geometry']['location']
            location = db.GeoPt(float(location['lat']), float(location['lng']))

            newPlace = Place(
                name = place['name'],
                place_id = place['place_id'],
                location = location,
                place_type = place_type,
                place_tags = place['types'],
                state = state,
                abr_state = abr_state,
                country = country,
                abr_country = abr_country
                )
            print newPlace
            newPlace.put()


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

        #Save Trail
        newTrail = Trail(
            name=request.form['name'], 
            place_id=place_id,
            position=coords[0],
            coords= coords,
            elevation=elevation,
            cumulative_distance = cumulative_distance,
            total_distance = round(total_distance, 2),
            total_elevation_change = total_elevation_change,
            start_elevation = elevation[0],
            end_elevation = elevation[len(elevation)-1],
            activities = activities
        )
        newTrail.put()

        #Save Photo Sphere
        urls = request.form.getlist('sphere_url')
        embeds = request.form.getlist('embed_code')

        for x in xrange(len(urls)):
            string = urls[x].split('@')[1]
            string = string.split(',')
            lat = string[0]
            lng = string[1]
            position = db.GeoPt(float(lat), float(lng))
            sphere = Sphere(
                trail = newTrail,
                embed_code = embeds[x].split('"')[1],
                position = position
            )
            print sphere
            sphere.put()

        return redirect( url_for('map') )
    #Get
    else:
        return render_template('addTrail.html')

#Edit Trail
@app.route('/editTrail/<int:trail_id>', methods=['Get', 'Post'])
def editTrail(trail_id):
    #Post
    if request.method == 'POST':
        trail = Trail.get_by_id(trail_id)
        trail.name = request.form['name']
        trail.lat = float(request.form['lat'])
        trail.lon = float(request.form['lon'])
        trail.put()
        return redirect( url_for('map' ))
    #Get
    else:
        #park = Park.get_by_id(park_id)
        trail = Trail.get_by_id(trail_id)
        return render_template('editTrail.html', trail=trail)

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