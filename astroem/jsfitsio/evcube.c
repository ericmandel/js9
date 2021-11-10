/*
 *    evcube: create a FITS 3D cube from a FITS binary table
 */

#include <unistd.h>
#include <string.h>
#include <stdio.h>
#include "fitsio.h"
#include "jsfitsio.h"

#define EXTLIST "EVENTS STDEVT"
#define NDIM    3
#define IMDIM   4096
#define SZ_LINE 1024

void errchk(int status){
  if (status){
    fits_report_error(stderr, status);
    exit(status);
  }
}

static void usage (char *fname){
  fprintf(stderr,
	  "usage: %s [switches] binarytable imagecube cols [opts]\n", 
	  fname);
  fprintf(stderr, "optional switches:\n");
  fprintf(stderr, "  -b bin       # binning factor\n");
  fprintf(stderr, "  -c cx,cy     # image center\n");
  fprintf(stderr, "  -f filter    # event filter\n");
  fprintf(stderr, "  -h height    # image cube height \n");
  fprintf(stderr, "  -m maxsize   # max output size (0 => no limit)\n");
  fprintf(stderr, "  -v           # verbose mode\n");
  fprintf(stderr, "  -w width     # image cube width\n");
  fprintf(stderr, "  -x           # output bitpix\n");
  fprintf(stderr, "opts (overridden by switches):\n");
  fprintf(stderr, "  bitpix=[n]   # output bitpix\n");
  fprintf(stderr, "  maxsize=[n]  # max output size\n");
  fprintf(stderr, "\n");
  exit(1);
}

int main(int argc, char *argv[]){
  int c, args, hdutype;
  int got = 0;
  int status = 0;
  int doverbose = 0;
  int bitpix = 0;
  int dims[] = {IMDIM, IMDIM};
  double bin = 1;
  double cens[2] = {0, 0};
  char *s, *t;
  char *cols = NULL;
  char *filter = NULL;
  char *ifile = NULL;
  char *ofile = NULL;
  char opts[SZ_LINE];
  char tbuf[SZ_LINE];
  fitsfile *ifptr, *tfptr;

  /* we want the args in the same order in which they arrived, and
     gnu getopt sometimes changes things without this */
  putenv("POSIXLY_CORRECT=true");

  /* process switch arguments */
  *opts = '\0';
  while ((c = getopt(argc, argv, "b:c:h:f:m:vw:x:")) != -1){
    switch(c){
    case 'b':
      bin = strtod(optarg, NULL);
      break;
    case 'c':
      t = strdup(optarg);
      for(s=(char *)strtok(t, " ,"); s; s=(char *)strtok(NULL," ,")){
	if( got >= 2 ) break;
	cens[got++] = strtod(s, NULL);
      }
      if( t ) free(t);
      break;
    case 'f':
      filter = optarg;
      break;
    case 'h':
      dims[0] = strtol(optarg, NULL, 10);
      break;
    case 'm':
      snprintf(tbuf, SZ_LINE, "maxsize=%ld", strtol(optarg, NULL, 10));
      if( *opts ) strncat(opts, ",", SZ_LINE);
      strncat(opts, tbuf, SZ_LINE);
      break;
    case 'v':
      doverbose = 1;
      break;
    case 'w':
      dims[1] = strtol(optarg, NULL, 10);
      break;
    case 'x':
      bitpix = strtol(optarg, NULL, 10);
      snprintf(tbuf, SZ_LINE, "bitpix=%d", bitpix);
      if( *opts ) strncat(opts, ",", SZ_LINE);
      strncat(opts, tbuf, SZ_LINE);
      break;
    }
  }
  // require args: ifile ofile cols
  args = argc - optind;
  if( args < 3 ){
    usage(argv[0]);
  } else {
    // input file
    ifile = argv[optind + 0];
    // output file
    ofile = argv[optind + 1];
    // output file does into opts
    snprintf(tbuf, SZ_LINE, "ofile=%s", ofile);
    if( *opts ) strncat(opts, ",", SZ_LINE);
    strncat(opts, tbuf, SZ_LINE);
    // column(s)
    cols  = argv[optind + 2];
    if( args > 3 ){
      if( *opts ) strncat(opts, ",", SZ_LINE);
      strncat(opts, argv[optind + 3], SZ_LINE);
    }
  }
  // open fits file for reading, go to a useful HDU
  strncpy(tbuf, ifile, SZ_LINE);
  if( strchr(tbuf, '[') < 0 ) strncat(tbuf, "[EVENTS]", SZ_LINE);
  ifptr = openFITSFile(tbuf, READONLY, EXTLIST, NULL, &hdutype, &status);
  errchk(status);
  // make sure we are pointing to a binary table
  if( hdutype == IMAGE_HDU ){
    fprintf(stderr, "ERROR: %s requires a binary table as input\n", argv[0]);
    exit(1);
  }
  if( doverbose ){
    fprintf(stderr, "evcube %s -> %s cols='%s'", ifile, ofile, cols);
    if( filter ){
      fprintf(stderr, " filter='%s'", filter);
    }
    if( dims[0] && dims[1] ){
      fprintf(stderr, " dims=[%d,%d]", dims[0], dims[1]);
    }
    if( cens[0] && cens[1] ){
      fprintf(stderr, " cens=[%f,%f]", cens[0], cens[1]);
    }
    if( bin != 1 ){
      fprintf(stderr, " bin=%f", bin);
    }
    if( bitpix ){
      fprintf(stderr, " bitpix=%d", bitpix);
    }
    fprintf(stderr, "\n");
  }
  // convert binary table to cube
  tfptr = createCubeFromTable(ifptr,
			      filter, cols, dims, cens, bin, opts,
			      &status);
  errchk(status);
  // close all files
  closeFITSFile(ifptr, &status);
  errchk(status);
  fits_close_file(tfptr,  &status);
  errchk(status);
  return(0);
}
