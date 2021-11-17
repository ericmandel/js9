RM =		rm -rf
CC =		gcc
CFLAGS =	-Wall -I. -I$$HOME/include
LDFLAGS		= -L$$HOME/lib
LIBS		= -lcfitsio -lz -lcurl -lm

OBJS0		= listhdu.o
PROG0 		= listhdu

OBJS1		= mkidx.o
PROG1 		= mkidx

OBJS2		= sortidx.o
PROG2 		= sortidx

OBJS3		= evcube.o jsfitsio.o healpix.o idx.o
PROG3 		= evcube

all:		$(PROG0)

All:		$(PROG0) $(PROG1) $(PROG2) $(PROG3)

$(PROG0):	$(OBJS0)
		$(CC) $(LDFLAGS) $(CFLAGS) -o $@ $+ $(LIBS)

$(PROG1):	$(OBJS1)
		$(CC) $(CFLAGS) $^ -o $@ $(LDFLAGS) $(LIBS)

$(PROG2):	$(OBJS2)
		$(CC) $(CFLAGS) $^ -o $@ $(LDFLAGS) $(LIBS)

$(PROG3):	$(OBJS3)
		$(CC) $(CFLAGS) $^ -o $@ $(LDFLAGS) $(LIBS)

listhdu.o:	listhdu.c
		$(CC) -c $(CFLAGS) -DLISTHDUMAIN $^ -o $@

clean:		FORCE
		@($(RM) *{.a,.so,.so.?,.so.?.?,.o,.dylib} \
		  listhdu mkidx sortidx evcube \
		  *.exe core core.[0-9]* errs *pure* .nfs* \
		  foo* *~ *.log \#* TAGS *.E a.out errors \
		  gmon.out *.pg *.bak regtest.{pr,dy,co} \
		  config.info config.log autom4te.cache *.dSYM;)

FORCE:
