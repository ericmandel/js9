""" smoke.py: smoke tests for JS9, calling much of the public API """
import time
import sys
import json
import re
import pyjs9
from astropy.io import fits
from smokesubs import *

# add new tests here

deftimeout = 2

regions1 = 'physical;ellipse(4103.0,3873.0,30.0,20.0,0) {"strokeWidth":2} # source,include,foo2; ellipse(3990.0,3872.0,30.0,20.0,0) {"strokeWidth":2} # source,include,foo1; circle(3990.0,3988.0,30.0) {"strokeWidth":2} # source,include,foo2; circle(3882.0,3988.0,30.0) {"strokeWidth":2} # source,include,foo1'

regions2 = 'physical;circle(3980,4120,20) {"color":"red","groupid":"grp1"} # source,include,foo1;ellipse(4090,4120,25,15) {"color":"orange","groupid":"grp1"} # source,include,foo1;circle(3980,4020,20) {"color":"blue","groupid":"grp2"} # source,include,foo2;box(4090,4020,40,30)  {"color":"green","groupid":"grp2"} # source,include,foo2;circle(3980,3920,20) {"color":"cyan","groupid":"grp3"} # source,include,foo3;annulus(4090,3920,5,10,15,20,25,30) {"color":"lightgreen", "groupid":"grp3"} # source,include,foo3;box(3980,3820,30,20) # source,include,foo4;annulus(4090,3820,10,20,30) # source,include,foo4;line(3948,3706,4008,3766) # source,include;polygon(4056,3704,4116,3704,4086,3764) # background,include'

def xwait(j, t=deftimeout):
    sleep(t)
    if len(j.GetRegions()) == 0:
        j.AddRegions(regions1)
        sleep(timeout)

def xdisp(j, rtn, s):
    if rtn == j.SelectRegions:
        s = re.sub(r':.*', ': selected', s)
    displayMessage(j, s)

def regSelectTest(j, file):
    """
    region selection (including boolean parser)
    """
    rtns = [j.ChangeRegions, j.SelectRegions]
    timeout = 2;
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"log", "colormap": "cool"}')
    for rtn in rtns:
        j.AddRegions(regions1)
        xwait(j, timeout)
        xdisp(j, rtn, "circle: orange");
        rtn("circle", {"color": "orange"})
        xwait(j, timeout)
        xdisp(j, rtn, "ellipse: magenta");
        rtn("ellipse", {"color": "magenta"})
        xwait(j, timeout)
        xdisp(j, rtn, "circle && foo1: red");
        rtn("circle && foo1", {"color": "red"})
        xwait(j, timeout)
        xdisp(j, rtn, "ellipse && !foo2: red");
        rtn("ellipse && !foo2", {"color": "red"})
        xwait(j, timeout)
        xdisp(j, rtn, "circle || ellipse: yellow");
        rtn("circle || ellipse", {"color": "yellow"})
        xwait(j, timeout)
        xdisp(j, rtn, "(circle && foo2) || (ellipse && foo1): red");
        rtn("(circle && foo2) || (ellipse && foo1)", {"color": "red"})
        xwait(j, timeout)
        xdisp(j, rtn, "(circle && !foo2) || (ellipse && !foo1): orange");
        rtn("(circle && !foo2) || (ellipse && !foo1)", {"color": "orange"})
        xwait(j, timeout)
        xdisp(j, rtn, "/foo.*/: red");
        rtn("/foo.*/", {"color": "red"})
        xwait(j, timeout)
        xdisp(j, rtn, "circle && foo1: magenta");
        rtn("circle && foo1", {"color": "magenta"})
        xwait(j, timeout)
        xdisp(j, rtn, "circle && foo2 + saved: orange");
        rtn("circle && foo2", {"saved": True, "color": "orange"})
        xwait(j, timeout)
        xdisp(j, rtn, "ellipse && foo1 + saved: yellow");
        rtn("ellipse && foo1", {"saved": "or", "color": "yellow"})
        xwait(j, timeout)
        xdisp(j, rtn, "ellipse && foo2 + saved: cyan");
        rtn("ellipse && foo2", {"saved": True, "color": "cyan"})
        xwait(j, timeout)
        xdisp(j, rtn, "saved: red");
        rtn("saved", {"color": "red"})
        xwait(j, timeout)
        xdisp(j, rtn, "!foo1 && !circle: orange");
        rtn("!foo1 && !circle", {"color": "orange"})
        xwait(j, timeout)
        xdisp(j, rtn, "saved || (!foo2 && !circle): yellow");
        rtn("saved || (!foo2 && !circle)", {"color": "yellow"})
        xwait(j, timeout)
        xdisp(j, rtn, "saved || (!foo1 && !ellipse): orange");
        rtn("saved || (!foo1 && !ellipse)", {"color": "orange"})
        xwait(j, timeout)
        xdisp(j, rtn, "saved || (!foo2 && !ellipse): magenta");
        rtn("saved || (!foo2 && !ellipse)", {"color": "magenta"})
        sleep(timeout)
        xdisp(j, rtn, "reset selection");
        j.SelectRegions("reset")
        sleep(timeout)
        xdisp(j, rtn, "circle + saved (i.e. none)");
        j.SelectRegions("circle", {"saved":"add"})

def regGroupTest(j, file):
    """
    region selection (including boolean parser)
    """
    rtns = [j.ChangeRegions, j.SelectRegions]
    timeout = 1;
    if file:
        closeImage(j)
        loadImage(j, file, '{"colormap": "grey"}')
    for rtn in rtns:
        j.RemoveRegions("all")
        j.AddRegions(regions2)
        xwait(j, timeout)
        xdisp(j, rtn, "grp1: red");
        rtn("grp1", {"color": "red"})
        xwait(j, timeout)
        xdisp(j, rtn, "grp1||grp2: orange");
        rtn("grp1||grp2", {"color": "orange"})
        xwait(j, timeout)
        xdisp(j, rtn, "grp1||grp2||grp3: yellow");
        rtn("grp1||grp2||grp3", {"color": "yellow"})
        xwait(j, timeout)
        xdisp(j, rtn, "grp1||grp2||grp3||annulus||box: green");
        rtn("grp1||grp2||grp3||annulus||box", {"color": "green"})
        xwait(j, timeout)
        xdisp(j, rtn, "!polygon: blue");
        rtn("!polygon", {"color": "blue"})
        xwait(j, timeout)
        displayMessage(j, "ungroup: grp1");
        j.UngroupRegions("grp1");
        # j.send({'cmd': 'UngroupRegions', 'args': ['grp1']})
        xwait(j, timeout)
        s = j.ListGroups()
        # s = j.send({'cmd': 'ListGroups', 'args': []})
        s = re.sub(r';|\n', '<br>', s)
        displayMessage(j, s)
        xwait(j, 3)
        xdisp(j, rtn, "circle || line: cyan");
        rtn("circle || line", {"color": "cyan"})
        xwait(j, 3)
        displayMessage(j, "ungroup: grp2");
        j.UngroupRegions("grp2");
        # j.send({'cmd': 'UngroupRegions', 'args': ['grp2']})
        xwait(j, timeout)
        xdisp(j, rtn, "(ellipse && foo1) || (box && foo2) || polygon: majenta");
        rtn("(ellipse && foo1) || (box && foo2) || polygon", {"color": "magenta"})
        xwait(j, timeout)
        displayMessage(j, "ungroup: grp3");
        j.UngroupRegions("grp3");
        # j.send({'cmd': 'UngroupRegions', 'args': ['grp3']})
        xwait(j, timeout)
        xdisp(j, rtn, "all: yellow");
        rtn("all", {"color": "yellow"})
        xwait(j, timeout)
        displayMessage(j, "group: circle || box");
        grp = j.GroupRegions("circle || box");
        # grp = j.send({'cmd': 'GroupRegions', 'args': ['circle || box']})
        xwait(j, timeout)
        xdisp(j, rtn, "%s: red" % grp);
        rtn(grp, {"color": "red"})
        xwait(j, 3)

# end of new tests

def smokeTests():
    """
    all the tests
    """
    j = init()
    # call new tests here
    regGroupTest(j,  "../js9/data/fits/casa.fits.gz")
    regSelectTest(j, "../js9/data/fits/casa.fits.gz")
    # end of new tests
    sleep(2)
    j.close()
    sleep(2)
    sys.exit()

if __name__ == '__main__':
    smokeTests()
