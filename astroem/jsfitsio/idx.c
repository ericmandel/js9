/*
 * use a sorted index to generate a rowlist for cfitsio
 *
 */

#include <unistd.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <fcntl.h>
#include <fitsio.h>
#include <sys/stat.h>
#include "idx.h"

#define MAXSIZE 8

/*
 *
 * private routines
 *
 */

/* upper to lower case and back */
static void culc(char *s){
  while(*s){
    if( isupper((int)*s) ) *s = tolower(*s);
    s++;
  }
}
static void cluc(char *s){
  while(*s){
    if( islower((int)*s) ) *s = toupper(*s);
    s++;
  }
}

static int idxsizeof(int type){
  switch(type){
  case 'B':
    return 1;
    break;
  case 'I':
    return 2;
    break;
  case 'U':
    return 2;
    break;
  case 'J':
    return 4;
    break;
  case 'V':
    return 4;
    break;
  case 'E':
    return 4;
    break;
  case 'D':
    return 8;
    break;
  default:
    return 0;
    break;
  }
}

static char *idxfilename(fitsfile *fptr, char *col, int *fsize)
{
  int status = 0;
  char *t;
  char *fitsroot=NULL;
  char *idxroot=NULL;
  char *idxname=NULL;
  char fitsfile[IDXLEN];
  char col1[IDXLEN];
  char col2[IDXLEN];
  char tbuf1[IDXLEN];
  char tbuf2[IDXLEN];
  struct stat ibuf1, ibuf2, fbuf;

  // sanity checks
  if( !col ) return NULL;
  // get fits file name
  fits_file_name(fptr, fitsfile, &status);
  if( status > 0 ) return NULL;
  // remove bracket extension from fits file
  fitsroot = strdup(fitsfile);
  if( (t=strchr(fitsroot, '[')) ) *t = '\0';
  // make sure we can find the fits file
  if( stat(fitsroot, &fbuf) < 0 ) goto done;
  // get extensionless root of filename to use for index
  idxroot = strdup(fitsroot);
  // remove extensions
  if( (t=strrchr(idxroot, '.')) ){
    *t = '\0';
    if( !strcmp(t+1, "gz") && (t=strrchr(idxroot, '.')) ) *t = '\0';
  }
  // make up possible index filenames, allowing for case difference
  strncpy(col1, col, IDXLEN-1);
  culc(col1);
  snprintf(tbuf1, IDXLEN-1, "%s_%s.idx", idxroot, col1);
  strncpy(col2, col, IDXLEN-1);
  cluc(col2);
  snprintf(tbuf2, IDXLEN-1, "%s_%s.idx", idxroot, col2);
  // see if index file exists and is newer than fits file
  if( !stat(tbuf1, &ibuf1) && (fbuf.st_mtime <= ibuf1.st_mtime ) ){
    idxname = strdup(tbuf1);
    if( fsize ) *fsize = ibuf1.st_size;
  } else if( !stat(tbuf2, &ibuf2) && (fbuf.st_mtime <= ibuf2.st_mtime ) ){
    idxname = strdup(tbuf2);
    if( fsize ) *fsize = ibuf2.st_size;
  }
done:
  if( fitsroot ) free(fitsroot);
  if( idxroot ) free(idxroot);
  return idxname;
}

static Idx idxparse(fitsfile *fptr, char *f){
  int i, n, fd, fsize, ncol, nlimit;
  int status = 0;
  int coltype = 0;
  char *idxfile = NULL;
  char col[2][IDXLEN];
  char lim[2][IDXLEN];
  char keyword[FLEN_KEYWORD], colname[FLEN_VALUE], format[FLEN_VALUE];
  Idx idx = NULL;
  enum idxops op[2];

  // check for excessively long filter
  if( strlen(f) > IDXLEN ) return NULL;
  for(i=0, nlimit=0; i<2; i++){
    col[i][0] = '\0';
    lim[i][0] = '\0';
    op[i] = 0;
    while( isspace(*f) ) f++;
    // column
    if( sscanf(f, "%[a-zA-Z0-9_] %n",  col[i], &n) == 0 ) return NULL;
    f += n;
    while( isspace(*f) ) f++;
    // op
    if( !strncmp(f, "<=", 2) ){
      op[i] = le;
      f+= 2;
    } else if( !strncmp(f, "<", 1) ){
      op[i] = lt;
      f+= 1;
    } else if( !strncmp(f, ">=", 2) ){
      op[i] = ge;
      f+= 2;
    } else if( !strncmp(f, ">", 1) ){
      op[i] = gt;
      f+= 1;
    } else if( !strncmp(f, "==", 2) ){
      op[i] = eq;
      f+= 2;
    } else {
      return NULL;
    }
    // numeric value TODO: add DE format
    if( sscanf(f, "%[-0-9.]%n",  lim[i], &n) == 0) return NULL;
    f += n;
    while( isspace(*f) ) f++;
    // finished with this limit
    nlimit++;
    // conjunction indicating another limit specification?
    if( strncmp(f, "&&", 2) ) break;
    f += 2;
  }
  // must be end of string
  while( isspace(*f) ) f++;
  if( *f != '\0' ) return NULL;
  // must be the same column in both limit specifications
  if( n == 2 && strcasecmp(col[0], col[1]) ) return NULL;
  // if two opts, must be consistent
  if( nlimit == 2 ){
    if(  op[0]==eq || op[1]==eq ) return NULL;
    if( (op[0]==lt || op[0]==le) && !(op[1]==gt || op[1]==ge) ) return NULL;
    if( (op[0]==gt || op[0]==ge) && !(op[1]==lt || op[1]==le) ) return NULL;
  }
  // check for valid column
  fits_get_num_cols(fptr, &ncol, &status);
  if( status > 0 ) return NULL;
  for(i=1; i<=ncol; i++) {
    status = 0;
    // get column name
    fits_make_keyn("TTYPE", i, keyword, &status);
    if( status > 0 ) continue;
    fits_read_key(fptr, TSTRING, keyword, colname, NULL, &status);
    if( status > 0 ) continue;
    // is this the right column?
    if( strcasecmp(colname, col[0]) ) continue;
    // get data typeof column
    fits_make_keyn("TFORM", i, keyword, &status);
    if( status > 0 ) continue;
    fits_read_key(fptr, TSTRING, keyword, format, NULL, &status);
    if( status > 0 ) continue;
    // scalar columns only
    if( format[0] != '1' ) return NULL;
    // save type
    coltype = format[1];
    break;
  }
  // make sure we got a valid column
  if( !coltype || !idxsizeof(coltype) ) return NULL;
  // is there an index available for this column?
  idxfile = idxfilename(fptr, colname, &fsize);
  if( !idxfile ) return NULL;
  fd = open(idxfile, O_RDONLY);
  if( !fd ) return NULL;
  // fill in the index struct
  idx = calloc(1, sizeof(IdxRec));
  idx->n = nlimit;
  idx->fptr = fptr;
  idx->filename = idxfile;
  idx->fd = fd;
  idx->fsize = fsize;
  idx->colname = strdup(colname);
  idx->coltype = coltype;
  idx->coloffset = sizeof(int); // index contains row number, col value
  idx->rowsize = sizeof(int) + idxsizeof(coltype);
  fits_get_num_rows(fptr, &(idx->nrow), &status);
  // get lo and hi limits
  for(i=0; i<2; i++){
    idx->ilim[i] = -1;
    idx->dlim[i] = -1;
  }
  switch(coltype){
  case 'B':
  case 'I':
  case 'U':
  case 'J':
  case 'V':
    idx->ilim[0] = strtol(lim[0], NULL, 10);
    if( nlimit == 2 ) idx->ilim[1] = strtol(lim[1], NULL, 10);
    break;
  case 'E':
  case 'D':
    idx->dlim[0] = strtod(lim[0], NULL);
    if( nlimit == 2 ) idx->dlim[1] = strtod(lim[1], NULL);
    break;
  default:
    break;
  }
  // save the conjunctive op for each limit
  idx->op[0] =op[0];
  if( nlimit == 2 ) idx->op[1] = op[1];
  // return the good news
  return idx;
}

static int idxcompare(void *databuf, void *valbuf, int type){
  unsigned char ubdata;
  short int sdata;
  unsigned short int usdata;
  int idata, ival;
  unsigned int uidata;
  float fdata;
  double ddata, dval;

  switch(type){
  case 'B':
    ubdata = *(unsigned char *)databuf;
    ival = *(int *)valbuf;
    return ubdata < ival ? -1 : (ubdata > ival ? 1 : 0);
    break;
  case 'I':
    sdata = *(short int *)databuf;
    ival = *(int *)valbuf;
    return sdata < ival ? -1 : (sdata > ival ? 1 : 0);
    break;
  case 'U':
    usdata = *(unsigned short int *)databuf;
    ival = *(int *)valbuf;
    return usdata < ival ? -1 : (usdata > ival ? 1 : 0);
    break;
  case 'J':
    idata = *(int *)databuf;
    ival = *(int *)valbuf;
    return idata < ival ? -1 : (idata > ival ? 1 : 0);
    break;
  case 'V':
    uidata = *(unsigned int *)databuf;
    ival = *(int *)valbuf;
    return uidata < ival ? -1 : (uidata > ival ? 1 : 0);
    break;
  case 'E':
    fdata = *(float *)databuf;
    dval = *(double *)valbuf;
    return fdata < dval ? -1 : (fdata > dval ? 1 : 0);
    break;
  case 'D':
    ddata = *(double *)databuf;
    dval = *(double *)valbuf;
    return ddata < dval ? -1 : (ddata > dval ? 1 : 0);
    break;
  default:
    // presumably this has been caught long before we reach here!
    return 0;
    break;
  }
  return 0;
}

static int idxbsearch(int fd, long nrow, int rowsize, int offset, int type,
		      int exact, int edge, void *valbuf){
  int high, low, try;
  int cmp;
  int datasize;
  char databuf[MAXSIZE];

  /* set limits */
  low = 0;
  high = nrow + 1;
  /* size of data element in bytes */
  datasize = idxsizeof(type);
  if( datasize <= 0 ) return -1;
  /* search */
  while( (high - low) > 1){
    try = (high + low) / 2;
    /* grab desired row in index */
    if( lseek(fd, (off_t)((try-1)*rowsize+offset), 0) < 0 ) return -1;
    if( read(fd, databuf, datasize) != datasize ) return -1;
    /* compare row to key value */
    cmp = idxcompare(databuf, valbuf, type);
    if( cmp < 0 ){
      low = try;
    } else if( cmp == 0 ){
      if( edge == LEFT_EDGE ){
	/* to find first record, set hi */
	high = try;
      } else {
	/* for last record, set lo */
	low = try;
      }
    } else {
      high = try;
    }
  }
  /* check for out of bounds and get candidate row */
  if( edge == RIGHT_EDGE ){
    if( low  == 0 ) return exact ? -1 : 0;
    try = low;
  }
  else {
    if( high == (nrow + 1) ) return exact ? -1 : nrow + 1;
    try = high;
  }
  /* grab desired row in index */
  if( lseek(fd, (off_t)((try-1)*rowsize+offset), 0) < 0 ) return -1;
  if( read(fd, databuf, datasize) != datasize ) return -1;
  /* compare row to key value */
  cmp = idxcompare(databuf, valbuf, type);
  /* if row == key value, we got a match */
  if( !cmp || !exact ) return edge == RIGHT_EDGE ? low : high;
  return -1;
}

/*
 *
 * public routines
 *
 */

int idx_find_rows(fitsfile *fptr, char *filter, long firstrow, long nrow,
		  long *nselectrow, char *selectrow, int *status){
  int i;
  long row, lastrow;
  long start, stop;
  char *s;
  void *vptr;
  Idx idx;

  // pessimistic start
  *nselectrow = 0;
  // sanity check
  if( !filter || !selectrow || *status > 0 ) return 0;
  // might be turned off in the environment
  if( (s = getenv("IDX_ACTIVATE")) && !strcasecmp(s, "false") ) return -1;
  // can we use an index?
  idx = idxparse(fptr, filter);
  if( !idx ) return -1;
  // start using all rows
  start = 1;
  stop = idx->nrow;
  // get start/stop
  for(i=0; i<idx->n; i++){
    // value
    if( idx->coltype == 'E' || idx->coltype == 'D' ){
      vptr = &(idx->dlim[i]);
    } else {
      vptr = &(idx->ilim[i]);
    }
    // row limits for this value and op
    switch(idx->op[i]){
    case eq:
      start = idxbsearch(idx->fd, idx->nrow, idx->rowsize,
			 idx->coloffset, idx->coltype,
			 EXACT, LEFT_EDGE, vptr);
      stop  = idxbsearch(idx->fd, idx->nrow, idx->rowsize,
			 idx->coloffset, idx->coltype,
			 EXACT, RIGHT_EDGE, vptr);
      break;
    case ge:
      start = idxbsearch(idx->fd, idx->nrow, idx->rowsize,
			 idx->coloffset, idx->coltype,
			 INEXACT, LEFT_EDGE, vptr);
      break;
    case gt:
      start = idxbsearch(idx->fd, idx->nrow, idx->rowsize,
			 idx->coloffset, idx->coltype,
			 INEXACT, RIGHT_EDGE, vptr);
      start++;
      break;
    case le:
      stop  = idxbsearch(idx->fd, idx->nrow, idx->rowsize,
			 idx->coloffset, idx->coltype,
			 INEXACT, RIGHT_EDGE, vptr);
      break;
    case lt:
      stop  = idxbsearch(idx->fd, idx->nrow, idx->rowsize,
			 idx->coloffset, idx->coltype,
			 INEXACT, LEFT_EDGE, vptr);
      stop--;
      break;
    default:
      break;
    }
  }
  // fill in the selectrow array
  lastrow = firstrow + nrow;
  for(i=start; i<=stop; i++){
    lseek(idx->fd, (off_t)(i*idx->rowsize), 0);
    read(idx->fd, &row, sizeof(int));
    if( row >= firstrow && row <= lastrow ){
      selectrow[row-1] = TRUE;
      *nselectrow += 1;
    }
  }
  // clean up
  if( idx->fd ) close(idx->fd);
  if( idx->filename ) free(idx->filename);
  if( idx->colname ) free(idx->colname);
  free(idx);
  return *nselectrow;
}
