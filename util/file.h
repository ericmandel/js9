/*
 *	Copyright (c) 2015 Smithsonian Astrophysical Observatory
 */

/*
 *
 * file.h -- declarations for file parsing
 *
 */

#ifndef	__file_h
#define	__file_h

#include "xutil.h"
#include "xalloc.h"
#include "macro.h"

int FileExists(char *filename);
int IsFile(char *s, char *filename, int len);
int IsFits(char *filename);
char *FileNameFromPath(char *s);
char *FileContents(char *path, int isize, int *osize);
int FileSize(char *path);
int FileCopy(char *iname, char *oname);
char *FileRoot(char *fname);
char *FileExtension(char *fname);
int GenerateArraySpecification(char *ispec, char *ospec, int olen);
int GenerateArraySpec2(char *iname, char *ispec, char *ospec, int olen);
int GetNextFileName(char *filenames, int *ip, char *filename, int len);
int ParseArraySpec(char *tbuf, int *xdim, int *ydim, int *bitpix,
		   int *skip, int *bigendian);

#endif
