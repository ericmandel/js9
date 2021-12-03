""" smoke.py: smoke tests for JS9, calling much of the public API """
import time
import sys
import json
import pyjs9
from astropy.io import fits
from smokesubs import *

def fitsioTest(j, file):
    """
    test FITS IO routines
    """
    tfits = "foo.fits"
    hdul = fits.open(file)
    hdul.info()
    displayMessage(j, "j.SetFITS(hdul, %s)" % tfits)
    j.SetFITS(hdul, tfits)
    waitStatus(j)
    displayMessage(j, 'j.SetColormap("cool")')
    j.SetColormap("cool")
    sleep(2)

def pixTest(j, file=None):
    """
    pixel conversion
    """
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"log", "colormap": "heat"}')
    displayMessage(j, 'j.GetImageData()')
    imdata = j.GetImageData(False)
    displayMessage(j,
                   "    id: %s type: %s width: %d height: %d bitpix: %d"
                   % (imdata["id"], imdata["imtab"],
                      imdata["width"], imdata["height"],
                      imdata["bitpix"]))
    displayMessage(j,
                   "    CRPIX: %f %f: CRVAL: %f %f"
                   % (imdata["header"]["CRPIX1"], imdata["header"]["CRPIX2"],
                      imdata["header"]["CRVAL1"], imdata["header"]["CRVAL2"]))
    displayMessage(j, "j.WCSToPix(CRVAL1, CRVAL2)")
    obj = j.WCSToPix(imdata["header"]["CRVAL1"], imdata["header"]["CRVAL2"])
    abs1 = abs(obj["x"] - imdata["header"]["CRPIX1"])
    abs2 = abs(obj["y"] - imdata["header"]["CRPIX2"])
    if abs1 < 1 and abs2 < 1:
        displayMessage(j, "    %f %f" % (obj["x"], obj["y"]))
    else:
        raise ValueError("wrong WCSToPix")
    displayMessage(j, "j.ImageToDisplayPos(obj.x, obj.y)")
    dpos = j.ImageToDisplayPos({"x": obj["x"], "y": obj["y"]})
    displayMessage(j, "    %f %f" % (dpos["x"], dpos["y"]))
    displayMessage(j, "j.DisplayToImagePos(dpos.x, dpos.y)")
    ipos = j.DisplayToImagePos({"x": dpos["x"], "y": dpos["y"]})
    displayMessage(j, "    %f %f" % (ipos["x"], ipos["y"]))
    displayMessage(j, "j.PixToWCS(CRPIX1, CRPIX2)")
    obj = j.PixToWCS(imdata["header"]["CRPIX1"], imdata["header"]["CRPIX2"])
    abs1 = abs(obj["ra"] - imdata["header"]["CRVAL1"])
    abs2 = abs(obj["dec"] - imdata["header"]["CRVAL2"])
    if abs1 < 0.001 and abs2 < 0.001:
        displayMessage(j, "    %f %f" % (obj["ra"], obj["dec"]))
    else:
        raise ValueError("wrong WCSToPix")
    displayMessage(j, 'j.GetValPos(ipos)')
    valpos = j.GetValPos(ipos, False)
    displayMessage(j, '    %s'
                   % valpos["vstr"].replace("&nbsp;&nbsp;&nbsp;&nbsp;", " "))
    sleep()

def headerTest(j, file=None):
    """
    get header
    """
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"log", "colormap": "heat"}')
    displayMessage(j, 'j.GetFITSHeader(True)')
    header = j.GetFITSHeader(True).split("\n")
    displayMessage(j, "    found %d cards" % len(header))
    sleep()


def dispCoordsTest(j, file=None):
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"linear","colormap":"cool"}')
    displayMessage(j, 'j.LoadRegions("tests/dcoords.reg")')
    j.LoadRegions("tests/dcoords.reg")
    waitStatus(j, "LoadRegions")
    displayMessage(j, 'j.GetRegions()')
    obj = j.GetRegions()
    if len(obj) == 13:
        displayMessage(j, "    found 13 regions")
    else:
        raise ValueError("incorrect number of regions (%d)" % len(obj))
    sleep(2)

def zoomTest(j, file=None):
    """
    bin an image (binary table)
    """
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"log", "colormap": "heat"}')
    for i in [0.5, 2, 4, 2, 1, 0.5]:
        displayMessage(j, 'j.SetZoom(zoom: %f)' % (i))
        j.SetZoom(i)
        sleep()

def binTest(j, file=None):
    """
    bin an image (binary table)
    """
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"log", "colormap": "heat"}')
    for i in [0.5, 2, 4, 2, 1, 0.5]:
        if i in (0.5, 2):
            xfilter = "pi == pha"
        else:
            xfilter = ""
        displayMessage(j, 'j.DisplaySection(bin: %f, filter: %s)'
                       % (i, xfilter))
        j.DisplaySection({"bin":i, "filter": xfilter})
        waitStatus(j, "DisplaySection")

def rotateTest(j, file=None):
    """
    rotate an image
    """
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"log", "colormap": "heat"}')
    displayMessage(j, 'j.RotateData(45)')
    j.RotateData(45)
    waitStatus(j, "ReprojectData")
    sleep()
    displayMessage(j, 'j.RotateData(0)')
    j.RotateData(0)
    waitStatus(j, "ReprojectData")
    sleep()

def filterRGBTest(j, file=None):
    """
    image processing filters (changes RGB data, not image data)
    """
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"log", "colormap": "heat"}')
    displayMessage(j, 'j.FilterRGBImage("emboss")')
    j.FilterRGBImage("emboss")
    sleep()

def loadWindowTest(j, xfrom, xto):
    """
    load a new window, move image to/from
    """
    displayMessage(j, 'j.LoadWindow({"id": "%s"}, "light")' % xto)
    j.LoadWindow("",
                 {"id": xto, "clone": xfrom},
                 "light",
                 "",
                 "width=512px,height=598px,left=10,top=10,resize=1,scrolling=1")
    sleep()
    displayMessage(j, 'j.MoveToDisplay("%s")' % xto)
    j.MoveToDisplay(xto)
    sleep()
    displayMessage(j, 'j.MoveToDisplay(%s, "{display: %s"})' % (xfrom, xto))
    j.MoveToDisplay(xfrom, {"display": xto})
    sleep()

def wcsTest(j, file=None):
    """
    change WCS system and units
    """
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"linear","colormap":"cool"}')
    displayMessage(j, 'j.GetImageData()')
    imdata = j.GetImageData(False)
    displayMessage(j,
                   "    id: %s type: %s width: %d height: %d bitpix: %d"
                   % (imdata["id"], imdata["imtab"],
                      imdata["width"], imdata["height"], imdata["bitpix"]))
    displayMessage(j, 'j.GetWCSSys()')
    sysstr = j.GetWCSSys()
    displayMessage(j, 'j.GetWCSUnits()')
    unitsstr = j.GetWCSUnits()
    displayMessage(j, "    sys: %s units: %s" % (sysstr, unitsstr))
    displayMessage(j, 'j.SetWCSSys("galactic")')
    j.SetWCSSys("galactic")
    if j.GetWCSSys() != "galactic":
        raise ValueError("wrong wcs sys")
    displayMessage(j, 'j.SetWCSSys("native")')
    j.SetWCSSys("native")
    displayMessage(j, 'j.SetWCSUnits("degrees")')
    j.SetWCSUnits("degrees")
    if j.GetWCSUnits() != "degrees":
        raise ValueError("wrong wcs units")
    sleep()
    displayMessage(j, 'j.SetWCSUnits("sexagesimal")')
    j.SetWCSUnits("sexagesimal")
    sleep()

def countsTest(j, file=None):
    """
    internal counts in regions routine
    """
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"linear","colormap":"cool"}')
    displayMessage(j, 'j.AddRegions("circle")')
    j.AddRegions("circle")
    displayMessage(j, 'j.CountsinRegions()')
    s = j.CountsInRegions("$sregions", {"cmdswitches":"-j"})
    if type(s) is dict:
        obj = s
    else:
        obj = json.loads(s)
    c = obj["backgroundSubtractedResults"][0]["netCounts"]
    displayMessage(j, "    counts: %f" % c)
    if c != 16703.0:
        raise ValueError("wrong counts")
    sleep()
    displayMessage(j, 'j.RemoveRegions()')
    j.RemoveRegions()

def colormapTest(j, file=None):
    """
    change colormap in various ways
    """
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"linear","colormap":"cool"}')
    cmap = "data/cmaps/purple_mm.cmap"
    displayMessage(j, 'j.LoadColormap(%s)' % cmap)
    j.LoadColormap(cmap)
    displayMessage(j, 'j.AddColormap("cyan")')
    j.AddColormap("cyan",
                  [[0, 0], [0, 0]], [[0, 0], [1, 1]], [[0, 0], [1, 1]],
                  {"toplevel": False})
    displayMessage(j, 'j.SetColormap(3.4, 0.15)')
    j.SetColormap(3.4, 0.15)
    sleep()
    color0 = j.GetParam("colormap")
    displayMessage(j, 'j.SetColormap("purplish")')
    j.SetColormap("purplish")
    sleep()
    displayMessage(j, 'j.GetParam("colormap")')
    cmap = j.GetParam("colormap")
    displayMessage(j, '    colormap: %s' % j.GetColormap())
    displayMessage(j, 'j.SetParam("colormap", "cyan")')
    j.SetParam("colormap", "cyan")
    displayMessage(j, '    colormap: %s' % j.GetColormap())
    sleep()
    displayMessage(j, 'j.SetParam("colormap", color0)')
    j.SetParam("colormap", color0)
    cmap = j.GetParam("colormap")
    displayMessage(j, '    colormap: %s' % j.GetColormap())
    j.SetColormap(color0)
    sleep()

def regionsTest(j, file=None):
    """
    manipulate regions
    """
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"linear","colormap":"cool"}')
    displayMessage(j, 'j.LoadRegions("data/casa/casa.reg")')
    j.LoadRegions("data/casa/casa.reg")
    waitStatus(j, "LoadRegions")
    displayMessage(j, 'j.GetRegions()')
    obj = j.GetRegions()
    if len(obj) == 13:
        displayMessage(j, "    found 13 regions")
    else:
        raise ValueError("incorrect number of regions (%d)" % len(obj))
    displayMessage(j, 'j.ChangeRegions()')
    j.ChangeRegions("text", {"color": "cyan"})
    sleep()
    displayMessage(j, 'j.RemoveRegions()')
    j.RemoveRegions("text")
    sleep()
    displayMessage(j, 'j.UnremoveRegions()')
    j.UnremoveRegions()
    sleep()

def shapesTest(j, file=None):
    """
    manipulate shapes (like regions, but in arbitrary layers)
    """
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"linear","colormap":"cool"}')
    displayMessage(j, 'j.NewShapeLayer("reg2")')
    j.NewShapeLayer("reg2")
    displayMessage(j, 'j.AddShapes("reg2" "box, circle")')
    # pylint: disable=line-too-long
    j.AddShapes("reg2", 'ICRS; box(23:23:12.7,+58:51:07.6,29",29",0); circle(23:23:35.2,+58:50:04.6, 14")')
    displayMessage(j, 'j.GetShapes("reg2")')
    obj = j.GetShapes("reg2")
    if len(obj) == 2:
        displayMessage(j, '    added 2 shapes')
    else:
        raise ValueError("incorrect number of shapes")
    displayMessage(j, 'j.ChangeShapes("reg2", {"color": "red"})')
    j.ChangeShapes("reg2", {"color": "red"})
    sleep()
    displayMessage(j, 'j.ShowShapeLayer("reg2", False)')
    j.ShowShapeLayer("reg2", False)
    sleep()
    displayMessage(j, 'j.ShowShapeLayer("reg2", True)')
    j.ShowShapeLayer("reg2", True)
    sleep()
    displayMessage(j, 'j.RemoveShapes("reg2")')
    j.RemoveShapes("reg2")
    sleep()

def catalogTest(j, file=None):
    """
    load a catalog
    """
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"linear","colormap":"cool"}')
    displayMessage(j, 'j.LoadCatalog("cat", "data/casa/casa.cat")')
    j.LoadCatalog("cat", "data/casa/casa.cat")
    waitStatus(j, "LoadRegions")
    sleep()

def blurTest(j, file=None):
    """
    gause blur
    """
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"linear","colormap":"cool"}')
    displayMessage(j, 'j.GaussBlurData(2)')
    j.GaussBlurData(2)
    sleep()

def panTest(j, file=None):
    """
    get and set pan
    """
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"linear","colormap":"cool"}')
    displayMessage(j, 'j.SetPan({"px": 4006, "py": 3928})')
    j.SetPan({"px": 4006, "py": 3928})
    displayMessage(j, 'j.GetPan()')
    obj = j.GetPan()
    if abs(obj["x"] - 1958) > 2 or (obj["y"] - 2216) > 2:
        raise ValueError("incorrect pan")
    sleep()

def gridTest(j, file=None):
    """
    display coord grid
    """
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"linear","colormap":"cool"}')
    displayMessage(j, 'j.DisplayCoordGrid(True)')
    j.DisplayCoordGrid(True)
    sleep()
    displayMessage(j, 'j.DisplayCoordGrid(False)')
    j.DisplayCoordGrid(False)
    sleep()

def cubeTest(j, file=None):
    """
    display 3D cube data
    """
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"log","colormap":"viridis"}')
        imdata = j.GetImageData(False)
    for i in range(2, 6):
        sleep()
        displayMessage(j, 'j.DisplaySlice(%d)' % i)
        j.DisplaySlice(i)
        waitStatus(j, "DisplaySection")
        imdata2 = j.GetImageData(False)
        if imdata["width"] != imdata2["width"] or imdata["height"] != imdata2["height"]:
            raise ValueError("wrong image cube dimensions [%d,%d] [%d,%d]" % (imdata["width"], imdata["height"], imdata2["width"], imdata2["height"]))
        displayMessage(j,
                       "    id: %s type: %s width: %d height: %d bitpix: %d"
                       % (imdata2["id"], imdata2["imtab"],
                          imdata2["width"], imdata2["height"],
                          imdata2["bitpix"]))
    sleep()

def cubeTest2(j, file=None):
    """
    display 3D cube data
    """
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"log","colormap":"viridis"}')
        displayMessage(j,'j.DisplaySection({cubecol:"energy:1000:5000:1000"})')
        j.DisplaySection({"cubecol":"energy:1000:5000:1000", "bitpix":16});
        waitStatus(j, "DisplaySection")
        j.SetColormap("heat");
        j.SetScale("log");
    for i in range(2, 5):
        sleep()
        displayMessage(j, 'j.DisplaySlice(%d)' % i)
        j.DisplaySlice(i)
        waitStatus(j, "DisplaySection")
    sleep()

def analysisTest(j, file=None):
    """
    run an server-side analysis test
    """
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"log","colormap":"viridis"}')
    displayMessage(j, 'j.GetAnalysis()')
    x = j.GetAnalysis()
    displayMessage(j, '    found %d analysis routines' % len(x))
    displayMessage(j, 'j.RunAnalysis("counts")')
    x = j.RunAnalysis("counts").split("\n")[13].split()[1]
    if abs(float(x) - 933) < 0.01:
        displayMessage(j, "    counts: %s" % x)
    else:
        raise ValueError("incorrect counts: %s" % x)
    sleep()

def extTest(j, file=None):
    """
    multi-extension FITS
    """
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"linear","colormap":"viridis"}')
        imdata = j.GetImageData(False)
    for i in range(3, 5):
        sleep()
        displayMessage(j, 'j.DisplayExtension(%d)' % i)
        j.DisplayExtension(i)
        waitStatus(j, "DisplaySection")
        imdata2 = j.GetImageData(False)
        if imdata["width"] != imdata2["width"] or imdata["height"] != imdata2["height"]:
            raise ValueError("wrong image extdimensions [%d,%d] [%d,%d]" % (imdata["width"], imdata["height"], imdata2["width"], imdata2["height"]))
        displayMessage(j,
                       "    id: %s type: %s width: %d height: %d bitpix: %d"
                       % (imdata2["id"], imdata2["imtab"],
                          imdata2["width"], imdata2["height"],
                          imdata2["bitpix"]))
    sleep()

def xmmProxyTest(j):
    """
    retrieve data from XMM archive, blend and display
    """
    # pylint: disable=line-too-long
    xmmurl = "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action-aio?obsno=0791580701&name=3COLIM&level=PPS&extension=FTZ"
    closeImage(j)
    displayMessage(j, "load xmm archive via proxy ...")
    j.LoadProxy(xmmurl,
                {"colormap":"red", "scale":"log",
                 "scalemin": 0, "contrast": 9.2, "bias": 0.047})
    waitStatus(j)
    displayMessage(j, 'j.DisplaySlice(2)')
    j.DisplaySlice(2,
                   {"separate": True, "colormap":"green", "scale":"log",
                    "scalemin": 0, "contrast": 9.2, "bias": 0.047})
    sleep()
    displayMessage(j, 'j.DisplaySlice(3)')
    j.DisplaySlice(3,
                   {"separate": True, "colormap":"blue", "scale":"log",
                    "scalemin": 0, "contrast": 9.2, "bias": 0.047})
    sleep()
    displayMessage(j, 'j.SetRGBMode(True)')
    j.SetRGBMode(True)
    sleep(4)
    displayMessage(j, 'j.SetRGBMode(False)')
    j.SetRGBMode(False)
    sleep()
    closeDisplay(j)

def mosaicTest(j, file=None):
    """
    create a mosaic from a file
    """
    if file:
        closeImage(j)
        loadImage(j, file, '{"scale":"linear","colormap":"viridis"}')
    displayMessage(j, 'j.CreateMosaic("current")')
    j.CreateMosaic("current")
    waitStatus(j, "CreateMosaic")
    displayMessage(j, 'j.SetColormap("magma", 5.13, 0.04)')
    j.SetColormap("magma", 5.13, 0.04)
    displayMessage(j, 'j.DisplayPlugin("JS9Panner")')
    j.DisplayPlugin("JS9Panner")
    sleep(2)
    displayMessage(j, 'j.DisplayPlugin("panner")')
    j.DisplayPlugin("panner")
    closeDisplay(j)

def flipAll(j, rots=[90, 10, -90, 15], flips=["x", "y", "x", "y"], bins=[]):
    """
    flip and rotate in all combinations
    """
    timeout = 1
    for ix in range(len(rots)):
        rot = rots[ix]
        if rot % 90 == 0:
            j.SetRot90(rot)
            xrot = j.GetRot90()
            displayMessage(j, 'j.SetRot90: %d' % (xrot))
        else:
            j.SetRotate(rot)
            xrot = j.GetRotate()
            displayMessage(j, 'j.SetRotate: %d' % (xrot))
        sleep(timeout)
        for iy in range(len(flips)):
            flip = flips[iy]
            j.SetFlip(flip)
            xflip = j.GetFlip()
            displayMessage(j, 'j.SetFlip: %s' % (xflip))
            sleep(timeout)
            if iy < len(bins):
                bin = bins[iy]
                displayMessage(j, 'j.DisplaySection(bin: %f)' % bin)
                j.DisplaySection({"bin":bin, "xcen":0, "ycen":0})
                waitStatus(j, "DisplaySection")
                sleep(timeout)

def flipRotateTest(j):
    """
    flip and rotate image (the regions show wcs/physical update)
    """
    # pylint: disable=line-too-long
    loadImage(j, 'data/fits/ngc1316.fits', '{"scale":"linear", "contrast":2.93, "bias":0.643}')
    displayMessage(j, 'j.AddRegions("circle; ellipse")')
    # pylint: disable=line-too-long
    j.AddRegions("FK4; ellipse(03:20:47.200, -37:23:08.221, 2.916667', 1.750000', 322.431400); circle(03:22:25.384, -37:14:17.178, 1.051199')")
    # pylint: disable=line-too-long
    j.AddRegions('physical; ellipse(226.00, 147.00, 28.00, 18.00, 322.4314) {"color":"red"}; circle(58.50, 222.50, 12) {"color":"red"}')
    flipAll(j, rots=[90, 15, -90, -100], flips=["x", "y"])
    loadImage(j, 'data/fits/sipsample.fits', '{"scale":"log", "colormap": "heat", "contrast": 4.84, "bias": 0.48}')
    displayMessage(j, 'j.AddRegions("ellipse; circle")')
    # pylint: disable=line-too-long
    j.AddRegions('FK5; ellipse(13:29:44.577, +47:10:11.644, 36.686718", 21.417932", 81.620827); circle(13:29:52.660, +47:11:42.560, 36.545208")')
    # pylint: disable=line-too-long
    j.AddRegions('physical; circle(149.00, 67.00, 33) {"color":"red"}; ellipse(49.00, 76.00, 33, 20, 81.6208) {"color":"red"}')
    flipAll(j, rots=[10, 90, -10, -90], flips=["x", "y"])
    loadImage(j, 'data/orion/orion_1.fits', {"colormap":"grey"})
    # pylint: disable=line-too-long
    j.AddRegions('physical; ellipse(414.00, 109.00, 53.75, 20.00, 328.8843); box(500.00, 344.00, 22.00, 22.00, 0.0000); circle(245.00, 392.00, 14.00)')
    flipAll(j, rots=[12, 51, 90, -90], flips=["x", "y"])
    loadImage(j, 'data/fits/casa.fits.gz', '{"scale":"log", "colormap": "cool"}')
    displayMessage(j, 'j.LoadRegions("data/casa/casa.reg")')
    j.LoadRegions("data/casa/casa.reg")
    flipAll(j, bins=[0.5, 2, 4])
    loadImage(j, 'data/fits/squares.fits', {"colormap":"grey"})
    # pylint: disable=line-too-long
    j.AddRegions('physical; polygon(438.00, 24.00, 498.00, 24.00, 468.00, 84.00) {"text":"white","textOpts":{"px":466,"py":97}}; box(52.00, 452.00, 60.00, 60.00, 0.0000) {"text":"black","textOpts":{"px":52,"py":470}}; circle(459.00, 462.00, 30.00) {"text":"darkgrey","textOpts":{"px":459,"py":421}}; ellipse(57.00, 43.00, 30.00, 20.00, 0.0000) {"text":"lightgrey","textOpts":{"px":57,"py":77}}')
    flipAll(j, rots=[90, 95, -90, -95], flips=["x", "y"])
    sleep()
    closeDisplay(j)

# pylint: disable=too-many-statements
def blendTest(j):
    """
    blend images
    """
    closeDisplay(j)
    j.BlendDisplay(False)
    loadImage(j, 'data/blend/chandra.fits',
              '{"scale":"linear","colormap":"sls","contrast":5.78,"bias":0.15}')
    displayMessage(j, 'j.SetScale(log)')
    j.SetScale("log")
    displayMessage(j, 'j.GetScale()')
    obj = j.GetScale()
    if obj["scale"] != "log":
        raise ValueError("incorrect scale")
    displayMessage(j, 'j.SetZoom(2)')
    j.SetZoom(2)
    displayMessage(j, 'j.GetZoom()')
    val = j.GetZoom()
    if val != 2:
        raise ValueError("incorrect zoom")
    sleep()
    displayMessage(j, 'j.SetColormap("red")')
    j.SetColormap("red")
    displayMessage(j, 'j.GetColormap()')
    obj = j.GetColormap()
    if obj["colormap"] != "red":
        raise ValueError("incorrect colormap")
    displayMessage(j, 'j.BlendImage("screen", 1, True)')
    j.BlendImage('screen', 1, True)
    sleep()

    # pylint: disable=line-too-long
    loadImage(j, 'data/blend/galex.fits',
              '{"scale":"log","colormap":"green","contrast":6.25,"bias":0.25}')
    displayMessage(j, 'j.ReprojectData("chandra.fits")')
    j.ReprojectData('chandra.fits')
    waitStatus(j, "ReprojectData")
    displayMessage(j, 'j.SetColormap("green", 5.6, 0.74)')
    j.SetColormap('green', 5.6, 0.74)
    displayMessage(j, 'j.SetZoom(2)')
    j.SetZoom(2)
    displayMessage(j, 'j.BlendImage("screen", 1, True)')
    j.BlendImage('screen', 1, True)
    sleep()

    # pylint: disable=line-too-long
    loadImage(j, 'data/blend/spitzer.fits', '{"scale":"log","colormap":"blue","contrast":6.3,"bias":0.54}')
    displayMessage(j, 'j.ReprojectData("chandra.fits")')
    j.ReprojectData('chandra.fits')
    waitStatus(j, "ReprojectData")
    displayMessage(j, 'j.SetColormap("blue", 6.3, 0.54)')
    j.SetColormap('blue', 6.3, 0.54)
    displayMessage(j, 'j.SetZoom(2)')
    j.SetZoom(2)
    displayMessage(j, 'j.BlendImage("screen", 1, True)')
    j.BlendImage('screen', 1, True)
    sleep()

    # pylint: disable=line-too-long
    loadImage(j, 'data/blend/hst.fits', '{"scale":"log","scaleclipping":"user","scalemin":0,"scalemax":5,"colormap":"heat","contrast":4.0,"bias":0.67}')
    displayMessage(j, 'j.ReprojectData("chandra.fits")')
    j.ReprojectData('chandra.fits')
    waitStatus(j, "ReprojectData")
    displayMessage(j, 'j.SetColormap("heat", 3.0, 0.535)')
    j.SetColormap('heat', 3.0, 0.535)
    displayMessage(j, 'j.SetZoom(2)')
    j.SetZoom(2)
    displayMessage(j, 'j.BlendImage("screen", 1, True)')
    j.BlendImage('screen', 1, True)
    displayMessage(j, 'j.Addregions("ellipse; circle")')
    j.AddRegions('FK5; ellipse(06:16:27.2, -21:22:31.1, 35.97", 19.19", 20.25) {"color":"cyan"}; circle(06:16:22.1, -21:22:22.8, 14.8")')
    displayMessage(j, 'j.GetRegions()')
    obj = j.GetRegions()
    if len(obj) != 2:
        raise ValueError("incorrect number of regions")
    displayMessage(j, 'j.CopyRegions("chandra.fits")')
    j.CopyRegions("chandra.fits")
    displayMessage(j, 'j.RemoveRegions()')
    j.RemoveRegions()
    displayMessage(j, 'blend the images ...')
    displayMessage(j, 'j.BlendDisplay(True)')
    j.BlendDisplay(True)
    sleep()
    displayMessage(j, 'j.GetDisplayData()')
    imarr = j.GetDisplayData()
    for imdata in imarr:
        displayMessage(j, "    id: %s type: %s width: %d height: %d bitpix: %d"
                       % (imdata["id"], imdata["imtab"],
                          imdata["width"], imdata["height"], imdata["bitpix"]))
    displayMessage(j, 'j.DisplayImage("chandra.fits")')
    j.DisplayImage("colormap", {"display":"chandra.fits"})
    sleep()

def resizeSeparateTest(j):
    """
    resize display, separate, gather images in a display
    """
    displayMessage(j, 'gather, resize ...')
    displayMessage(j, 'j.ResizeDisplay(400,300)')
    j.ResizeDisplay(300, 300)
    sleep()
    displayMessage(j, 'j.SeparateDisplay()')
    j.SeparateDisplay()
    sleep(2)
    displayMessage(j, 'j.GatherDisplay()')
    j.GatherDisplay()
    sleep(2)
    displayMessage(j, 'j.ResizeDisplay("reset")')
    j.ResizeDisplay("reset")

def staticColormapTest(j):
    """
    add colormaps
    """
    if j:
        j.AddColormap("mask", [["#ff000080", 1, 31], ["cyan", 32, 32], ["rgba(0,255,0,0.5)", 37, 99], ["blue", 100, "Infinity"]])

def maskBlendTest(j):
    """
    load masks
    """
    imageFile = 'data/fits/lsst1.fits'
    imageId = 'lsst1.fits[1]'
    maskId = 'lsst1.fits[2]'
    # load the mask first, so it can blend into the image
    loadImage(j, imageFile + '[2]')
    # use the lsst mask
    displayMessage(j, 'j.SetColormap("mask")')
    j.SetColormap("mask")
    # the mask will be blended using source-atop composition
    displayMessage(j, 'j.BlendImage()')
    j.BlendImage("source-atop")
    # load extension #1: the image data itself
    displayMessage(j, 'j.Displayextension(1)')
    j.DisplayExtension(1, {"separate": True})
    displayMessage(j, "waiting for DisplayExtension ...")
    waitStatus(j, "DisplayExtension")
    # set some nice image params
    displayMessage(j, 'j.SetScale("log")')
    j.SetScale("log")
    displayMessage(j, 'j.SetColormap("grey")')
    j.SetColormap("grey", 6.37, 0.3)
    # blend the two images
    j.BlendDisplay(True)
    # and sync them
    displayMessage(j, 'j.SyncImages()')
    j.SyncImages(["flip", "pan", "rot90", "zoom"], [maskId])
    displayMessage(j, 'j.DisplayPlugin(JS9Blend)')
    j.DisplayPlugin("JS9Blend")
    sleep(2)
    j.DisplayPlugin("JS9Blend")

def maskOverlayTest(j):
    """
    load masks
    """
    imageFile = 'data/fits/lsst1.fits'
    imageId = 'lsst1.fits[1]'
    maskId = 'lsst1.fits[2]'
    # turn off blending, just in case we were just runing maskblend ...
    j.BlendDisplay(False)
    loadImage(j, imageFile, '{"scale":"log"}')
    displayMessage(j, 'j.SetColormap("grey")')
    j.SetColormap("grey", 5.57, 0.28)
    displayMessage(j, 'j.Displayextension(2)')
    j.DisplayExtension(2, {"separate": True})
    displayMessage(j, "waiting for DisplayExtension ...")
    waitStatus(j, "DisplayExtension")
    displayMessage(j, 'j.SetColormap("mask")')
    j.SetColormap("mask")
    displayMessage(j, 'j.DisplayImage()')
    j.DisplayImage({"display": imageId})
    displayMessage(j, 'j.MaskImage()')
    j.MaskImage(maskId, '{"mode":"overlay"}')
    displayMessage(j, 'j.SyncImages()')
    j.SyncImages(["flip", "pan", "rot90", "zoom"], [maskId])
    sleep(2)

def smokeTests():
    """
    all the tests
    """
    j = init()
    fitsioTest(j, "data/fits/casa.fits.gz")
    pixTest(j, "data/fits/snr.fits")
    headerTest(j)
    dispCoordsTest(j)
    zoomTest(j)
    binTest(j)
    rotateTest(j)
    loadWindowTest(j, "JS9", "myJS9")
    filterRGBTest(j)
    flipRotateTest(j)
    wcsTest(j, "data/fits/casa.fits")
    countsTest(j)
    colormapTest(j)
    regionsTest(j)
    shapesTest(j)
    catalogTest(j)
    blurTest(j)
    panTest(j)
    gridTest(j)
    cubeTest(j, "data/fits/jupiter_cube.fits")
    analysisTest(j)
    cubeTest2(j, "data/fits/casa.fits")
    extTest(j, "data/fits/nicmos.fits")
    mosaicTest(j, "data/fits/mosaicimage.fits")
    staticColormapTest(j)
    maskBlendTest(j)
    maskOverlayTest(j)
    blendTest(j)
    resizeSeparateTest(j)
    j.BlendDisplay(False)
    closeDisplay(j)
    xmmProxyTest(j)
    sleep(2)
    j.close()
    sleep(2)
    sys.exit()

if __name__ == '__main__':
    smokeTests()
