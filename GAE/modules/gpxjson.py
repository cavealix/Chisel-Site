import sys
import json
from xml.dom import minidom

#Import to create GeoPt type
from google.appengine.ext import db

def gpxToJson(gpxFile):
  dom = minidom.parse(gpxFile)
  elevation = []
  coords = []
  type = 'coords'

  tracks = dom.getElementsByTagName("trk")
  for track in tracks:
    elevation.append(readTrack(track, 'elevation'))

  for track in tracks:
    coords.append(readTrack(track, 'coords'))

  return {'elevation': elevation[0], 'coords': coords[0]}

def readTrack(track, type): 
  trackData = {}
  #if ( getTextValue(track, "name") ):
    #trackData = {"name": getTextValue(track, "name")}
  trackData = []

  trackSegments = track.getElementsByTagName("trkseg")
  for trackSegment in trackSegments:
    trackData.extend(readTrackSegment(trackSegment, type));

  return trackData
    

def readTrackSegment(segment, type):
  if not segment.hasChildNodes(): return []
  points = []

  for point in segment.childNodes:
    if not hasattr(point, "tagName") or point.tagName != "trkpt":
      continue
    if type == 'elevation':
      points.append(getElev(point))
    elif type == 'coords':
      points.append(readTrackPoint(point))

  return points
  

def getElev(point):
  return float(getTextValue(point, "ele"))

def readTrackPoint(point):
  return db.GeoPt(
      float(point.getAttribute("lat")),
      float(point.getAttribute("lon"))
    )


## Utility
def getTextValue(node, tagName):
  if node.getElementsByTagName(tagName):
    return node.getElementsByTagName(tagName)[0].firstChild.nodeValue
  else:
    return 0

