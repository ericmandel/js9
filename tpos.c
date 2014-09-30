#include <png.h>
#include <funtoolsP.h>
#include <swap.h>

#if HAVE_CONFIG_H
#include <conf.h>
#endif
#include <stdio.h>
#if HAVE_UNISTD_H
#include <unistd.h>
#endif
#if HAVE_STRING_H
#include <string.h>
#endif
#if HAVE_STDLIB_H
#include <stdlib.h>
#endif
#if HAVE_MALLOC_H
#include <malloc.h>
#endif
#if HAVE_GETOPT_H
#include <getopt.h>
#else
extern char *optarg;
extern int optind;
#endif

#define ABS(x) ((x)<0?(-x):(x))

/* NB: if you change the format of the png file, update the version number:
 * update major version number for an incompatible change
 * update minor version number for a backwards-compatible change
 */
#define JS9_PROTOCOL "1.0"
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

/* writePNG can be made funtools-clean by unsetting this variable */
#define GIO_IN_PNG 1

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
    *ostr = (char *)xcalloc(olen, sizeof(char));
  else
    *ostr = (char *)xrealloc(*ostr, olen);
  strcat(*ostr, str);
}

/* generate JS9-specific parameters to add to header */
static char *_js9Params=NULL;
static char *js9Params()
{
  char tbuf[SZ_LINE];
  snprintf(tbuf, SZ_LINE-1, "\"js9Protocol\":%s, ", JS9_PROTOCOL);
  scat(tbuf, &_js9Params);
  snprintf(tbuf, SZ_LINE-1, "\"js9Endian\":\"%s\", ", JS9_ENDIAN);
  scat(tbuf, &_js9Params);
  return _js9Params;
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
#if GIO_IN_PNG
    gerror(stderr, "can't create PNG write structure");
#endif
    return 1;
  }
  
  /* Allocate/initialize the image information data.  REQUIRED */
  info_ptr = png_create_info_struct(png_ptr);
  if (info_ptr == NULL){
    png_destroy_write_struct(&png_ptr,  NULL);
#if GIO_IN_PNG
    gerror(stderr, "can't create PNG info structure");
#endif
    return 1;
  }
  
  /* Set error handling.  REQUIRED if you aren't supplying your own
   * error handling functions in the png_create_write_struct() call.
   */
  if (setjmp(png_jmpbuf(png_ptr))){
    /* If we get here, we had a problem writing the file */
    png_destroy_write_struct(&png_ptr, &info_ptr);
#if GIO_IN_PNG
    gerror(stderr, "PNG error (via setjmp)");
#endif
    return 1;
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
  
  return 0;
}

int main(int argc, char **argv)
{
  int c, i, j, got, dtype, args, bitpix, jsonlen, len, istart;
  int idim1, idim2, odim1, odim2, pad;
  size_t totbytes;
  int verbose=0;
  char *buf=NULL;
  char *s;
  char tbuf[SZ_LINE];
  char tbuf2[SZ_LINE];
  char tbuf3[SZ_LINE];
  char tbuf4[SZ_LINE];
  char *jsonheader=NULL;
  char *iname=NULL, *oname=NULL;
  Fun ifun=NULL, tfun=NULL;
  FILE *ofp=NULL;
  Optinfo optinfo;

  /* exit on gio errors */
  setgerror(2);

  /* we want the args in the same order in which they arrived, and
     gnu getopt sometimes changes things without this */
  putenv("POSIXLY_CORRECT=true");

  /* process switch arguments */
  while ((c = getopt(argc, argv, "v")) != -1){
    switch(c){
    case 'v':
      verbose++;
      break;
    }
  }

  /* check for required arguments */
  args = argc - optind;
  if( args < 2 )
    gerror(stderr, "usage: %s iname oname\n", argv[0]);
  iname = argv[optind++];
  oname = argv[optind++];

  /* optional info */
  if( !(optinfo = (Optinfo)xcalloc(sizeof(OptinfoRec), 1)) ){
    gerror(stderr, "can't allocate optional info rec\n");
  }

  /* open the input FITS file */
  if( !(ifun = FunOpen(iname, "r", NULL)) ){
    gerror(stderr, "could not open input FITS file: %s (%s)\n", 
	   iname, strerror(errno));
  }

  /* save the input filename in the png file */
  optinfo->fitsname = iname;

  /* open the output PGN file */
  if( !strcmp(oname, "-") || !strcmp(oname, "stdout") ){
    ofp = stdout;
  } else if( !(ofp = fopen(oname, "w")) ){
    gerror(stderr, "could not create output PNG file: %s (%s)\n", 
	   oname, strerror(errno));
  }

  /* copy the input fits header into a FITS image header */
  if( !(tfun = (Fun)xcalloc(1, sizeof(FunRec))) ){
      gerror(stderr, "could not create tfun struct\n");
  }
  _FunCopy2ImageHeader(ifun, tfun);
  /* and save for storage in the png file */
  optinfo->fitsheader = (char *)tfun->header->cards;

  /* get image parameters. its safe to do this before callingimage get
     so long as we don't change bitpix before that call */
  FunInfoGet(ifun,
	     FUN_SECT_BITPIX,  &bitpix,
	     FUN_SECT_DIM1,    &idim1,
	     FUN_SECT_DIM2,    &idim2,
	     0);

  /* convert FITS header into a json string */
  for(*tbuf3='\0', i=1; ;i++){
    if( (s = FunParamGets(tfun, NULL, i, NULL, &dtype)) ){
      snprintf(tbuf, SZ_LINE-1, "%8.8s", s);
      nowhite(tbuf, tbuf);
      nowhite((char *)ft_cardget((FITSCard)s), tbuf2);
      len = strlen(tbuf2);
      /* pre-processing of values */
      switch(dtype){
      case 'l':
	if( strchr(tbuf2, 'F') ){
	  strcpy(tbuf2, "false");
	} else {
	  strcpy(tbuf2, "true");
	}
	break;
      case 'r':
	if( tbuf2[len-1] == '.' ){
	  strcat(tbuf2, "0");
	}
	break;
      case 's':
	/* change single quotes to double quotes */
	if( *tbuf2 == '\'' ){
	  *tbuf2 = '"';
	}
	if( tbuf[len-1] == '\'' ){
	  tbuf[len-1] = '"';
	}
	break;
      default:
	break;
      }
      /* skip some repeating keywords */
      if( dtype != 'c' 			&&
	  strncmp(tbuf, "        ", 8)	&& 
	  (*tbuf2 != '\0') ){
	if( *tbuf3 == '\0' ){
	  snprintf(tbuf4, SZ_LINE, "{%s", js9Params());
	  scat(tbuf4, &jsonheader);
	} else {
	  scat(", ", &jsonheader);
	}
	/* format key/value pair */
	switch(dtype){
	case 's':
	  snprintf(tbuf3, SZ_LINE, "\"%s\":\"%s\"", tbuf, tbuf2);
	  break;
	default:
	  snprintf(tbuf3, SZ_LINE, "\"%s\":%s", tbuf, tbuf2);
	  break;
	}
	scat(tbuf3, &jsonheader);
      }
      xfree(s);
    }
    else{
      /* end of input */
      scat("}", &jsonheader);
      break;
    }
  }

  /* we want the image buffer to start on an 8-byte boundary, 
     so make jsonheader + null byte end on one */
  pad = 8 - (strlen(jsonheader) % 8) - 1;
  for(i=0; i<pad; i++){
    strcat(jsonheader, " ");
  }
  /* get final length of json header */
  jsonlen = strlen(jsonheader);

  /* total length of the header + null + image we are storing */
  totbytes = jsonlen + 1 + ((size_t)idim1 * ft_sizeof(bitpix) * (size_t)idim2);

  /* all of this should now fit into the png image */
  /* somewhat arbitrarily, we use idim1 for odim1, and adjust odim2 to fit */
  odim1 = idim1;
  odim2 = (int)(((totbytes + odim1 - 1) / odim1) + (COLOR_CHANNELS-1)) / COLOR_CHANNELS;

  /* allocate buf to hold json header + null byte + RGB image */
  if( !(buf=xcalloc(COLOR_CHANNELS, odim1 * odim2)) ){
    gerror(stderr, "can't allocate image buf\n");
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

  /* extract and bin the data section into an image buffer */
  if( !FunImageGet(ifun, &buf[istart], NULL) ){
    gerror(stderr, "could not FunImageGet: %s\n", iname);
  }

  /* might have to swap to preferred endian for png creation */
  if( (!strncmp(JS9_ENDIAN, "l", 1) &&  is_bigendian()) ||
      (!strncmp(JS9_ENDIAN, "b", 1) && !is_bigendian()) ){
    swap_data(&buf[istart], idim1 * idim2, bitpix/8);
  }

  /* debugging output to check against javascript input */
  if( verbose > 1 ){
    fprintf(stderr, "jsonheader: %s\n", jsonheader);
    for(j=0; j<4; j++){
      fprintf(stderr, "data #%d: ", j);
      for(i=0; i<ABS(bitpix)/8; i++){
	fprintf(stderr, "%02d ",
		(unsigned char)buf[istart + (j*ABS(bitpix/8))+i]);
      }
      fprintf(stderr, "\n");
    }
  }

  /* write the PNG file */
  got = writePNG(ofp, buf, odim1, odim2, optinfo);

  /* free up space */
  if( buf ) xfree(buf);
  if( optinfo ) xfree(optinfo);

  /* close files */
  if( ifun ) FunClose(ifun);
  if( tfun ) FunClose(tfun);
  if( ofp) fclose(ofp);

  /* return the news */
  return got;
}
