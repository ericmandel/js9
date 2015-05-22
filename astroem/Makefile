# output files
ASTROEM	=	astroem.js
# ASTROEMEXTRA =	astroem.raw.js.mem

# where is JS9 directory
JS9	= ..

# where JS version of cfitsio is located
CFITSIO = ../../cfitsio

# where C version of cfitsion is located
CFITSIOC = ../../soft/cfitsio

# where zlib sources are located
ZLIB=./zee.js

# emcc compiler flags
# NB: -O2 is the recommended optimization (not -O3, as of 1/27/2015)
# can't use mem file: we don't know where the mem file will resides
# EMFLAGS	= 	-g --memory-init-file 0
# EMFLAGS	= 	-DEM -g --memory-init-file 0
EMFLAGS	= 	-DEM -O2 --memory-init-file 0

# support zscale up to 2048 * 2048 * 4-byte images
# EMOPTS =	-s TOTAL_MEMORY=33554432
# support zscale up to 4096 * 4096 * 4-byte images
# EMOPTS =	-s TOTAL_MEMORY=67108864
# semi-arbitrarily large files, but disables asm.js compilation
# cfitsio requires this:
EMOPTS =	-s TOTAL_MEMORY=67108864 -s ALLOW_MEMORY_GROWTH=1

EMEXPORTS =	-s EXPORTED_FUNCTIONS="['_initwcs', '_pix2wcsstr', '_wcs2pixstr', '_reg2wcsstr', '_wcssys', '_wcsunits', '_saostrtod', '_saodtype', '_zscale', '_gzopen', '_gzread', '_gzwrite', '_gzclose', '_gzseek', '_openFITSFile', '_openFITSMem', '_getImageToArray', '_filterTableToImage', '_getHeaderToString', '_closeFITSFile', '_maxFITSMemory', '_ffgerr']"

EMEXTRAS =	--pre-js pre.js --post-js post.js

# combine into EMCC command
EMCC =		emcc $(EMFLAGS) $(EMOPTS) $(EMEXPORTS) $(EMEXTRAS) -I$(CFITSIO)

# needed to generate emcc objects
CC =		emcc $(EMFLAGS) -I$(CFITSIO)

SRCS =  	wrappers.c wcsinit.c wcs.c wcscon.c \
		hget.c hput.c iget.c worldpos.c platepos.c \
		tnxpos.c zpxpos.c dsspos.c poly.c \
	        wcslib.c lin.c cel.c proj.c sph.c wcstrig.c \
		dateutil.c distort.c \
		strtod.c \
		cdlzscale.c \
		jsfitsio.c

OBJS = 		$(SRCS:%.c=%.o)

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

LIBS =		libcfitsio.a

all:		$(ASTROEM)

astroem.bc:	$(OBJS) $(ZOBJS) $(LIBS)
		$(EMCC) $(OBJS) $(ZOBJS) $(LIBS) -o $@

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
		cp -p libcfitsio.a $${CDIR};)

clean:		FORCE
		@(rm -rf *.o *~ a.out* foo* *.map \#* $(ZLIB)/*.o  \
		astroem*.js astroem*.mem astroem.bc \
		cimtest cimtest.js cimtest.html \
		cnodetest cnodetest.js cnodetest.html)

# make c version for testing
LDFLAGS	= -g

test.o: 	test.c
		gcc -c test.c

test:		test.o -g -Wall $(SRCS)
		gcc $(CFLAGS) -Wall -o test test.o $(SRCS)

FORCE:
