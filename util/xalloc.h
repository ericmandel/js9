/*
 *	Copyright (c) 2015 Smithsonian Astrophysical Observatory
 */

/*
 *
 * xalloc.h -- declarations for safe (error-checked) memory allocation
 *
 */

#ifndef	__xalloc_h
#define	__xalloc_h

#include "xutil.h"
#ifdef HAVE_SETJMP_H
#define XALLOC_SETJMP 142857
#include <setjmp.h>
#endif

void *xmalloc(size_t n);
void *xcalloc(size_t n, size_t s);
void *xrealloc(void *p, size_t n);
void xfree(void *p);
char *xstrdup(char *s);
#if HAVE_SETJMP
void xalloc_savejmp(jmp_buf *env);
#endif

#endif
