#ifdef __EMSCRIPTEN__
#define HAVE_CFITSIO  1
#define HAVE_UNISTD_H 1
#define HAVE_STRING_H 1
#define HAVE_STDLIB_H 1
#define HAVE_MALLOC_H 1
#define HAVE_GETOPT_H 1
#endif

#if HAVE_CFITSIO
#include <fitsio.h>
#include "jsfitsio.h"
#endif
#include <file.h>
#include <find.h>
#include <macro.h>
#include <word.h>
#include <xalloc.h>
#if FITS2PNG
#include <png.h>
#endif
#include <math.h>

#if HAVE_CONFIG_H
#include <conf.h>
#endif
#include <stdio.h>
#if HAVE_UNISTD_H
#include <unistd.h>
#endif
#if HAVE_STRING_H
#include <string.h>
#endif
#if HAVE_STDLIB_H
#include <stdlib.h>
#endif
#if HAVE_MALLOC_H
#include <malloc.h>
#endif
#if HAVE_GETOPT_H
#include <getopt.h>
#else
extern char *optarg;
extern int optind;
#endif

/* warning format strings */
#define WRONGARGS "ERROR: wrong # of args for '%s' (expected %d, got %d)\n"
#define WRONGARGS2 "ERROR: wrong # of args for '%s' (expected at least %d)\n"
#define NONEW "ERROR: can't allocate new struct for '%s'\n"
#define NOFINFO "ERROR: no current image for '%s'\n"
#define NOIMAGE "ERROR: no image found with name '%s'\n"

/* supported file types */
#define FTYPE_IMG	1
#define FTYPE_FITS	2

/* these must match the parameters written in tpos.c */
#define FITSFILE	"fitsfile"
#define FITSHEADER	"fitsheader"

/* wcs units for display */
#define WCS_DEGREES	0
#define WCS_RADIANS	1
#define WCS_SEXAGESIMAL	2

#define PI		3.141592653589793238462643
#define DEG2RAD(a)	((PI/180.0)*a)
#define RAD2DEG(a)	((180.0/PI)*a)

#define EXTLIST "EVENTS STDEVT"

/* fits info structure */
typedef struct finforec{
  struct finforec *next;
  char *fname;
  int ftype;
  FILE *fp;
  char *fitsfile;
#if FITS2PNG
  png_structp png_ptr;
  png_infop info_ptr;
  png_textp text_ptr;
#endif
  int num_text;
} *Finfo, FinfoRec;

#ifndef SZ_LINE
#define SZ_LINE 4096
#endif

int _listhdu(char *iname, char *oname);
