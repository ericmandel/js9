/*
 *	Copyright (c) 2015 Smithsonian Astrophysical Observatory
 */

/*
 *
 * xerror.h -- declarations for xerror handling
 *
 */

#ifndef	__xerror_h
#define	__xerror_h

#include "xutil.h"
#ifdef __STDC__
#include <stdarg.h>
#else
#include <varargs.h>
#endif

char *xerrorstring(void);
int setxerror(int flag);
FILE *setxerrorfd(FILE *fd);
void setxerrorexit(void (*rtn)(void));
void xerror(FILE *fd, char *format, ...);
char *xwarningstring(void);
int setxwarning(int flag);
void xwarning(FILE *fd, char *format, ...);

#endif
