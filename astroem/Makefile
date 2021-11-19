# astroem: astronomy/astrophysics C code compiled to javascript via emscripten
# see: http://kripken.github.io/emscripten-site/index.html

# astroem library containing our support code:
ASTROEMLIB	=	libastroem.a

# export files for wasm support:
ASTROEMWJS	=	astroemw.js
ASTROEMWASM	=	astroemw.wasm
# export files for non-wasm (javasript) support:
ASTROEMJS	=	astroem.js

# where is export files are installed
INSTALLDIR =	..

# use emscripten ports, rather than our own
# https://github.com/emscripten-ports
EMPORTS	=	-s USE_ZLIB=1 -s USE_BZIP2=1

# enable node file system for desktop use
EMFS =		-lnodefs.js

# emcc compiler flags
# EMFLAGS = 	-g
# debugging
# EMFLAGS	= -s ASSERTIONS=1
# debugging with symbols
# EMFLAGS	= -O0 --memory-init-file 0  -s ASSERTIONS=1 -s SAFE_HEAP=1
# production
EMFLAGS		= -O3

# initial memory: support zscale up to 4096 * 4096 * 4-byte images
# EMOPTS =	-s TOTAL_MEMORY=67108864
# cfitsio requires memory growth
EMOPTS =	-s TOTAL_MEMORY=67108864 -s ALLOW_MEMORY_GROWTH=1 $(EMPORTS) $(EMFS)
# note to myself: in the event of a catastrophic drop in performance, see:
# https://github.com/emscripten-core/emscripten/issues/13899
# and try:
# -s BINARYEN_EXTRA_PASSES=--one-caller-inline-max-function-size=1
# can't use mem file: we don't know where the mem file will resides
# (moved out of compiler switches because this gives warning as of v2.0.32)
MEMOPTS =	--memory-init-file 0
# javascript instead of wasm:
NOWASMOPTS =	-s WASM=0 $(MEMOPTS)
# wasm support:
WASMOPTS =	-s WASM=1 $(MEMOPTS)
# debugging
# WASMOPTS =	-s WASM=1 -s SAFE_HEAP=1 -s ASSERTIONS=1 $(MEMOPTS)

EMEXPORTS =	-s EXPORTED_FUNCTIONS="['_malloc', '_free', '_initwcs', '_freewcs', '_wcsinfo', '_pix2wcsstr', '_wcs2pixstr', '_reg2wcsstr', '_wcssys', '_wcsunits', '_saostrtod', '_saodtostr', '_saodtype', '_zscale', '_gzopen', '_gzread', '_gzwrite', '_gzclose', '_gzseek',  '_BZ2_bzopen', '_BZ2_bzread', '_BZ2_bzwrite', '_BZ2_bzclose', '_openFITSFile', '_openFITSMem', '_getImageToArray', '_filterTableToImage', '_getHeaderToString', '_closeFITSFile', '_maxFITSMemory', '_ffgerr', '_ffgisz', '_ffmahd', '_ffghdn','_ffmnhd', '_ffghdt', '_ffgky', '_fffree', '_listhdu', '_tanhdr', '_reproject', '_madd', '_imgtbl', '_makehdr', '_shrinkhdr', '_imsection', '_imannulusi', '_imboxi', '_imcirclei', '_imellipsei', '_imfieldi', '_imlinei', '_impiei', '_imqtpiei', '_impointi', '_impandai', '_imnannulusi', '_imnboxi', '_imnellipsei', '_imnpiei', '_impolygoni', '_imvannulusi', '_imvboxi', '_imvellipsei', '_imvpiei', '_imvpointi', '_imannulus', '_imbox', '_imcircle', '_imellipse', '_imfield', '_imline', '_impie', '_imqtpie', '_impoint', '_impanda', '_imnannulus', '_imnbox', '_imnellipse', '_imnpie', '_impolygon', '_imvannulus', '_imvbox', '_imvellipse', '_imvpie', '_imvpoint', '_regcnts', '_vls', '_vcat']" -s EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap', 'writeArrayToMemory', 'writeAsciiToMemory']"

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
		$(JSFITSIO)/listhdu.c js9helper.c
JOBJS = 	$(JSRCS:%.c=%.o)

# montage (re-project)
MONTAGE =	./montage
MSRCS =		$(MONTAGE)/mGlobals.c \
		$(MONTAGE)/mProjectPP.c \
		$(MONTAGE)/mTANHdr.c \
		$(MONTAGE)/mAdd.c \
		$(MONTAGE)/mImgtbl.c \
		$(MONTAGE)/mMakeHdr.c \
		$(MONTAGE)/mShrinkHdr.c \
		$(MONTAGE)/overlapAreaPP.c \
		$(MONTAGE)/debugCheck.c \
		$(MONTAGE)/checkHdr.c \
		$(MONTAGE)/checkWCS.c \
		$(MONTAGE)/two_plane.c \
		$(MONTAGE)/distort.c \
		$(MONTAGE)/undistort.c \
		$(MONTAGE)/initdistdata.c \
		$(MONTAGE)/redefine_pointing.c \
		$(MONTAGE)/boundaries.c \
		$(MONTAGE)/get_files.c \
		$(MONTAGE)/get_hdr.c \
		$(MONTAGE)/print_rec.c \
		$(MONTAGE)/convertCoordinates.c \
		$(MONTAGE)/convertBesselianJulian.c \
		$(MONTAGE)/convertEclEqu.c \
		$(MONTAGE)/convertEquGal.c \
		$(MONTAGE)/convertGalSgal.c \
		$(MONTAGE)/computeFKCorrections.c \
		$(MONTAGE)/precessBesselian.c \
		$(MONTAGE)/precessJulian.c \
		$(MONTAGE)/ccalc.c \
		$(MONTAGE)/decimalDegreeToSex.c \
		$(MONTAGE)/sexToDecimalDegree.c \
		$(MONTAGE)/filePath.c \
		$(MONTAGE)/mtbl.c
MOBJS =		$(MSRCS:%.c=%.o)

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
PKGDIRS =	$(JSFITSIO) $(MONTAGE) $(ZSCALE) $(ZEXTRA)

LIBS =		lib/libcfitsio.a lib/libregions.a lib/libwcs.a lib/libutil.a \
		lib/libem.a
#		use Emscripten ports instead of our own
#		lib/libz.a lib/libbz2.a

# combine into EMCC command
EMCC =		emcc $(EMFLAGS) $(EMOPTS) $(EMEXPORTS) $(EMINCS) $(EMEXTRAS)

# flags to generate all emcc objects (i.e. so default rule for $(CC) runs emcc)
CC =		emcc $(EMFLAGS) -I./include -I$(JSFITSIO) -I$(ZSCALE) -D'exit(n)=em_exit(n)'

all:		$(ASTROEMLIB) $(ASTROEMJS) $(ASTROEMWJS)

# 2.0.2 breaks this technique: it generates an executable instead of bitcode
# astroem.bc:	$(OBJS) $(PKGOBJS) $(LIBS)
# 		$(EMCC) -r -o $@ $+

# replacement technique: make a library using emar:
# https://github.com/emscripten-core/emscripten/issues/12382
$(ASTROEMLIB):	$(OBJS) $(PKGOBJS)
		emar rcs $@ $?

$(ASTROEMJS):	$(ASTROEMLIB) pre.js post.js shell-pre.js shell-post.js Makefile
		@(echo "generating raw $(ASTROEMJS) ..."; \
		$(EMCC) $(NOWASMOPTS) $(ASTROEMLIB) $(LIBS) -o $(ASTROEMJS); \
		echo "adding shell wrapper to generate $(ASTROEMJS) ..."; \
		cat shell-pre.js > full_$(ASTROEMJS); \
		cat $(ASTROEMJS) >> full_$(ASTROEMJS); \
		cat shell-post.js >> full_$(ASTROEMJS); \
		mv full_$(ASTROEMJS) $(ASTROEMJS);)

$(ASTROEMWJS):	$(ASTROEMLIB) pre.js post.js shell-pre.js shell-post.js Makefile
		@(echo "generating raw $(ASTROEMWJS) ..."; \
		$(EMCC) $(WASMOPTS) $(ASTROEMLIB) $(LIBS) -o $(ASTROEMWJS); \
		echo "adding shell wrapper to generate $(ASTROEMWJS) ..."; \
		cat shell-pre.js > full_$(ASTROEMWJS); \
		cat $(ASTROEMWJS) >> full_$(ASTROEMWJS); \
		cat shell-post.js >> full_$(ASTROEMWJS); \
		mv full_$(ASTROEMWJS) $(ASTROEMWJS);)

install:	FORCE
		@(if [ -d $(INSTALLDIR) ]; then \
		    echo "installing $(ASTROEMJS) in: $(INSTALLDIR)"; \
		    cp -p $(ASTROEMJS) $(INSTALLDIR)/.; \
		    if [ x"$(ASTROEMWASM)" != x ]; then \
		      echo "also installing $(ASTROEMWJS): $(INSTALLDIR)"; \
		      cp -p $(ASTROEMWJS)  $(INSTALLDIR)/.; \
		      cp -p $(ASTROEMWASM) $(INSTALLDIR)/.; \
		    fi; \
		    cd .. && $(MAKE) js9support; \
		  else \
		    echo "could not find JS9 directory: $(JS9)"; \
		  fi;)

clean:		FORCE
		@(rm -rf *.o *~ a.out* foo* *.map \#*  \
		astroem.* astroemw.* libastroem.a; \
		for d in $(PKGDIRS); do \
		  cd $$d; \
		  if [ -f Makefile ]; then \
		    make clean; \
		  else \
		    rm -rf $$d/*{.a,.o,~}; \
		  fi; \
		  cd ..; \
		done;)

FORCE:
