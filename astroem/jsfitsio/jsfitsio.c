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
#include <unistd.h>
#include <string.h>
#include <stdio.h>
#include <math.h>
#include "fitsio.h"
#include "healpix.h"

/* must match what cfitsio expects (i.e., 4 for histogramming) */
#define IDIM 4
#define IFILE "mem://"
#define MFILE "foo"
#ifndef SZ_LINE
#define SZ_LINE 1024
#endif

#define max(a,b) (a>=b?a:b)
#define min(a,b) (a<=b?a:b)

// the emscripten heap is about 1Gb, so we have to place limits on memory
// somewhat arbitrarily, this size allows for a 10600 x 10600 4-byte image
#define MAX_MEMORY 450000000
static int max_memory = MAX_MEMORY;

// this routine was added to cfitsio v3.39
#if (CFITSIO_MAJOR < 3) || ((CFITSIO_MAJOR == 3) && (CFITSIO_MINOR < 39))
// ffhist3: same as ffhist2, but does not close the original file,
// and/or replace the original file pointer
fitsfile *ffhist3(fitsfile *fptr, /* I - ptr to table with X and Y cols*/
           char *outfile,    /* I - name for the output histogram file      */
           int imagetype,    /* I - datatype for image: TINT, TSHORT, etc   */
           int naxis,        /* I - number of axes in the histogram image   */
           char colname[4][FLEN_VALUE],   /* I - column names               */
           double *minin,     /* I - minimum histogram value, for each axis */
           double *maxin,     /* I - maximum histogram value, for each axis */
           double *binsizein, /* I - bin size along each axis               */
           char minname[4][FLEN_VALUE], /* I - optional keywords for min    */
           char maxname[4][FLEN_VALUE], /* I - optional keywords for max    */
           char binname[4][FLEN_VALUE], /* I - optional keywords for binsize */
           double weightin,        /* I - binning weighting factor          */
           char wtcol[FLEN_VALUE], /* I - optional keyword or col for weight*/
           int recip,              /* I - use reciprocal of the weight?     */
           char *selectrow,        /* I - optional array (length = no. of   */
                             /* rows in the table).  If the element is true */
                             /* then the corresponding row of the table will*/
                             /* be included in the histogram, otherwise the */
                             /* row will be skipped.  Ingnored if *selectrow*/
                             /* is equal to NULL.                           */
           int *status)
{
    fitsfile *histptr;
    int   bitpix, colnum[4], wtcolnum;
    long haxes[4];
    float amin[4], amax[4], binsize[4],  weight;

    if (*status > 0)
        return(NULL);

    if (naxis > 4)
    {
        ffpmsg("histogram has more than 4 dimensions");
	*status = BAD_DIMEN;
        return(NULL);
    }

    /* reset position to the correct HDU if necessary */
    if ((fptr)->HDUposition != ((fptr)->Fptr)->curhdu)
        ffmahd(fptr, ((fptr)->HDUposition) + 1, NULL, status);

    if (imagetype == TBYTE)
        bitpix = BYTE_IMG;
    else if (imagetype == TSHORT)
        bitpix = SHORT_IMG;
    else if (imagetype == TINT)
        bitpix = LONG_IMG;
    else if (imagetype == TFLOAT)
        bitpix = FLOAT_IMG;
    else if (imagetype == TDOUBLE)
        bitpix = DOUBLE_IMG;
    else{
        *status = BAD_DATATYPE;
        return(NULL);
    }

    /*    Calculate the binning parameters:    */
    /*   columm numbers, axes length, min values,  max values, and binsizes.  */

    if (fits_calc_binning(
      fptr, naxis, colname, minin, maxin, binsizein, minname, maxname, binname,
      colnum, haxes, amin, amax, binsize, status) > 0)
    {
       ffpmsg("failed to determine binning parameters");
        return(NULL);
    }

    /* get the histogramming weighting factor, if any */
    if (*wtcol)
    {
        /* first, look for a keyword with the weight value */
        if (fits_read_key(fptr, TFLOAT, wtcol, &weight, NULL, status) )
        {
            /* not a keyword, so look for column with this name */
            *status = 0;

            /* get the column number in the table */
            if (ffgcno(fptr, CASEINSEN, wtcol, &wtcolnum, status) > 0)
            {
               ffpmsg(
               "keyword or column for histogram weights doesn't exist: ");
               ffpmsg(wtcol);
               return(NULL);
            }

            weight = FLOATNULLVALUE;
        }
    }
    else
        weight = (float) weightin;

    if (weight <= 0. && weight != FLOATNULLVALUE)
    {
        ffpmsg("Illegal histogramming weighting factor <= 0.");
	*status = URL_PARSE_ERROR;
        return(NULL);
    }

    if (recip && weight != FLOATNULLVALUE)
       /* take reciprocal of weight */
       weight = (float) (1.0 / weight);

    /* size of histogram is now known, so create temp output file */
    if (fits_create_file(&histptr, outfile, status) > 0)
    {
        ffpmsg("failed to create temp output file for histogram");
        return(NULL);
    }

    /* create output FITS image HDU */
    if (ffcrim(histptr, bitpix, naxis, haxes, status) > 0)
    {
        ffpmsg("failed to create output histogram FITS image");
        return(NULL);
    }

    /* copy header keywords, converting pixel list WCS keywords to image WCS */
    if (fits_copy_pixlist2image(fptr, histptr, 9, naxis, colnum, status) > 0)
    {
        ffpmsg("failed to copy pixel list keywords to new histogram header");
        return(NULL);
    }

    /* if the table columns have no WCS keywords, then write default keywords */
    fits_write_keys_histo(fptr, histptr, naxis, colnum, status);

    /* update the WCS keywords for the ref. pixel location, and pixel size */
    fits_rebin_wcs(histptr, naxis, amin, binsize,  status);

    /* now compute the output image by binning the column values */
    if (fits_make_hist(fptr, histptr, bitpix, naxis, haxes, colnum, amin, amax,
        binsize, weight, wtcolnum, recip, selectrow, status) > 0)
    {
        ffpmsg("failed to calculate new histogram values");
        return(NULL);
    }

    return(histptr);
}
#endif

// gotoFITSHDU: try to go to a reasonable HDU if the primary is useless
// we look for specified extensions and if not found, go to hdu #2
// this is how xray binary tables are imaged automatically
fitsfile *gotoFITSHDU(fitsfile *fptr, char *extlist, int *hdutype, int *status){
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

// openFITSFile: open a FITS file for reading and go to a useful HDU
//
fitsfile *openFITSFile(char *ifile, int iomode, char *extlist, int *hdutype,
		       int *status){
  fitsfile *fptr;
  // open fits file
  fits_open_file(&fptr, ifile, iomode, status);
  // bail out if there is an error at this point
  if( *status ){
    return NULL;
  }
  return gotoFITSHDU(fptr, extlist, hdutype, status);
}

// openFITSMem: open a FITS memory buffer for reading and go to a useful HDU
fitsfile *openFITSMem(void **buf, size_t *buflen, char *extlist,
		      int *hdutype, int *status){
  fitsfile *fptr;
  // open fits file
  fits_open_memfile(&fptr, MFILE, READWRITE, buf, buflen, 0, NULL, status);
  // bail out if there is an error at this point
  if( *status ){
    return NULL;
  }
  return gotoFITSHDU(fptr, extlist, hdutype, status);
}

// update/add WCS params
// update/add LTM and LTV header params
// ftp://iraf.noao.edu/iraf/web/projects/fitswcs/specwcs.html
void updateWCS(fitsfile *fptr, fitsfile *ofptr,
	       int xcen, int ycen, int dim1, int dim2, int bin,
	       float *amin){
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
      // dval = (dval + 1.0 - x1 - 0.5) / bin + 0.5;
      // cfitsio-style: see cfitsio/histo.c
      dval = (dval - x1) / bin + 0.5;
      fits_update_key(ofptr, TDOUBLE, "CRPIX1", &dval, comment, &status);
    }
    dval = 0.0; *comment = '\0'; status = 0;
    fits_read_key(fptr, TDOUBLE, "CRPIX2", &dval, comment, &status);
    if( status == 0 ){
      // funtools-style: see funtools/funcopy.c/_FunCopy2ImageHeader
      // dval = (dval + 1.0 - y1 - 0.5) / bin + 0.5;
      // cfitsio-style: see cfitsio/histo.c
      dval = (dval - y1) / bin + 0.5;
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
    // funtools-style: see funtools/funcopy.c/_FunCopy2ImageHeader
    // dval = (dval + 1.0 - x1 - 0.5) / bin + 0.5; status = 0;
    // cfitsio-style: see cfitsio/histo.c
    dval = (dval - x1) / bin + 0.5; status = 0;
    fits_update_key(ofptr, TDOUBLE, "LTV1", &dval, comment, &status);
    dval = 0.0; *comment = '\0'; status = 0;
    fits_read_key(fptr, TDOUBLE, "LTV2", &dval, comment, &status);
    // funtools-style: see funtools/funcopy.c/_FunCopy2ImageHeader
    // dval = (dval + 1.0 - y1 - 0.5) / bin + 0.5; status = 0;
    // cfitsio-style: see cfitsio/histo.c
    dval = (dval - y1) / bin + 0.5; status = 0;
    fits_update_key(ofptr, TDOUBLE, "LTV2", &dval, comment, &status);
  }
}

// getImageToArray: extract a sub-section from an image HDU, return array
void *getImageToArray(fitsfile *fptr, int *dims, double *cens,
		      int bin, int binMode, char *slice,
		      int *start, int *end, int *bitpix, int *status){
  int i, j, k, naxis;
  int dim1, dim2, maxdim1, maxdim2, odim1, odim2, odim3, hidim1, hidim2, hidim3;
  int ttype, tsize;
  int ooff = 0;
  int ojoff = 0;
  int tstatus = 0;
  int doscale = 0;
  int bin2;
  void *obuf, *rbuf;
  long totim, totpix, totbytes;
  long naxes[IDIM], fpixel[IDIM], lpixel[IDIM], myfpixel[IDIM], inc[IDIM];
  double xcen, ycen;
  double bscale = 1.0;
  double bzero = 0.0;
  char comment[FLEN_CARD];
  char tbuf[SZ_LINE];
  char *s, *tslice;
  int nslice, idx, iaxis0=0, iaxis1=0, iaxis2=0;
  int iaxes[3] = {0, 1, 2};
  int saxes[IDIM] = {0, 0, 0, 0};
  unsigned char *crbuf=NULL, *cobuf=NULL;
  short *srbuf=NULL, *sobuf=NULL;
  unsigned short *usrbuf=NULL, *usobuf=NULL;
  int *irbuf=NULL, *iobuf=NULL;
  long long *lrbuf=NULL, *lobuf=NULL;
  float *frbuf=NULL, *fobuf=NULL;
  double *drbuf=NULL, *dobuf=NULL;
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
  // get binning parameter, integer only (for now)
  bin = (int)bin;
  if( bin <= 0 ){
    bin = 1;
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
    for(s=(char *)strtok(tslice, ":,"), nslice=0, idx=0;
	(s != NULL) && (nslice < IDIM);
	s=(char *)strtok(NULL,":,"), nslice++){
      if( !strcmp(s, "*") ){
	if( idx < 2 ){
	  iaxes[idx++] = nslice;
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
  // max dimension if each axis for integral binning
  maxdim1 = (int)(naxes[iaxis0] / bin) * bin;
  maxdim2 = (int)(naxes[iaxis1] / bin) * bin;
  // get limits of extracted section taking binning into account
  if( dims && dims[0] && dims[1] ){
    dim1 = min(dims[0], maxdim1);
    dim2 = min(dims[1], maxdim2);
    // read image section
    if( cens && cens[0] && cens[1] ){
      xcen = cens[0];
      ycen = cens[1];
    } else {
      xcen = maxdim1/2.0;
      ycen = maxdim2/2.0;
    }
    // min and max, indexed from 1
    fpixel[iaxis0] = (int)(xcen - (dim1/2.0) + 1);
    fpixel[iaxis1] = (int)(ycen - (dim2/2.0) + 1);
    lpixel[iaxis0] = (int)(xcen + (dim1/2.0));
    lpixel[iaxis1] = (int)(ycen + (dim2/2.0));
  } else {
    // read entire image
    fpixel[iaxis0] = 1;
    fpixel[iaxis1] = 1;
    lpixel[iaxis0] = maxdim1;
    lpixel[iaxis1] = maxdim2;
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
  /* get final dimensions, ensuring that bin divides dimensions evenly */
  for(i=0; i<bin; i++){
    odim1 = (lpixel[iaxis0] - fpixel[iaxis0] + 1);
    if( (odim1 <= 0 ) || fmod(((float)odim1/(float)bin), 1) == 0.0 ){
      break;
    }
    lpixel[iaxis0] -= 1;
  }
  for(i=0; i<bin; i++){
    odim2 = (lpixel[iaxis1] - fpixel[iaxis1] + 1);
    if( (odim2 <= 0 ) || fmod(((float)odim2/(float)bin), 1) == 0.0 ){
      break;
    }
    lpixel[iaxis1] -= 1;
  }
  // for sliced dimensions, set first and last pixel to the specified slice
  odim3 = 1;
  for(i=0; i<min(IDIM,naxis); i++){
    if( saxes[i] ){
      if( saxes[i] < 0 ){
	// entire slice dimension
	fpixel[i] = 1;
	lpixel[i] = naxes[i];
	odim3 = naxes[i];
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
  totim = odim1 * odim2;
  // total pixels in the image
  totpix = odim1 * odim2 * odim3;
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
  // allocate space for the pixel array
  switch(*bitpix){
    case 8:
      if( doscale ){
	// scaled data has to be float
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
	// scaled data has to be float
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
	// scaled data has to be float
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
	// scaled data has to be float
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
	// scaled data has to be float
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
#if __EMSCRIPTEN__
    // sanity check on memory limits
    if( totbytes > max_memory ){
      *status = MEMORY_ALLOCATION;
      return NULL;
    }
#endif
    // allocate memory for the whole image section
    if(!(obuf = (void *)calloc(totbytes, sizeof(char)))){
      *status = MEMORY_ALLOCATION;
      return NULL;
    }
    /* read the image section */
    fits_read_subset(fptr, ttype, fpixel, lpixel, inc, 0, obuf, 0, status);
  } else {
    // allocate memory for one full row of input data
    if(!(rbuf = (void *)calloc(odim1 * tsize, sizeof(char)))){
      *status = MEMORY_ALLOCATION;
      return NULL;
    }
    // get total bytes
    totbytes = (int)(odim3 * (int)(odim1 / bin) * (int)(odim2 / bin) * tsize);
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
    hidim1 = (int)(odim1/bin)*bin;
    hidim2 = (int)(odim2/bin)*bin;
    hidim3 = odim3;
    for(k=0; k<hidim3; k++){
      /* read next line slice */
      myfpixel[2] = fpixel[2] + k;
      /* for each row */
      for(j=0; j<hidim2; j++){
	/* read next line of the section */
	myfpixel[1] = fpixel[1] + j;
	tstatus = 0;
	/* read next line */
	fits_read_pix(fptr, ttype, myfpixel, odim1, NULL, rbuf, NULL, &tstatus);
	/* exit on error, perhaps we still have something to show */
	if( tstatus ){
	  break;
	}
	ojoff = (int)(k * totim) + (int)(j / bin) * (int)(odim1 / bin);
	/* for each column */
	for(i=0; i<hidim1; i++){
	  ooff = ojoff + (int)(i / bin);
	  switch(*bitpix){
	  case 8:
	    cobuf[ooff] += crbuf[i];
	    break;
	  case 16:
	    sobuf[ooff] += srbuf[i];
	    break;
	  case -16:
	    usobuf[ooff] += usrbuf[i];
	    break;
	  case 32:
	    iobuf[ooff] += irbuf[i];
	    break;
	  case 64:
	    lobuf[ooff] += lrbuf[i];
	    break;
	  case -32:
	    fobuf[ooff] += frbuf[i];
	    break;
	  case -64:
	    dobuf[ooff] += drbuf[i];
	    break;
	  }
	}
      }
      free(rbuf);
    }
  }

  // average, if necessary
  if( (bin > 1) && ((binMode == 1) || (binMode == 'a')) ){
    bin2 = bin * bin;
    totpix = (odim1 * odim2 * odim3) / bin2;
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
  // return pixel buffer (and section dimensions)
  return obuf;
}

// filterTableToImage: filter a binary table, create a temp image
fitsfile *filterTableToImage(fitsfile *fptr, char *filter, char **cols,
			     int *dims, double *cens, int bin, int *status){
  int i, dim1, dim2, hpx, tstatus;
  int imagetype=TINT, naxis=2, recip=0;
  long nirow, norow;
  float weight=1;
  double xcen, ycen;
  double minin[IDIM], maxin[IDIM], binsizein[IDIM];
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
    if( *status > 0 ){
      return NULL;
    }
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
  // otherwise, it's an ordinary binary table
  // set up defaults
  if( !bin ) bin = 1;
  wtcol[0] = '\0';
  if( cols && cols[0] && cols[1] ){
    strcpy(colname[0], cols[0]);
    strcpy(colname[1], cols[1]);
  } else {
    colname[0][0] = '\0';
    colname[1][0] = '\0';
  }
  for(i=0; i<IDIM; i++){
    minin[i] = DOUBLENULLVALUE;
    maxin[i] = DOUBLENULLVALUE;
    binsizein[i] = (double)bin;
    minname[i][0] = '\0';
    maxname[i][0] = '\0';
    binname[i][0] = '\0';
  }
  // get total number of rows in input file
  fits_get_num_rows(fptr, &nirow, status);
  // and allocate memory for selected rows array
  rowselect = calloc(nirow+1, sizeof(char));
  // filter the input file and generate selected rows array
  if( filter && *filter ){
    fits_find_rows(fptr, filter, 0, nirow, &norow, rowselect,  status);
    if( *status > 0 ){
      return(NULL);
    }
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
  if( *status > 0 ){
    return(NULL);
  }
  // add bin factor back into haxes to get table dimensions
  haxes[0] = haxes[0] * bin;
  haxes[1] = haxes[1] * bin;
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
  // make 2D section histogram from selected rows
  ofptr = ffhist3(fptr, outfile, imagetype, naxis, colname,
		  minin, maxin, binsizein, minname, maxname, binname,
		  weight, wtcol, recip, rowselect, status);
  if( *status > 0 ){
    return NULL;
  }
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
  // free up space
  if( rowselect ) free(rowselect);
  // return new file pointer
  return ofptr;
}

void getHeaderToString(fitsfile *fptr, char **cardstr, int *ncard, int *status){
  fits_convert_hdr2str(fptr, 0, NULL, 0, cardstr, ncard, status);
}


// closeFITSFile: close a FITS file or memory object
void closeFITSFile(fitsfile *fptr, int *status){
  fits_close_file(fptr, status);
}

// maxFITSMemory: set limit of size of memory available for a FITS image
int maxFITSMemory(int limit){
  int old = max_memory;
  // if 0, don't set, just return current
  if( limit ){
    max_memory = limit;
  }
  // return prev value
  return old;
}
