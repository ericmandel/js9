#!/bin/bash

# site configuration
if [ -f ./js9config.cgi ]; then
  . ./js9config.cgi
fi

# default simbad URL
URL=https://simbad.u-strasbg.fr

# error handler
error() {
  echo "ERROR: $*"
  exit 1
}

# preamble
if [ "$HTTP_HOST" != "" ] ; then
    echo "Access-Control-Allow-Origin: *"
    echo "Content-Type: text/plain"
    echo ""
fi

# we need wget or curl to retrieve the image
hash wget 1>/dev/null 2>&1
if [ $? = 0 ]; then
  URLGET="wget"
  URLGETARGS="-O- -q"
else
  hash curl 1>/dev/null 2>&1
  if [ $? = 0 ]; then
    URLGET="curl"
    URLGETARGS="-s"
  else
    error "requires either wget or curl"
  fi
fi

# allow query to be passed on command line for debugging
if [ "$QUERY_STRING" = "" ] ; then
    QUERY_STRING="$1"
fi

# get args from query string
OIFS="$IFS"
IFS="&"
set $QUERY_STRING
IFS="$OIFS"

# mandatory arg1: object id
if [ x"$1" = x ] ; then
  error "requires an astronomical object"
fi
# optional arg2: simbad url
if [ x"$2" != x ] ; then
  URL="$2"
fi

if [ $URLGET = "wget" ]; then

$URLGET $URLGETARGS $URL/simbad/sim-script?script="
output console=off script=off
set limit 1
format object form1 \"%COO(:;A;FK5;2000;2000) %COO(:;D;FK5;2000;2000)\"
query id $1
"

elif [ $URLGET = "curl" ]; then

# curl requires encoding
$URLGET $URLGETARGS $URL/simbad/sim-script --data-urlencode "script=
output console=off script=off
set limit 1
format object form1 \"%COO(:;A;FK5;2000;2000) %COO(:;D;FK5;2000;2000)\"
query id $1
"

else

error "unknown URL get method: $URLGET"

fi
