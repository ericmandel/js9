""" smoke.py: smoke tests for JS9, calling much of the public API """
import time
import sys
import json
import pyjs9
from astropy.io import fits
from smokesubs import *

# add new tests here

timeout = 2

regions = 'physical;ellipse(4103.0,3873.0,30.0,20.0,0) {"strokeWidth":2} # source,include,foo2; ellipse(3990.0,3872.0,30.0,20.0,0) {"strokeWidth":2} # source,include,foo1; circle(3990.0,3988.0,30.0) {"strokeWidth":2} # source,include,foo2; circle(3882.0,3988.0,30.0) {"strokeWidth":2} # source,include,foo1'

def xwait(j):
    sleep(timeout)
    if len(j.GetRegions()) == 0:
        j.AddRegions(regions)
        sleep(timeout)

def regSelectTest(j, file):
    """
    region selection (including boolean parser)
    """
    rtns = [j.ChangeRegions, j.SelectRegions]
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"log", "colormap": "cool"}')
    for rtn in rtns:
        j.AddRegions(regions)
        xwait(j)
        displayMessage(j, "circle: orange");
        rtn("circle", {"color": "orange"})
        xwait(j)
        displayMessage(j, "ellipse: magenta");
        rtn("ellipse", {"color": "magenta"})
        xwait(j)
        displayMessage(j, "circle && foo1: red");
        rtn("circle && foo1", {"color": "red"})
        xwait(j)
        displayMessage(j, "ellipse && !foo2: red");
        rtn("ellipse && !foo2", {"color": "red"})
        xwait(j)
        displayMessage(j, "circle || ellipse: yellow");
        rtn("circle || ellipse", {"color": "yellow"})
        xwait(j)
        displayMessage(j, "(circle && foo2) || (ellipse && foo1): red");
        rtn("(circle && foo2) || (ellipse && foo1)", {"color": "red"})
        xwait(j)
        displayMessage(j, "(circle && !foo2) || (ellipse && !foo1): orange");
        rtn("(circle && !foo2) || (ellipse && !foo1)", {"color": "orange"})
        xwait(j)
        displayMessage(j, "/foo*/: red");
        rtn("/foo*/", {"color": "red"})
        xwait(j)
        displayMessage(j, "circle && foo1: magenta");
        rtn("circle && foo1", {"color": "magenta"})
        xwait(j)
        displayMessage(j, "circle && foo2 + prev: orange");
        rtn("circle && foo2", {"prev": "add", "color": "orange"})
        xwait(j)
        displayMessage(j, "ellipse && foo1 + prev: yellow");
        rtn("ellipse && foo1", {"prev": "or", "color": "yellow"})
        xwait(j)
        displayMessage(j, "ellipse && foo2 + prev: cyan");
        rtn("ellipse && foo2", {"prev": "add", "color": "cyan"})
        xwait(j)
        displayMessage(j, "previous: red");
        rtn("previous", {"color": "red"})
        xwait(j)
        displayMessage(j, "!foo1 && !circle: orange");
        rtn("!foo1 && !circle", {"color": "orange"})
        xwait(j)
        displayMessage(j, "previous || (!foo2 && !circle): yellow");
        rtn("previous || (!foo2 && !circle)", {"color": "yellow"})
        xwait(j)
        displayMessage(j, "previous || (!foo1 && !ellipse): orange");
        rtn("previous || (!foo1 && !ellipse)", {"color": "orange"})
        xwait(j)
        displayMessage(j, "previous || (!foo2 && !ellipse): magenta");
        rtn("previous || (!foo2 && !ellipse)", {"color": "magenta"})
        sleep(timeout)
        displayMessage(j, "reset selection");
        j.SelectRegions("reset")
        sleep(timeout)
        displayMessage(j, "circle + previous (i.e. none)");
        j.SelectRegions("circle", {"prev":"add"})

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
