/*
 *	Copyright (c) 1999-2003 Smithsonian Astrophysical Observatory
 */

/*
 *
 * file.c -- routines to grab file contents, get file size, etc.
 *
 */

#include <file.h>

#define BUFSIZE 8192
#define DIR_SEPARATOR '/'

/*
 * FileExists -- determine if a string is a file
 *
 * This should get re-implemented on slower systems that have
 * a system to call to check for a file's existance.
 *
 */
#ifdef ANSI_FUNC
int
FileExists(char *filename)
#else
int FileExists(filename)
     char *filename;
#endif
{
  FILE *fp;

  if((fp = fopen(filename,"r")) == NULL){
    return(0);
  }
  else{
    fclose(fp);
    return(1);
  }
}

/* 
 * 
 * IsFile -- parse a string and determine if it contains a file name
 *
 * We skip white space, etc and return the actual file name
 *
 */
#ifdef ANSI_FUNC
int
IsFile(char *s, char *filename, int len)
#else
int IsFile(s, filename, len)
     char *s;
     char *filename;
     int len;
#endif
{
  int i;

  /* skip white space */
  while( *s && isspace((int)*s) )
    s++;
  /* grab the file name up to a max, null, or CR */
  for(i=0; i<len && *s && *s != '\n'; i++, s++)
    filename[i] = *s;
  /* null terminate */
  filename[i] = '\0';
  /* try to open as a file */
  return(FileExists(filename));
}

/*
 * IsFits -- determine if a string is a FITS file
 *
 */
#ifdef ANSI_FUNC
int
IsFits(char *filename)
#else
int IsFits(filename)
     char *filename;
#endif
{
  int got = 0;
  char tbuf[10];
  FILE *fp=NULL;

  tbuf[9] = '\0';
  if( !(fp = fopen(filename,"r")) )
    goto done;
  if( fread(tbuf, sizeof(char), 9, fp) != 9 )
    goto done;
  if( !strcmp(tbuf, "SIMPLE  =") )
    got = 1;

done:
  if( fp) fclose(fp);
  return(got);
}

/*
 *
 * FileNameFromPath -- return file name, given a path
 *
 */
#ifdef ANSI_FUNC
char *
FileNameFromPath(char *s)
#else
char *FileNameFromPath(s)
     char *s;
#endif
{
  char *idx;

  idx = strrchr(s, DIR_SEPARATOR);
  if( idx != NULL )
    return(++idx);
  else
    return(s);
}

/*
 *
 * FileContents -- return contents of a file
 *
 */
#ifdef ANSI_FUNC
char *
FileContents(char *path, int isize, int *osize)
#else
char *FileContents(path, isize, osize)
     char *path;
     int isize;
     int *osize;
#endif
{
  FILE *fd;
  char *npath;
  char *tbuf;
  struct stat buf;
  int get;
  int got;

  /* start pessimisticly */
  if( osize != NULL )
    *osize = 0;

  /* expand environment variables */
  npath = (char *)ExpandMacro(path, NULL, NULL, 0, NULL, NULL);

  /* make sure the file exists */
  if( stat(npath, &buf) <0 ){
    free(npath);
    return(NULL);
  }

  /* open the file */
  if( (fd=fopen(npath, "r")) == NULL ){
    free(npath);
    return(NULL);
  }

  /* use may have specified amount of data to get */
  if( isize >0 )
    get = isize;
  else
    get = buf.st_size;

  /* get contents */
  tbuf = (char *)malloc(get+1);
  got = fread(tbuf, sizeof(char), get, fd);
  fclose(fd);
  tbuf[got] = '\0';

  /* user may want to know how much was read */
  if( osize != NULL )
    *osize = got;

  free(npath);
  return(tbuf);
}

/*
 *
 * FileSize -- return the size of a file
 *
 */
#ifdef ANSI_FUNC
int
FileSize(char *path)
#else
int FileSize(path)
     char *path;
#endif
{
  char *npath;
  struct stat buf;

  /* expand environment variables */
  npath = (char *)ExpandMacro(path, NULL, NULL, 0, NULL, NULL);
  /* make sure the file exists */
  if( stat(npath, &buf) <0 ){
    free(npath);
    return(-1);
  }
  else{
    free(npath);
    return(buf.st_size);
  }
}

/*
 *
 * FileCopy -- copy a file to another file
 *
 */
#ifdef ANSI_FUNC
int
FileCopy(char *iname, char *oname)
#else
int FileCopy(iname, oname)
     char *iname;
     char *oname;
#endif
{
  FILE *ifd;
  FILE *ofd;
  char *ipath;
  char *opath;
  char tbuf[BUFSIZE];
  int got;

  ipath = (char *)ExpandMacro(iname, NULL, NULL, 0, NULL, NULL);
  opath = (char *)ExpandMacro(oname, NULL, NULL, 0, NULL, NULL);
  if( (ifd=fopen(ipath, "r")) == NULL )
     return(0);
  if( (ofd=fopen(opath, "w")) == NULL )
     return(0);
  while( (got = fread(tbuf, sizeof(char), BUFSIZE, ifd)) != 0 ){
    fwrite(tbuf, sizeof(char), got, ofd);
  }
  fclose(ifd);
  fclose(ofd);
  free(ipath);
  free(opath);
  return(1);
}

/*
 *
 * FileRoot -- strip the [...] extension from a file name and return root
 *
 */
#ifdef ANSI_FUNC
char *
FileRoot(char *fname)
#else
char *FileRoot(fname)
     char *fname;
#endif
{
  int i;
  int len;
  char *file;

  len = strlen(fname)+1;
  file = (char *)malloc(len);
  for(i=0; (fname[i]!='\0') && (fname[i]!='['); i++)
    file[i] = fname[i];
  file[i] = '\0';
  return(file);
}

/*
 *
 * FileExtension -- extract the [...] extension from a file name
 *
 */
#ifdef ANSI_FUNC
char *
FileExtension(char *fname)
#else
char *FileExtension(fname)
     char *fname;
#endif
{
  int i;
  int len;
  char *s;
  char *extn;

  /* look for opening bracket */
  if( (s=strchr(fname, '[')) == NULL ){
    return(NULL);
  }
  /* grab extension(s) */
  else{
    len = strlen(s);
    extn = (char *)malloc(len+1);
    strcpy(extn, s);
    for(i=len-1; i>=0; i--){
      if( extn[i] == ']' ){
	extn[i+1] = '\0';
	break;
      }
    }
    return(extn);
  }
}

/*
 *
 * GenerateArraySpecification -- generate an array specification of the
 * form [xdim=x,ydim=y,...] from various valid inputs 
 *
 */
#ifdef ANSI_FUNC
int
GenerateArraySpecification(char *ispec, char *ospec, int olen)
#else
int GenerateArraySpecification(ispec, ospec, olen)
     char *ispec;
     char *ospec;
     int olen;
#endif
{
  int got;
  int size;
  int dsize;
  int bitpix;
  char s1[SZ_LINE];
  char s2[SZ_LINE];
  char s3[SZ_LINE];
  char s4[SZ_LINE];
  char s5[SZ_LINE];

  if( (ispec == NULL) || (*ispec == '\0') )
    return(0);

  got = sscanf(ispec, "%s %s %s %s %s", s1, s2, s3, s4, s5);
  switch(got){
  case 0:
    *ospec = '\0';
    return(0);
  case 1:
    snprintf(ospec, olen, "%s", s1);
    return(1);
  case 2:
    /* make a guess at the data type by looking at the file size ...
       we probably should not work this hard!! */
    size = FileSize(s1);
    if( size > 0 ){
      dsize = atoi(s2)*atoi(s2);
      bitpix = (size/dsize)*8;
      snprintf(ospec, olen, 
	       "%s[xdim=%s,ydim=%s,bitpix=%d]", s1, s2, s2, bitpix);
      return(2);
    }
    else {
      *ospec = '\0';
      return(0);
    }
  case 3:
    snprintf(ospec, olen, "%s[xdim=%s,ydim=%s,bitpix=%s]", s1, s2, s2, s3);
    return(3);
  case 4:
      snprintf(ospec, olen, "%s[xdim=%s,ydim=%s,bitpix=%s]", s1, s2, s3, s4);
    return(4);
  case 5:
    snprintf(ospec, olen, "%s[xdim=%s,ydim=%s,bitpix=%s,skip=%s]",
	     s1, s2, s3, s4, s5);
    return(5);
  default:
    return(0);
  }
}

/*
 *
 * GenerateArraySpec2 -- generate an array specification from separate name
 * and spec strings
 *
 */
#ifdef ANSI_FUNC
int
GenerateArraySpec2(char *iname, char *ispec, char *ospec, int olen)
#else
int GenerateArraySpec2(iname, ispec, ospec, olen)
     char *iname;
     char *ispec;
     char *ospec;
     int olen;
#endif
{

  char *buf;
  int len;
  int got=0;

  len = strlen(iname)+strlen(ispec)+2;
  buf = (char *)malloc(len);
  snprintf(buf, len, "%s %s", iname, ispec);
  if( *buf ){
    got = GenerateArraySpecification(buf, ospec, olen);
    free(buf);
  }
  return(got);
}

/*
 *
 * GetNextFileName -- return next file name, given a list
 *
 */
#ifdef ANSI_FUNC
int 
GetNextFileName(char *filenames, int *ip, char *filename, int len)
#else
int GetNextFileName(filenames, ip, filename, len)
     char *filenames;
     int *ip;
     char *filename;
     int len;
#endif
{
  int i;
  int j;

  /* start with a clean slate */
  *filename = '\0';
  i = *ip;
  /* make sure there is a string */
  if( filenames == NULL || filenames[i] == '\0' )
    return(0);
  /* skip white space */
  while((isspace((int)filenames[i]) || (filenames[i] == ':')))
    i++;
  /* copy string up to a terminator */
  j = 0;
  while(filenames[i] && !isspace((int)filenames[i]) && filenames[i]!= ':'){
    if( j < len ) filename[j++] = filenames[i++];
  }
  /* null terminate */
  filename[j] = '\0';
  /* update the filenames pointer */
  *ip = i;
  /* return the news */
  if( *filename )
    return(1);
  else
    return(0);
}

/*
 *
 * ParseArraySpec -- parse the special array spec
 *
 * Generally used in syntax such as:
 *
 * foo.arr[aa=<spec>]
 *
 * where spec is of the form:
 *
 *	<type><xdim>[.<ydim>][:<skip>][<endian>]
 *
 * where type is:
 *	b   (8-bit unsigned char)
 *	s   (16-bit short int)
 *	u   (16-bit unsigned short int)
 *	i   (32-bit int)
 *	r,f (32-bit float)
 *	d   (64-bit float)
 * 
 * xdim is required, ydim is optional and defaults to xdim
 * skip is optional
 * endian is optional and can be 'l' or 'b'
 *
 *
 * e.g.:
 *
 *	r512		bitpix=-32 xdim=512 ydim=512
 *	r512.400	bitpix=-32 xdim=512 ydim=400
 *	r512.400	bitpix=-32 xdim=512 ydim=400
 *	r512.400:2880	bitpix=-32 xdim=512 ydim=400 skip=2880
 *	r512l		bitpix=-32 xdim=512 ydim=512 endian=little
 *
 */
#ifdef ANSI_FUNC
int
ParseArraySpec(char *tbuf, int *xdim, int *ydim, int *bitpix,
	       int *skip, int *bigendian)
#else
int ParseArraySpec(tbuf, xdim, ydim, bitpix, skip, bigendian)
     char *tbuf;
     int *xdim;
     int *ydim;
     int *bitpix;
     int *skip;
     int *bigendian;
#endif
{
  int txdim=0;
  int tydim=0;
  int tbitpix=0;
  int tskip=-1;
  int tbigendian=0;
  int isarr=0;
  long lval;
  char *tptr;
  char *tptr2;
  tptr = tbuf;

  /* get type and use it to set bitpix */
  switch(*tptr){
  case 'b':
  case 'B':
    tbitpix = 8;
    isarr |= 4;
    break;
  case 's':
  case 'S':
    tbitpix = 16;
    isarr |= 4;
    break;
  case 'u':
  case 'U':
    tbitpix = -16;
    isarr |= 4;
    break;
  case 'i':
  case 'I':
    tbitpix = 32;
    isarr |= 4;
    break;
  case 'r':
  case 'R':
  case 'f':
  case 'F':
    tbitpix = -32;
    isarr |= 4;
    break;
  case 'd':
  case 'D':
    tbitpix = -64;
    isarr |= 4;
    break;
  default:
    return(0);
  }
  tptr++;

  /* check for the required xdim value */
  lval = strtol(tptr, &tptr2, 10);
  if( (tptr == tptr2) || (lval <=0) )
    return(0);
  else{
    txdim = lval;
    /* seed the y value as well, in case we don't get one */
    tydim = txdim;
    isarr |= 3;
  }
  /* update pointer */
  tptr = tptr2;

  /* there are 2 possible delims here */
  switch( *tptr ){
  case '.':
    /* now check for the optional ydim value */
    tptr++;
    lval = strtol(tptr, &tptr2, 10);
    if( (tptr == tptr2) )
      tydim = txdim;
    else{
      if( lval <=0 )
	return(0);
      else
	tydim = lval;
    }
    /* update pointer */
    tptr = tptr2;
    /* look for skip after this */
    if( *tptr != ':' )
      break;
  case ':':
    /* check for the optional skip value */
    tptr++;
    lval = strtol(tptr, &tptr2, 10);
    if( (tptr != tptr2) && (lval >0) ){
      tskip = lval;
      isarr |= 8;
    }
    /* update pointer */
    tptr = tptr2;
    break;
  }

  switch(*tptr){
  case 'l':
  case 'L':
    tbigendian = 0;
    isarr |= 16;
    break;
  case 'b':
  case 'B':
    tbigendian = 1;
    isarr |= 16;
    break;
  }

  /* make sure required values were set */
  if( (isarr&7) != 7 )
    return(0);

  /* fill in required values */
  *xdim = txdim;
  *ydim = tydim;
  *bitpix = tbitpix;

  /* see if optional values were set */
  if( isarr & 8 )
    *skip = tskip;
  if( isarr & 16 )
    *bigendian = tbigendian;

  /* success */
  return(1);
}
