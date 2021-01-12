""" smoke.py: smoke tests for JS9, calling much of the public API """
import time
import sys
import json
import pyjs9
from astropy.io import fits
from smokesubs import *

# add new tests here

def regSelectTest(j, file):
    """
    region selection (including boolean parser)
    """
    timeout = 1
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"log", "colormap": "cool"}')
    displayMessage(j, "add regions: circles and boxes")
    j.AddRegions('physical;box(4103.0,3873.0,60.0,60.0,0) {"strokeWidth":2} # source,include,foo2; box(3990.0,3872.0,60.0,60.0,0) {"strokeWidth":2} # source,include,foo1; circle(3990.0,3988.0,30.0) {"strokeWidth":2} # source,include,foo2; circle(3882.0,3988.0,30.0) {"strokeWidth":2} # source,include,foo1')
    sleep(timeout)
    j.ChangeRegions("circle", {"color": "orange"})
    sleep(timeout)
    j.ChangeRegions("box", {"color": "magenta"})
    sleep(timeout)
    j.ChangeRegions("circle && foo1", {"color": "red"})
    sleep(timeout)
    j.ChangeRegions("box && !foo2", {"color": "red"})
    sleep(timeout)
    j.ChangeRegions("circle || box", {"color": "yellow"})
    sleep(timeout)
    j.ChangeRegions("(circle && foo2) || (box && foo1)", {"color": "red"})
    sleep(timeout)
    j.ChangeRegions("(circle && !foo2) || (box && !foo1)", {"color": "#00FF00"})
    sleep(timeout)
    j.ChangeRegions("/foo*/", {"color": "yellow"})
    sleep(timeout)
    j.ChangeRegions("circle && foo1", {"color": "magenta"})
    sleep(timeout)
    j.ChangeRegions("circle && foo2", {"prevselect": "add", "color": "magenta"})
    sleep(timeout)
    j.ChangeRegions("box && foo1", {"prevselect": "add", "color": "magenta"})
    sleep(timeout)
    j.ChangeRegions("box && foo2", {"prevselect": "add", "color": "magenta"})
    sleep(timeout)
    j.ChangeRegions("!foo1 && !circle", {"color": "yellow"})
    sleep(timeout)
    j.ChangeRegions("$prevselect || !foo2 && !circle", {"color": "yellow"})
    sleep(timeout)
    j.ChangeRegions("$prevselect || !foo1 && !box", {"color": "yellow"})
    sleep(timeout)
    j.ChangeRegions("$prevselect || !foo2 && !box", {"color": "yellow"})

# end of new tests

def smokeTests():
    """
    all the tests
    """
    j = init()
    # call new tests here
    regSelectTest(j, "../js9/data/fits/casa.fits.gz")
    # end of new tests
    sleep(2)
    j.close()
    sleep(2)
    sys.exit()

if __name__ == '__main__':
    smokeTests()
