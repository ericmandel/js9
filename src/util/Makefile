OBJS =		file.o find.o macro.o word.o swap.o xalloc.o

libutil.a:	$(OBJS)
		ar rv $@ $?
		ranlib $@

file.o:		file.c
		$(CC) -c $(CFLAGS) -o $@ $?

find.o:		find.c
		$(CC) -c $(CFLAGS) -o $@ $?

macro.o:	macro.c
		$(CC) -c $(CFLAGS) -o $@ $?

swap.o:		swap.c
		$(CC) -c $(CFLAGS) -o $@ $?

word.o:		word.c
		$(CC) -c $(CFLAGS) -o $@ $?

xalloc.o:	xalloc.c
		$(CC) -c $(CFLAGS) -o $@ $?

clean:		FORCE
		rm -rf *.o *.a *~

FORCE:
