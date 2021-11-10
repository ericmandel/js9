/*
 * make a sorted index of a column in a FITS table
 *
 * reminder, to display: fundisp snr_pha.idx'[EVENTS(n:J,pha:I)]'
 *
 */

#include <unistd.h>
#include <string.h>
#include <stdio.h>
#include <fitsio.h>
#include "idx.h"

static void errchk(int status){
    if (status){
      fits_report_error(stderr, status);
      exit(status);
    }
}

int main(int argc, char *argv[]){
  char *ifile = NULL;
  char *column = NULL;
  char *sortprog=SORTPROG;
  char sortcmd[IDXLEN];

  char keyword[FLEN_KEYWORD], colname[FLEN_VALUE], form[FLEN_VALUE];
  int c, args, hdutype, ncols, col, row, anynul;
  int dosort = 0;
  int doverify = 0;
  int datatype = 0;
  int status = 0;
  FILE *ofp = stdout;
  long nrows;
  fitsfile *fptr;

  unsigned char ubval;
  short int sval;
  unsigned short int usval;
  int ival;
  unsigned int uival;
  float fval;
  double dval;

  /* we want the args in the same order in which they arrived, and
     gnu getopt sometimes changes things without this */
  putenv("POSIXLY_CORRECT=true");

  /* process switch arguments */
  while ((c = getopt(argc, argv, "sv")) != -1){
    switch(c){
    case 's':
      dosort = 1;
      break;
    case 'v':
      doverify = 1;
      break;
    }
  }
  // filename is required, filter is optional
  args = argc - optind;

  // filename and column is required, filter is optional
  if( args < 2 ){
    fprintf(stderr, "usage: %s [-s] file column\n", argv[0]);
    return 1;
  }
  ifile = argv[optind + 0];
  column = argv[optind + 1];

  // open fits file
  fits_open_file(&fptr, ifile, READONLY, &status);
  errchk(status);

  // make sure we're pointing to a table HDU
  fits_get_hdu_type(fptr, &hdutype, &status); /* Get the HDU type */
  errchk(status);
  if (hdutype == IMAGE_HDU){
    fprintf(stderr, "Error: requires a table HDU\n");
    return 1;
  }

  // get number of columns
  fits_get_num_cols(fptr, &ncols, &status);
  errchk(status);
  // get number of rows
  fits_get_num_rows(fptr, &nrows, &status);
  errchk(status);

  // look for the specified column
  for(col=1; col<=ncols; col++){
    fits_make_keyn("TTYPE", col, keyword, &status);
    errchk(status);
    fits_read_key(fptr, TSTRING, keyword, colname, NULL, &status);
    errchk(status);
    if( !strcasecmp(column, colname) ){
      fits_make_keyn("TFORM", col, keyword, &status);
      errchk(status);
      fits_read_key(fptr, TSTRING, keyword, form, NULL, &status);
      errchk(status);
      if( form[0] != '1' ){
	fprintf(stderr, "ERROR: TFORM must be 1 for indexed column: %s\n",
		form);
	exit(1);
      }
      datatype = form[1];
      break;
    } else {
      *colname = '\0';
    }
  }
  if( !*colname ){
    fprintf(stderr, "ERROR: can't find column '%s' in HDU\n", column);
    return 1;
  }
  if( !datatype ){
    fprintf(stderr, "ERROR: can't find column datatype '%s' in HDU\n", column);
    return 1;
  }

  // construct idxsort command line
  switch(datatype){
  case 'B':
    if( doverify ) fprintf(stderr, "idx:  EVENTS(n:J,%s:B)\n", colname);
    snprintf(sortcmd, IDXLEN-1, "%s -B5 +B4", sortprog);
    break;
  case 'I':
    if( doverify ) fprintf(stderr, "idx:  EVENTS(n:J,%s:I)\n", colname);
    snprintf(sortcmd, IDXLEN-1, "%s -B6 +s4", sortprog);
    break;
  case 'U':
    if( doverify ) fprintf(stderr, "idx:  EVENTS(n:J,%s:U)\n", colname);
    snprintf(sortcmd, IDXLEN-1, "%s -B6 +S4", sortprog);
    break;
  case 'J':
    if( doverify ) fprintf(stderr, "idx:  EVENTS(n:J,%s:J)\n", colname);
    snprintf(sortcmd, IDXLEN-1, "%s -B8 +i4", sortprog);
    break;
  case 'V':
    if( doverify ) fprintf(stderr, "idx:  EVENTS(n:J,%s:V)\n", colname);
    snprintf(sortcmd, IDXLEN-1, "%s -B8 +I4", sortprog);
    break;
  case 'E':
    if( doverify ) fprintf(stderr, "idx:  EVENTS(n:J,%s:E)\n", colname);
    snprintf(sortcmd, IDXLEN-1, "%s -B8 +f4", sortprog);
    break;
  case 'D':
    if( doverify ) fprintf(stderr, "idx:  EVENTS(n:J,%s:D)\n", colname);
    snprintf(sortcmd, IDXLEN-1, "%s -B12 +d4", sortprog);
    break;
  default:
    fprintf(stderr, "ERROR: unsupported data type for index: %c\n",
	    datatype);
    exit(1);
  }
  // start the sort
  if( dosort ){
    if( doverify ) fprintf(stderr, "sort: %s\n", sortcmd);
    ofp = popen(sortcmd, "w");
    if( ofp == NULL ){
      fprintf(stderr, "ERROR: could not popen sort program: %s\n",
	      sortprog);
      exit(1);
    }
  } else {
    if( doverify ) fprintf(stderr, "sort: false\n");
  }

  // read and write each row value for this column, along with the row number
  for(row=1; row<=nrows; row++){
    fwrite(&row, sizeof(int), 1, ofp);
    switch(datatype){
    case 'B':
      fits_read_col_byt(fptr, col, row, 1, 1, 0, &ubval, &anynul, &status);
      errchk(status);
      fwrite(&ubval, sizeof(unsigned char), 1, ofp);
      break;
    case 'I':
      fits_read_col_sht(fptr, col, row, 1, 1, 0, &sval, &anynul, &status);
      errchk(status);
      fwrite(&sval, sizeof(short int), 1, ofp);
      break;
    case 'U':
      fits_read_col_usht(fptr, col, row, 1, 1, 0, &usval, &anynul, &status);
      errchk(status);
      fwrite(&usval, sizeof(unsigned short int), 1, ofp);
      break;
    case 'J':
      fits_read_col_int(fptr, col, row, 1, 1, 0, &ival, &anynul, &status);
      errchk(status);
      fwrite(&ival, sizeof(int), 1, ofp);
      break;
    case 'V':
      fits_read_col_uint(fptr, col, row, 1, 1, 0, &uival, &anynul, &status);
      errchk(status);
      fwrite(&uival, sizeof(unsigned int), 1, ofp);
      break;
    case 'E':
      fits_read_col_flt(fptr, col, row, 1, 1, 0, &fval, &anynul, &status);
      errchk(status);
      fwrite(&fval, sizeof(float), 1, ofp);
      break;
    case 'D':
      fits_read_col_dbl(fptr, col, row, 1, 1, 0, &dval, &anynul, &status);
      errchk(status);
      fwrite(&dval, sizeof(double), 1, ofp);
      break;
    default:
      fprintf(stderr, "ERROR: unsupported data type for index: %c\n",
	      datatype);
      exit(1);
    }
  }

  // all done
  if( dosort ) pclose(ofp);
  fits_close_file(fptr, &status);
  errchk(status);
  return 0;
}
