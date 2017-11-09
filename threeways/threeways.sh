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
        read -p "$ASK" -n 1 -r
	echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]
        then
            exit
        fi
    else
      echo "$ACT"
      sleep $timeout
    fi
}

js9 $XARGS BlendDisplay false > /dev/null

echo 'load ../blend/chandra.fits'
../js9load $XARGS '../blend/chandra.fits' '{"scale":"log","colormap":"red","contrast":5.78,"bias":0.15}'
js9 $XARGS BlendImage 'screen' 1 true > /dev/null

dowait 'load ../blend/galex.fits'
../js9load $XARGS '../blend/galex.fits' '{"scale":"log","colormap":"green","contrast":6.25,"bias":0.25}'

dowait 'reproject using chandra wcs'
js9 $XARGS ReprojectData 'chandra.fits' > /dev/null
js9 $XARGS SetColormap 'green' 5.6 0.74 > /dev/null
js9 $XARGS BlendImage 'screen' 1 true > /dev/null

dowait 'load ../blend/spitzer.fits'
../js9load $XARGS '../blend/spitzer.fits' '{"scale":"log","colormap":"blue","contrast":6.3,"bias":0.54}'

dowait 'reproject using chandra wcs'
js9 $XARGS ReprojectData 'chandra.fits' > /dev/null
js9 $XARGS SetColormap 'blue' 6.3 0.54 > /dev/null
js9 $XARGS BlendImage 'screen' 1 true > /dev/null

dowait 'blend all three images'
js9 $XARGS BlendDisplay true > /dev/null

dowait 'separate into three displays'
js9 $XARGS SeparateDisplay true > /dev/null

dowait 'gather again into one display'
js9 $XARGS GatherDisplay true > /dev/null
