import pyjs9
import time

timeout = 3
loadTimeout = 1
maxIter = 10
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

j = pyjs9.JS9()

print 'load ./blend/chandra.fits'
j.Load('./blend/chandra.fits', '{"scale":"log","colormap":"red","contrast":5.78,"bias":0.15}')
waitLoad()
j.BlendImage('screen', 1, True)
time.sleep(timeout)

print 'load ./blend/galex.fits'
j.Load('./blend/galex.fits', '{"scale":"log","colormap":"green","contrast":6.25,"bias":0.25}')
waitLoad()
time.sleep(timeout)

print 'reproject using chandra wcs'
j.ReprojectData('chandra.fits')
j.SetColormap('green', 5.6, 0.74)
j.BlendImage('screen', 1, True)
time.sleep(timeout)

print 'load ./blend/spitzer.fits'
j.Load('./blend/spitzer.fits', '{"scale":"log","colormap":"blue","contrast":6.3,"bias":0.54}')
waitLoad()
time.sleep(timeout)

print 'reproject using chandra wcs'
j.ReprojectData('chandra.fits')
j.SetColormap('blue', 6.3, 0.54)
j.BlendImage('screen', 1, True)
time.sleep(timeout)

print 'blend all three images'
j.BlendDisplay(True)
