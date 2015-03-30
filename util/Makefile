OBJS =		file.o find.o macro.o word.o xalloc.o

libutil.a:	$(OBJS)
		ar rv $@ $?
		ranlib $@

file.o:		file.c
		$(CC) -c $(CFLAGS) -o $@ file.c

find.o:		find.c
		$(CC) -c $(CFLAGS) -o $@ find.c

macro.o:	macro.c
		$(CC) -c $(CFLAGS) -o $@ macro.c

word.o:		word.c
		$(CC) -c $(CFLAGS) -o $@ word.c

xalloc.o:	xalloc.c
		$(CC) -c $(CFLAGS) -o $@ xalloc.c

