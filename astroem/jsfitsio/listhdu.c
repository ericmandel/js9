/* 
  listhdu: list hdu info for a FITS file, a modification for JS9 of: 
    https://heasarc.gsfc.nasa.gov/docs/software/fitsio/cexamples.html#liststruc
  we write the output to a file in json format
*/
#include <string.h>
#include <stdio.h>
#include "fitsio.h"

// list all hdu elements
int _listhdu(char *iname, char *oname){
    fitsfile *fptr;         /* FITS file pointer, defined in fitsio.h */
    char colname[FLEN_VALUE], coltype[FLEN_VALUE], vbuf[FLEN_VALUE];
    char keyname[FLEN_KEYWORD], kbuf[FLEN_KEYWORD];
    int status = 0;   /* CFITSIO status value MUST be initialized to zero! */
    int hdupos, hdutype, bitpix, naxis, ncols, ii, jj, tstatus;
    long naxes[10], nrows;
    double dval;
    FILE *fd = stdout;

    if( !fits_open_file(&fptr, iname, READONLY, &status) ){
      if( oname && *oname ){
	if( !(fd = fopen(oname, "w")) ){
	  fprintf(stderr, "ERROR: can't open output file: %s\n", oname);
	  return -1;
	}
      }
      /* go to the first hdu */
      fits_movabs_hdu(fptr, 1, &hdutype, &status);
      /* join original code */
      fits_get_hdu_num(fptr, &hdupos);  /* Get the current HDU position */
      /* index at 0, instead of 1 */
      hdupos--;
      fprintf(fd, "[");
      /* process all hdus */
      /* output json: no new-lines or spaces so shell scripts can process it */
      for (; !status; hdupos++){   /* Main loop for each HDU */
        fprintf(fd, "{");
        fits_get_hdu_type(fptr, &hdutype, &status);  /* Get the HDU type */
        fprintf(fd, "\"hdu\":%d", hdupos);
	/* output extname, if possible */
	fits_read_key(fptr, TSTRING, "EXTNAME", colname, NULL, &status);
	if( status == 0 ){
	  fprintf(fd, ",\"name\":\"%s\"", colname);
	}
	status = 0;
	/* type-specific processing (image or table) */
        if( hdutype == IMAGE_HDU ){   /* primary array or image HDU */
          fits_get_img_param(fptr, 10, &bitpix, &naxis, naxes, &status);
	  /* number of axes */
          fprintf(fd, ",\"type\":\"image\",\"naxis\":%d", naxis);
	  /* axis dimensions, if there are any */
	  fprintf(fd, ",\"naxes\":[");
	  for (ii = 0; ii < naxis; ii++){
	    if( ii != 0 ){
	      fprintf(fd, ",");
	    }
	    fprintf(fd, "%ld", naxes[ii]);  
	  }
	  fprintf(fd, "]");
	  /* bitpix */
          fprintf(fd, ",\"bitpix\":%d", bitpix);
	  /* wcs parameters are used for mosaics (mainly crpix and crval) */
	  for (ii = 1; ii <= 2; ii++){
	    tstatus = 0;
            fits_make_keyn("CTYPE", ii, keyname, &tstatus);
	    fits_read_key(fptr, TSTRING, keyname, vbuf, NULL, &tstatus);
	    if( tstatus == 0 ){
	      fprintf(fd, ",\"%s\":\"%s\"", keyname, vbuf);
	    }
	    tstatus = 0;
            fits_make_keyn("CUNIT", ii, keyname, &tstatus);
	    fits_read_key(fptr, TSTRING, keyname, vbuf, NULL, &tstatus);
	    if( tstatus == 0 ){
	      fprintf(fd, ",\"%s\":\"%s\"", keyname, vbuf);
	    }
            tstatus = 0;
            fits_make_keyn("CRPIX", ii, keyname, &tstatus);
            fits_read_key(fptr, TDOUBLE, keyname, &dval, NULL, &tstatus);
	    if( tstatus == 0 ){
	      fprintf(fd, ",\"%s\":%f", keyname, dval);
	    }
            tstatus = 0;
            fits_make_keyn("CRVAL", ii, keyname, &tstatus);
            fits_read_key(fptr, TDOUBLE, keyname, &dval, NULL, &tstatus);
	    if( tstatus == 0 ){
	      fprintf(fd, ",\"%s\":%f", keyname, dval);
	    }
            tstatus = 0;
            fits_make_keyn("CDELT", ii, keyname, &tstatus);
            fits_read_key(fptr, TDOUBLE, keyname, &dval, NULL, &tstatus);
	    if( tstatus == 0 ){
	      fprintf(fd, ",\"%s\":%f", keyname, dval);
	    }
            tstatus = 0;
            fits_make_keyn("CROTA", ii, keyname, &tstatus);
            fits_read_key(fptr, TDOUBLE, keyname, &dval, NULL, &tstatus);
	    if( tstatus == 0 ){
	      fprintf(fd, ",\"%s\":%f", keyname, dval);
	    }
	    for (jj = 1; jj <= 2; jj++){
	      tstatus = 0;
	      snprintf(kbuf, FLEN_KEYWORD, "CD%d_", ii);
	      fits_make_keyn(kbuf, jj, keyname, &tstatus);
	      fits_read_key(fptr, TDOUBLE, keyname, &dval, NULL, &tstatus);
	      if( tstatus == 0 ){
		fprintf(fd, ",\"%s\":%f", keyname, dval);
	      }
	    }
	  }
	  tstatus = 0;
	  strcpy(keyname, "RADECSYS");
	  fits_read_key(fptr, TSTRING, keyname, vbuf, NULL, &tstatus);
	  if( tstatus == 0 ){
	    fprintf(fd, ",\"%s\":\"%s\"", keyname, vbuf);
	  }
	  tstatus = 0;
	  strcpy(keyname, "EQUINOX");
	  fits_read_key(fptr, TSTRING, keyname, vbuf, NULL, &tstatus);
	  if( tstatus == 0 ){
	    fprintf(fd, ",\"%s\":\"%s\"", keyname, vbuf);
	  }
        } else {
	  /* a table HDU */
          fits_get_num_rows(fptr, &nrows, &status);
          fits_get_num_cols(fptr, &ncols, &status);
	  /* which type of table? */
          if( hdutype == ASCII_TBL ){
            fprintf(fd, ",\"type\":\"ascii\"");
	  } else {
            fprintf(fd, ",\"type\":\"table\"");
	  }
	  /* rows */
          fprintf(fd, ",\"rows\":%ld", nrows);
	  /* array of column names and types */
          fprintf(fd, ",\"cols\":[");
          for (ii = 1; ii <= ncols; ii++){
            fits_make_keyn("TTYPE", ii, keyname, &status); /* make keyword */
            fits_read_key(fptr, TSTRING, keyname, colname, NULL, &status);
            fits_make_keyn("TFORM", ii, keyname, &status); /* make keyword */
            fits_read_key(fptr, TSTRING, keyname, coltype, NULL, &status);
            fprintf(fd, "{\"name\":\"%s\",\"type\":\"%s\"", colname, coltype);
            tstatus = 0;
            fits_make_keyn("TLMIN", ii, keyname, &tstatus); /* make keyword */
            fits_read_key(fptr, TSTRING, keyname, vbuf, NULL, &tstatus);
            if( tstatus == 0 ){
	      fprintf(fd, ",\"min\":%s", vbuf);
            }
            tstatus = 0;
            fits_make_keyn("TLMAX", ii, keyname, &tstatus); /* make keyword */
            fits_read_key(fptr, TSTRING, keyname, vbuf, NULL, &tstatus);
            if( tstatus == 0 ){
	      fprintf(fd, ",\"max\":%s", vbuf);
	    }
	    fprintf(fd, "}");
	    if( ii != ncols ){
	      fprintf(fd, ",");
	    }
          }
          fprintf(fd, "]");
        }
	fprintf(fd, "}");
        fits_movrel_hdu(fptr, 1, NULL, &status);  /* try move to next ext */
        if( status == 0 ){
	  fprintf(fd, ",");
	}
      }
      fprintf(fd, "]");
      if( status == END_OF_FILE ){
	status = 0; /* Reset normal error */
      }
      fits_close_file(fptr, &status);
    }
    if( status ){
      fits_report_error(stderr, status); /* print any error message */
    }
    if( fd == stdout ){
      fflush(fd);
    } else {
      fclose(fd);
    }
    return(status);
}

#ifdef LISTHDUMAIN
int main(int argc, char **argv)
{
    char *iname=NULL, *oname=NULL;
    if (argc < 2) {
      return(0);
    }
    iname = argv[1];
    if( argc >= 3 ){
      iname = argv[2];
    }
    return _listhdu(iname, oname);
}
#endif
