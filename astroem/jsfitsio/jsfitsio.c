/*
 *
 * jsfitsio.c -- extra routines for javascript version
 *
 */

/*
Notes:
passing arrays and passing by reference:
http://stackoverflow.com/questions/17883799/how-to-handle-passing-returning-array-pointers-to-emscripten-compiled-code
https://groups.google.com/forum/#!topic/emscripten-discuss/JDaNHIRQ_G4
*/
#include <stdio.h>
#include <unistd.h>
#include <ctype.h>
#include <string.h>
#include <sys/time.h>
#include <math.h>
#include "fitsio.h"
#include "jsfitsio.h"
#include "healpix.h"
#if WITH_IDX
#include "idx.h"
#endif

/*
* http://stackoverflow.com/questions/3599160/unused-parameter-warnings-in-c-code
*/
#ifndef UNUSED
#ifdef __GNUC__
#  define UNUSED(x) UNUSED_ ## x __attribute__((__unused__))
#else
#  define UNUSED(x) UNUSED_ ## x
#endif
#endif

int ffpxsz(int datatype);

/*
 *----------------------------------------------------------------------------
 *
 *
 * 			Private Routines and Data
 *
 *
 *----------------------------------------------------------------------------
 */

// emscripten does not have access to unlimited memory
#if __EMSCRIPTEN__
#define HAVE_MEMORY_LIMIT 1
#else
#define HAVE_MEMORY_LIMIT 0
#endif

// ffhist3 was added to cfitsio v3.39
#if (CFITSIO_MAJOR < 3) || ((CFITSIO_MAJOR == 3) && (CFITSIO_MINOR < 39))
#error ffhist3() required: please upgrade cfitsio to v3.39 or higher
#endif

/* must match what cfitsio expects (i.e., 4 for histogramming) */
#define IDIM 4
#define IFILE "mem://"
#define MFILE "cfitsio_memfile"

#define MAXINT  2147483647
#define MININT -2147483648

#ifndef min
#define min(a,b) (a<=b?a:b)
#endif
#ifndef max
#define max(a,b) (a>=b?a:b)
#endif
#ifndef SZ_LINE
#define SZ_LINE 1024
#endif

#if HAVE_MEMORY_LIMIT
#define DEF_MAX_MEMORY 2000000000
#else
#define DEF_MAX_MEMORY 0
#endif
static long def_max_memory = DEF_MAX_MEMORY;

/*
 *
 * Routine:	keyword
 *
 * Purpose:	look for a keyword=<value> string inside another string,
 *		remove and return the <value> in another buffer
 *
 * Returns:	len if keyword was found, 0 otherwise
 *
 */
static int keyword (char *ibuf, char *key, char *env, char *obuf, int maxlen){
  int qlev;
  int len = 0;
  char *s;
  char *t;
  char *u;
  char *v;
  char *ibase = NULL;
  char *iptr=NULL;
  char quote='\0';

  /* if we have no input string, we are done */
  if( !ibuf || !*ibuf || !key || !*key ) return 0;
  /* start out pessimistically */
  ibase = strdup(ibuf);
  iptr = ibase;
  *obuf = '\0';
  /* maxlen generally is 1 more than we can handle */
  maxlen--;
  /* keep trying */
  while( *iptr ){
    /* look for key from current position */
    if( (s = (char *)strstr(iptr, key)) == NULL ) goto done;
    /* if we found a key, we need to make sure ... */
    /* it must be preceeded by beginning of string, beginning of bracket,
       or by a "," from previous keyword */
    if( (s == ibase) || (*(s-1) == ',') || (*(s-1) == '[') ){
      /* it can be followed by spaces ... */
      t = s + strlen(key);
      while( isspace((int)*t) ) t++;
      /* but must be followed by an "=" */
      if( *t == '=' ){
	t++;
	/* skip spaces again */
	while( isspace((int)*t) ) t++;
	/* this is where the actual value part of the string begins */
	u = t;
	/* this will be where it ends */
	v = t;
	/* gather up everything to the next "," or end of filter */
	if( (*t == '"') || (*t == '\'') || (*t == '(') || (*t == '[') ){
	  switch(*t){
	  case '"':
	  case '\'':
	    quote = *t;
	    break;
	  case '(':
	    quote = ')';
	    break;
	  case '[':
	    quote = ']';
	    break;
	  }
	  /* bump past opening quote char */
	  t++; u++; v++;
	  while( *t && (*t != quote) ){
	    t++; v++;
	  }
	  if( *t == quote ){
	    t++;
	  }
	}
	else{
	  qlev = 0;
	  while( *t &&
		 ((qlev != 0) || (*t != ',')) &&
		 ((qlev != 0) || (*t != ']')) ){
	    if( *t == '[' ){
	      qlev++;
	    } else if( *t == ']' ){
	      qlev--;
	    }
	    t++; v++;
	  }
	}
	len = min(maxlen, v - u);
	strncpy(obuf, u, len);
	obuf[len] = '\0';
	/* remove keyword=value string from the original buffer */
	/* first remove preceding comma, if necessary */
	if( (s > ibase) && (*(s-1) == ',') ){
	  s--;
	}
	/* but leave 1 comma in place */
	else if( *t == ',' ){
	  t++;
	}
	/* now overwrite original from where the keyword started */
	memmove(s, t, strlen(t)+1);
	/* return success */
	goto done;
      }
    }
    /* start next search just past this one */
    iptr = s+1;
  }
  /* didn't find anything */
  len = 0;
done:
  if( ibase ) free(ibase);
  /* if not found, check for environment variable, if necessary */
  if( !len && env && (s = (char *)getenv(env)) ){
    strncpy(obuf, s, maxlen);
    len = strlen(obuf);
  }
  return len;
}

/*
 *
 * getcolinfo -- read a string containing tlmin, tlmax, binsiz of a column
 *
 * col[:tlmin[:tmlax[:binsiz]]]
 *
 * If only one arg is given, it's assumed to be the binsize
 *
 *
 */
static int getcolinfo(char *s, char *col, int clen,
		      double *tlmin, double *tlmax, double *binsiz){
  int i, got, tlen;
  char *v;
  char vbuf[SZ_LINE];
  double val[3];

  /* initialize */
  *col = '\0';
  /* make sure we have something to do */
  if( !s || !*s ){
    return 0;
  }
  /* get column name */
  for(v=col, tlen=0; *s && (*s != ':') && tlen < clen; tlen++ ){
    *v++ = *s++;
  }
  *v = '\0';
  /* get image dimensions and bin size */
  for(i=0, got=0; i<3; i++, got++){
    if( *s != ':' ){
      break;
    }
    /* skip past ':' */
    s++;
    /* fill buffer with next value */
    *vbuf = '\0';
    for(v=vbuf; *s && (*s != ':') && tlen < SZ_LINE; tlen++){
      *v++ = *s++;
    }
    *v = '\0';
    /* convert string to double */
    val[i] = atof(vbuf);
  }
  switch(got){
  case 0:
    *binsiz = 1;
    got = 1;
    break;
  case 1:
    *binsiz = val[0];
    break;
  case 2:
    *tlmin = val[0];
    *tlmax = val[1];
    break;
  case 3:
  default:
    *tlmin = val[0];
    *tlmax = val[1];
    *binsiz = val[2];
    break;
  }
  return got;
}


// give a bitpix, return type
int fitstypeof(int bitpix){
  switch(bitpix){
  case 8:
    return TBYTE;
  case 16:
    return TSHORT;
  case -16:
    return TUSHORT;
  case 32:
    return TINT;
  case 64:
    return TLONGLONG;
  case -32:
    return TFLOAT;
  case -64:
    return TDOUBLE;
  default:
    return TINT;
  }
}

// gotoFITSHDU: try to go to a reasonable HDU if the primary is useless
// we look for specified extensions and if not found, go to hdu #2
// this is how xray binary tables are imaged automatically
static fitsfile *gotoFITSHDU(fitsfile *fptr,
			     char *extlist, int *hdutype, int *status){
  int hdunum, naxis, thdutype, gotext=0;
  long naxes[IDIM] = {0, 0, 0, 0};
  char *ext, *textlist;
  // if this is the primary array and it does not contain an image,
  // try to move to something more reasonble
  fits_get_hdu_num(fptr, &hdunum); *status = 0;
  fits_get_img_dim(fptr, &naxis, status); *status = 0;
  fits_get_img_size(fptr, min(IDIM,naxis), naxes, status); *status = 0;
  if( (hdunum == 1) && ((naxis == 0) || naxes[0] == 0) ){
    // look through the extension list
    if( extlist ){
      gotext = 0;
      textlist = (char *)strdup(extlist);
      for(ext=(char *)strtok(textlist, " "); ext != NULL;
	  ext=(char *)strtok(NULL," ")){
	fits_movnam_hdu(fptr, ANY_HDU, ext, 0, status);
	if( *status == 0 ){
	  gotext = 1;
	  break;
	} else {
	  *status = 0;
	}
      }
      free(textlist);
    }
    if( !gotext ){
      // if all else fails, move to extension #2 and hope for the best
      fits_movabs_hdu(fptr, 2, &thdutype, status);
    }
  }
  fits_get_hdu_type(fptr, hdutype, status);
  return fptr;
}

/*
 *----------------------------------------------------------------------------
 *
 *
 * 			Public Routines and Data
 *
 *
 *----------------------------------------------------------------------------
 */

// openFITSFile: open a FITS file for reading and go to a useful HDU
//
fitsfile *openFITSFile(char *ifile, int iomode, char *extlist,
		       char *UNUSED(opts), int *hdutype, int *status){
  fitsfile *fptr;
  // open fits file
  fits_open_file(&fptr, ifile, iomode, status);
  // bail out if there is an error at this point
  if( *status ) return NULL;
  return gotoFITSHDU(fptr, extlist, hdutype, status);
}

// openFITSMem: open a FITS memory buffer for reading and go to a useful HDU
fitsfile *openFITSMem(void **buf, size_t *buflen, char *extlist,
		      char *UNUSED(opts), int *hdutype, int *status){
  fitsfile *fptr;
  // open fits file
  fits_open_memfile(&fptr, MFILE, READWRITE, buf, buflen, 0, NULL, status);
  // bail out if there is an error at this point
  if( *status ) return NULL;
  return gotoFITSHDU(fptr, extlist, hdutype, status);
}

// getHeaderToString: get header as a string
void getHeaderToString(fitsfile *fptr,
		       char **cardstr, int *ncard, int *status){
  fits_convert_hdr2str(fptr, 0, NULL, 0, cardstr, ncard, status);
}

// update/add WCS params
// update/add LTM and LTV header params
// ftp://iraf.noao.edu/iraf/web/projects/fitswcs/specwcs.html
void updateWCS(fitsfile *fptr, fitsfile *ofptr,
	       int xcen, int ycen, int dim1, int dim2, double bin,
	       double *amin){
  int status;
  double x1, y1;
  double dval;
  char comment[FLEN_CARD];
  if( !bin ){
    bin = 1;
  }
  // use amin to calculate CRPIX values, if present
  if( amin != NULL ){
    x1 = (double)amin[0];
    y1 = (double)amin[1];
    dval = 0.0; *comment = '\0'; status = 0;
    fits_read_key(fptr, TDOUBLE, "CRPIX1", &dval, comment, &status);
    if( status == 0 ){
      // funtools-style: see funtools/funcopy.c/_FunCopy2ImageHeader
      dval = (dval + 1.0 - x1 - 0.5) / bin + 0.5;
      // cfitsio-style: see cfitsio/histo.c
      // dval = (dval - x1) / bin + 0.5;
      // zhtools-style: see zhtools/src/images/imblock
      // dval = (dval - x1 - 0.5) / bin + 0.5;
      fits_update_key(ofptr, TDOUBLE, "CRPIX1", &dval, comment, &status);
    }
    dval = 0.0; *comment = '\0'; status = 0;
    fits_read_key(fptr, TDOUBLE, "CRPIX2", &dval, comment, &status);
    if( status == 0 ){
      // funtools-style: see funtools/funcopy.c/_FunCopy2ImageHeader
      dval = (dval + 1.0 - y1 - 0.5) / bin + 0.5;
      // cfitsio-style: see cfitsio/histo.c
      // dval = (dval - y1) / bin + 0.5;
      // zhtools-style: see zhtools/src/images/imblock
      // dval = (dval - y1 - 0.5) / bin + 0.5;
      fits_update_key(ofptr, TDOUBLE, "CRPIX2", &dval, comment, &status);
    }
    dval = 0.0; *comment = '\0'; status = 0;
    fits_read_key(fptr, TDOUBLE, "CDELT1", &dval, comment, &status);
    if( status == 0 ){
      dval = dval * bin;
      fits_update_key(ofptr, TDOUBLE, "CDELT1", &dval, comment, &status);
    }
    dval = 0.0; *comment = '\0'; status = 0;
    fits_read_key(fptr, TDOUBLE, "CDELT2", &dval, comment, &status);
    if( status == 0 ){
      dval = dval * bin;
      fits_update_key(ofptr, TDOUBLE, "CDELT2", &dval, comment, &status);
    }
    dval = 0.0; *comment = '\0'; status = 0;
    fits_read_key(fptr, TDOUBLE, "CD1_1", &dval, comment, &status);
    if( status == 0 ){
      dval = dval * bin;
      fits_update_key(ofptr, TDOUBLE, "CD1_1", &dval, comment, &status);
    }
    dval = 0.0; *comment = '\0'; status = 0;
    fits_read_key(fptr, TDOUBLE, "CD1_2", &dval, comment, &status);
    if( status == 0 ){
      dval = dval * bin;
      fits_update_key(ofptr, TDOUBLE, "CD1_2", &dval, comment, &status);
    }
    dval = 0.0; *comment = '\0'; status = 0;
    fits_read_key(fptr, TDOUBLE, "CD2_1", &dval, comment, &status);
    if( status == 0 ){
      dval = dval * bin;
      fits_update_key(ofptr, TDOUBLE, "CD2_1", &dval, comment, &status);
    }
    dval = 0.0; *comment = '\0'; status = 0;
    fits_read_key(fptr, TDOUBLE, "CD2_2", &dval, comment, &status);
    if( status == 0 ){
      dval = dval * bin;
      fits_update_key(ofptr, TDOUBLE, "CD2_2", &dval, comment, &status);
    }
  }
  // update ltm/ltv values, using center to calculate ltv values
  if( dim1 && dim2 ){
    x1 = (xcen - (dim1 / 2.0));
    y1 = (ycen - (dim2 / 2.0));
    dval = 1.0; *comment = '\0'; status = 0;
    fits_read_key(fptr, TDOUBLE, "LTM1_1", &dval, comment, &status);
    dval = dval / bin; status = 0;
    fits_update_key(ofptr, TDOUBLE, "LTM1_1", &dval, comment, &status);
    dval = 0.0; *comment = '\0'; status = 0;
    fits_read_key(fptr, TDOUBLE, "LTM1_2", &dval, comment, &status);
    dval = dval / bin; status = 0;
    fits_update_key(ofptr, TDOUBLE, "LTM1_2", &dval, comment, &status);
    dval = 0.0; *comment = '\0'; status = 0;
    fits_read_key(fptr, TDOUBLE, "LTM2_1", &dval, comment, &status);
    dval = dval / bin; status = 0;
    fits_update_key(ofptr, TDOUBLE, "LTM2_1", &dval, comment, &status);
    dval = 1.0; *comment = '\0'; status = 0;
    fits_read_key(fptr, TDOUBLE, "LTM2_2", &dval, comment, &status);
    dval = dval / bin; status = 0;
    fits_update_key(ofptr, TDOUBLE, "LTM2_2", &dval, comment, &status);
    dval = 0.0; *comment = '\0'; status = 0;
    fits_read_key(fptr, TDOUBLE, "LTV1", &dval, comment, &status);
    dval = (dval - x1 - 0.5) / bin + 0.5; status = 0;
    fits_update_key(ofptr, TDOUBLE, "LTV1", &dval, comment, &status);
    dval = 0.0; *comment = '\0'; status = 0;
    fits_read_key(fptr, TDOUBLE, "LTV2", &dval, comment, &status);
    dval = (dval - y1 - 0.5) / bin + 0.5; status = 0;
    fits_update_key(ofptr, TDOUBLE, "LTV2", &dval, comment, &status);
  }
}

// getImageToArray: extract a sub-section from an image HDU, return array
void *getImageToArray(fitsfile *fptr,
		      int *dims, double *cens, double bin, int binMode,
		      char *slice, char *opts,
		      int *start, int *end, int *bitpix, int *status){
  int b, i, j, k, naxis;
  int idim1, idim2, idim3, sdim1, sdim2, hidim1, hidim2, hidim3;
  int ttype, tsize;
  int bsize = 0;
  int biter = 1;
  int ooff = 0;
  int ojoff = 0;
  int tstatus = 0;
  int doscale = 0;
  int dobin = 0;
#if __EMSCRIPTEN__
  int doconvert64 = 0;
#endif
  void *obuf, *rbuf;
  long totim, totpix, totbytes;
  long naxes[IDIM], fpixel[IDIM], lpixel[IDIM], myfpixel[IDIM], inc[IDIM];
  double bin2;
  double xcen, ycen;
  double bscale = 1.0;
  double bzero = 0.0;
  char comment[FLEN_CARD];
  char tbuf[SZ_LINE];
  char *s, *tslice;
  char *bptr = NULL;
  int nslice, iaxis0=0, iaxis1=0, iaxis2=0;
  int iaxes[3] = {0, 1, 2};
  int saxes[IDIM] = {0, 0, 0, 0};
  long max_memory = def_max_memory;
  unsigned char *crbuf=NULL, *cobuf=NULL;
  short *srbuf=NULL, *sobuf=NULL;
  unsigned short *usrbuf=NULL, *usobuf=NULL;
  int *irbuf=NULL, *iobuf=NULL;
  long long *lrbuf=NULL, *lobuf=NULL;
  float *frbuf=NULL, *fobuf=NULL;
  double *drbuf=NULL, *dobuf=NULL;
  // get options
  if( keyword(opts, "maxsize", "JSFITSIO_MAXMEMORY", tbuf, SZ_LINE) ){
    max_memory = strtol(tbuf, NULL, 10);
  }
  // seed buffers
  for(i=0; i<IDIM; i++){
    naxes[i] = 0;
    fpixel[i] = 1;
    lpixel[i] = 1;
    inc[i] = 1;
  }
  // get image dimensions and type
  fits_get_img_dim(fptr, &naxis, status);
  fits_get_img_size(fptr, min(IDIM,naxis), naxes, status);
  fits_get_img_type(fptr, bitpix, status);
  if( naxis < 2 ){
    *status = BAD_DIMEN;
    return NULL;
  }
  // get binning parameter
  // negative bin => 1/abs(bin)
  if( bin == 0 ){
    bin = 1.0;
  } else if( bin < 0 ){
    bin = 1.0 / fabs(bin);
  }
  // parse slice string into primary axes and slice axes
  if( slice && *slice ){
    if( !strcmp(slice, "all") ){
      tslice = (char *)strdup("*:*:all");
    } else {
      if( strchr(slice, ':') || strchr(slice, ',') ){
	tslice = (char *)strdup(slice);
      } else {
	snprintf(tbuf, SZ_LINE, "*:*:%s", slice);
	tslice = (char *)strdup(tbuf);
      }
    }
    for(s=(char *)strtok(tslice, ":,"), nslice=0, i=0;
	(s != NULL) && (nslice < IDIM);
	s=(char *)strtok(NULL,":,"), nslice++){
      if( !strcmp(s, "*") ){
	if( i < 2 ){
	  iaxes[i++] = nslice;
	}
      } else {
	// all slices (i.e. the whole data cube)?
	if( !strcmp(s, "all") ){
	  saxes[nslice] = -naxes[nslice];
	  iaxis2 = nslice;
	} else {
	  // specific slice
	  saxes[nslice] = atoi(s);
	  if( (saxes[nslice] < 1) || (saxes[nslice] > naxes[nslice]) ){
	    *status = SEEK_ERROR;
	    return NULL;
	  }
	}
      }
    }
    free(tslice);
  }
  // convenience variables for the primary axis indexes
  iaxis0 = iaxes[0];
  iaxis1 = iaxes[1];
  // max dimension of each input axis for integral binning
  if( bin >= 1 ){
    idim1 = (int)(naxes[iaxis0] / bin) * bin;
    idim2 = (int)(naxes[iaxis1] / bin) * bin;
  } else {
    idim1 = naxes[iaxis0];
    idim2 = naxes[iaxis1];
  }
  // get limits of extracted section taking binning into account
  if( dims && dims[0] && dims[1] ){
    sdim1 = min(dims[0], idim1);
    sdim2 = min(dims[1], idim2);
    // read image section
    if( cens && cens[0] && cens[1] ){
      xcen = cens[0];
      ycen = cens[1];
    } else {
      xcen = idim1/2.0;
      ycen = idim2/2.0;
    }
    // min and max of input section, indexed from 1
    fpixel[iaxis0] = (int)(xcen - (sdim1/2.0) + 1);
    fpixel[iaxis1] = (int)(ycen - (sdim2/2.0) + 1);
    lpixel[iaxis0] = (int)(xcen + (sdim1/2.0));
    if( sdim1 % 2 == 1 ){ lpixel[iaxis0] += 1; }
    lpixel[iaxis1] = (int)(ycen + (sdim2/2.0));
    if( sdim2 % 2 == 1 ){ lpixel[iaxis1] += 1; }
  } else {
    // read entire input image
    fpixel[iaxis0] = 1;
    fpixel[iaxis1] = 1;
    lpixel[iaxis0] = idim1;
    lpixel[iaxis1] = idim2;
  }
  // stay within image limits
  fpixel[iaxis0] = max(fpixel[iaxis0], 1);
  fpixel[iaxis0] = min(fpixel[iaxis0], naxes[iaxis0]);
  lpixel[iaxis0] = max(lpixel[iaxis0], 1);
  lpixel[iaxis0] = min(lpixel[iaxis0], naxes[iaxis0]);
  fpixel[iaxis1] = max(fpixel[iaxis1], 1);
  fpixel[iaxis1] = min(fpixel[iaxis1], naxes[iaxis1]);
  lpixel[iaxis1] = max(lpixel[iaxis1], 1);
  lpixel[iaxis1] = min(lpixel[iaxis1], naxes[iaxis1]);
  /* get output dimensions, ensuring that bin divides dimensions evenly */
  if( fmod(bin,1) == 0.0 ){
    for(i=0; i<bin; i++){
      idim1 = (lpixel[iaxis0] - fpixel[iaxis0] + 1);
      if( (idim1 <= 0 ) || fmod(((float)idim1/(float)bin), 1) == 0.0 ){
	break;
      }
      lpixel[iaxis0] -= 1;
    }
    for(i=0; i<bin; i++){
      idim2 = (lpixel[iaxis1] - fpixel[iaxis1] + 1);
      if( (idim2 <= 0 ) || fmod(((float)idim2/(float)bin), 1) == 0.0 ){
	break;
      }
      lpixel[iaxis1] -= 1;
    }
  } else {
      idim1 = (lpixel[iaxis0] - fpixel[iaxis0] + 1);
      idim2 = (lpixel[iaxis1] - fpixel[iaxis1] + 1);
  }
  // for sliced dimensions, set first and last pixel to the specified slice
  idim3 = 1;
  for(i=0; i<min(IDIM,naxis); i++){
    if( saxes[i] ){
      if( saxes[i] < 0 ){
	// entire slice dimension
	fpixel[i] = 1;
	lpixel[i] = naxes[i];
	idim3 = naxes[i];
      } else {
	// 1 pixel slice in this dimension
	fpixel[i] = saxes[i];
	lpixel[i] = saxes[i];
      }
      // stay within image limits
      fpixel[i] = max(fpixel[i], 1);
      fpixel[i] = min(fpixel[i], naxes[i]);
      lpixel[i] = max(lpixel[i], 1);
      lpixel[i] = min(lpixel[i], naxes[i]);
    }
  }
  // save section limits
  if( start ){
    start[0] = fpixel[iaxis0];
    start[1] = fpixel[iaxis1];
    if( iaxis2 ){
      start[2] = fpixel[iaxis2];
    }
  }
  if( end ){
    end[0] = lpixel[iaxis0];
    end[1] = lpixel[iaxis1];
    if( iaxis2 ){
      end[2] = lpixel[iaxis2];
    }
  }
  // total pixels in one slice of the image
  totim = idim1 * idim2;
  // total pixels in the image
  totpix = idim1 * idim2 * idim3;
  // make sure we have an image with valid dimensions size
  if( totpix <= 1 ){
    *status = NEG_AXIS;
    return NULL;
  }
  // are we scaling?
  fits_read_key(fptr, TDOUBLE, "BSCALE", &bscale, comment, &tstatus);
  if( tstatus != VALUE_UNDEFINED ){
    fits_read_key(fptr, TDOUBLE, "BZERO", &bzero, comment, &tstatus);
  }
  if( (bscale != 1.0) || (bzero != 0.0) ){
    doscale = 1;
  }
  if( bin != 1 ){
    if( (binMode == 0) || (binMode == 's') ){
      dobin = 's';
    } else {
      dobin = 'a';
    }
  }
  // in javascript, there is no 64-bit typed array support other than BitInt64,
  // which strictly requires bigint values, so we convert to double float
#if __EMSCRIPTEN__
  if( *bitpix == 64 ){
    *bitpix = -64;
    doconvert64 = 1;
  }
#endif
  // allocate space for the pixel array
  // scaled integer data => float
  // binned sum integer data => int
  // binned avg integer data => float
  switch(*bitpix){
    case 8:
      if( doscale ){
	*bitpix = -32;
	ttype = TFLOAT;
	tsize = sizeof(float);
      } else if( dobin == 's' ){
	*bitpix = 32;
	ttype = TINT;
	tsize = sizeof(int);
      } else if( dobin == 'a' ){
	*bitpix = -32;
	ttype = TFLOAT;
	tsize = sizeof(float);
      } else {
	ttype = TBYTE;
	tsize = sizeof(char);
      }
      break;
    case 16:
      if( doscale ){
	*bitpix = -32;
	ttype = TFLOAT;
	tsize = sizeof(float);
      } else if( dobin == 's' ){
	*bitpix = 32;
	ttype = TINT;
	tsize = sizeof(int);
      } else if( dobin == 'a' ){
	*bitpix = -32;
	ttype = TFLOAT;
	tsize = sizeof(float);
      } else {
	ttype = TSHORT;
	tsize = sizeof(short);
      }
      break;
    case -16:
      if( doscale ){
	*bitpix = -32;
	ttype = TFLOAT;
	tsize = sizeof(float);
      } else if( dobin == 's' ){
	*bitpix = 32;
	ttype = TINT;
	tsize = sizeof(int);
      } else if( dobin == 'a' ){
	*bitpix = -32;
	ttype = TFLOAT;
	tsize = sizeof(float);
      } else {
	ttype = TUSHORT;
	tsize = sizeof(unsigned short);
      }
      break;
    case 32:
      if( doscale ){
	*bitpix = -32;
	ttype = TFLOAT;
	tsize = sizeof(float);
      } else if( dobin == 'a' ){
	*bitpix = -32;
	ttype = TFLOAT;
	tsize = sizeof(float);
      } else {
	ttype = TINT;
	tsize = sizeof(int);
      }
      break;
    case 64:
      if( doscale ){
	*bitpix = -32;
	ttype = TFLOAT;
	tsize = sizeof(float);
      } else if( dobin == 'a' ){
	*bitpix = -32;
	ttype = TFLOAT;
	tsize = sizeof(float);
      } else {
	ttype = TLONGLONG;
	tsize = sizeof(long long);
      }
      break;
    case -32:
      ttype = TFLOAT;
      tsize = sizeof(float);
      break;
    case -64:
      ttype = TDOUBLE;
      tsize = sizeof(double);
      break;
  default:
    return NULL;
  }
  if( bin == 1 ){
    totbytes = totpix * tsize;
    // sanity check on memory limits
    if( max_memory && totbytes > max_memory ){
      *status = MEMORY_ALLOCATION;
      return NULL;
    }
    // allocate memory for the whole image section
    if(!(obuf = (void *)calloc(totbytes, sizeof(char)))){
      *status = MEMORY_ALLOCATION;
      return NULL;
    }
    /* read the image section */
    fits_read_subset(fptr, ttype, fpixel, lpixel, inc, 0, obuf, 0, status);
  } else {
    // allocate memory for one full row of input data
    if(!(rbuf = (void *)calloc(idim1 * tsize, sizeof(char)))){
      *status = MEMORY_ALLOCATION;
      return NULL;
    }
    // get total bytes
    totbytes = (int)((int)(idim1 / bin) * (int)(idim2 / bin) * idim3 * tsize);
    /* allocate memory for the output binned image section */
    if( !(obuf = (void *)calloc(totbytes, sizeof(char))) ){
      *status = MEMORY_ALLOCATION;
      return NULL;
    }
    switch(*bitpix){
    case 8:
      crbuf = (unsigned char *)rbuf;
      cobuf = (unsigned char *)obuf;
      break;
    case 16:
      srbuf = (short *)rbuf;
      sobuf = (short *)obuf;
      break;
    case -16:
      usrbuf = (unsigned short *)rbuf;
      usobuf = (unsigned short *)obuf;
      break;
    case 32:
      irbuf = (int *)rbuf;
      iobuf = (int *)obuf;
      break;
    case 64:
      lrbuf = (long long *)rbuf;
      lobuf = (long long *)obuf;
      break;
    case -32:
      frbuf = (float *)rbuf;
      fobuf = (float *)obuf;
      break;
    case -64:
      drbuf = (double *)rbuf;
      dobuf = (double *)obuf;
      break;
    }
    /* seed section limits */
    for(i=0; i<IDIM; i++){
      myfpixel[i] = fpixel[i];
    }
    // loop limits
    if( bin >= 1 ){
      hidim1 = (int)(idim1 / bin) * bin;
      hidim2 = (int)(idim2 / bin) * bin;
      hidim3 = idim3;
    } else {
      hidim1 = idim1;
      hidim2 = idim2;
      hidim3 = idim3;
      biter = (int)(1.0 / bin);
      bsize = (int)(idim1 / bin) * tsize;
    }
    /* for each input slice */
    for(k=0; k<hidim3; k++){
      /* read thus slice slice */
      myfpixel[2] = fpixel[2] + k;
      /* for each input row */
      for(j=0; j<hidim2; j++){
	/* read next line of the input section */
	myfpixel[1] = fpixel[1] + j;
	tstatus = 0;
	fits_read_pix(fptr, ttype, myfpixel, idim1, NULL, rbuf, NULL, &tstatus);
	/* exit on error, perhaps we still have something to show */
	if( tstatus ){
	  break;
	}
	// offset into output image for this line
	ojoff = (int)(k * totim) + (int)(j / bin) * (int)(idim1 / bin);
	/* for each pixel in the input line */
	for(i=0; i<hidim1; i++){
	  /* index of output image pixel */
	  ooff = ojoff + (int)(i / bin);
	  switch(*bitpix){
	  case 8:
	    for(b=0; b<biter; b++){
	      cobuf[ooff+b] += crbuf[i];
	    }
	    break;
	  case 16:
	    for(b=0; b<biter; b++){
	      sobuf[ooff+b] += srbuf[i];
	    }
	    break;
	  case -16:
	    for(b=0; b<biter; b++){
	      usobuf[ooff+b] += usrbuf[i];
	    }
	    break;
	  case 32:
	    for(b=0; b<biter; b++){
	      iobuf[ooff+b] += irbuf[i];
	    }
	    break;
	  case 64:
	    for(b=0; b<biter; b++){
	      lobuf[ooff+b] += lrbuf[i];
	    }
	    break;
	  case -32:
	    for(b=0; b<biter; b++){
	      fobuf[ooff+b] += frbuf[i];
	    }
	    break;
	  case -64:
	    for(b=0; b<biter; b++){
	      dobuf[ooff+b] += drbuf[i];
	    }
	    break;
	  }
	}
	if( bin < 1 ){
	  bptr = obuf + (ojoff * tsize);
	  for(b=1; b<biter; b++){
	    memcpy(bptr + b * bsize, bptr, bsize);
	  }
	}
      }
      free(rbuf);
    }
  }
  // average, if necessary
  if( dobin == 'a' ){
    if( bin >= 1 ){
      bin2 = bin * bin;
    } else {
      bin2 = 1 / (bin * bin);
    }
    totpix = totbytes / tsize;
    for(i=0; i<totpix; i++){
      switch(*bitpix){
      case 8:
	cobuf[i] /= bin2;
	break;
      case 16:
	sobuf[i] /= bin2;
	break;
      case -16:
	usobuf[i] /= bin2;
	break;
      case 32:
	iobuf[i] /= bin2;
	break;
      case 64:
	lobuf[i] /= bin2;
	break;
      case -32:
	fobuf[i] /= bin2;
	break;
      case -64:
	dobuf[i] /= bin2;
	break;
      }
    }
  }
  // if we converted bitpix 64 to -64, check if we can convert back to 32
#if __EMSCRIPTEN__
  if( doconvert64 ){
    // ensure dobuf points to obuf (in case we read the whole section)
    dobuf = (double *)obuf;
    // are all pixel values are in range of 32 bit ints?
    for(i=0; i<totpix; i++){
      if( (dobuf[i] > MAXINT) || (dobuf[i] < MININT) ){
	// data is out of 32-bit range, leave as double
        doconvert64 = 0;
	break;
      }
    }
    // if so, we can convert the output to int 32 data
    if( doconvert64 ){
      // allocate buffer for int data
      if( !(iobuf = (int *)calloc(totpix, sizeof(int))) ){
	*status = MEMORY_ALLOCATION;
	return NULL;
      }
      // convert to int
      for(i=0; i<totpix; i++){
	iobuf[i] = (int)round(dobuf[i]);
      }
      // free original double data
      free(obuf);
      // point to int data
      obuf = iobuf;
      // change bitpix to int 32
      *bitpix = 32;
    }
  }
#endif
  // return pixel buffer
  return obuf;
}

// filterTableToImage: filter a binary table, create a temp image
fitsfile *filterTableToImage(fitsfile *fptr,
			     char *filter, char *cols,
			     int *dims, double *cens, double bin,
			     char *opts,
			     int *status){
  int i, dim1, dim2, hpx, tstatus;
  int imagetype=TINT, naxis=2, recip=0;
#if WITH_IDX
  int got=-1;
#endif
  long nirow, norow, totbytes;
  long max_memory = def_max_memory;
  float weight=1;
  double xcen, ycen;
  double minin[IDIM], maxin[IDIM], binsizein[IDIM];
  char *s, *t;
  char tbuf[SZ_LINE];
  char filename[SZ_LINE];
  char keyname[FLEN_KEYWORD];
  char param[FLEN_CARD];
  char comment[FLEN_CARD];
  char *rowselect=NULL;
  char *outfile=IFILE;
  char wtcol[FLEN_VALUE];
  char colname[IDIM][FLEN_VALUE];
  char minname[IDIM][FLEN_VALUE];
  char maxname[IDIM][FLEN_VALUE];
  char binname[IDIM][FLEN_VALUE];
  int colnum[IDIM];
  long haxes[IDIM];
  long naxes[IDIM];
  float amin[IDIM];
  float amax[IDIM];
  float binsize[IDIM];
  fitsfile *ofptr;

  // look for opts directives
  if( keyword(opts, "bitpix", "JSFITSIO_TABLEBITPIX", tbuf, SZ_LINE) ){
    imagetype = fitstypeof(strtol(tbuf, NULL, 10));
  }
  if( keyword(opts, "maxsize", "JSFITSIO_MAXMEMORY", tbuf, SZ_LINE) ){
    max_memory = strtol(tbuf, NULL, 10);
  }
  if( keyword(opts, "ofile", "JSFITSIO_OFILE", filename, SZ_LINE) ){
    outfile = filename;
  }
  // check for HEALPix table, which is handled specially
  hpx = 0;
  param[0] = '\0';
  tstatus = 0;
  fits_read_key(fptr, TSTRING, "PIXTYPE", param, comment, &tstatus);
  // look for pixtype param with value of "healpix" ...
  if( (tstatus == 0) && !strcasecmp(param, "HEALPIX") ){
    hpx = 1;
  } else {
    param[0] = '\0';
    tstatus = 0;
    // ... or nside param with non-negative value
    fits_read_key(fptr, TSTRING, "NSIDE", param, comment, &tstatus);
    if( (tstatus == 0) && atoi(param) > 0 ){
      hpx = 2;
    }
  }
  // if either case holds, it's HEALPix ...
  if( hpx ){
    ofptr = healpixToImage(fptr, status);
    if( *status ) return NULL;
    // if 0,0 was input, change to center of image
    if( cens && ((cens[0] == 0) || (cens[1] == 0)) ){
      tstatus = 0;
      fits_get_img_size(ofptr, 2, naxes, &tstatus);
      if( cens[0] == 0 ){
	cens[0] = naxes[0]/2;
      }
      if( cens[1] == 0 ){
	cens[1] = naxes[1]/2;
      }
    }
    return ofptr;
  }
  // otherwise, it's an ordinary binary table, set up defaults
  // get binning parameter
  // negative bin => 1/abs(bin)
  if( bin == 0 ){
    bin = 1.0;
  } else if( bin < 0 ){
    bin = 1.0 / fabs(bin);
  }
  wtcol[0] = '\0';
  for(i=0; i<IDIM; i++){
    minin[i] = DOUBLENULLVALUE;
    maxin[i] = DOUBLENULLVALUE;
    binsizein[i] = bin;
    minname[i][0] = '\0';
    maxname[i][0] = '\0';
    binname[i][0] = '\0';
  }
  if( cols ){
    s = (char *)strdup(cols);
    // x column
    t = (char *)strtok(s, " ,");
    if( t ){
      strncpy(colname[0], t, FLEN_VALUE);
      colname[0][FLEN_VALUE-1] = '\0';
    }
    // y column
    t = (char *)strtok(NULL, " ,");
    if( t ){
      strncpy(colname[1], t, FLEN_VALUE);
      colname[1][FLEN_VALUE-1] = '\0';
    }
    // cube column[:min:max][:binsize]
    t = (char *)strtok(NULL, " ,");
    if( getcolinfo(t, colname[2], FLEN_VALUE,
		   &minin[2], &maxin[2], &binsizein[2]) ){
      naxis = naxis + 1;
    }
    free(s);
  } else {
    colname[0][0] = '\0';
    colname[1][0] = '\0';
  }
  // get total number of rows in input file
  fits_get_num_rows(fptr, &nirow, status);
  // and allocate memory for selected rows array
  rowselect = calloc(nirow+1, sizeof(char));
  // filter the input file and generate selected rows array
  if( filter && *filter ){
#if WITH_IDX
    got = idx_find_rows(fptr, filter, 0, nirow, &norow, rowselect, status);
    if( got < 0 ){
#endif
      fits_find_rows(fptr, filter, 0, nirow, &norow, rowselect,  status);
      if( *status ) return NULL;
#if WITH_IDX
    }
#endif
  } else {
    for(i=0; i<nirow+1; i++){
      rowselect[i] = TRUE;
    }
  }
  // get binning parameters so we can know the image dims for these cols
  // and from that, get the default center of the image
  fits_calc_binning(fptr, naxis, colname, minin, maxin, binsizein,
		    minname, maxname, binname,
		    colnum, haxes, amin, amax, binsize, status);
  if( *status ) return NULL;
  // add bin factor back into haxes to get table dimensions
  haxes[0] = (int)(haxes[0] * bin);
  haxes[1] = (int)(haxes[1] * bin);
  // why truncate to int? otherwise, cfitsio is 0.5 pixels off from js9 ...
  xcen = (int)((amax[0] + amin[0])/2.0);
  ycen = (int)((amax[1] + amin[1])/2.0);
  dim1 = haxes[0];
  dim2 = haxes[1];
  // get limits of extracted section
  if( dims && dims[0] && dims[1] ){
    // read image section
    if( cens && cens[0] && cens[1] ){
      xcen = cens[0];
      ycen = cens[1];
      dim1 = dims[0];
      dim2 = dims[1];
    } else {
      if( haxes[0] >= dims[0] ){
	dim1 = dims[0];
      }
      if( haxes[1] >= dims[1] ){
	dim2 = dims[1];
      }
    }
    // min and max, indexed from 1
    minin[0] = (int)(xcen - (dim1/2.0));
    minin[1] = (int)(ycen - (dim2/2.0));
    maxin[0] = (int)(xcen + (dim1/2.0));
    maxin[1] = (int)(ycen + (dim2/2.0));
  }
  // sanity check on memory limits
  if( max_memory ){
    for(i=0, totbytes=1; i<naxis; i++){
      totbytes *= (maxin[i] - minin[i]) / binsizein[i];
    }
    totbytes *= ffpxsz(imagetype);
    if( totbytes > max_memory ){
      *status = MEMORY_ALLOCATION;
      return NULL;
    }
  }
  // make histogram from selected rows
  ofptr = ffhist3(fptr, outfile, imagetype, naxis, colname,
		  minin, maxin, binsizein, minname, maxname, binname,
		  weight, wtcol, recip, rowselect, status);
  if( *status ) return NULL;
  // store original table info needed by JS9 in header
  for(i=0; i<2; i++){
    tstatus = 0;
    ffkeyn("TFORM", colnum[i], keyname, &tstatus);
    fits_read_key(fptr, TSTRING, keyname, param, comment, &tstatus);
    ffkeyn("TABTYP", i+1, keyname, &tstatus);
    fits_update_key(ofptr, TSTRING, keyname, param,
		    "original table data type", &tstatus);
    tstatus = 0;
    ffkeyn("TABMIN", i+1, keyname, &tstatus);
    fits_update_key(ofptr, TFLOAT, keyname, &amin[i],
		    "original table lower bound", &tstatus);
    tstatus = 0;
    ffkeyn("TABMAX", i+1, keyname, &tstatus);
    fits_update_key(ofptr, TFLOAT, keyname, &amax[i],
		    "original table upper bound", &tstatus);
    tstatus = 0;
    ffkeyn("TABDIM", i+1, keyname, &tstatus);
    fits_update_key(ofptr, TLONG, keyname, &haxes[i],
		    "original table dimensions", &tstatus);
  }
  // update/add LTM and LTV header params
  updateWCS(fptr, ofptr, xcen, ycen, dim1, dim2, bin, NULL);
  // return the center and dims used
  if( dims ){
    dims[0] = dim1;
    dims[1] = dim2;
  }
  if( cens ){
    cens[0] = xcen;
    cens[1] = ycen;
  }
  // if we are writing a disk file, flush to ensure header is updated completely
  if( strcmp(outfile, IFILE) ){
    fits_flush_file(ofptr, &tstatus);
  }
  // free up space
  if( rowselect ) free(rowselect);
  // return new file pointer
  return ofptr;
}

// create a data cube from a FITS bianry table
fitsfile *createCubeFromTable(fitsfile *fptr, char *filter, char *cols,
			      int *dims, double *cens, double bin, char *opts,
			      int *status){
  int got = 0;
  char *s = NULL;
  char *t = NULL;
  char tbuf[SZ_LINE];
  fitsfile *ofptr = NULL;
  // 1 col (X Y is implied) or 3 cols
  t = strdup(cols);
  for(s=(char *)strtok(t, " ,"); s; s=(char *)strtok(NULL," ,")){ got++; }
  if( t ) free(t);
  switch(got){
  case 1:
    snprintf(tbuf, SZ_LINE-1, "X Y %s", cols);
    break;
  case 3:
    strncpy(tbuf, cols, SZ_LINE-1);
    break;
  default:
    *status = NGP_BAD_ARG;
    return NULL;
  }
  // convert table to image
  ofptr = filterTableToImage(fptr, filter, tbuf, dims, cens, bin, opts, status);
  return ofptr;
}

// closeFITSFile: close a FITS file or memory object
void closeFITSFile(fitsfile *fptr, int *status){
  fits_close_file(fptr, status);
}

// maxFITSMemory: set limit of size of memory available for a FITS image
int maxFITSMemory(int limit){
  int old = def_max_memory;
  // if 0, don't set, just return current
  if( limit ){
    def_max_memory = limit;
  }
  // return prev value
  return old;
}
