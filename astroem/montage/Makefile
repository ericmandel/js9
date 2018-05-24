BASE =		$$HOME
CFLAGS=		-I$(BASE)/include
LIBS=		-L$(BASE)/lib -lwcs -lcfitsio -lm

MSRCS =		mtest.c \
		mProjectPP.c \
		overlapAreaPP.c \
		debugCheck.c \
		checkHdr.c \
		checkWCS.c \
		two_plane.c \
		distort.c \
		undistort.c \
		initdistdata.c \
		redefine_pointing.c
MOBJS =		$(MSRCS:%.c=%.o)

PROGS =		mtest

all:		$(PROGS)

mtest:		$(MOBJS)
		$(CC) -o $@ $+ $(LIBS)

clean:		FORCE
		@(rm -rf $(PROGS) *.o *~ a.out* foo* *.map \#* mProjectPP)

FORCE:
