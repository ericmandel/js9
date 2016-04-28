#include <unistd.h>
#include <string.h>
#include <stdio.h>
#include <sys/types.h>
#include <sys/stat.h>
#include "fitsio.h"
#include "jsfitsio.h"
#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#define EMDIR "/mydir"
#endif

#define EXTLIST "EVENTS STDEVT"
#define IMDIM 2048

void errchk(int status) {
    if (status){
      fits_report_error(stderr, status);
      exit(status);
    }
}

char *FileContents(char *path, size_t *osize)
{
  FILE *fd;
  char *tbuf;
  struct stat buf;
  int get;
  int got;

  /* start pessimisticly */
  if( osize != NULL )
    *osize = 0;

  /* make sure the file exists */
  if( stat(path, &buf) <0 ){
    return(NULL);
  }

  /* open the file */
  if( (fd=fopen(path, "r")) == NULL ){
    return(NULL);
  }
  get = buf.st_size;

  /* get contents */
  tbuf = (char *)malloc(get+1);
  got = fread(tbuf, sizeof(char), get, fd);
  fclose(fd);
  tbuf[got] = '\0';

  /* user may want to know how much was read */
  if( osize != NULL )
    *osize = got;

  return(tbuf);
}

void imstat(void *buf, int idim1, int idim2, int bitpix){
  int ii, totpix;
  double sum = 0.0, meanval = 0.0, minval = 1.E33, maxval = -1.E33;
  char *cbuf;
  short *sbuf;
  unsigned short *usbuf;
  int *ibuf;
  long long *lbuf;
  float *fbuf;
  double *dbuf;
  /* process image section */
  totpix = idim1 * idim2;
  for (ii = 0; ii < totpix; ii++) {
    // allocate space for the pixel array
    switch(bitpix){
    case 8:
      cbuf = (char *)buf;
      sum += cbuf[ii];
      if (cbuf[ii] < minval) minval = cbuf[ii];  /* find min and  */
      if (cbuf[ii] > maxval) maxval = cbuf[ii];  /* max values    */
      break;
    case 16:
      sbuf = (short *)buf;
      sum += sbuf[ii];
      if (sbuf[ii] < minval) minval = sbuf[ii];  /* find min and  */
      if (sbuf[ii] > maxval) maxval = sbuf[ii];  /* max values    */
      break;
    case -16:
      usbuf = (unsigned short *)buf;
      sum += usbuf[ii];
      if (usbuf[ii] < minval) minval = usbuf[ii];  /* find min and  */
      if (usbuf[ii] > maxval) maxval = usbuf[ii];  /* max values    */
      break;
    case 32:
      ibuf = (int *)buf;
      sum += ibuf[ii];
      if (ibuf[ii] < minval) minval = ibuf[ii];  /* find min and  */
      if (ibuf[ii] > maxval) maxval = ibuf[ii];  /* max values    */
      break;
    case 64:
      lbuf = (long long *)buf;
      sum += lbuf[ii];
      if (lbuf[ii] < minval) minval = lbuf[ii];  /* find min and  */
      if (lbuf[ii] > maxval) maxval = lbuf[ii];  /* max values    */
      break;
    case -32:
      fbuf = (float *)buf;
      sum += fbuf[ii];
      if (fbuf[ii] < minval) minval = fbuf[ii];  /* find min and  */
      if (fbuf[ii] > maxval) maxval = fbuf[ii];  /* max values    */
      break;
    case -64:
      dbuf = (double *)buf;
      sum += dbuf[ii];
      if (dbuf[ii] < minval) minval = dbuf[ii];  /* find min and  */
      if (dbuf[ii] > maxval) maxval = dbuf[ii];  /* max values    */
      break;
    default:
      return;
    }
  }
  if (totpix > 0) meanval = sum / totpix;
  printf("Statistics for %d x %d [bitpix %d] image\n", idim1, idim2, bitpix);
  printf("  sum of pixels = %.3f\n", sum);
  printf("  mean value    = %.3f\n", meanval);
  printf("  minimum value = %.3f\n", minval);
  printf("  maximum value = %.3f\n", maxval);
}

int main(int argc, char *argv[])
{
  char *colname[2] = {"X", "Y"};
  char *ifile = NULL;
  char *ifilter=NULL;
  char *tfilter=NULL;
  char *tfilt=NULL;
  char *imem=NULL;
  char *cardstr=NULL;
  char *slice=NULL;
  char tbuf[81];
  int c, i, args, hdutype, ncard;
  int domem = 0;
  int status = 0;   /*  CFITSIO status value MUST be initialized to zero!  */
  int dims[] = {IMDIM, IMDIM};
  void *buf;
  int idim1, idim2, bitpix;
  size_t ilen=0;
  fitsfile *fptr, *ofptr;

  /* we want the args in the same order in which they arrived, and
     gnu getopt sometimes changes things without this */
  putenv("POSIXLY_CORRECT=true");

  // mount the current folder as a NODEFS instance
  // inside of emscripten
#ifdef NODEJS
  EM_ASM(
	 FS.mkdir('/mydir');
	 FS.mount(NODEFS, { root: '.' }, '/mydir');
  );
#endif

  /* process switch arguments */
  while ((c = getopt(argc, argv, "ms:")) != -1){
    switch(c){
    case 'm':
      domem = 1;
      break;
    case 's':
      slice = optarg;
      break;
    }
  }
  // filename is required, filter is optional
  args = argc - optind;
  if( args < 1 ){
    ifile = strdup("test/snr.ev.gz");
  } else {
    // emscripten: if path is relative, make it relative to the virtual dir
#if NODEJS
    if( argv[optind + 0][0] == '/' ){
      ifile = strdup(argv[optind + 0]);
    } else {
      ifile = malloc(strlen(EMDIR) + 1 + strlen(argv[optind + 0]) + 1);
      strcpy(ifile, EMDIR);
      strcat(ifile, "/");
      strcat(ifile, argv[optind + 0]);
    }
#else
    ifile = strdup(argv[optind + 0]);
#endif
  }

  // check for a filter
  if( args > 1 ){
    ifilter = argv[optind + 1];
  }

  if( domem ){
    // read and open fits file in memory for reading, go to a useful HDU
    imem = FileContents(ifile, &ilen);
    fptr = openFITSMem((void **)&imem, &ilen, EXTLIST, &hdutype, &status);
  } else {
    // open fits file for reading, go to a useful HDU
    fptr = openFITSFile(ifile, EXTLIST, &hdutype, &status);
  }
  errchk(status);
  fprintf(stdout, "File: %s\n", ifile);

  // get cards as a string
  getHeaderToString(fptr, &cardstr, &ncard, &status);
  errchk(status);
  if( ncard && cardstr ){
    // print cards individually to make it easier to diff
    fprintf(stdout, "Cards [%d]:\n", ncard);
    tbuf[80] = '\0';
    for(i=0; i<ncard; i++){
      memcpy(tbuf, &cardstr[i*80], 80);
      fprintf(stdout, "%s\n", tbuf);
    }
    free(cardstr);
  }
  
  // process based on hdu type
  switch(hdutype){
  case IMAGE_HDU:
    // get image array
    buf = getImageToArray(fptr, NULL, NULL, slice,
			   &idim1, &idim2, &bitpix, &status);
    errchk(status);
    // image statistics on image section
    imstat(buf, idim1, idim2, bitpix);
    // clean up
    free(buf);
    break;
  default:
    // image statistics through a filter
    if( ifilter && *ifilter ){
      tfilter = (char *)strdup(ifilter);
      for(tfilt=(char *)strtok(tfilter, ";"); tfilt != NULL; 
	  tfilt=(char *)strtok(NULL, ";")){
	// image from table
	fprintf(stdout, "Filter: %s\n", tfilt);
	ofptr = filterTableToImage(fptr, tfilt, colname, dims, NULL, 1, 
				   &status);
	errchk(status);
	// get image array
	buf = getImageToArray(ofptr, dims, NULL, slice,
			      &idim1, &idim2, &bitpix, &status);
	errchk(status);
	// image statistics on image section
	imstat(buf, idim1, idim2, bitpix);
	// clean up
	free(buf);
	closeFITSFile(ofptr, &status);
	errchk(status);
      }
    } else {
      // image from table
      ofptr = filterTableToImage(fptr, NULL, colname, dims, NULL, 1, &status);
      errchk(status);
      // get image array
      buf = getImageToArray(ofptr, dims, NULL, slice,
			    &idim1, &idim2, &bitpix, &status);
      errchk(status);
      // image statistics on image section
      imstat(buf, idim1, idim2, bitpix);
      // clean up
      free(buf);
      closeFITSFile(ofptr, &status);
      errchk(status);
    }
    free(tfilter);
    break;
  }
  
  // close fits file
  closeFITSFile(fptr, &status);
  errchk(status);

  // clean up
  if( imem ) free(imem);
  if( ifile ) free(ifile);
  return(0);
}
