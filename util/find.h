/*
 *	Copyright (c) 1999-2003 Smithsonian Astrophysical Observatory
 */

/*
 *
 * find.h -- declarations for find finding
 *
 */

#ifndef	__find_h
#define	__find_h

#if HAVE_CONFIG_H
#include <conf.h>
#endif

#include <stdio.h>
#include <ctype.h>
#if HAVE_UNISTD_H
#include <unistd.h>
#endif
#if HAVE_STRING_H
#include <string.h>
#endif
#include <sys/types.h>
#include <sys/stat.h>
#include <xalloc.h>
#include <prsetup.h>

_PRbeg

char *ResolvePath _PRx((char *ibuf, char *obuf, int maxlen));
void ExpandEnv _PRx((char *name, char *fullname, int maxlen));
char *Access _PRx((char *name, char *mode));
char *Find _PRx((char *name, char *mode, char *extn, char *path));

_PRend

#endif
