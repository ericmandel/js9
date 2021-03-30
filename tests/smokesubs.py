import os
import time
import sys
import json
import pyjs9
from astropy.io import fits

def sleep(timeout=1):
    """
    sleep, usually for 1 second, use env to set globally for debugging
    """
    if os.environ.get('JS9_TEST_TIMEOUT'):
        timeout = int(os.environ.get('JS9_TEST_TIMEOUT'));
    time.sleep(timeout)

def waitStatus(j, wtype='Load'):
    """
    wait for JS9 status to be complete
    """
    timeout = 1
    curIter = 0
    maxIter = 60
    done = False
    while not done:
        stat = j.GetStatus(wtype)
        if stat == "complete":
            done = True
        else:
            curIter = curIter + 1
            if curIter > maxIter:
                raise ValueError("timeout waiting")
            time.sleep(timeout)

def init():
    """
    connect to the js9 helper, reset some JS9 states
    """
    if len(sys.argv) > 1:
        xid = sys.argv[1]
    else:
        xid = "JS9"
    j = pyjs9.JS9(id=xid)
    displayMessage(j, 'Start pyjs9.JS9(id={})'.format(xid))
    j.BlendDisplay(False)
    j.SetRGBMode(False)
    closeDisplay(j)
    return j

def displayMessage(j, s):
    """
    display message in the terminal and on JS9 display
    """
    if j:
        j.DisplayMessage("info", s.replace(" ", "&nbsp;").replace("j.", "", 1))
    print("    " + s)

def closeDisplay(j):
    """
    close display (all images in a given display)
    """
    displayMessage(j, "j.CloseDisplay(%s)" % j.id)
    j.CloseDisplay(j.id)

def closeImage(j):
    """
    close currently displayed image
    """
    displayMessage(j, 'j.CloseImage()')
    j.CloseImage()

def loadImage(j, im, opts={}):
    """
    load an image and wait for completion
    """
    displayMessage(j, "j.Load(%s, ...)" % im)
    j.Load(im, opts)
    waitStatus(j)

