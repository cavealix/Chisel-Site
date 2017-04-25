import sys
import json
from xml.dom import minidom


def getElevate(gpxFile):
  dom = minidom.parse(gpxFile)
  outputTracks = []

  tracks = dom.getElementsByTagName("trk")
  for track in tracks:
    outputTracks.append(readTrack(track))

  return outputTracks[0]

def readTrack(track): 
  trackData = {}
  trackData = []

  trackSegments = track.getElementsByTagName("trkseg")
  for trackSegment in trackSegments:
    trackData.extend(readTrackSegment(trackSegment));

  return trackData
    

def readTrackSegment(segment):
  if not segment.hasChildNodes(): return []
  elev = []

  for point in segment.childNodes:
    if not hasattr(point, "tagName") or point.tagName != "trkpt":
      continue
    elev.append(getElev(point))

  return elev
  

def getElev(point):
  return float(getTextValue(point, "ele"))


## Utility
def getTextValue(node, tagName):
  if node.getElementsByTagName(tagName):
    return node.getElementsByTagName(tagName)[0].firstChild.nodeValue
  else:
    return 0