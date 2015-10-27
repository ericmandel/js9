s#\("scale" *:.*"\)[^"]*\("\)#\1log\2#
s#\("pngisfits" *: *\)false\(.*\)#\1true\2#
s#\("fits2png" *: *\)false\(.*\)#\1false\2#
s#\("workDir" *:.*"\)[^"]*\("\)#\1./tmp\2#
