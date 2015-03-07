/*
 *	Copyright (c) 1999-2003 Smithsonian Astrophysical Observatory
 */

/*
 *
 * word.h -- declarations for word parsing
 *
 */

#ifndef	__word_h
#define	__word_h

#if HAVE_CONFIG_H
#include <conf.h>
#endif
#ifdef HAVE_STRING_H
#include <string.h>
#endif
#if HAVE_MALLOC_H
#include <malloc.h>
#endif
#if HAVE_STDLIB_H
#include <stdlib.h>
#endif
#include <prsetup.h>
#include <xalloc.h>

/* defines the types of callback procedure we use */
typedef char *(*MacroCB)(
#ifdef ANSI_FUNC
    char *buf,
    void *client_data
#endif
);

_PRbeg

int word _PRx((char *lbuf, char *tbuf, int *lptr));
int newdtable _PRx((char *s));
int freedtable _PRx((void));
void newdelim _PRx((char *s));
void freedelim _PRx((char *s));
int lastdelim _PRx((void));
int tmatch _PRx((char *string, char *xtemplate));
int keyword _PRx((char *ibuf, char *key, char *obuf, int maxlen));
char *macro _PRx((char *icmd, char **keyword, char **value, int nkey,
		  MacroCB client_callback, void *client_data));
void cluc _PRx((char *s));
void culc _PRx((char *s));
int nowhite _PRx((char *c, char *cr));
void nocr _PRx((char *s));
int istrue _PRx((char *s));
int isfalse _PRx((char *s));
unsigned long strtoul16 _PRx((char *s, char **t));

_PRend

#endif
