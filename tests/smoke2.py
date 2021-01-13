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
        rtn("circle", {"color": "orange"})
        displayMessage(j, "circle: orange");
        xwait(j)
        rtn("ellipse", {"color": "magenta"})
        displayMessage(j, "ellipse: magenta");
        xwait(j)
        rtn("circle && foo1", {"color": "red"})
        displayMessage(j, "circle && foo1: red");
        xwait(j)
        rtn("ellipse && !foo2", {"color": "red"})
        displayMessage(j, "ellipse && !foo2: red");
        xwait(j)
        rtn("circle || ellipse", {"color": "yellow"})
        displayMessage(j, "circle || ellipse: yellow");
        xwait(j)
        rtn("(circle && foo2) || (ellipse && foo1)", {"color": "red"})
        displayMessage(j, "(circle && foo2) || (ellipse && foo1): red");
        xwait(j)
        rtn("(circle && !foo2) || (ellipse && !foo1)", {"color": "orange"})
        displayMessage(j, "(circle && !foo2) || (ellipse && !foo1): orange");
        xwait(j)
        rtn("/foo*/", {"color": "red"})
        displayMessage(j, "/foo*/: red");
        xwait(j)
        rtn("circle && foo1", {"color": "magenta"})
        displayMessage(j, "circle && foo1: magenta");
        xwait(j)
        rtn("circle && foo2", {"prev": "add", "color": "orange"})
        displayMessage(j, "circle && foo2 + prev: orange");
        xwait(j)
        rtn("ellipse && foo1", {"prev": "or", "color": "yellow"})
        displayMessage(j, "ellipse && foo1 + prev: yellow");
        xwait(j)
        rtn("ellipse && foo2", {"prev": "add", "color": "cyan"})
        displayMessage(j, "ellipse && foo2 + prev: cyan");
        xwait(j)
        rtn("previous", {"color": "red"})
        displayMessage(j, "previous: red");
        xwait(j)
        rtn("!foo1 && !circle", {"color": "orange"})
        displayMessage(j, "!foo1 && !circle: orange");
        xwait(j)
        rtn("previous || (!foo2 && !circle)", {"color": "yellow"})
        displayMessage(j, "previous || (!foo2 && !circle): yellow");
        xwait(j)
        rtn("previous || (!foo1 && !ellipse)", {"color": "orange"})
        displayMessage(j, "previous || (!foo1 && !ellipse): orange");
        xwait(j)
        rtn("previous || (!foo2 && !ellipse)", {"color": "magenta"})
        displayMessage(j, "previous || (!foo2 && !ellipse): magenta");
        sleep(timeout)
        j.RemoveRegions("all")

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
