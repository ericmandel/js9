RM =		rm -rf
PROGS =		cimtest
LIBS =	 	-L$$HOME/lib -lcfitsio -ldl -lm
# CFLAGS =	-I. -I$$HOME/include
CC =		gcc
CFLAGS =	-Wall -I. -I$$HOME/include

all:		$(PROGS)

cimtest:	cimtest.o jsfitsio.o
		$(CC) $(LDFLAGS) $(CFLAGS) -o $@ $+ $(LIBS)


clean:		FORCE
		@($(RM) *{.a,.so,.so.?,.so.?.?,.o,.dylib} \
		  $(PROGS) $(TPROGS) \
		  *.exe core core.[0-9]* errs *pure* .nfs* \
		  foo* *~ *.log \#* TAGS *.E a.out errors \
		  gmon.out *.pg *.bak regtest.{pr,dy,co} \
		  config.info config.log autom4te.cache *.dSYM;)

FORCE:
