import sys
import json
from xml.dom import minidom

#Import to create GeoPt type
from google.appengine.ext import db

def gpxToJson(gpxFile):
  return parseGpx(gpxFile)#json.dumps(parseGpx(gpxFile))

def parseGpx(gpxFile):
  dom = minidom.parse(gpxFile)
  outputTracks = []

  tracks = dom.getElementsByTagName("trk")
  for track in tracks:
    outputTracks.append(readTrack(track))

  return outputTracks[0]

def readTrack(track):
  trackData = []

  trackSegments = track.getElementsByTagName("trkseg")
  for trackSegment in trackSegments:
    trackData.extend(readTrackSegment(trackSegment));#append for multiple tracks/lists

  return trackData
    

def readTrackSegment(segment):
  if not segment.hasChildNodes(): return []
  points = []

  for point in segment.childNodes:
    if not hasattr(point, "tagName") or point.tagName != "trkpt":
      continue
    points.append(readTrackPoint(point))

  return points

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