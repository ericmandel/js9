""" smoke.py: smoke tests for JS9, calling much of the public API """
import os
import subprocess
import time
import sys
import json
import re
import pyjs9
from pathlib import Path
from astropy.io import fits
from smokesubs import *

# add new tests here

def regSaveTest(j, file):
    """
    region save test
    """
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"log", "colormap": "grey"}')
    p = Path(file);
    extensions = "".join(p.suffixes)
    new_ext = ".reg"
    regions = str(p).replace(extensions, new_ext)
    j.LoadRegions(regions)
    j.SaveRegions("foo.reg")
    sleep(1);
    os.system("ls -l foo.reg");
    print("diff %s foo.reg" % regions)
    s = subprocess.call(["/usr/bin/diff",regions,"foo.reg"],universal_newlines=True)
    print(s);
    os.system("rm -f foo.reg");
    sleep(2)

# end of new tests

def smokeTests():
    """
    all the tests
    """
    j = init()
    # call new tests here
    regSaveTest(j, "../js9/data/tests/a133.fits.gz")
    regSaveTest(j, "../js9/data/tests/casa_obs4637_img.fits")
    regSaveTest(j, "../js9/data/tests/orion_1.fits")
    regSaveTest(j, "../js9/data/tests/ngc1316.fits")
    # end of new tests
    sleep(2)
    j.close()
    sleep(2)
    sys.exit()

if __name__ == '__main__':
    smokeTests()
