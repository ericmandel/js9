/*
 *	Copyright (c) 1999-2003 Smithsonian Astrophysical Observatory
 */

/*
 *
 * macro.h - include file for the macro expander
 *
 */

#ifndef	__macro_h
#define	__macro_h

#if HAVE_CONFIG_H
#include <conf.h>
#endif

#include <stdio.h>
#include <ctype.h>
#ifdef HAVE_STRING_H
#include <string.h>
#endif
#ifdef HAVE_MALLOC_H
#include <malloc.h>
#endif
#ifdef HAVE_STDLIB_H
#include <stdlib.h>
#endif
#include <prsetup.h>

typedef char *(*MacroCall)(
#ifdef ANSI_FUNC
    char *s,
    void *client_data
#endif
);

_PRbeg
char *ExpandMacro _PRx((char *icmd, char **keyword, char **value, int nkey,
			MacroCall client_callback, void *client_data));
_PRend

#endif /* __macro.h */
