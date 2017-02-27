import logging

# Flask
from flask import Flask, render_template, url_for, request, \
    redirect, flash, jsonify

# 3rd Party Modules
from modules.gpxjson import gpxToJson

# import the db library from GAE
from google.appengine.ext import db
from DBclasses import Park, Trail

app = Flask(__name__)

#API -------------------------------------------------
@app.route('/parksJSON')
#@cross_origin()
def parksJSON():
    parks = db.GqlQuery("select * from Park")
    return jsonify(Parks=[p.serialize for p in parks])

#Park API 
@app.route('/parkAPI/<int:park_id>')
def parkAPI(park_id):
    park = Park.get_by_id(park_id)
    trails = Trail.gql(
            "where park_id = :park_id",
            park_id=park_id).fetch(limit=None)
    return jsonify(Park=park.serialize, Trails=[t.serialize for t in trails])

#Trail API
@app.route('/trailAPI/<int:trail_id>')
def trailAPI(trail_id):
    trail = Trail.get_by_id(trail_id)
    return jsonify(Trail=trail.serialize)


#Home -------------------------------------------------
@app.route('/', methods=['Get'])
def home():
    return render_template('home.html')

#List Parks
@app.route('/parks', methods=['Get'])
def parks():
    parks = db.GqlQuery("select * from Park")
    return render_template('parks.html', parks=parks)


#Park Page-------------------------------------------------
@app.route('/parks/<int:park_id>/', methods=['Get'])
def park(park_id):
    park = Park.get_by_id(park_id)
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
            lon=float(request.form['lon'])
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
        park = Park.get_by_id(trail_id)
        park.name = request.form['name']
        park.lat = float(request.form['lat'])
        park.lon = float(request.form['lon'])
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
    return render_template('trail.html', park=park, trail=trail)

#Add Trail
@app.route('/parks/<int:park_id>/addTrail', methods=['Get', 'Post'])
def addTrail(park_id):
    #Post
    if request.method == 'POST':
        lat=float(request.form['lat'])
        lon=float(request.form['lon'])
        newTrail = Trail(name=request.form['name'], 
            park_id=park_id,
            position=db.GeoPt(lat,lon),
            coords= gpxToJson( request.files['gpx'])
        )
        newTrail.put()
        return redirect( url_for('park', park_id=park_id) )
    #Get
    else:
        park = Park.get_by_id(park_id)
        return render_template('addTrail.html', park=park)

#Edit Trail
@app.route('/parks/<int:park_id>/<int:trail_id>/edit', methods=['Get', 'Post'])
def editTrail(park_id, trail_id):
    #Post
    if request.method == 'POST':
        trail = Trail.get_by_id(trail_id)
        trail.name = request.form['name']
        trail.lat = float(request.form['lat'])
        trail.lon = float(request.form['lon'])
        trail.put()
        return redirect( url_for('trail', park_id=trail.park_id, trail_id=trail.key().id() ))
    #Get
    else:
        park = Park.get_by_id(park_id)
        trail = Trail.get_by_id(trail_id)
        return render_template('editTrail.html', park=park, trail=trail)

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