import logging

from flask import Flask, render_template, url_for, request, \
    redirect, flash, jsonify
from DBclasses import Park, Trail


# import the db library from GAE
from google.appengine.ext import db

app = Flask(__name__)


@app.route('/', methods=['Get'])
def home():
    return render_template('home.html')

@app.route('/parks', methods=['Get'])
def parks():
    parks = db.GqlQuery("select * from Park")
    return render_template('parks.html', parks=parks)

@app.route('/parks/<int:park_key>/', methods=['Get'])
def park(park_key):
    park = Park.get_by_id(park_key)
    trails = Trail.gql("where park_key = :park_key", park_key)
    return render_template('park.html', park=park)

@app.route('/addPark', methods=['Get', 'Post'])
def addPark():
    if request.method == 'POST':
        #Enforce Access
        #uid_cookie = request.cookies.get('uid')
        #if uid_cookie != '' and uid_cookie != None \
        #        and cookies.check_secure_val(uid_cookie):
        #    user_id = uid_cookie.split('|')[0]
        newPark = Park(
            name=request.form['name'])
        newPark.put()
        
        #notify user
        #flash('New park created')
        return redirect(url_for('parks'))
        
    #Get
    else:
        return render_template('addPark.html')

@app.route('/parks/<int:park_key>/edit', methods=['Get', 'Post'])
def editPark():
    #Post
    if request.method == 'POST':
        return 'Edit Park (Post)'
    #Get
    else:
        return 'Edit Park (Get)'

@app.route('/parks/<int:park_key>/delete', methods=['Get', 'Post'])
def deletePark():
    #Post
    if request.method == 'POST':
        return 'Delete Park (Post)'
    #Get
    else:
        return 'Delete Park (Get)'

@app.route('/parks/<int:park_key>/<int:trail_key>', methods=['Get', 'Post'])
def trail():
    #Post
    if request.method == 'POST':
        return 'Trail (Post)'
    #Get
    else:
        return 'Trail (Get)'

@app.route('/parks/<int:park_key>/addTrail', methods=['Get', 'Post'])
def addTrail():
    #Post
    if request.method == 'POST':
        return 'Add Trail (Post)'
    #Get
    else:
        return 'Add Trail (Get)'


@app.errorhandler(500)
def server_error(e):
    # Log the error and stacktrace.
    logging.exception('An error occurred during a request.')
    return 'An internal error occurred.', 500 