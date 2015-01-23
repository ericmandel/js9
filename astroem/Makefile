# output files
ASTROEM	=	astroem.js
ASTROEMEXTRA =	astroem.raw.js.mem

# where is JS9 directory
JS9	= ..

# emcc compiler flags
EMFLAGS	= 	-O3

# support zscale up to 2048 * 2048 * 4-byte images
# EMOPTS =	-s TOTAL_MEMORY=33554432
# support zscale up to 4096 * 4096 * 4-byte images
EMOPTS =	-s TOTAL_MEMORY=67108864
# support zscale in semi-arbitrarily large files
# but disables asm.js compilation
# EMOPTS =	-s TOTAL_MEMORY=33554432 -s ALLOW_MEMORY_GROWTH=1

EMEXPORTS =	-s EXPORTED_FUNCTIONS="['_initwcs', '_pix2wcsstr', '_wcs2pixstr', '_reg2wcsstr', '_wcssys', '_wcsunits', '_saostrtod', '_zscale', '_gzopen', '_gzread', '_gzwrite', '_gzclose', '_gzseek']"

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
		cdlzscale.c

OBJS =  	wrappers.o wcsinit.o wcs.o wcscon.o \
		hget.o hput.o iget.o worldpos.o platepos.o \
		tnxpos.o zpxpos.o dsspos.o poly.o \
	        wcslib.o lin.o cel.o proj.o sph.o wcstrig.o \
		dateutil.o distort.o \
		strtod.o \
		cdlzscale.o

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

all:		$(ASTROEM)

astroem.bc:	$(OBJS) $(ZOBJS)
		$(EMCC) $(OBJS) $(ZOBJS) -o $@

$(ASTROEM):	astroem.bc
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
		    echo "also installing $(ASTROEMEXTRA): $(JS9)/js"; \
		    cp -p $(ASTROEMEXTRA) $(JS9)/js/.; \
		  else \
		    echo "could not find JS9 directory: $(JS9)"; \
		  fi;)

clean:		FORCE
		rm -rf *.o *~ a.out* foo* *.map \#* zee.js/*.o

# make c version for testing
LDFLAGS	= -g

test.o: 	test.c
		gcc -c test.c

test:		test.o -g -Wall $(SRCS)
		gcc $(CFLAGS) -Wall -o test test.o $(SRCS)

FORCE:
