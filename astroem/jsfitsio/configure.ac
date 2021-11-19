#	This file is an input file used by the GNU "autoconf" program to
#	generate the file "configure", which is run during JS9 installation
#	to configure the system for the local environment.
AC_INIT(jsfitsio, 1.0, emandel@cfa.harvard.edu, jsfitsio.c)

AC_CANONICAL_HOST

AC_PROG_CC
AC_MSG_CHECKING([C compiler flags])
case $CC in
    *icc* )
      CFLAGS="-axW $CFLAGS"
      ;;
esac
AC_MSG_RESULT(OK)

# check for rflag
case $host_os in
  *solaris*|*Solaris* )
    RFLAG="-R"
    ;;
  *linux*|*Linux* )
    RFLAG="-Wl,-R"
    ;;
  * )
    RFLAG=""
    ;;
esac

AC_PROG_RANLIB

AC_CHECK_SIZEOF([void *])
case $ac_cv_sizeof_void_p in
    8) LSUFFIX="64";;
esac

AC_HEADER_STDC
AC_CHECK_HEADERS(malloc.h)
AC_CHECK_HEADERS(getopt.h)
AC_CHECK_HEADERS(pwd.h)
AC_CHECK_HEADERS(dlfcn.h)
AC_CHECK_HEADERS(setjmp.h)
AC_CHECK_HEADERS(values.h)

# check for external cfitsio libraries
AC_MSG_CHECKING(for cfitsio)
AC_ARG_WITH(cfitsio,
    [ --with-cfitsio=<path> cfitsio directory e.g. /soft/cfitsio], havelib=1, havelib=0)
if test x"$havelib" = x1 ; then
  CFITSIOBASE=$withval
  # make sure essential libraries are present
  if test -r $CFITSIOBASE/lib$LSUFFIX/libcfitsio.a -o \
	    -r $CFITSIOBASE/lib$LSUFFIX/libcfitsio.so -o \
	    -r $CFITSIOBASE/lib$LSUFFIX/libcfitsio.dylib; then
      CFITSIOLIB=$CFITSIOBASE/lib$LSUFFIX
      CFITSIOINC=$CFITSIOBASE/include
      AC_MSG_RESULT(yes ($CFITSIOBASE))
  elif test -r $CFITSIOBASE/lib/$OSSUFFIX/libcfitsio.a -o \
	    -r $CFITSIOBASE/lib/$OSSUFFIX/libcfitsio.so -o \
	    -r $CFITSIOBASE/lib/$OSSUFFIX/libcfitsio.dylib; then
      CFITSIOLIB=$CFITSIOBASE/lib/$OSSUFFIX
      CFITSIOINC=$CFITSIOBASE/include
      AC_MSG_RESULT(yes ($CFITSIOBASE))
  elif test -r $CFITSIOBASE/lib/libcfitsio.a -o \
	    -r $CFITSIOBASE/lib/libcfitsio.so -o \
	    -r $CFITSIOBASE/lib/libcfitsio.dylib; then
      CFITSIOLIB=$CFITSIOBASE/lib
      CFITSIOINC=$CFITSIOBASE/include
      AC_MSG_RESULT(yes ($CFITSIOBASE))
  else
      AC_CHECK_LIB(cfitsio, ffopen, have_cfitsio=yes, have_cfitsio=no)
      if test "$have_cfitsio" = yes; then
        CFITSIOLIB="__def__"
        CFITSIOINC="__def__"
      fi
  fi
else
  AC_MSG_RESULT(no)
fi
# make up the final switches
if test x$CFITSIOINC != x; then
  if test x$CFITSIOINC != x__def__; then
    CFITSIOINC="-I$CFITSIOINC"
  fi
fi
if test x$CFITSIOLIB != x; then
  if test x$CFITSIOLIB != x__def__; then
    CFITSIOLIB="-L $CFITSIOLIB -lcfitsio"
  else
    CFITSIOLIB="-lcfitsio"
  fi
  # cfitsio 3.440 probably requires the curl library in the link line!
  AC_CHECK_LIB(curl, curl_easy_init, CFITSIOLIB="$CFITSIOLIB -lcurl")
  # might also require bz2 library ...
  AC_CHECK_LIB(bz2, BZ2_bzReadOpen, CFITSIOLIB="$CFITSIOLIB -lbz2")
  # cfitsio 4.0.0 no longer supplies zlib routines if they are installed
  AC_CHECK_LIB(z, inflate, CFITSIOLIB="$CFITSIOLIB -lz")
fi
if test x"${CFITSIOLIB}" = x; then
  AC_MSG_ERROR([can't find CFITSIO library, please use --with-cfitsio])
fi
# results from cfitsio search
AC_SUBST(CFITSIOINC)
AC_SUBST(CFITSIOLIB)

AC_MSG_CHECKING([$host_os configuration])
case $host_os in
    *cygwin*|*Cygwin* )
        AC_DEFINE(HAVE_CYGWIN)
        AC_MSG_RESULT(flagging Cygwin)
        ;;
    *mingw32*|*Mingw32*)
        CFLAGS="$CFLAGS -mconsole"
	EXTRA_LIBS="$EXTRA_LIBS -lwsock32"
        AC_DEFINE(HAVE_MINGW32)
        AC_MSG_RESULT(flagging MinGW)
        ;;
    * )
        if test x"$fpic" = x"yes" ; then
          if test "$CC" = "gcc" -o `$CC -v 2>&1 | grep -c gcc` != "0" ; then
	    CFLAGS="$CFLAGS -fPIC"
	    AC_MSG_RESULT(adding -fPIC to gcc)
	  else
            AC_MSG_RESULT(none)
	  fi
	else
            AC_MSG_RESULT(none)
	fi
        ;;
esac

AC_SUBST(EXTRA_LIBS)

# generate Makefiles
AC_CONFIG_FILES(Makefile)

AC_OUTPUT
