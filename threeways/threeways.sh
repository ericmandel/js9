#!/bin/bash
#set -x

timeout=3
XARGS=""
while [ x"$1" != x ]; do
    case $1 in
    -h) shift
	XARGS="$XARGS -h $1"
        shift;;
    -t) shift
	timeout="$1"
        shift;;
     *) break;;
    esac
done

echo 'load ./blend/chandra.fits'
../js9load $XARGS './blend/chandra.fits' '{"scale":"log","colormap":"red","contrast":5.78,"bias":0.15}'
js9 $XARGS BlendImage 'screen' 1 true > /dev/null
sleep $timeout

echo 'load ./blend/galex.fits'
../js9load './blend/galex.fits' '{"scale":"log","colormap":"green","contrast":6.25,"bias":0.25}'
js9 $XARGS BlendImage 'screen'  1 true > /dev/null
sleep $timeout

echo 'reproject using chandra wcs'
js9 $XARGS ReprojectData 'chandra.fits' > /dev/null
js9 $XARGS SetColormap 'green' 5.6 0.74 > /dev/null
js9 $XARGS BlendImage 'screen' 1 true > /dev/null
sleep $timeout

echo 'load ./blend/spitzer.fits'
../js9load './blend/spitzer.fits' '{"scale":"log","colormap":"blue","contrast":6.3,"bias":0.54}'
js9 $XARGS BlendImage 'screen'  1 true > /dev/null
sleep $timeout

echo 'reproject using chandra wcs'
js9 $XARGS ReprojectData 'chandra.fits' > /dev/null
js9 $XARGS SetColormap 'blue' 6.3 0.54 > /dev/null
js9 $XARGS BlendImage 'screen' 1 true > /dev/null
sleep $timeout

echo 'blend all three images'
js9 $XARGS BlendDisplay true > /dev/null
