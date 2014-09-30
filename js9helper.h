#include <funtools.h>
#include <strtod.h>
#include <word.h>
#include <find.h>
#include <swap.h>
#include <png.h>

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
#define WRONGARGS "wrong # of args for '%s' (expected %d, got %d)\n"
#define WRONGARGS2 "wrong # of args for '%s' (expected at least %d)\n"
#define NONEW "can't allocate new struct for '%s'\n"
#define NOFINFO "no current image for '%s'\n"
#define NOIMAGE "no image found with name '%s'\n"

/* supported file types */
#define FTYPE_PNG	1
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

/* fits info structure */
typedef struct finforec{
  struct finforec *next;
  char *fname;
  int ftype;
  Fun fun;
  FILE *fp;
  char *ofitsfile;
  char *fitsfile;
  char *fitscards;
  png_structp png_ptr;
  png_infop info_ptr;
  png_textp text_ptr;
  int num_text;
  void *wcs;
  int wcsunits;
} *Finfo, FinfoRec;

