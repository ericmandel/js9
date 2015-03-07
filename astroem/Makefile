# output files
ASTROEM	=	astroem.js
# ASTROEMEXTRA =	astroem.raw.js.mem

# where is JS9 directory
JS9	= ..

# where JS version of cfitsio is located
CFITSIO = ../../cfitsio

# where C version of cfitsion is located
CFITSIOC = ../../soft/cfitsio

# emcc compiler flags
# NB: -O2 is the recommended optimization (not -O3, as of 1/27/2015)
# can't use mem file: we don't know where the mem file will resides
# EMFLAGS	= 	-g --memory-init-file 0 -I$(CFITSIO)
EMFLAGS	= 	-O2 --memory-init-file 0 -I$(CFITSIO)

# support zscale up to 2048 * 2048 * 4-byte images
# EMOPTS =	-s TOTAL_MEMORY=33554432
# support zscale up to 4096 * 4096 * 4-byte images
# EMOPTS =	-s TOTAL_MEMORY=67108864
# semi-arbitrarily large files, but disables asm.js compilation
# cfitsio requires this:
EMOPTS =	-s TOTAL_MEMORY=67108864 -s ALLOW_MEMORY_GROWTH=1

EMEXPORTS =	-s EXPORTED_FUNCTIONS="['_initwcs', '_pix2wcsstr', '_wcs2pixstr', '_reg2wcsstr', '_wcssys', '_wcsunits', '_saostrtod', '_zscale', '_gzopen', '_gzread', '_gzwrite', '_gzclose', '_gzseek', '_openFITSFile', '_openFITSMem', '_getImageToArray', '_filterTableToImage', '_getHeaderToString', '_closeFITSFile', '_ffgerr']"

EMEXTRAS =	--pre-js pre.js --post-js post.js

# combine into EMCC command
EMCC =		emcc $(EMFLAGS) $(EMOPTS) $(EMEXPORTS) $(EMEXTRAS)

# needed to generate emcc objects
CC =		emcc $(EMFLAGS)

SRCS =  	wrappers.c wcsinit.c wcs.c wcscon.c \
		hget.c hput.c iget.c worldpos.c platepos.c \
		tnxpos.c zpxpos.c dsspos.c poly.c \
	        wcslib.c lin.c cel.c proj.c sph.c wcstrig.c \
		dateutil.c distort.c \
		strtod.c \
		cdlzscale.c \
		jsfitsio.c

OBJS =  	wrappers.o wcsinit.o wcs.o wcscon.o \
		hget.o hput.o iget.o worldpos.o platepos.o \
		tnxpos.o zpxpos.o dsspos.o poly.o \
	        wcslib.o lin.o cel.o proj.o sph.o wcstrig.o \
		dateutil.o distort.o \
		strtod.o \
		cdlzscale.o \
		jsfitsio.o

ZOBJS = 	./zee.js/adler32.o \
		./zee.js/compress.o \
		./zee.js/crc32.o \
		./zee.js/deflate.o \
		./zee.js/gzclose.o \
		./zee.js/gzlib.o \
		./zee.js/gzread.o \
		./zee.js/gzwrite.o \
		./zee.js/infback.o \
		./zee.js/inffast.o \
		./zee.js/inflate.o \
		./zee.js/inftrees.o \
		./zee.js/trees.o \
		./zee.js/uncompr.o \
		./zee.js/zutil.o

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

LIBCFLAGS =	-fno-common -D__x86_64__

cfitsio:	FORCE
		@(CDIR=`pwd`; cd $(CFITSIO); \
		emconfigure ./configure; \
		emmake make CFLAGS="$(LIBCFLAGS)" clean all-nofitsio ;\
		cp -p libcfitsio.a $${CDIR};)

zlib:		FORCE
		@(CDIR=`pwd`; cd $(Z); \
		emconfigure ./configure; \
		emmake make CFLAGS="$(LIBCFLAGS)" clean all;\
		cp -p libz.a $${CDIR};)

clean:		FORCE
		rm -rf *.o *~ a.out* foo* *.map \#* zee.js/*.o \
		cimtest cimtest.js cimtest.html \
		cnodetest cnodetest.js cnodetest.html


# make c version for testing
LDFLAGS	= -g

test.o: 	test.c
		gcc -c test.c

test:		test.o -g -Wall $(SRCS)
		gcc $(CFLAGS) -Wall -o test test.o $(SRCS)

FORCE:
