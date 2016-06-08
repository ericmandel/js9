#	This file is an input file used by the GNU "autoconf" program to
#	generate the file "configure", which is run during XPA installation
#	to configure the system for the local environment.
AC_INIT(js9, 1.9, eric@cfa.harvard.edu, js9)

AC_MSG_CHECKING(for web install directory)
AC_ARG_WITH(webdir,
    [ --with-webdir=<path> web install directory e.g. /var/www/public_html/js9], haveweb=1, haveweb=0)
if test x"$haveweb" = x1 ; then
  WEBDIR=$withval
  AC_MSG_RESULT(yes ($WEBDIR))
else
  AC_MSG_ERROR([--with-webdir=<path> is required to specify the Web install directory])
fi
AC_SUBST(WEBDIR)

AC_MSG_CHECKING(for server-side helper type)
AC_ARG_WITH(helper,
    [ --with-helper=<type> i.e. none, nodejs, get, or post], havebe=1, havebe=0)
if test x"$havebe" = x1 ; then
  HELPER=$withval
  USEHELPER=yes
  AC_MSG_RESULT(yes ($HELPER))
else
  HELPER=none
  USEHELPER=no
  AC_MSG_RESULT(no)
fi
AC_SUBST(HELPER)
AC_SUBST(USEHELPER)

# if no back-end, we don't need a compiler, etc.
if [ test x"$USEHELPER" = xyes ]; then

AC_CONFIG_SRCDIR(./tpos.c)
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

AC_MSG_CHECKING(for cgi install directory)
AC_ARG_WITH(cgidir,
    [ --with-cgidir=<path> cgi install directory e.g. /var/www/public_html/cgi-bin], havecgi=1, havecgi=0)
if test x"$havecgi" = x1 ; then
  CGIDIR=$withval
  # make sure this directory is present
  if test -d $CGIDIR; then
    AC_MSG_RESULT(yes ($CGIDIR))
  else
    AC_MSG_RESULT(no)
    AC_MSG_ERROR([can't find cgi install dir: $CGIDIR])
  fi
else
  AC_MSG_RESULT(no)
fi
AC_SUBST(CGIDIR)

AC_MSG_CHECKING(for cgi url)
AC_ARG_WITH(cgiurl,
    [ --with-cgiurl=<url> cgi relative url e.g. ./cgi-bin], havecgi=1, havecgi=0)
if test x"$havecgi" = x1 ; then
  CGIURL=$withval
  AC_MSG_RESULT(yes ($CGIURL))
else
  AC_MSG_RESULT(no)
fi
AC_SUBST(CGIURL)

AC_MSG_CHECKING(for extra directories for cgi path)
AC_ARG_WITH(cgixpath,
    [ --with-cgixpath=<dir1;dir2;...> directories to add to cgi path], havecgi=1, havecgi=0)
if test x"$havecgi" = x1 ; then
  CGIXPATH=$withval
  AC_MSG_RESULT(yes ($CGIXPATH))
else
  AC_MSG_RESULT(no)
fi
AC_SUBST(CGIXPATH)

# check for external funtools libraries
FITSLIB="none"
AC_MSG_CHECKING(for funtools)
AC_ARG_WITH(funtools,
    [ --with-funtools=<path> funtools directory e.g. /soft/funtools], havelib=1, havelib=0)
if test x"$havelib" = x1 ; then
  FUNTOOLSBASE=$withval
  # make sure essential libraries are present
  if test -r $FUNTOOLSBASE/lib$LSUFFIX/libfuntools.a -o \
	    -r $FUNTOOLSBASE/lib$LSUFFIX/libfuntools.so -o \
	    -r $FUNTOOLSBASE/lib$LSUFFIX/libfuntools.dylib; then
      FUNTOOLSLIB=$FUNTOOLSBASE/lib$LSUFFIX
      FUNTOOLSINC=$FUNTOOLSBASE/include
      AC_MSG_RESULT(yes ($FUNTOOLSBASE))
  elif test -r $FUNTOOLSBASE/lib/libfuntools.a -o \
	    -r $FUNTOOLSBASE/lib/libfuntools.so -o \
	    -r $FUNTOOLSBASE/lib/libfuntools.dylib; then
      FUNTOOLSLIB=$FUNTOOLSBASE/lib
      FUNTOOLSINC=$FUNTOOLSBASE/include
      AC_MSG_RESULT(yes ($FUNTOOLSBASE))
  else
    AC_MSG_RESULT(no)
  fi
else
  AC_MSG_RESULT(no)
fi
# make up the final switches
if test x$FUNTOOLSINC != x; then
  FUNINC="-I$FUNTOOLSINC -DHAVE_FUNTOOLS"
fi
if test x$FUNTOOLSLIB != x; then
  FUNLIB="-L $FUNTOOLSLIB -lfuntools"
  FITSLIB="funtools"
fi
# results from funtools search
AC_SUBST(FUNINC)
AC_SUBST(FUNLIB)

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
  elif test -r $CFITSIOBASE/lib/libcfitsio.a -o \
	    -r $CFITSIOBASE/lib/libcfitsio.so -o \
	    -r $CFITSIOBASE/lib/libcfitsio.dylib; then
      CFITSIOLIB=$CFITSIOBASE/lib
      CFITSIOINC=$CFITSIOBASE/include
      AC_MSG_RESULT(yes ($CFITSIOBASE))
  else
    AC_MSG_RESULT(no)
  fi
else
  AC_MSG_RESULT(no)
fi
# make up the final switches
if test x$CFITSIOINC != x; then
  CFITSIOINC="-I$CFITSIOINC -DHAVE_CFITSIO"
fi
if test x$CFITSIOLIB != x; then
  CFITSIOLIB="-L $CFITSIOLIB -lcfitsio"
  CFITSIOOBJS="jsfitsio.o"
  FITSLIB="cfitsio"
fi
# results from cfitsio search
AC_SUBST(CFITSIOINC)
AC_SUBST(CFITSIOLIB)
AC_SUBST(CFITSIOOBJS)

# which fits library (if any)
AC_SUBST(FITSLIB)

if test x"${CFITSIOINC}${FUNINC}" = x; then
  AC_MSG_RESULT(no funtools or cfitsio: back-end programs will not be built)
  USEHELPER="no"
fi

# check for external png libraries
AC_MSG_CHECKING(for png)
AC_ARG_WITH(png,
    [ --with-png=<path> directory containing lib/libpng e.g. /usr/local], havelib=1, havelib=0)
if test x"$havelib" = x1 ; then
  PNGBASE=$withval
  # make sure essential libraries are present
  if test -r $PNGBASE/lib$LSUFFIX/libpng.a -o \
          -r $PNGBASE/lib$LSUFFIX/libpng.so -o \
	  -r $PNGBASE/lib$LSUFFIX/libpng.dylib; then
      PNGLIB="-L $PNGBASE/lib$LSUFFIX -lpng"
      if test x"$RFLAG" != x; then
          PNGLIB="$RFLAG $PNGBASE/lib$LSUFFIX $PNGLIB"
      fi
      PNGINC="-I$PNGBASE/include"
      AC_MSG_RESULT(yes ($PNGBASE))
  elif test -r $PNGBASE/lib/libpng.a -o \
	    -r $PNGBASE/lib/libpng.so -o \
	    -r $PNGBASE/lib/libpng.dylib; then
      PNGLIB="-L $PNGBASE/lib -lpng"
      if test x"$RFLAG" != x; then
          PNGLIB="$RFLAG $PNGBASE/lib $PNGLIB"
      fi
      PNGINC="-I$PNGBASE/include"
      AC_MSG_RESULT(yes ($PNGBASE))
  else
    AC_MSG_RESULT(no)
    AC_MSG_ERROR([can't find png library])
  fi
else
  AC_CHECK_LIB(png, png_create_write_struct, have_png=yes, have_png=no)
  if test "$have_png" = yes; then
    PNGLIB="-lpng"
    PNGINC=""
  else
    AC_MSG_ERROR([png library is required (visit: http://www.libpng.org)])
  fi
fi
# results from png search
AC_SUBST(PNGLIB)
AC_SUBST(PNGINC)

AC_CHECK_FUNC(connect)
if test $ac_cv_func_connect = no; then
  AC_CHECK_LIB(socket, connect,  EXTRA_LIBS="$EXTRA_LIBS -lsocket")
fi
AC_CHECK_FUNC(gethostbyname)
if test $ac_cv_func_gethostbyname = no; then
  AC_CHECK_LIB(nsl, gethostbyname, EXTRA_LIBS="$EXTRA_LIBS -lnsl")
fi
AC_CHECK_LIB(dl, dlopen, EXTRA_LIBS="$EXTRA_LIBS -ldl")

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

fi

AC_MSG_CHECKING(for sao top-level install directory)
AC_ARG_WITH(saodir,
    [ --with-saodir=<path> top install directory e.g. /var/www/public_html], havetop=1, havetop=0)
if test x"$havetop" = x1 ; then
  SAODIR=$withval
  AC_MSG_RESULT(yes ($SAODIR))
else
  SAODIR=""
  AC_MSG_RESULT(no)
fi
AC_SUBST(SAODIR)

AC_CONFIG_FILES(Makefile)

# generate pkg-config meta-data file
AC_CONFIG_FILES(js9helper.pc)

AC_OUTPUT
