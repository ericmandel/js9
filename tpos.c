#if HAVE_CFITSIO
#include <fitsio.h>
#include "jsfitsio.h"
#include <ctype.h>
#define FT_CARDLEN 80
#elif HAVE_FUNTOOLS
#include <funtoolsP.h>
#endif
#include <png.h>
#include <errno.h>

#include <xutil.h>
#include <swap.h>

#if HAVE_GETOPT_H
#include <getopt.h>
#else
extern char *optarg;
extern int optind;
#endif

#define ABS(x) ((x)<0?(-x):(x))
#define DEF_EVTLIST "EVENTS STDEVT"
#define BUFLEN 1024

/* NB: if you change the format of the png file, update the version number:
 * update major version number for an incompatible change
 * update minor version number for a backwards-compatible change
 */
/* 1.0 (js9 1.0): send header params in a javascript object (w/o comments) */
/* 1.1 (js9 1.3): send header as a string of cards (including comments)
   NB: js9 1.3 will read either protocol */
#define JS9_PROTOCOL "1.1"
/* endian: little or big */
#define JS9_ENDIAN "little"
/* 3 bytes per png pixel. NB: RGBA is bad because of precalculated alpha */
#define MY_PNG_COLOR_TYPE PNG_COLOR_TYPE_RGB
/* NB: channels has to match color type above, i.e. RGB==3, RGBA==4 */
#define COLOR_CHANNELS 3
/* bytes/channel */
#define MY_BIT_DEPTH 8
/* totally arbitrary */
#define MAX_TEXT 10

/* text info structure */
typedef struct optinforec{
  char *fitsname;
  char *fitsheader;
} *Optinfo, OptinfoRec;

/* scat -- append a string onto another, reallocating space as needed */
static void scat(char *str, char **ostr)
{
  static int olen=0;
  int blen;
  int slen;
  
  if( (str == NULL) || (*str == '\0') )
    return;
  else
    slen = strlen(str) + 1;
  
  if( (*ostr == NULL) || (**ostr == '\0') )
    blen = 0;
  else
    blen = strlen(*ostr);
  
  while( (blen + slen) >= olen ){
    olen += SZ_LINE;
  }
  if( blen == 0 )
    *ostr = (char *)calloc(olen, sizeof(char));
  else
    *ostr = (char *)realloc(*ostr, olen);
  strcat(*ostr, str);
}

/*
 * image is width x height buffer containing int data of size COLOR_CHANNELS
 *
 * image should be in little-endian format, so that low pixel values go into
 * the red channel (instead of alpha channel).
 *
 */
int writePNG(FILE *ofp, void *image, int width, int height, Optinfo optinfo)
{
  int k;
  int ntext = 0;
  png_structp png_ptr;
  png_infop info_ptr;
  png_bytep imptr;
  png_bytep row_pointers[height];
  png_text texts[MAX_TEXT];

  /* set up row pointers for image data */
  imptr = (png_bytep)image;
  for(k=0; k<height; k++){
    row_pointers[k] = imptr +  ((size_t)k * (size_t)width * COLOR_CHANNELS);
  }

  /* Create and initialize the png_struct with the desired error handler
   * functions.  If you want to use the default stderr and longjump method,
   * you can supply NULL for the last three parameters.  We also check that
   * the library version is compatible with the one used at compile time,
   * in case we are using dynamically linked libraries.  REQUIRED.
   */
  png_ptr = png_create_write_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
  if (png_ptr == NULL){
    fprintf(stderr, "ERROR: can't create PNG write structure");
    exit(1);
  }
  
  /* Allocate/initialize the image information data.  REQUIRED */
  info_ptr = png_create_info_struct(png_ptr);
  if (info_ptr == NULL){
    png_destroy_write_struct(&png_ptr,  NULL);
    fprintf(stderr, "ERRORL can't create PNG info structure");
    exit(1);
  }
  
  /* Set error handling.  REQUIRED if you aren't supplying your own
   * error handling functions in the png_create_write_struct() call.
   */
  if (setjmp(png_jmpbuf(png_ptr))){
    /* If we get here, we had a problem writing the file */
    png_destroy_write_struct(&png_ptr, &info_ptr);
    fprintf(stderr, "ERROR: PNG error (via setjmp)");
    exit(1);
  }
  
  /* Set up the output control if you are using standard C streams */
  png_init_io(png_ptr, ofp);
  
  /* Set the image information here.  Width and height are up to 2^31,
   * bit_depth is one of 1, 2, 4, 8, or 16, but valid values also depend on
   * the color_type selected. color_type is one of PNG_COLOR_TYPE_GRAY,
   * PNG_COLOR_TYPE_GRAY_ALPHA, PNG_COLOR_TYPE_PALETTE, PNG_COLOR_TYPE_RGB,
   * or PNG_COLOR_TYPE_RGB_ALPHA.  interlace is either PNG_INTERLACE_NONE or
   * PNG_INTERLACE_ADAM7, and the compression_type and filter_type MUST
   * currently be PNG_COMPRESSION_TYPE_BASE and PNG_FILTER_TYPE_BASE. REQUIRED
   */
  png_set_IHDR(png_ptr, info_ptr, width, height, MY_BIT_DEPTH, 
	       MY_PNG_COLOR_TYPE, PNG_INTERLACE_NONE, 
	       PNG_COMPRESSION_TYPE_BASE, PNG_FILTER_TYPE_BASE);
  
  /* write text before the image so that the helper program can read it
     without reading the image itself */
  ntext = 0;
  if( optinfo->fitsname && *optinfo->fitsname ){
    if( ntext < MAX_TEXT ){
      texts[ntext].compression = PNG_TEXT_COMPRESSION_NONE;
      texts[ntext].key = "fitsfile";
      texts[ntext].text = optinfo->fitsname;
      ntext++;
    }
  }
  if( optinfo->fitsheader && *optinfo->fitsheader ){
    if( ntext < MAX_TEXT ){
      /* texts[ntext].compression = PNG_TEXT_COMPRESSION_NONE; */
      texts[ntext].compression = PNG_TEXT_COMPRESSION_zTXt;
      texts[ntext].key = "fitsheader";
      texts[ntext].text = optinfo->fitsheader;
      ntext++;
    }
  }
  png_set_text(png_ptr, info_ptr, texts, ntext);

  /* Write the file header information.  REQUIRED */
  png_write_info(png_ptr, info_ptr);
  
  /* Now you can write the image data.  The simplest way to do this
     is in one function call.  If you have the whole image in memory,
     you can just call png_write_image() and libpng will write the
     image.  You will need to pass in an array of pointers to each
     row.  */
  png_write_image(png_ptr, row_pointers);
  
  /* It is REQUIRED to call this to finish writing the rest of the file */
  png_write_end(png_ptr, info_ptr);
  
  // clean up 
  png_destroy_write_struct(&png_ptr, &info_ptr);

  return 0;
}

// from fitsy/cardpar.c
int getCardType(char *card){
  int i=0, j=0;
  int type=0;
  if ( !strncmp(card, "HISTORY ",  8) || !strncmp(card, "COMMENT ", 8)
       || !strncmp(card, "CONTINUE ", 9)
       || !strncmp(card, "        ",  8) || card[8] != '=' ) {
    type  = 'c';
  } else {
    if ( card[10] == '\'' ) {
      type = 's';
    } else {
      type = 'i';
      for(i = 10; i< FT_CARDLEN; i++ )
	if ( card[i] != ' ' )
	  break;
      if ( ( card[i] == 'T' || card[i] == 'F' ||
	     card[i] == 't' || card[i] == 'f' ) )
	   type = 'l';
      for(j=0; i<FT_CARDLEN; i++, j++ ) {
	if ( card[i] == '/' ) break;
	if ( card[i] == '.' ) type = 'r';
      }
    }
  }
  return type;
}

#if HAVE_CFITSIO
int nowhite (char *c, char *cr)
{
  char *cr0;    /* initial value of cr */
  int n;        /* the number of characters */

  /* skip leading white space */
  while(*c && isspace((int)*c))
    c++;
  /* copy up to the null */
  cr0 = cr;
  while(*c)
    *cr++ = *c++;
  n = cr - cr0;   /* the number of characters */
  *cr-- = '\0';   /* Null and point to the last character */
  /* remove trailing white space */
  while( n && isspace((int)*cr) ){
    *cr-- = '\0';
    n--;
  }
  return(n);
}

void errchk(int status) {
    if (status){
      fits_report_error(stderr, status);
      exit(status);
    }
}
#endif

int main(int argc, char **argv)
{
  int c, i, j, got, args, jsonlen, istart;
  int odim1, odim2, blen, pad;
  int idim1=0, idim2=0, bitpix=0, ncard=0;
  int verbose=0;
  size_t totbytes, dlen;
  char tbuf[SZ_LINE];
  char *buf=NULL;
  char *jsonheader=NULL;
  char *iname=NULL, *oname=NULL;
  FILE *ofp=NULL;
  Optinfo optinfo;
#if HAVE_CFITSIO
  int status = 0;
  int n;
  int hdutype;
  int maxcard, morekeys;
  int dims[2] = {0, 0};
  int block = 1;
  void *dbuf;
  double d1, d2, d3, d4;
  double cens[2] = {0.0, 0.0};
  char *s;
  char *filter=NULL;
  char *evtlist = DEF_EVTLIST;
  char card[81];
  char s1[BUFLEN], s2[BUFLEN], s3[BUFLEN], s4[BUFLEN];
  fitsfile *fptr=NULL, *ofptr=NULL;
#elif HAVE_FUNTOOLS
  char *s=NULL;
  int dtype;
  Fun ifun=NULL, tfun=NULL;
#endif

  /* we want the args in the same order in which they arrived, and
     gnu getopt sometimes changes things without this */
  putenv("POSIXLY_CORRECT=true");

  /* process switch arguments */
  while ((c = getopt(argc, argv, "b:e:f:s:v")) != -1){
    switch(c){
    case 'b':
#if HAVE_CFITSIO
      block = atoi(optarg);
#else
      fprintf(stderr, "warning: -b switch only for cfitsio (ignoring)\n");
#endif
      break;
    case 'e':
#if HAVE_CFITSIO
      evtlist = optarg;
#else
      fprintf(stderr, "warning: -e switch only for cfitsio (ignoring)\n");
#endif
      break;
    case 'f':
#if HAVE_CFITSIO
      filter = optarg;
#else
      fprintf(stderr, "warning: -f switch only for cfitsio (ignoring)\n");
#endif
      break;
    case 's':
#if HAVE_CFITSIO
      s = strdup(optarg);
      if( strlen(s) > BUFLEN ) s[BUFLEN-1] = '\0';
      if( sscanf(s, "%[0-9.*] @ %[-0-9.*] , %[0-9.*] @ %[-0-9.*]%n",
		 s1, s2, s3, s4, &n) == 4){
	dims[0] = atof(s1);
	cens[0] = atof(s2);
	dims[1] = atof(s3);
	cens[1] = atof(s4);
      }  else if(sscanf(s, "%[-0-9.*] : %[-0-9.*] , %[-0-9.*] : %[-0-9.*]%n",
			s1, s2, s3, s4, &n) == 4){
	d1 = atof(s1);
	d2 = atof(s2);
	d3 = atof(s3);
	d4 = atof(s4);
	dims[0] = d2 - d1 + 1;
	cens[0] = dims[0] / 2;
	dims[1] = d4 - d3 + 1;
	cens[1] = dims[1] / 2;
      } else {
	fprintf(stderr, "warning: unknown arg for -s switch (ignoring)\n");
      }
      if( s ) free(s);
#else
      fprintf(stderr, "warning: -s switch only for cfitsio (ignoring)\n");
#endif
     break;
    case 'v':
      verbose++;
      break;
    }
  }

  /* check for required arguments */
  args = argc - optind;
  if( args < 2 ){
    fprintf(stderr, "usage: %s iname oname\n", argv[0]);
    exit(1);
  }
  iname = argv[optind++];
  oname = argv[optind++];

  /* optional info */
  if( !(optinfo = (Optinfo)calloc(sizeof(OptinfoRec), 1)) ){
    fprintf(stderr, "ERROR: can't allocate optional info rec\n");
    exit(1);
  }

  /* open the input FITS file */
#if HAVE_CFITSIO
  fptr = openFITSFile(iname, evtlist, &hdutype, &status);
  errchk(status);
#elif HAVE_FUNTOOLS
  if( !(ifun = FunOpen(iname, "r", NULL)) ){
    fprintf(stderr, "ERROR could not open input FITS file: %s (%s)\n", 
	    iname, strerror(errno));
    exit(1);
  }
#endif

  /* save the input filename in the png file */
  optinfo->fitsname = iname;

  /* open the output PGN file */
  if( !strcmp(oname, "-") || !strcmp(oname, "stdout") ){
    ofp = stdout;
  } else if( !(ofp = fopen(oname, "w")) ){
    fprintf(stderr, "ERROR: could not create output PNG file: %s (%s)\n", 
	    oname, strerror(errno));
    exit(1);
  }

#if HAVE_CFITSIO
  switch(hdutype){
  case IMAGE_HDU:
    // get image array
    dbuf = getImageToArray(fptr, NULL, NULL, NULL,
			   &idim1, &idim2, &bitpix, &status);
    errchk(status);
    fits_get_hdrspace(fptr, &maxcard, &morekeys, &status);
    errchk(status);
    ofptr = fptr;
    break;
  default:
    ofptr = filterTableToImage(fptr, filter, NULL, dims, cens, block, &status);
    errchk(status);
    // get image array
    dbuf = getImageToArray(ofptr, NULL, NULL, NULL,
			   &idim1, &idim2, &bitpix, &status);
    errchk(status);
    // get number of keys
    fits_get_hdrspace(ofptr, &maxcard, &morekeys, &status);
    errchk(status);
    break;
  }

#elif HAVE_FUNTOOLS
  /* copy the input fits header into a FITS image header */
  if( !(tfun = (Fun)calloc(1, sizeof(FunRec))) ){
      fprintf(stderr, "ERROR: could not create tfun struct\n");
      exit(1);
  }
  _FunCopy2ImageHeader(ifun, tfun);
  /* and save for storage in the png file */
  optinfo->fitsheader = (char *)tfun->header->cards;

  /* get image parameters. its safe to do this before calling image get
     so long as we don't change bitpix before that call */
  FunInfoGet(ifun,
	     FUN_SECT_BITPIX,  &bitpix,
	     FUN_SECT_DIM1,    &idim1,
	     FUN_SECT_DIM2,    &idim2,
	     0);
#endif

  /* convert FITS header into a json string */
  snprintf(tbuf, SZ_LINE-1, "{\"js9Protocol\": %s, ", JS9_PROTOCOL);
  scat(tbuf, &jsonheader);
  snprintf(tbuf, SZ_LINE-1, "\"js9Endian\": \"%s\", ", JS9_ENDIAN);
  scat(tbuf, &jsonheader);
  snprintf(tbuf, SZ_LINE-1, "\"cardstr\": \"");
  scat(tbuf, &jsonheader);
  // concat header cards into a single string
#if HAVE_CFITSIO
  while( ++ncard <= maxcard ){
    fits_read_record(ofptr, ncard, card, &status);
    errchk(status);
    // change " to '
    for(i=0; i<80; i++){
      if( card[i] == '"' ){
	card[i] = '\'';
      }
    }
    snprintf(tbuf, SZ_LINE-1, "%-80s", card);
    scat(tbuf, &jsonheader);
  }
#elif HAVE_FUNTOOLS
  while( (s = FunParamGets(tfun, NULL, ++ncard, NULL, &dtype)) ){
    for(i=0; i<80; i++){
      if( s[i] == '"' ){
	s[i] = '\'';
      }
    }
    scat(s, &jsonheader);
    if( s ) free(s);
  }
#endif
  // end with the number of cards
  snprintf(tbuf, SZ_LINE-1, "\", \"ncard\": %d}", ncard);
  scat(tbuf, &jsonheader);

  /* we want the image buffer to start on an 8-byte boundary, 
     so make jsonheader + null byte end on one */
  pad = 8 - (strlen(jsonheader) % 8) - 1;
  for(i=0; i<pad; i++){
    strcat(jsonheader, " ");
  }
  /* get final length of json header */
  jsonlen = strlen(jsonheader);

  /* total length of the header + null + image we are storing */
  blen = ABS(bitpix/8);
  dlen = (size_t)idim1 * (size_t)idim2 * blen;
  totbytes = jsonlen + 1 + dlen;

  /* all of this should now fit into the png image */
  /* somewhat arbitrarily, we use idim1 for odim1, and adjust odim2 to fit */
  odim1 = idim1;
  odim2 = (int)(((totbytes + odim1 - 1) / odim1) + (COLOR_CHANNELS-1)) / COLOR_CHANNELS;

  /* allocate buf to hold json header + null byte + RGB image */
  if( !(buf=calloc(COLOR_CHANNELS, odim1 * odim2)) ){
    fprintf(stderr, "ERROR: can't allocate image buf\n");
    exit(1);
  }

  /* move the json header into the output buffer */
  memmove(buf, jsonheader, jsonlen);
  /* add a null byte to signify end of json header */
  buf[jsonlen] = '\0';

  /* offset into image buffer where image starts, past header and null byte */
  istart = jsonlen + 1;

  /* debug output */
  if( verbose ){
    fprintf(stderr, 
    "idim=%d,%d (bitpix=%d jsonlen=%d istart=%d endian=%s) [%ld] -> odim=%d,%d [%d]\n", 
	    idim1, idim2, bitpix, jsonlen, istart, JS9_ENDIAN, totbytes, 
	    odim1, odim2, odim1 * odim2 * COLOR_CHANNELS);
  }

#if HAVE_CFITSIO
  /* move the json header into the output buffer */
  memmove(&buf[istart], dbuf, dlen);
#elif HAVE_FUNTOOLS
  /* extract and bin the data section into an image buffer */
  if( !FunImageGet(ifun, &buf[istart], NULL) ){
    fprintf(stderr, "ERROR: could not FunImageGet: %s\n", iname);
    exit(1);
  }
#endif

  /* debugging output to check against javascript input */
  if( verbose > 1 ){
    fprintf(stderr, "jsonheader: %s\n", jsonheader);
    for(j=0; j<idim2; j++){
      fprintf(stderr, "data #%d: ", j);
      for(i=0; i<idim1; i++){
	switch(bitpix){
	case 8:
	  fprintf(stderr, "%d ", 
		  *(unsigned char *)(buf + istart + ((j * idim1) + i) * blen));
	  break;
	case 16:
	  fprintf(stderr, "%d ", 
		  *(short *)(buf + istart + ((j * idim1) + i) * blen));
	  break;
	case -16:
	  fprintf(stderr, "%d ", 
		  *(unsigned short *)(buf + istart + ((j * idim1) + i) * blen));
	  break;
	case 32:
	  fprintf(stderr, "%d ",
		  *(int *)(buf + istart + ((j * idim1) + i) * blen));
	  break;
	case -32:
	  fprintf(stderr, "%.3f ",
		  *(float *)(buf + istart + ((j * idim1) + i) * blen));
	  break;
	case -64:
	  fprintf(stderr, "%.3f ", 
		  *(double *)(buf + istart + ((j * idim1) + i) * blen));
	  break;
	}
      }
      fprintf(stderr, "\n");
    }
    fprintf(stderr, "\n");
  }

  /* might have to swap to preferred endian for png creation */
  if( (!strncmp(JS9_ENDIAN, "l", 1) &&  is_bigendian()) ||
      (!strncmp(JS9_ENDIAN, "b", 1) && !is_bigendian()) ){
    swap_data(&buf[istart], idim1 * idim2, bitpix/8);
  }

  /* write the PNG file */
  got = writePNG(ofp, buf, odim1, odim2, optinfo);

  /* free up space */
  if( buf ) free(buf);
  if( optinfo ) free(optinfo);
  if( jsonheader ) free(jsonheader);

  /* close files */
#if HAVE_CFITSIO
  status = 0;
  if( ofptr && (ofptr != fptr) ) closeFITSFile(ofptr, &status);
  if( fptr ) closeFITSFile(fptr, &status);
  if( dbuf ) free(dbuf);
#elif HAVE_FUNTOOLS
  if( ifun ) FunClose(ifun);
  if( tfun ){
    FunClose(tfun);
    free(tfun);
  }
#endif
  if( ofp) fclose(ofp);

  /* return the news */
  return got;
}
