#!/bin/bash
#set -x

# blend image directory relative to web page
BLEND="./blend"

timeout=3
XARGS=""
while [ x"$1" != x ]; do
    case $1 in
    -b) shift
	BLEND="$1"
        shift;;
    -h) shift
	XARGS="$XARGS -h $1"
        shift;;
    -t) shift
	timeout="$1"
        shift;;
    -y) timeout=0
	doyesno=true
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
      sleep $timeout
    fi
}

js9 $XARGS BlendDisplay false > /dev/null

echo "load chandra.fits"
../js9load $XARGS "${BLEND}/chandra.fits" '{"scale":"log","colormap":"red","contrast":5.78,"bias":0.15}'
js9 $XARGS BlendImage "screen" 1 true > /dev/null

dowait "load galex.fits"
../js9load $XARGS "${BLEND}/galex.fits" '{"scale":"log","colormap":"green","contrast":6.5,"bias":0.375}'

dowait "reproject galex using the chandra wcs"
js9 $XARGS ReprojectData "chandra.fits" > /dev/null
js9 $XARGS SetColormap "green" 5.6 0.74 > /dev/null
js9 $XARGS BlendImage "screen" 1 true > /dev/null

dowait "load spitzer.fits"
../js9load $XARGS "${BLEND}/spitzer.fits" '{"scale":"log","colormap":"blue","contrast":4.89,"bias":0.41}'

dowait "reproject spitzer using the chandra wcs"
js9 $XARGS ReprojectData "chandra.fits" > /dev/null
js9 $XARGS SetColormap "blue" 6.3 0.54 > /dev/null
js9 $XARGS BlendImage "screen" 1 true > /dev/null

dowait "blend all three images"
js9 $XARGS BlendDisplay true > /dev/null
