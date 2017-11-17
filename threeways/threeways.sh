#!/bin/bash
#set -x

# blend image directory relative to web page
BLDIR="./blend"

TIMEOUT=1
XARGS=""
ZOOM=1
while [ x"$1" != x ]; do
    case $1 in
    -a) shift
	doapp=true;;
    -b) shift
	BLDIR="$1"
        shift;;
    -h) shift
	XARGS="$XARGS -h $1"
        shift;;
    -j) BLDIR="./js9/blend"
	TIMEOUT=0
	XARGS="$XARGS -h https://js9.si.edu"
	shift;;
    -t) shift
	TIMEOUT="$1"
        shift;;
    -y) TIMEOUT=0
	doyesno=true
        shift;;
    -z) shift
	ZOOM=$1
        shift;;
     *) break;;
    esac
done

dowait (){
    if [ x"$1" != x ]; then
        ACT="$1"
    fi
    if [ x"$ACT" != x ]; then
        ASK="$ACT? "
    else
        ASK='Continue? '
    fi
    if [ x"$doyesno" = xtrue ]; then
        read -p "$ASK"
        if [[ ! $REPLY =~ ^[Yy]$ ]]
        then
echo "${REPLY}" | od -a
            exit
        fi
    else
      echo "$ACT"
      sleep $TIMEOUT
    fi
}

if [ x${doapp} = xtrue ]; then
  js9 -a &
  sleep 1
fi

# js9 $XARGS ResizeDisplay 1024 > /dev/null
js9 $XARGS BlendDisplay false > /dev/null

echo "load chandra.fits"
../js9load $XARGS "${BLDIR}/chandra.fits" '{"scale":"log","colormap":"red","contrast":5.78,"bias":0.15}'
js9 $XARGS SetZoom $ZOOM > /dev/null
js9 $XARGS BlendImage "screen" 1 true > /dev/null

dowait "load galex.fits"
../js9load $XARGS "${BLDIR}/galex.fits" '{"scale":"log","colormap":"green","contrast":6.5,"bias":0.375}'

dowait "reproject galex using the chandra wcs"
js9 $XARGS ReprojectData "chandra.fits" > /dev/null
js9 $XARGS SetColormap "green" 5.6 0.74 > /dev/null
js9 $XARGS SetZoom $ZOOM > /dev/null
js9 $XARGS BlendImage "screen" 1 true > /dev/null

dowait "load spitzer.fits"
../js9load $XARGS "${BLDIR}/spitzer.fits" '{"scale":"log","colormap":"blue","contrast":4.89,"bias":0.41}'

dowait "reproject spitzer using the chandra wcs"
js9 $XARGS ReprojectData "chandra.fits" > /dev/null
js9 $XARGS SetColormap "blue" 6.3 0.54 > /dev/null
js9 $XARGS SetZoom $ZOOM > /dev/null
js9 $XARGS BlendImage "screen" 1 true > /dev/null

dowait "load hst.fits"
../js9load $XARGS "${BLDIR}/hst.fits" '{"scale":"log","colormap":"magma","contrast":6.32,"bias":0.384}'

dowait "reproject hst using the chandra wcs"
js9 $XARGS ReprojectData chandra.fits > /dev/null
js9 $XARGS SetColormap cool 5.74 0.38 > /dev/null
js9 $XARGS SetZoom $ZOOM > /dev/null
js9 $XARGS BlendImage "screen" 1 true > /dev/null

dowait "blend the images"
js9 $XARGS BlendDisplay true > /dev/null
