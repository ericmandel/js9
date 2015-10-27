#!/bin/bash
# set -x

echo "Content-Type: text/plain
"

#
# site-specific variables (filled in my mkcgi)
#
# root of Web tree where js9 is installed: same as $WEBDIR in Makefile
JROOT=""
# directory where js9 command-line tools are installed:
# taken from $prefix/bin or $exec_prefix/bin in Makefile
JBIN=""
# directory containing wrapper files
# taken from analysisWrappers in js9Prefs.json
JWRAPPERS=""
# same as fits2png action in fits2png.json
JFITS2PNG=""
# taken from analysisPlugins in js9Prefs.json
JPLUGINS=""
# directory(/ies) where your CGI analysis tools are installed
JXPATH=""
# work directory
JWORKDIR=""
# whether loadproxy is enabled
JLOADPROXY=""
# directory(/ies) where your local data files are stored
# taken from analysisWrappers in js9Prefs.json
JDATAPATH=""

# these are passed to scripts
export JS9_DIR="$JROOT"

# append path(s) where JS9 and analysis tools are located
export PATH="$PATH:$JBIN:$JXPATH"

# generate datapath for commands that needs it
if [ x"$JDATAPATH" != x ]; then
    export JS9_DATAPATH="$JDATAPATH"
fi

# error handler: send to stderr for node.js processing
# and send to stdout for cgi processing ... sigh ...
error() {
  echo "ERROR: $1"
  echo "ERROR: $1" >&2
  exit 1
}

# temporary file
tmpbase=`basename $0`
TMPFILE=`mktemp /tmp/${tmpbase}.XXXXXX` || error "Cannot create temp file"

# start in the root directory, as if this was running under node.js
if [ -d "$JROOT" ]; then
  cd "$JROOT" || error "Cannot find root of Web tree for CGI processing"
else
  error "Root of Web tree not configured for CGI processing"
fi

# save POST in GET variable
if [ "$REQUEST_METHOD" = "POST" ]; then
  QUERY_STRING=`cat`
fi

# convert query string to args
OFS="$IFS"
IFS="&"
set -- $QUERY_STRING
IFS="$OFS"

# process args to generate key=val statements, removing dangerous characters
# keys all have "CGI" prefixes in the name, to avoid name collisions
ARGS=$*
for arg in $ARGS ; do
    OFS="$IFS"
    IFS="="
    set -- $arg
    IFS="$OFS"
    echo "$1" "$2" | 
    awk '{
        saved=$1
	gsub(/\+/,      " ")
	gsub(/%09/,     "\t")
	gsub(/%21/,     "!")
	gsub(/%23/,     "#")
	gsub(/%22/,     "\\\042")
	gsub(/%24/,     "$")
	gsub(/%26/,     "&")
	gsub(/%27/,     "\047")
	gsub(/%28/,     "(")
	gsub(/%29/,     ")")
	gsub(/%2[Bb]/,  "+")
	gsub(/%2[Cc]/,  ",")
	gsub(/%2[Dd]/,  "-")
	gsub(/%2[Ee]/,  ".")
	gsub(/%2[Ff]/,  "/")
	gsub(/%3[Aa]/,  ":")
	gsub(/%3[Bb]/,  ";")
	gsub(/%3[Cc]/,  "<")
	gsub(/%3[Dd]/,  "=")
	gsub(/%3[Ee]/,  ">")
	gsub(/%3[Ff]/,  "?")
	gsub(/%40/,     "@")
	gsub(/%5[bB]/,  "[")
	gsub(/%5[cC]/,  "\\")
	gsub(/%5[dD]/,  "]")
	gsub(/%7[bB]/,  "{")
	gsub(/%7[cC]/,  "|")
	gsub(/%7[dD]/,  "}")
	gsub(/%7[eE]/,  "~")
	gsub(/%0D/,    "\n")
	gsub(/%0[Aa]/  , "")
	gsub(/%[^2][^5]/,"")
	gsub(/%25/,     "%")
	gsub(/[`&]/,     "")
	gsub(/[`$&=;]/, "", saved)
        gsub(/\(\)[ 	]*{.*/, "")
        $1=""
	printf("CGI%s=\"%s\"\n", saved, substr($0,2))
    }' >> $TMPFILE
done

# a good place to stop when debugging
#   cat $TMPFILE
#   rm -f $TMPFILE
#   exit 0

# load the set of CGIkey=value
. $TMPFILE
rm -f $TMPFILE

# final check for cookies (seems like localhost cookies don't get set if FF)
if [ x"$HTTP_COOKIE" = x -a x"$CGIcookie" != x ]; then
  export HTTP_COOKIE="$CGIcookie"    
fi

# if data path was passed, set the environment variable
if [ x"$CGIdataPath" != x ]; then
  export JS9_DATAPATH="$CGIdataPath"
fi

# process the specified command
case $CGIkey in
    image)
	js9helper -i "$CGIimage"
	;;

    getAnalysis)
	if [ -d "$JPLUGINS" ]; then
	    JDEFS=""
	    for f in `ls $JPLUGINS/*.json`; do
		case $f in
		    */fits2png.json) continue;;
		    *) JDEF="`cat $f`"
		       if [ x"$JDEFS" = x ]; then
	    	         JDEFS="[$JDEF"
	     	       else
	    	         JDEFS="$JDEFS,$JDEF"
		       fi
		       continue;;
		esac
	    done
	    if [ x"$JDEFS" != x ]; then
	      JDEFS="$JDEFS]"
	      echo "$JDEFS"
	    fi
	fi
	;;

    runAnalysis)
	if [ -d "$JWRAPPERS" ]; then
	    # cd to the work directory, if necessary
	    if [ -d "$JWORKDIR" ]; then
		export JS9_WORKDIR="$JWORKDIR"
		cd "$JS9_WORKDIR" || error "can't find work dir: $JS9_WORKDIR"
	    fi
	    OFS="$IFS"
	    IFS=" "
	    set -- $CGIcmd
	    IFS="$OFS"
	    CMD="$JWRAPPERS/$1"
	    shift
	    $CMD $*
        else
	    error "wrapper function missing for: $CMD"
	fi
	;;

    fits2png)
	if [ -d "$JWRAPPERS" -a x"$JFITS2PNG" != x ]; then
	    OFS="$IFS"
	    IFS=" "
	    set -- $JFITS2PNG
	    IFS="$OFS"
	    CMD="$JWRAPPERS/$1"
	    shift
	    $CMD $* "$CGIfits"
        else
	    error "fits2png or wrapper function missing"
	fi
	;;

    loadproxy)
	if [ -d "$JWRAPPERS" ]; then
	    # cd to the work directory, if necessary
	    if [ x"$JLOADPROXY" != xtrue ]; then
		error "loadProxy not enabled on this host"
	    fi
	    if [ -d "$JWORKDIR" ]; then
		export JS9_WORKDIR="$JWORKDIR"
		cd "$JS9_WORKDIR" || error "can't find work dir: $JS9_WORKDIR"
	    else
		error "requires configuration of temp work directory"
	    fi
	    OFS="$IFS"
	    IFS=" "
	    set -- $CGIcmd
	    IFS="$OFS"
	    CMD="$JWRAPPERS/$1"
	    shift
	    $CMD $*
        else
	    error "wrapper function missing for: $CMD"
	fi
	;;

    *)	;;
esac
