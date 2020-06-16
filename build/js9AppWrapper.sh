#!/bin/bash

# wrapper script used by MacOS js9.app to run Electron with the user's path
mypath=`${SHELL:-/bin/bash} -c 'echo $PATH'`
if [ x"$mypath" != x ]; then
    export PATH="$mypath"
fi
exec "`dirname \"$0\"`/Electron" $@

