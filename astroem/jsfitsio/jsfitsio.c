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
#include "fitsio.h"
#if EM
#include <emscripten.h>
#endif

/* must match what cfitsio expects (i.e., 4 for histogramming) */
#define IDIM 4
#define IFILE "mem://";
#define MFILE "foo"

#define max(a,b) (a>=b?a:b)
#define min(a,b) (a<=b?a:b)

// the emscripten heap is about 1Gb, so we have to place limits on memory
// somewhat arbitrarily, this size allows for a 10600 x 10600 4-byte image
#define MAX_MEMORY 450000000
static int max_memory = MAX_MEMORY;

// gotoFITSHDU: try to go to a reasonable HDU if the primary is useless
// we look for specified extensions and if not found, go to hdu #2
// this is how xray binary tables are imaged automatically
fitsfile *gotoFITSHDU(fitsfile *fptr, char *extlist, int *hdutype, int *status){
  int hdunum, naxis, thdutype, gotext=0;
  char *ext, *textlist;
  // if this is the primary array and it does not contain an image,
  // try to move to something more reasonble
  fits_get_hdu_num(fptr, &hdunum); *status = 0;
  fits_get_img_dim(fptr, &naxis, status); *status = 0;
  if( (hdunum == 1) && (naxis == 0) ){ 
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
fitsfile *openFITSFile(char *ifile, char *extlist, int *hdutype, int *status){
  fitsfile *fptr;
  // open fits file
  fits_open_file(&fptr, ifile, READONLY, status);
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
  fits_open_memfile(&fptr, MFILE, READONLY, buf, buflen, 0, NULL, status);
  // bail out if there is an error at this point
  if( *status ){
    return NULL;
  }
  return gotoFITSHDU(fptr, extlist, hdutype, status);
}

// getImageToArray: extract a sub-section from an image HDU, return array
void *getImageToArray(fitsfile *fptr, int *dims, double *cens, char *slice,
		      int *odim1, int *odim2, int *bitpix, int *status){
  int i, naxis;
  int xcen, ycen, dim1, dim2, type;
  int tstatus = 0;
  int doscale = 0;
  void *obuf;
  long totpix, totbytes;
  long naxes[IDIM], fpixel[IDIM], lpixel[IDIM], inc[IDIM];
  double bscale = 1.0;
  double bzero = 0.0;
  char comment[81];
  char *s, *tslice;
  int nslice, idx, iaxis0, iaxis1;
  int iaxes[2] = {0, 1};
  int saxes[IDIM] = {0, 0, 0, 0};
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
  // parse slice string into primary axes and slice axes
  if( slice && *slice ){
    tslice = (char *)strdup(slice);
    for(s=(char *)strtok(tslice, " :,"), nslice=0, idx=0;
	(s != NULL) && (nslice < IDIM); 
	s=(char *)strtok(NULL," :,"), nslice++){
      if( !strcmp(s, "*") ){
	if( idx < 2 ){
	  iaxes[idx++] = nslice;
	}
      } else {
	saxes[nslice] = atoi(s);
	if( (saxes[nslice] < 1) || (saxes[nslice] > naxes[nslice]) ){
	  *status = SEEK_ERROR;
	  return NULL;
	}
      }
    }
    free(tslice);      
  }
  // convenience variables for the primary axis indexes
  iaxis0 = iaxes[0];
  iaxis1 = iaxes[1];
  // get limits of extracted section
  if( dims && dims[0] && dims[1] ){
    dim1 = min(dims[0], naxes[iaxis0]);
    dim2 = min(dims[1], naxes[iaxis1]);
    // read image section
    if( cens ){
      xcen = cens[0];
      ycen = cens[1];
    } else {
      xcen = dim1/2;
      ycen = dim2/2;
    }
    fpixel[iaxis0] = (int)(xcen - (dim1+1)/2);
    fpixel[iaxis1] = (int)(ycen - (dim2+1)/2);
    lpixel[iaxis0] = (int)(xcen + (dim1/2));
    lpixel[iaxis1] = (int)(ycen + (dim2/2));
  } else {
    // read entire image
    fpixel[iaxis0] = 1;
    fpixel[iaxis1] = 1;
    lpixel[iaxis0] = naxes[iaxis0];
    lpixel[iaxis1] = naxes[iaxis1];
  }
  // stay within image limits
  fpixel[iaxis0] = max(fpixel[iaxis0], 1);
  fpixel[iaxis0] = min(fpixel[iaxis0], naxes[iaxis0]);
  lpixel[iaxis0] = max(lpixel[iaxis0], 1);
  lpixel[iaxis0] = min(lpixel[iaxis0], naxes[iaxis0]);
  fpixel[iaxis1] = max(fpixel[iaxis1], 1);
  fpixel[iaxis1] = min(fpixel[iaxis1], naxes[iaxis0]);
  lpixel[iaxis1] = max(lpixel[iaxis1], 1);
  lpixel[iaxis1] = min(lpixel[iaxis1], naxes[iaxis0]);
  // for sliced dimensions, set first and last pixel to the specified slice
  for(i=0; i<min(IDIM,naxis); i++){
    if( saxes[i] ){
      // 1 pixel slice in this dimension
      fpixel[i] = saxes[i];
      lpixel[i] = saxes[i];
      // stay within image limits
      fpixel[i] = max(fpixel[i], 1);
      fpixel[i] = min(fpixel[i], naxes[i]);
      lpixel[i] = max(lpixel[i], 1);
      lpixel[i] = min(lpixel[i], naxes[i]);
    }
  }
  // section dimensions
  *odim1 = lpixel[iaxis0] - fpixel[iaxis0] + 1;
  *odim2 = lpixel[iaxis1] - fpixel[iaxis1] + 1;
  totpix = *odim1 * *odim2;
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
	type = TFLOAT;
	totbytes = totpix * sizeof(float);
      } else {
	type = TBYTE;
	totbytes = totpix * sizeof(char);
      }
      break;
    case 16:
      if( doscale ){
	// scaled data has to be float
	*bitpix = -32;
	type = TFLOAT;
	totbytes = totpix * sizeof(float);
      } else {
	type = TSHORT;
	totbytes = totpix * sizeof(short);
      }
      break;
    case -16:
      if( doscale ){
	// scaled data has to be float
	*bitpix = -32;
	type = TFLOAT;
	totbytes = totpix * sizeof(float);
      } else {
	type = TUSHORT;
	totbytes = totpix * sizeof(unsigned short);
      }
      break;
    case 32:
      if( doscale ){
	// scaled data has to be float
	*bitpix = -32;
	type = TFLOAT;
	totbytes = totpix * sizeof(float);
      } else {
	type = TINT;
	totbytes = totpix * sizeof(int);
      }
      break;
    case 64:
      if( doscale ){
	// scaled data has to be float
	*bitpix = -32;
	type = TFLOAT;
	totbytes = totpix * sizeof(float);
      } else {
	type = TLONGLONG;
	totbytes = totpix * sizeof(long long);
      }
      break;
    case -32:
      type = TFLOAT;
      totbytes = totpix * sizeof(float);
      break;
    case -64:
      type = TDOUBLE;
      totbytes = totpix * sizeof(double);
      break;
  default:
    return NULL;
  }
#if EM
  // sanity check on memory limits
  if( totbytes > max_memory ){
    *status = MEMORY_ALLOCATION;
    return NULL;
  }
#endif
  // try to allocate that much memory
  if(!(obuf = (void *)malloc(totbytes))){
    *status = MEMORY_ALLOCATION;
    return NULL;
  }
  /* read the image section */
  fits_read_subset(fptr, type, fpixel, lpixel, inc, 0, obuf, 0, status);
  // return pixel buffer (and section dimensions)
  return obuf;
}

// filterTableToImage: filter a binary table, create a temp image
fitsfile *filterTableToImage(fitsfile *fptr, char *filter, char **cols,
			     int *dims, double *cens, int bin, int *status){
  int i, dim1, dim2;
  int tstatus;
  int imagetype=TINT, naxis=2, recip=0;
  long nirow, norow;
  float weight=1;
  float xcen, ycen;
  double dvalue;
  double minin[IDIM], maxin[IDIM], binsizein[IDIM];
  char comment[81];
  char *rowselect=NULL;
  char *outfile=IFILE;
  char wtcol[FLEN_VALUE];
  char colname[IDIM][FLEN_VALUE];
  char minname[IDIM][FLEN_VALUE];
  char maxname[IDIM][FLEN_VALUE];
  char binname[IDIM][FLEN_VALUE];
  int colnum[IDIM];
  long haxes[IDIM];
  float amin[IDIM];
  float amax[IDIM];
  float binsize[IDIM];
  fitsfile *ofptr;

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
  rowselect = malloc(nirow+1);
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
  // why truncate to int? otherwise, cfitsio is 0.5 pixels off from js9 ...
  xcen = (int)(amax[0] + amin[0])/2;
  ycen = (int)(amax[1] + amin[1])/2;
  dim1 = haxes[0];
  dim2 = haxes[0];
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
    dim1 *= bin;
    dim2 *= bin;
    minin[0] = (int)(xcen - ((dim1+1)/2));
    minin[1] = (int)(ycen - ((dim2+1)/2));
    maxin[0] = (int)(xcen + (dim1/2));
    maxin[1] = (int)(ycen + (dim2/2));
  }
  // make 2D section histogram from selected rows
  ofptr = ffhist3(fptr, outfile, imagetype, naxis, colname, 
		  minin, maxin, binsizein, minname, maxname, binname,
		  weight, wtcol, recip, rowselect, status);
  if( *status > 0 ){
    return NULL;
  }
  // update/add LTM and LTV header params
  dvalue = 0.0; *comment = '\0'; tstatus = 0;
  fits_read_key(fptr, TDOUBLE, "LTV1", &dvalue, comment, &tstatus); 
  dvalue = ((dim1 / 2) - xcen) / bin; tstatus = 0;
  fits_update_key(ofptr, TDOUBLE, "LTV1", &dvalue, comment, &tstatus);
  dvalue = 0.0; *comment = '\0'; tstatus = 0;
  fits_read_key(fptr, TDOUBLE, "LTV2", &dvalue, comment, &tstatus); 
  dvalue = ((dim2 / 2) - ycen) / bin; tstatus = 0;
  fits_update_key(ofptr, TDOUBLE, "LTV2", &dvalue, comment, &tstatus);
  dvalue = 1.0 / bin; *comment = '\0'; tstatus = 0;
  fits_read_key(fptr, TDOUBLE, "LTM1_1", &dvalue, comment, &tstatus); 
  tstatus = 0;
  fits_update_key(ofptr, TDOUBLE, "LTM1_1", &dvalue, comment, &tstatus);
  dvalue = 0.0; *comment = '\0'; tstatus = 0;
  fits_read_key(fptr, TDOUBLE, "LTM1_2", &dvalue, comment, &tstatus); 
  tstatus = 0;
  fits_update_key(ofptr, TDOUBLE, "LTM1_2", &dvalue, comment, &tstatus);
  dvalue = 0.0; *comment = '\0'; tstatus = 0;
  fits_read_key(fptr, TDOUBLE, "LTM2_1", &dvalue, comment, &tstatus); 
  tstatus = 0;
  fits_update_key(ofptr, TDOUBLE, "LTM2_1", &dvalue, comment, &tstatus);
  dvalue = 1.0 / bin; *comment = '\0'; tstatus = 0;
  fits_read_key(fptr, TDOUBLE, "LTM2_2", &dvalue, comment, &tstatus); 
  tstatus = 0;
  fits_update_key(ofptr, TDOUBLE, "LTM2_2", &dvalue, comment, &tstatus);
  // return the center and dims used
  if( dims ){
    dims[0] = dim1 / bin;
    dims[1] = dim2 / bin;
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
  fits_convert_hdr2str(fptr, 1, NULL, 0, cardstr, ncard, status);
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
