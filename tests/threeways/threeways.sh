#!/bin/bash
# set -x

# blend image directory relative to web page
BLDIR="../../data/blend"

DOADDON=false
TIMEOUT=1
XARGS=""
ZOOM=1
while [ x"$1" != x ]; do
    case $1 in
    -a) shift
        DOADDON=true;;
    -b) shift
	BLDIR="$1"
        shift;;
    -h) shift
	XARGS="$XARGS -h $1"
        shift;;
    -i) shift
	XARGS="$XARGS --id $1"
        shift;;
    -j)	TIMEOUT=0
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
    else
      echo "$ACT"
      sleep $TIMEOUT
    fi
}

xjs9 (){
  echo "    ${XJS9:-js9msg} $*" >&2
  ${XJS9:-js9msg} $XARGS $*
}

xjs9load (){
  echo "    js9load $*" >&2
  js9load $XARGS $*
}

# js9 $XARGS ResizeDisplay 1024 > /dev/null
echo "Merging multi-wavelength data for colliding galaxies NGC 2207 and IC 2163"
xjs9 $XARGS BlendDisplay false > /dev/null
xjs9 $XARGS CloseDisplay > /dev/null

dowait "load chandra.fits"
xjs9load $XARGS "${BLDIR}/chandra.fits" '{"scale":"log","colormap":"red","contrast":5.78,"bias":0.15}'
xjs9 $XARGS SetZoom $ZOOM > /dev/null
xjs9 $XARGS BlendImage "screen" 1 true > /dev/null

dowait "load galex.fits"
xjs9load $XARGS "${BLDIR}/galex.fits" '{"scale":"log","colormap":"green","contrast":6.5,"bias":0.375}'

dowait "reproject galex using the chandra wcs"
xjs9 $XARGS ReprojectData "chandra.fits" > /dev/null
dowait "set params galex.fits"
xjs9 $XARGS SetColormap "green" 5.6 0.74 > /dev/null
xjs9 $XARGS SetZoom $ZOOM > /dev/null
xjs9 $XARGS BlendImage "screen" 1 true > /dev/null

dowait "load spitzer.fits"
xjs9load $XARGS "${BLDIR}/spitzer.fits" '{"scale":"log","colormap":"blue","contrast":4.14,"bias":0.545}'

dowait "reproject spitzer using the chandra wcs"
xjs9 $XARGS ReprojectData "chandra.fits" > /dev/null
dowait "set params spitzer.fits"
xjs9 $XARGS SetColormap "blue" 6.3 0.54 > /dev/null
xjs9 $XARGS SetZoom $ZOOM > /dev/null
xjs9 $XARGS BlendImage "screen" 1 true > /dev/null

if [ x$DOADDON = xtrue ]; then
    dowait "load hst.fits"
    xjs9load $XARGS "${BLDIR}/hst.fits" '{"scale":"log","scaleclipping":"user","scalemin":0,"scalemax":5,"colormap":"heat","contrast":4.0,"bias":0.67}'
    dowait "reproject hst using the chandra wcs"
    xjs9 $XARGS ReprojectData chandra.fits > /dev/null
    dowait "set params hst.fits"
    xjs9 $XARGS SetColormap 3.0 0.535 > /dev/null
    xjs9 $XARGS SetZoom $ZOOM > /dev/null
    xjs9 $XARGS BlendImage "screen" 1 true > /dev/null
fi

dowait "blend the images"
xjs9 $XARGS BlendDisplay true > /dev/null
