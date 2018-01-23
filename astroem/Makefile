# astroem: astronomy/astrophysics C code compiled to javascript via emscripten
# see: http://kripken.github.io/emscripten-site/index.html

# output file name for the emscripten-compiled javascript file
ASTROEMJS	=	astroem.js
# files for wasm support:
ASTROEMWJS	=	astroemw.js
ASTROEMWASM	=	astroemw.wasm

# where is output file is installed
INSTALLDIR =	../js

# astroem: emscripten-compiled bitcode for astronomical libraries
ASTROEM =	$$HOME/astroem

# emcc compiler flags
# NB: -O2 is the recommended optimization (not -O3, as of 1/27/2015)
# can't use mem file: we don't know where the mem file will resides
# EMFLAGS = 	-g --memory-init-file 0
# EMFLAGS = 	-DEM -g --memory-init-file 0
# debugging
# EMFLAGS	= 	-DEM --memory-init-file 0 -s ASSERTIONS=1
# debugging with symbols
# EMFLAGS	= 	-DEM -O0 --memory-init-file 0  -s ASSERTIONS=1
# production
EMFLAGS	= 	-O3 --memory-init-file 0

# support zscale up to 2048 * 2048 * 4-byte images
# EMOPTS =	-s TOTAL_MEMORY=33554432
# support zscale up to 4096 * 4096 * 4-byte images
# EMOPTS =	-s TOTAL_MEMORY=67108864
# cfitsio requires memory growth
# but disable asm.js validation to avoid chrome slowdown with memory growth:
# https://github.com/kripken/emscripten/wiki/Chrome-Perf-Issues
EMOPTS =	-s TOTAL_MEMORY=67108864 -s ALLOW_MEMORY_GROWTH=1 -s ASM_JS=2
# wasm support:
WASMOPTS =	-s WASM=1
# WASMOPTS =	-s WASM=1 -s SAFE_HEAP=1 -s ASSERTIONS=1

EMEXPORTS =	-s EXPORTED_FUNCTIONS="['_initwcs', '_freewcs', '_wcsinfo', '_pix2wcsstr', '_wcs2pixstr', '_reg2wcsstr', '_wcssys', '_wcsunits', '_saostrtod', '_saodtype', '_zscale', '_gzopen', '_gzread', '_gzwrite', '_gzclose', '_gzseek',  '_BZ2_bzopen', '_BZ2_bzread', '_BZ2_bzwrite', '_BZ2_bzclose', '_openFITSFile', '_openFITSMem', '_getImageToArray', '_filterTableToImage', '_getHeaderToString', '_closeFITSFile', '_maxFITSMemory', '_ffgerr', '_ffmahd', '_ffghdn','_ffmnhd', '_ffghdt', '_ffgky', '_fffree', '_listhdu', '_tanhdr', '_reproject', '_vls', '_vcat']" -s EXTRA_EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap']"

# include directories
EMINCS =	-I./include

# extras to build emscripten runtime
EMEXTRAS =	--pre-js pre.js --post-js post.js

# top-level
SRCS =  	wrappers.c
OBJS = 		$(SRCS:%.c=%.o)

# wrapper for cfitsio
JSFITSIO =	./jsfitsio
JSRCS =  	$(JSFITSIO)/jsfitsio.c $(JSFITSIO)/healpix.c \
		$(JSFITSIO)/listhdu.c
JOBJS = 	$(JSRCS:%.c=%.o)

# montage (re-project)
MONTAGE =	./montage
MSRCS =		$(MONTAGE)/mProjectPP_nomain.c \
		$(MONTAGE)/mTANHdr_nomain.c \
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

# zlib
ZEXTRA =		./zextra
ZSRCS =		$(ZEXTRA)/zcompress.c \
		$(ZEXTRA)/zuncompress.c
ZOBJS = 	$(ZSRCS:%.c=%.o)

# iraf zscale
ZSCALE =	./zscale
ZSSRCS =	$(ZSCALE)/cdlzscale.c
ZSOBJS = 	$(ZSSRCS:%.c=%.o)

PKGOBJS =	$(JOBJS) $(MOBJS) $(UOBJS) $(ZOBJS) $(ZSOBJS)
PKGDIRS =	$(JSFITSIO) $(MONTAGE) $(UTIL) $(ZSCALE) $(ZEXTRA)

LIBS =		lib/libwcs.a lib/libcfitsio.a lib/libz.a lib/libbz2.a

# combine into EMCC command
EMCC =		emcc $(EMFLAGS) $(EMOPTS) $(EMEXPORTS) $(EMINCS) $(EMEXTRAS)

# flags to generate all emcc objects (i.e. so default rule for $(CC) runs emcc)
CC =		emcc $(EMFLAGS) -I./include -I$(JSFITSIO) -I$(UTIL) -I$(ZSCALE) -D'exit(n)=em_exit(n)'

all:		$(ASTROEMJS) $(ASTROEMWJS)

astroem.bc:	$(OBJS) $(PKGOBJS) $(LIBS)
		$(EMCC) -o $@ $+

$(ASTROEMJS):	astroem.bc pre.js post.js shell-pre.js shell-post.js Makefile
		@(echo "generating raw $(ASTROEMJS) ..."; \
		$(EMCC) astroem.bc -o $(ASTROEMJS); \
		echo "adding shell wrapper to generate $(ASTROEMJS) ..."; \
		cat shell-pre.js > full_$(ASTROEMJS); \
		cat $(ASTROEMJS) >> full_$(ASTROEMJS); \
		cat shell-post.js >> full_$(ASTROEMJS); \
		mv full_$(ASTROEMJS) $(ASTROEMJS);)

$(ASTROEMWJS):	astroem.bc pre.js post.js shell-pre.js shell-post.js Makefile
		@(echo "generating raw $(ASTROEMWJS) ..."; \
		$(EMCC) $(WASMOPTS) astroem.bc -o $(ASTROEMWJS); \
		echo "adding shell wrapper to generate $(ASTROEMWJS) ..."; \
		cat shell-pre.js > full_$(ASTROEMWJS); \
		cat $(ASTROEMWJS) >> full_$(ASTROEMWJS); \
		cat shell-post.js >> full_$(ASTROEMWJS); \
		mv full_$(ASTROEMWJS) $(ASTROEMWJS);)

install:	FORCE
		@(if [ -d $(INSTALLDIR) ]; then \
		    echo "installing $(ASTROEMJS) in: $(INSTALLDIR)"; \
		    cp -p $(ASTROEMJS) $(INSTALLDIR)/.; \
		    cp -p $(ASTROEMJS) $(INSTALLDIR)/..; \
		    if [ x"$(ASTROEMWASM)" != x ]; then \
		      echo "also installing $(ASTROEMWJS): $(INSTALLDIR)"; \
		      cp -p $(ASTROEMWJS)  $(INSTALLDIR)/.; \
		      cp -p $(ASTROEMWJS)  $(INSTALLDIR)/..; \
		      cp -p $(ASTROEMWASM) $(INSTALLDIR)/.; \
		      cp -p $(ASTROEMWASM) $(INSTALLDIR)/..; \
		    fi; \
		    cd .. && $(MAKE) js9support; \
		  else \
		    echo "could not find JS9 directory: $(JS9)"; \
		  fi;)

# get the astroem libraries
astroem:	FORCE
		@(cp -p $(ASTROEM)/include/*.h include/.; \
		  cp -p $(ASTROEM)/lib/*.a lib/.;)

clean:		FORCE
		@(rm -rf *.o *~ a.out* foo* *.map \#*  \
		astroem.* astroemw.*; \
		for d in $(PKGDIRS); do \
		  rm -rf $$d/*{.a,.o,~}; \
		done;)

FORCE:
