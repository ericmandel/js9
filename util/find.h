/*
 *	Copyright (c) 2015 Smithsonian Astrophysical Observatory
 */

/*
 *
 * find.h -- declarations for find finding
 *
 */

#ifndef	__find_h
#define	__find_h

#include "xutil.h"
#include "xalloc.h"

char *ResolvePath(char *ibuf, char *obuf, int maxlen);
void ExpandEnv(char *name, char *fullname, int maxlen);
char *Access(char *name, char *mode);
char *Find(char *name, char *mode, char *extn, char *path);

#endif
