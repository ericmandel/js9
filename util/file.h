/*
 *	Copyright (c) 1999-2003 Smithsonian Astrophysical Observatory
 */

/*
 *
 * file.h -- declarations for file parsing
 *
 */

#ifndef	__file_h
#define	__file_h

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
#include <sys/types.h>
#include <sys/stat.h>
#include <prsetup.h>
#include <macro.h>
#include <xalloc.h>

_PRbeg
int FileExists _PRx((char *filename));
int IsFile _PRx((char *s, char *filename, int len));
int IsFits _PRx((char *filename));
char *FileNameFromPath _PRx((char *s));
char *FileContents _PRx((char *path, int isize, int *osize));
int FileSize _PRx((char *path));
int FileCopy _PRx((char *iname, char *oname));
char *FileRoot _PRx((char *fname));
char *FileExtension _PRx((char *fname));
int GenerateArraySpecification _PRx((char *ispec, char *ospec, int olen));
int GenerateArraySpec2 _PRx((char *iname, char *ispec, char *ospec, int olen));
int GetNextFileName _PRx((char *filenames, int *ip, char *filename, int len));
int ParseArraySpec _PRx((char *tbuf, int *xdim, int *ydim, int *bitpix,
			 int *skip, int *bigendian));

_PRend

#endif
