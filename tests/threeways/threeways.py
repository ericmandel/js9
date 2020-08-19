import pyjs9
import time
import sys

timeout = 2
loadTimeout = 1
maxIter = 10
id = "threeJS9"

if len(sys.argv) > 1:
    id = sys.argv[1]

def waitLoad():
    iter = 0
    done = False
    while done == False:
        x = j.GetLoadStatus()
        if x == "complete":
            done = True
        else:
            iter = iter + 1
            if iter > maxIter:
                raise ValueError("timeout waiting")
            time.sleep(loadTimeout)

print('pyjs9.JS9(id={})'.format(id))
j = pyjs9.JS9(id=id)
j.BlendDisplay(False)
j.CloseDisplay()

print('load chandra.fits ...')
print('    j.Load("../../data/blend/chandra.fits", \'{"scale":"log","colormap":"red","contrast":5.78,"bias":0.15}\')')
j.Load('../../data/blend/chandra.fits', '{"scale":"log","colormap":"red","contrast":5.78,"bias":0.15}')
waitLoad()
print('    j.SetZoom(2)')
j.SetZoom(2)
print('    j.BlendImage("screen", 1, True)')
j.BlendImage('screen', 1, True)
time.sleep(timeout)

print('load galex.fits ...')
print('    j.Load("../../data/blend/galex.fits", \"{"scale":"log","colormap":"green","contrast":6.25,"bias":0.25}\')')
j.Load('../../data/blend/galex.fits', '{"scale":"log","colormap":"green","contrast":6.25,"bias":0.25}')
waitLoad()
time.sleep(timeout)

print('    j.ReprojectData("chandra.fits")')
j.ReprojectData('chandra.fits')
print('    j.SetColormap("green", 5.6, 0.74)')
j.SetColormap('green', 5.6, 0.74)
print('    j.SetZoom(2)')
j.SetZoom(2)
print('    j.BlendImage("screen", 1, True)')
j.BlendImage('screen', 1, True)
time.sleep(timeout)

print('load spitzer.fits ...')
print('    j.Load("../../data/blend/spitzer.fits", \'{"scale":"log","colormap":"blue","contrast":6.3,"bias":0.54}\')')
j.Load('../../data/blend/spitzer.fits', '{"scale":"log","colormap":"blue","contrast":6.3,"bias":0.54}')
waitLoad()
time.sleep(timeout)

print('    j.ReprojectData("chandra.fits")')
j.ReprojectData('chandra.fits')
print('    j.SetColormap("blue", 6.3, 0.54)')
j.SetColormap('blue', 6.3, 0.54)
print('    j.SetZoom(2)')
j.SetZoom(2)
print('    j.BlendImage("screen", 1, True)')
j.BlendImage('screen', 1, True)
time.sleep(timeout)

print('load hst.fits ...')
print('    j.Load("../../data/blend/hst.fits", \'{"scale":"log","scaleclipping":"user","scalemin":0,"scalemax":5,"colormap":"heat","contrast":4.0,"bias":0.67}\')')
j.Load('../../data/blend/hst.fits', '{"scale":"log","scaleclipping":"user","scalemin":0,"scalemax":5,"colormap":"heat","contrast":4.0,"bias":0.67}')
waitLoad()
time.sleep(timeout)

print('    j.ReprojectData("chandra.fits")')
j.ReprojectData('chandra.fits')
print('    j.SetColormap("heat", 3.0, 0.535)')
j.SetColormap('heat', 3.0, 0.535)
print('    j.SetZoom(2)')
j.SetZoom(2)
print('    j.BlendImage("screen", 1, True)')
j.BlendImage('screen', 1, True)
time.sleep(timeout)

print('blend the images')
print('    j.BlendDisplay(True)')
j.BlendDisplay(True)

j.close()
