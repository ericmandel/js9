# output files
ASTROEM	=	astroem.js
# ASTROEMEXTRA =	astroem.raw.js.mem

# where is JS9 directory
JS9 =		..

# where external JS version of cfitsio is built and stored
CFITSIO =	../cfitsio

# emcc compiler flags
# NB: -O2 is the recommended optimization (not -O3, as of 1/27/2015)
# can't use mem file: we don't know where the mem file will resides
# EMFLAGS = 	-g --memory-init-file 0
# EMFLAGS = 	-DEM -g --memory-init-file 0
EMFLAGS	= 	-DEM -O2 --memory-init-file 0

# support zscale up to 2048 * 2048 * 4-byte images
# EMOPTS =	-s TOTAL_MEMORY=33554432
# support zscale up to 4096 * 4096 * 4-byte images
# EMOPTS =	-s TOTAL_MEMORY=67108864
# cfitsio requires memory growth
# but disable asm.js validation to avoid chrome slowdown with memory growth:
# https://github.com/kripken/emscripten/wiki/Chrome-Perf-Issues
EMOPTS =	-s TOTAL_MEMORY=67108864 -s ALLOW_MEMORY_GROWTH=1 -s ASM_JS=2

EMEXPORTS =	-s EXPORTED_FUNCTIONS="['_initwcs', '_wcsinfo', '_pix2wcsstr', '_wcs2pixstr', '_reg2wcsstr', '_wcssys', '_wcsunits', '_saostrtod', '_saodtype', '_zscale', '_gzopen', '_gzread', '_gzwrite', '_gzclose', '_gzseek', '_openFITSFile', '_openFITSMem', '_getImageToArray', '_filterTableToImage', '_getHeaderToString', '_closeFITSFile', '_maxFITSMemory', '_ffgerr', '_ffmahd', '_ffghdn','_ffmnhd', '_ffghdt', '_ffgky', '_listhdu', '_reproject', '_vls', '_vcat']"

EMEXTRAS =	--pre-js pre.js --post-js post.js

# top-level
SRCS =  	wrappers.c
OBJS = 		$(SRCS:%.c=%.o)

# wrapper for cfitsio
JSFITSIO =	./jsfitsio
JSRCS =  	$(JSFITSIO)/jsfitsio.c \
		$(JSFITSIO)/listhdu.c
JOBJS = 	$(JSRCS:%.c=%.o)

# montage (re-project)
MONTAGE =	./montage
MSRCS =		$(MONTAGE)/mProjectPP_nomain.c \
		$(MONTAGE)/overlapAreaPP.c \
		$(MONTAGE)/debugCheck.c \
		$(MONTAGE)/checkHdr.c \
		$(MONTAGE)/checkWCS.c \
		$(MONTAGE)/two_plane.c \
		$(MONTAGE)/distort.c \
		$(MONTAGE)/undistort.c \
		$(MONTAGE)/initdistdata.c \
		$(MONTAGE)/redefine_pointing.c
MOBJS =		$(MSRCS:%.c=%.o)

# utilities
UTIL =		./util
USRCS =		$(UTIL)/strtod.c
UOBJS = 	$(USRCS:%.c=%.o)

# wcs
WCS =		./wcs
WSRCS =  	$(WCS)/wcsinit.c \
		$(WCS)/wcs.c \
		$(WCS)/wcscon.c \
		$(WCS)/hget.c \
		$(WCS)/hput.c \
		$(WCS)/iget.c \
		$(WCS)/worldpos.c \
		$(WCS)/platepos.c \
		$(WCS)/tnxpos.c \
		$(WCS)/zpxpos.c \
		$(WCS)/dsspos.c \
		$(WCS)/poly.c \
		$(WCS)/wcslib.c \
		$(WCS)/lin.c \
		$(WCS)/cel.c \
		$(WCS)/proj.c \
		$(WCS)/sph.c \
		$(WCS)/wcstrig.c \
		$(WCS)/dateutil.c \
		$(WCS)/distort.c
WOBJS = 	$(WSRCS:%.c=%.o)

# zlib
ZLIB =		./zee.js
ZSRCS = 	$(ZLIB)/adler32.c \
		$(ZLIB)/compress.c \
		$(ZLIB)/crc32.c \
		$(ZLIB)/deflate.c \
		$(ZLIB)/gzclose.c \
		$(ZLIB)/gzlib.c \
		$(ZLIB)/gzread.c \
		$(ZLIB)/gzwrite.c \
		$(ZLIB)/infback.c \
		$(ZLIB)/inffast.c \
		$(ZLIB)/inflate.c \
		$(ZLIB)/inftrees.c \
		$(ZLIB)/trees.c \
		$(ZLIB)/uncompr.c \
		$(ZLIB)/zutil.c \
		$(ZLIB)/zcompress.c \
		$(ZLIB)/zuncompress.c
ZOBJS = 	$(ZSRCS:%.c=%.o)

# iraf zscale
ZSCALE =	./zscale
ZSSRCS =	$(ZSCALE)/cdlzscale.c
ZSOBJS = 	$(ZSSRCS:%.c=%.o)

PKGOBJS =	$(JOBJS) $(MOBJS) $(UOBJS) $(WOBJS) $(ZOBJS) $(ZSOBJS)
PKGDIRS =	$(JSFITSIO) $(MONTAGE) $(UTIL) $(WCS) $(ZSCALE) $(ZLIB)

LIBS =		lib/libcfitsio.a

# combine into EMCC command
EMCC =		emcc $(EMFLAGS) $(EMOPTS) $(EMEXPORTS) $(EMEXTRAS) -I$(CFITSIO)

# flags to generate all emcc objects (i.e. so $(CC) runs emcc)
CC =		emcc $(EMFLAGS) -I$(CFITSIO) -I$(JSFITSIO) -I$(UTIL) -I$(WCS) -I$(ZLIB) -I$(ZSCALE) -D'exit(n)=em_exit(n)'

all:		$(ASTROEM)

astroem.bc:	$(OBJS) $(PKGOBJS) $(LIBS)
		$(EMCC) -o $@ $+

$(ASTROEM):	astroem.bc pre.js post.js shell-pre.js shell-post.js Makefile
		@(echo "generating raw astroem.js ..."; \
		$(EMCC) astroem.bc -o astroem.raw.js; \
		echo "adding shell wrapper to generate astroem.js ..."; \
		cat shell-pre.js > astroem.js; \
		cat astroem.raw.js >> astroem.js; \
		cat shell-post.js >> astroem.js)

install:	FORCE
		@(if [ -d $(JS9)/js ]; then \
		    echo "installing $(ASTROEM) in JS9 directory: $(JS9)/js"; \
		    cp -p $(ASTROEM) $(JS9)/js/.; \
		    if [ x"$(ASTROEMEXTRA)" != x ]; then \
		      echo "also installing $(ASTROEMEXTRA): $(JS9)/js"; \
		      cp -p $(ASTROEMEXTRA) $(JS9)/js/.; \
		    fi; \
		    cd .. && $(MAKE) js9support; \
		  else \
		    echo "could not find JS9 directory: $(JS9)"; \
		  fi;)

# turn off cfitsio IO buffering, since 'files' are stored in memory
LIBCFLAGS =	$(EMFLAGS) -fno-common -D__x86_64__ -DNIOBUF=0 -DMINDIRECT=0
# LIBCFLAGS =	$(EMFLAGS) -fno-common -D__x86_64__

# cfitsio library
# don't make zlib in cfitsio, we'll use the emscripten version
cfitsio:	FORCE
		@(CDIR=`pwd`; cd $(CFITSIO); \
		emconfigure ./configure; \
		emmake make ZLIB_SOURCES="" CFLAGS="$(LIBCFLAGS)" \
		clean all-nofitsio ;\
		cp -p libcfitsio.a $${CDIR}/lib;)

clean:		FORCE
		@(rm -rf *.o *~ a.out* foo* *.map \#*  \
		astroem*.js astroem*.mem astroem.bc; \
		for d in $(PKGDIRS); do \
		  rm -rf $$d/*{.a,.o,~}; \
		done; \
		if [ -d $(CFITSIO) ]; then \
		    cd $(CFITSIO) && make clean 2>&1 >/dev/null; \
		fi;)

FORCE:
