/*============================================================================

  Modified version of HPXcvt.c to allow it to be called as a subroutine:
    1. input existing fitsfile pointer (instead of reading an existing file)
    2. return a new fitsfile pointer (instead of generating a new file)
  E. Mandel, 12/5/2016, updated to 6.3 7/12/2019

  WCSLIB 6.3 - an implementation of the FITS WCS standard.
  Copyright (C) 1995-2019, Mark Calabretta

  This file is part of WCSLIB.

  WCSLIB is free software: you can redistribute it and/or modify it under the
  terms of the GNU Lesser General Public License as published by the Free
  Software Foundation, either version 3 of the License, or (at your option)
  any later version.

  WCSLIB is distributed in the hope that it will be useful, but WITHOUT ANY
  WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
  FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for
  more details.

  You should have received a copy of the GNU Lesser General Public License
  along with WCSLIB.  If not, see http://www.gnu.org/licenses.

  Direct correspondence concerning WCSLIB to mark@calabretta.id.au

  Author: Mark Calabretta, Australia Telescope National Facility, CSIRO.
  http://www.atnf.csiro.au/people/Mark.Calabretta
  $Id: HPXcvt.c,v 6.3 2019/07/12 07:33:40 mcalabre Exp $
*=============================================================================
*
* HPXcvt reorganises HEALPix data into a 2-D FITS image.  Refer to the usage
* notes below.
*
*---------------------------------------------------------------------------*/

char usage[] =
"Usage: HPXcvt [-C<col>] [-c<sys>] [-n|-r] [-q<quad>] [-x<n|s>]\n"
"              [<infile> [<outfile>]]\n"
"\n"
"HPXcvt reorganises HEALPix data into a 2-D FITS image with HPX coordinate\n"
"system.  The input data may be stored in a FITS file as a primary image\n"
"or image extension, or as a binary table extension.  Both NESTED and RING\n"
"pixel indices are supported.  The input and output files may be omitted or\n"
"specified as \"-\" to indicate stdin and stdout respectively.\n"
"\n"
"Options:\n"
"  -C<col>      Binary table column number from which to read data,\n"
"               default 1 (n.b. WMAP exclusion masks are in column 2).\n"
"\n"
"  -c<sys>      Specify the coordinate system to be used to label the\n"
"               output map if the COORDSYS keyword is absent from the input\n"
"               FITS header.  Recognised values are g (galactic),\n"
"               e (ecliptic) or q (equatorial).\n"
"\n"
"  -n|-r        Assume n(ested) or r(ing) organization if the ORDERING\n"
"               keyword is absent from the input FITS header.\n"
"\n"
"  -q<quad>     Recentre longitude at quad(mod 4) x 90 degrees, where\n"
"               quad(rant) is an integer.\n"
"\n"
"  -x<n|s>      Use a north-polar or south-polar layout (XPH).\n";

#include <ctype.h>
#include <errno.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include <fitsio.h>

#define HEALPIX_NULLVAL (-1.6375e30)

#define IFILE "mem://"

struct healpix {
  fitsfile *ifptr;	/* Input file ptr or ...                      */
  char  *infile;	/* Input file.                                */
  fitsfile *ofptr;	/* Output if ifptr is passed in ... or ...    */
  char  *outfile;	/* Output file.                               */
  int   col;		/* Input binary table column number.          */
  char  crdsys;		/* G(alactic), E(cliptic), or (e)Q(uatorial). */
  char  ordering;	/* R(ing) or N(ested).                        */
  char  layout;		/* Required output layout,                    */
                        /*   0: equatorial (default),                 */
                        /*   1: north, or                             */
                        /*   2: south.                                */
  char  quad;		/* Recentre longitude on quadrant (modulo 4). */
  int   nside;		/* Dimension of a base-resolution pixel.      */
  int   padding;	/* (Dummy inserted for alignment purposes.)   */
  long  npix;		/* Total number of pixels in the data array.  */
  float *data;		/* Pointer to memory allocated to hold data.  */
};

int HEALPixIn(struct healpix *hpxdat);
int HPXout(struct healpix *hpxdat);
int NESTidx(int nside, int facet, int rotn, int row, long *healidx);
int RINGidx(int nside, int facet, int rotn, int row, long *healidx);
int HPXhdr(fitsfile *fptr, struct healpix *hpxdat);

fitsfile *healpixToImage(fitsfile *ifptr, int *status){
  struct healpix hpxdat;

  /* TODO: allow defaults to be passed in */
  hpxdat.col      = 1;
  hpxdat.crdsys   = 'Q';
  hpxdat.ordering = 'R';
  hpxdat.layout   = 0;
  hpxdat.quad     = 0;
  hpxdat.infile   = "";

  /* sanity check */
  if( !ifptr ){
    *status = 1;
    return NULL;
  }
  hpxdat.ifptr = ifptr;

  /* Get the HEALPix data as a vector. */
  if( (*status = HEALPixIn(&hpxdat)) ){
    return NULL;
  }
  /* Map and return new FITS file pointer */
  *status = HPXout(&hpxdat);
  /* clean up and return the new fits pointer */
  if (hpxdat.data) free(hpxdat.data);
  return hpxdat.ofptr;
}

/* original main routine, not used */
int xmain(int argc, char **argv)

{
  int crdsys, i, layout, quad, status;
  struct healpix hpxdat;

  hpxdat.col      = 1;
  hpxdat.crdsys   = '?';
  hpxdat.ordering = '?';
  hpxdat.layout   = 0;
  hpxdat.quad     = 0;

  /* Parse options. */
  for (i = 1; i < argc && argv[i][0] == '-'; i++) {
    if (!argv[i][1]) break;

    switch (argv[i][1]) {
    case 'C':
      hpxdat.col = atoi(argv[i]+2);
      if (hpxdat.col < 1) hpxdat.col = 1;
      break;
    case 'c':
      crdsys = toupper(argv[i][2]);
      switch (crdsys) {
      case 'G':
      case 'E':
      case 'Q':
        hpxdat.crdsys = (char)crdsys;
      };
      break;
    case 'n':
      hpxdat.ordering = 'N';
      break;
    case 'q':
      quad = atoi(argv[i]+2)%4;
      if (quad < 0) quad += 4;
      hpxdat.quad = (char)quad;
      break;
    case 'r':
      hpxdat.ordering = 'R';
      break;
    case 'x':
      layout = toupper(argv[i][2]);
      switch (layout) {
      case '\0':
      case 'N':
        hpxdat.layout = 1;
        break;
      case 'S':
        hpxdat.layout = 2;
        break;
      };
      break;
    default:
      fprintf(stderr, "%s", usage);
      return 1;
    }
  }

  if (i < argc) {
    hpxdat.infile = argv[i++];

    if (i < argc) {
      hpxdat.outfile = argv[i++];

      if (i < argc) {
        fprintf(stderr, "%s", usage);
        return 1;
      }
    } else {
      hpxdat.outfile = "-";
    }
  } else {
    hpxdat.infile = "-";
  }

  /* Check accessibility of the input file. */
  if (strcmp(hpxdat.infile, "-") && access(hpxdat.infile, R_OK) == -1) {
    printf("HPXcvt: Cannot access %s.\n", hpxdat.infile);
    return 1;
  }


  /* Get the HEALPix data as a vector. */
  if ((status = HEALPixIn(&hpxdat))) {
    return 2;
  }

  if( 0 ){
  if (hpxdat.ordering == '?') {
    fprintf(stderr, "WARNING: ORDERING keyword absent, assuming RING.\n");
    hpxdat.ordering = 'r';
  }

  printf("HPXcvt: Read 12 * %d^2  = %ld pixels with %s indexing.\n",
    hpxdat.nside, hpxdat.npix, (hpxdat.ordering == 'N') ? "nested" : "ring");
  }

  /* Map and write it out as a FITS image. */
  if ((status = HPXout(&hpxdat))) return 3;

  if (hpxdat.data) free(hpxdat.data);
  return 0;
}

/*--------------------------------------------------------------------------*/

int HEALPixIn(struct healpix *hpxdat)

{
  char   crdsys[32], ordering[32];
  int    anynul, hdutype, iaxis, nfound, status;
  long   firstpix, ipix, lastpix, naxis, *naxes = 0x0, nside = 0, repeat;
  float  *datap, nulval;
  LONGLONG firstelem, irow, nelem = 0, npix = 0, nrow = 0;
  fitsfile *fptr;

  status = 0;
  hpxdat->data = 0x0;

  /* Open the FITS file and move to the first HDU with NAXIS != 0. */
  /* Open the FITS file and move to the first HDU with NAXIS != 0. */
  if( hpxdat->ifptr ){
    fptr = hpxdat->ifptr;
  } else {
    if (fits_open_data(&fptr, hpxdat->infile, READONLY, &status)) goto fitserr;
  }

  /* Is this the primary HDU or an extension? */
  if (fits_get_hdu_type(fptr, &hdutype, &status)) goto fitserr;
  if (!(hdutype == IMAGE_HDU || hdutype == BINARY_TBL)) {
    fprintf(stderr, "ERROR: %s does not contain HEALPix data.\n",
            hpxdat->infile);
    return 1;
  }


  /* Get the image size. */
  if (fits_read_key_lng(fptr, "NAXIS", &naxis, 0x0, &status)) goto fitserr;
  naxes = malloc(naxis*sizeof(long));
  if (fits_read_keys_lng(fptr, "NAXIS", 1, (int)naxis, naxes, &nfound,
                         &status)) goto fitserr;

  if (hdutype == IMAGE_HDU) {
    /* Look for the first non-degenerate image axis. */
    for (iaxis = 0; iaxis < nfound; iaxis++) {
      if (naxes[iaxis] > 1) {
        /* Assume for now that it is the total number of pixels. */
        npix = naxes[iaxis];
        break;
      }
    }

  } else if (hdutype == BINARY_TBL) {
    /* Binary tables are simpler. */
    if (nfound > 1) nrow = naxes[1];

    /* (Note that fits_get_coltypell() is not available in cfitsio 2.x.) */
    if (fits_get_coltype(fptr, hpxdat->col, 0x0, &repeat, 0x0, &status)) {
      goto fitserr;
    }
    nelem = (LONGLONG)repeat;
  }

  if (!npix && !nrow) {
    fprintf(stderr, "ERROR: Could not determine image size.\n");
    goto cleanup;
  }


  /* Number of pixels per side of each base-resolution pixel. */
  if (fits_read_key_lng(fptr, "NSIDE", &nside, 0x0, &status)) {
    /* Some HEALPix files, e.g. SFD dust maps, don't record NSIDE. */
    if (status != KEY_NO_EXIST) goto fitserr;
    status = 0;
  }

  /* FIRSTPIX and LASTPIX, if present, record the 0-relative pixel numbers of
   * the first and last pixels stored in the data. */
  firstpix = -1;
  if (fits_read_key_lng(fptr, "FIRSTPIX", &firstpix, 0x0, &status)) {
    if (status != KEY_NO_EXIST) goto fitserr;
    status = 0;
  }

  lastpix = -1;
  if (fits_read_key_lng(fptr, "LASTPIX", &lastpix, 0x0, &status)) {
    if (status != KEY_NO_EXIST) goto fitserr;
    status = 0;
  }

  if (!nside) {
    /* Deduce NSIDE. */
    if (lastpix >= 0) {
      /* If LASTPIX is present without NSIDE we can only assume it's npix. */
      nside = (int)(sqrt((double)((lastpix+1) / 12)) + 0.5);
    } else if (hdutype == IMAGE_HDU) {
      nside = (int)(sqrt((double)(npix / 12)) + 0.5);
    } else if (hdutype == BINARY_TBL) {
      nside = (int)(sqrt((double)((nrow * nelem) / 12)) + 0.5);
    }
  }

  hpxdat->nside = (int)nside;
  hpxdat->npix  = 12*nside*nside;

  /* Ensure that FIRSTPIX and LASTPIX are set. */
  if (firstpix < 0) firstpix = 0;
  if (lastpix  < 0) lastpix  = hpxdat->npix - 1;


  /* Any sign of a coordinate system identifier? */
  if (fits_read_key_str(fptr, "COORDSYS", crdsys, 0x0, &status)) {
    if (status != KEY_NO_EXIST) goto fitserr;
    status = 0;
  } else if (crdsys[0] == 'G') {
    hpxdat->crdsys = 'G';
  } else if (crdsys[0] == 'E') {
    hpxdat->crdsys = 'E';
  } else if (crdsys[0] == 'C') {
    /* ("celestial") */
    hpxdat->crdsys = 'Q';
  }

  /* Nested or ring ordering? */
  if (fits_read_key_str(fptr, "ORDERING", ordering, 0x0, &status)) {
    /* Some HEALPix files, e.g. SFD dust maps, don't record ORDERING. */
    if (status != KEY_NO_EXIST) goto fitserr;
    status = 0;

  } else if (strcmp(ordering, "NESTED") == 0) {
    hpxdat->ordering = 'N';

  } else if (strcmp(ordering, "RING") == 0) {
    hpxdat->ordering = 'R';

  } else {
    fprintf(stderr, "WARNING: Invalid ORDERING keyword: %s.\n", ordering);
  }


  /* Allocate memory and read the data. */
  if ((hpxdat->data = malloc((hpxdat->npix)*sizeof(float))) == NULL) {
    perror("HPXcvt");
    goto cleanup;
  }

  nulval = HEALPIX_NULLVAL;
  datap = hpxdat->data;
  for (ipix = 0; ipix < firstpix; ipix++) {
    *(datap++) = nulval;
  }

  firstelem = (LONGLONG)1;
  if (hdutype == IMAGE_HDU) {
    if (fits_read_img_flt(fptr, 0l, firstelem, npix, nulval, datap, &anynul,
        &status)) goto fitserr;

  } else if (hdutype == BINARY_TBL) {
    for (irow = 0; irow < nrow; irow++) {
      if (fits_read_col_flt(fptr, hpxdat->col, irow+1, firstelem, nelem,
          nulval, datap, &anynul, &status)) goto fitserr;
      datap += nelem;
    }
  }

  datap = hpxdat->data + (lastpix + 1);
  for (ipix = (lastpix+1); ipix < hpxdat->npix; ipix++) {
    *(datap++) = nulval;
  }

  /* Clean up. */
  if( !hpxdat->ifptr ){
    fits_close_file(fptr, &status);
  }
  status = 0;
  return status;

fitserr:
  fits_report_error(stderr, status);
cleanup:
  if (naxes) free(naxes);
  if (hpxdat->data) free(hpxdat->data);
  hpxdat->data = 0x0;
  return status;
}

/*--------------------------------------------------------------------------*/

int HPXout(struct healpix *hpxdat)

{
  /* Number of facets on a side of each layout. */
  const int NFACET[] = {5, 4, 4};

  /* Arrays that define the facet location and rotation for each recognised
   * layout.  Bear in mind that these appear to be upside-down, i.e. the top
   * line contains facet numbers for the bottom row of the output image.
   * Facets numbered -1 are blank. */

                              /* Equatorial (diagonal) facet layout. */
  const int FACETS[][5][5] = {{{ 6,  9, -1, -1, -1},
                               { 1,  5,  8, -1, -1},
                               {-1,  0,  4, 11, -1},
                               {-1, -1,  3,  7, 10},
                               {-1, -1, -1,  2,  6}},
                              /* North polar (X) facet layout. */
                              {{ 8,  4,  4, 11, -1},
                               { 5,  0,  3,  7, -1},
                               { 5,  1,  2,  7, -1},
                               { 9,  6,  6, 10, -1},
                               {-1, -1, -1, -1, -1}},
                              /* South polar (X) facet layout. */
                              {{ 1,  6,  6,  2, -1},
                               { 5,  9, 10,  7, -1},
                               { 5,  8, 11,  7, -1},
                               { 0,  4,  4,  3, -1},
                               {-1, -1, -1, -1, -1}}};

  /* All facets of the equatorial layout are rotated by +45 degrees with
   * respect to the normal orientation, i.e. that with the equator running
   * horizontally.  The rotation recorded for the polar facets is the number
   * of additional positive (anti-clockwise) 90 degree turns with respect to
   * the equatorial layout. */

                              /* Equatorial (diagonal), no facet rotation. */
  const int FROTAT[][5][5] = {{{ 0,  0,  0,  0,  0},
                               { 0,  0,  0,  0,  0},
                               { 0,  0,  0,  0,  0},
                               { 0,  0,  0,  0,  0},
                               { 0,  0,  0,  0,  0}},
                              /* North polar (X) facet rotation. */
                              {{ 3,  3,  0,  0,  0},
                               { 3,  3,  0,  0,  0},
                               { 2,  2,  1,  1,  0},
                               { 2,  2,  1,  1,  0},
                               { 0,  0,  0,  0,  0}},
                              /* South polar (X) facet rotation. */
                              {{ 1,  1,  2,  2,  0},
                               { 1,  1,  2,  2,  0},
                               { 0,  0,  3,  3,  0},
                               { 0,  0,  3,  3,  0},
                               { 0,  0,  0,  0,  0}}};

  /* Facet halving codes.  0: the facet is whole (or wholly blank),
   * 1: blanked bottom-right, 2: top-right, 3: top-left, 4: bottom-left.
   * Positive values mean that the diagonal is included, otherwise not. */

                              /* Equatorial (diagonal), no facet halving. */
  const int FHALVE[][5][5] = {{{ 0,  0,  0,  0,  0},
                               { 0,  0,  0,  0,  0},
                               { 0,  0,  0,  0,  0},
                               { 0,  0,  0,  0,  0},
                               { 0,  0,  0,  0,  0}},
                              /* North polar (X) facet halving. */
                              {{ 0,  1, -4,  0,  0},
                               {-3,  0,  0,  2,  0},
                               { 4,  0,  0, -1,  0},
                               { 0, -2,  3,  0,  0},
                               { 0,  0,  0,  0,  0}},
                              /* South polar (X) facet halving. */
                              {{ 0,  1, -4,  0,  0},
                               {-3,  0,  0,  2,  0},
                               { 4,  0,  0, -1,  0},
                               { 0, -2,  3,  0,  0},
                               { 0,  0,  0,  0,  0}}};

  char  history[72];
  int   facet, halve, i1, i2, ifacet, j, jfacet, layout, nfacet, nside, rotn,
        status;
  long  *healidx = 0x0, *healp, naxes[2];
  float nulval = HEALPIX_NULLVAL, *row = 0x0, *rowp;
  LONGLONG fpixel, group, nelem;
  fitsfile *fptr;


  nside  = hpxdat->nside;
  layout = hpxdat->layout;
  nfacet = NFACET[layout];

  /* Create the output FITS file. */
  status = 0;
  naxes[0] = nfacet * nside;
  naxes[1] = naxes[0];
  if( hpxdat->ifptr ){
    if (fits_create_file(&fptr, IFILE, &status)) goto fitserr;
  } else {
    if (fits_create_file(&fptr, hpxdat->outfile, &status)) goto fitserr;
  }
  if (fits_create_img(fptr, FLOAT_IMG, 2, naxes, &status)) goto fitserr;

  /* Write WCS keyrecords. */
  if ((status = HPXhdr(fptr, hpxdat))) goto fitserr;


  /* Allocate arrays. */
  if ((healidx = malloc(nside * sizeof(long)))   == NULL ||
      (row     = malloc(nside * sizeof(float)))  == NULL) {
    perror("HPXcvt");
    goto cleanup;
  }

  /* Loop vertically facet-by-facet. */
  fpixel = 1;
  group  = 0;
  nelem  = nside;
  for (jfacet = 0; jfacet < nfacet; jfacet++) {
    /* Loop row-by-row. */
    for (j = 0; j < nside; j++) {
      /* Loop horizontally facet-by-facet. */
      for (ifacet = 0; ifacet < nfacet; ifacet++) {
        facet = FACETS[layout][jfacet][ifacet];
        rotn  = FROTAT[layout][jfacet][ifacet];
        halve = FHALVE[layout][jfacet][ifacet];

        /* Recentre longitude? */
        if (hpxdat->quad && facet >= 0) {
          if (facet <= 3) {
            facet += hpxdat->quad;
            if (facet > 3) facet -= 4;
          } else if (facet <= 7) {
            facet += hpxdat->quad;
            if (facet > 7) facet -= 4;
          } else {
            facet += hpxdat->quad;
            if (facet > 11) facet -= 4;
          }
        }

        /* Write out the data. */
        if (facet < 0) {
          /* A blank facet. */
          if (fits_write_img_null(fptr, group, fpixel, nelem, &status)) {
            goto fitserr;
          }

        } else {
          if (hpxdat->ordering == 'N') {
            /* Get nested indices. */
            status = NESTidx(nside, facet, rotn, j, healidx);
          } else {
            /* Get ring indices. */
            status = RINGidx(nside, facet, rotn, j, healidx);
          }

          /* Gather data into the output vector. */
          healp = healidx;
          for (rowp = row; rowp < row + nside; rowp++) {
            *rowp = hpxdat->data[*(healp++)];
          }

          /* Apply blanking to halved facets. */
          if (halve) {
            if (abs(halve) == 1) {
              /* Blank bottom-right. */
              i1 = j;
              i2 = nside;
              if (halve > 0) i1++;
            } else if (abs(halve) == 2) {
              /* Blank top-right. */
              i1 = nside - j;
              i2 = nside;
              if (halve < 0) i1--;
            } else if (abs(halve) == 3) {
              /* Blank top-left. */
              i1 = 0;
              i2 = j;
              if (halve < 0) i2++;
            } else {
              /* Blank bottom-left. */
              i1 = 0;
              i2 = nside - j;
              if (halve > 0) i2--;
            }

            for (rowp = row + i1; rowp < row + i2; rowp++) {
              *rowp = nulval;
            }
          }

          /* Write out this facet's contribution to this row of the map. */
          if (fits_write_imgnull_flt(fptr, group, fpixel, nelem, row, nulval,
                                     &status)) {
            goto fitserr;
          }
        }

        fpixel += nelem;
      }
    }
  }

  /* Write history. */
  if( hpxdat->infile && *hpxdat->infile ){
    sprintf(history, "Original input file: %s", hpxdat->infile);
    fits_write_history(fptr, history, &status);
  }
  sprintf(history, "     Original NSIDE: %d", hpxdat->nside);
  fits_write_history(fptr, history, &status);
  sprintf(history, "  Original ordering: %s",
    (hpxdat->ordering == 'N') ? "NESTED" : "RING");
  if (hpxdat->ordering == 'r') strcat(history, " (assumed)");
  fits_write_history(fptr, history, &status);


  /* Clean up. */
  if( hpxdat->ifptr  ){
    hpxdat->ofptr = fptr;
  } else {
    fits_close_file(fptr, &status);
  }
  status = 0;
  return status;

fitserr:
  fits_report_error(stderr, status);
cleanup:
  if (healidx) free(healidx);
  if (row)     free(row);
  if( !hpxdat->ifptr  ){
    hpxdat->ofptr = NULL;
  }
  return status;
}

/*--------------------------------------------------------------------------*/

/* (imap,jmap) are 0-relative pixel coordinates in the output map with origin
 * at the bottom-left corner of the specified facet which is rotated by
 * (45 + rotn * 90) degrees from its natural orientation; imap increases to
 * the right and jmap upwards. */

int NESTidx(int nside, int facet, int rotn, int jmap, long *healidx)

{
  int  h, i, imap, j, nside1, bit;
  long *hp;

  /* Nested index (0-relative) of the first pixel in this facet. */
  h = facet * nside * nside;

  nside1 = nside - 1;
  hp = healidx;
  for (imap = 0; imap < nside; imap++, hp++) {
    /* (i,j) are 0-relative pixel coordinates with origin in the southern
     * corner of the facet; i increases to the north-east and j to the
     * north-west. */
    if (rotn == 0) {
      i = nside1 - imap;
      j = jmap;
    } else if (rotn == 1) {
      i = nside1 - jmap;
      j = nside1 - imap;
    } else if (rotn == 2) {
      i = imap;
      j = nside1 - jmap;
    } else if (rotn == 3) {
      i = jmap;
      j = imap;
    }

    *hp = 0;
    bit = 1;
    while (i || j) {
      if (i & 1) *hp |= bit;
      bit <<= 1;
      if (j & 1) *hp |= bit;
      bit <<= 1;
      i >>= 1;
      j >>= 1;
    }

    *hp += h;
  }

  return 0;
}

/*--------------------------------------------------------------------------*/

/* (imap,jmap) pixel coordinates are as described above for NESTidx().  This
 * function computes the double-pixelisation index then converts it to the
 * regular ring index. */

int RINGidx(int nside, int facet, int rotn, int jmap, long *healidx)

{
  const int I0[] = { 1,  3, -3, -1,  0,  2,  4, -2,  1,  3, -3, -1};
  const int J0[] = { 1,  1,  1,  1,  0,  0,  0,  0, -1, -1, -1, -1};

  int  i = 0, i0, imap, j = 0, j0, n2side, n8side, npj, npole, nside1;
  long *hp;

  n2side = 2 * nside;
  n8side = 8 * nside;

  /* Double-pixelisation index of the last pixel in the north polar cap. */
  npole = (n2side - 1) * (n2side - 1) - 1;

  /* Double-pixelisation pixel coordinates of the centre of the facet. */
  i0 = nside * I0[facet];
  j0 = nside * J0[facet];

  nside1 = nside - 1;
  hp = healidx;
  for (imap = 0; imap < nside; imap++, hp++) {
    /* (i,j) are 0-relative, double-pixelisation pixel coordinates.  The
     * origin is at the intersection of the equator and prime meridian,
     * i increases to the east (N.B.) and j to the north. */
    if (rotn == 0) {
      i = i0 + nside1 - (jmap + imap);
      j = j0 + jmap - imap;
    } else if (rotn == 1) {
      i = i0 + imap - jmap;
      j = j0 + nside1 - (imap + jmap);
    } else if (rotn == 2) {
      i = i0 + (imap + jmap) - nside1;
      j = j0 + imap - jmap;
    } else if (rotn == 3) {
      i = i0 + jmap - imap;
      j = j0 + jmap + imap - nside1;
    }

    /* Convert i for counting pixels. */
    if (i < 0) i += n8side;
    i++;

    if (j > nside) {
      /* North polar regime. */
      if (j == n2side) {
        *hp = 0;
      } else {
        /* Number of pixels in a polar facet with this value of j. */
        npj = 2 * (n2side - j);

        /* Index of the last pixel in the row above this. */
        *hp = (npj - 1) * (npj - 1) - 1;

        /* Number of pixels in this row in the polar facets before this. */
        *hp += npj * (i/n2side);

        /* Pixel number in this polar facet. */
        *hp += i%n2side - (j - nside) - 1;
      }

    } else if (j >= -nside) {
      /* Equatorial regime. */
      *hp = npole + n8side * (nside - j) + i;

    } else {
      /* South polar regime. */
      *hp = 24 * nside * nside + 1;

      if (j > -n2side) {
        /* Number of pixels in a polar facet with this value of j. */
        npj = 2 * (j + n2side);

        /* Total number of pixels in this row or below it. */
        *hp -= (npj + 1) * (npj + 1);

        /* Number of pixels in this row in the polar facets before this. */
        *hp += npj * (i/n2side);

        /* Pixel number in this polar facet. */
        *hp += i%n2side + (nside + j) - 1;
      }
    }

    /* Convert double-pixelisation index to regular. */
    *hp -= 1;
    *hp /= 2;
  }

  return 0;
}

/*--------------------------------------------------------------------------*/

int HPXhdr(fitsfile *fptr, struct healpix *hpxdat)

{
  char   comment[64], cval[16], *ctype1, *ctype2, *descr1, *descr2, *pcode;
  int    status;
  float  cos45, crpix1, crpix2, crval1, crval2, lonpole;
  double cdelt1, cdelt2;

  status = 0;

  fits_update_key_log(fptr, "EXTEND", 0,
    "No FITS extensions are present", &status);
  fits_write_date(fptr, &status);

  /* Set pixel transformation parameters. */
  if (hpxdat->layout == 0) {
    crpix1 = (5 * hpxdat->nside + 1) / 2.0f;
  } else {
    crpix1 = (4 * hpxdat->nside + 1) / 2.0f;
  }
  crpix2 = crpix1;

  fits_write_key(fptr, TFLOAT, "CRPIX1", &crpix1,
    "Coordinate reference pixel", &status);
  fits_write_key(fptr, TFLOAT, "CRPIX2", &crpix2,
    "Coordinate reference pixel", &status);

  cos45 = (float)sqrt(2.0) / 2.0f;
  if (hpxdat->layout == 0) {
    fits_write_key_flt(fptr, "PC1_1",  cos45, -8,
      "Transformation matrix element", &status);
    fits_write_key_flt(fptr, "PC1_2",  cos45, -8,
      "Transformation matrix element", &status);
    fits_write_key_flt(fptr, "PC2_1", -cos45, -8,
      "Transformation matrix element", &status);
    fits_write_key_flt(fptr, "PC2_2",  cos45, -8,
      "Transformation matrix element", &status);
  }

  cdelt1 = -90.0 / hpxdat->nside / sqrt(2.0);
  cdelt2 = -cdelt1;
  fits_write_key_dbl(fptr, "CDELT1", cdelt1, -8,
    "[deg] Coordinate increment", &status);
  fits_write_key_dbl(fptr, "CDELT2", cdelt2, -8,
    "[deg] Coordinate increment", &status);


  /* Celestial transformation parameters. */
  if (hpxdat->layout == 0) {
    pcode = "HPX";
  } else {
    pcode = "XPH";
  }

  if (hpxdat->crdsys == 'G') {
    /* Galactic. */
    ctype1 = "GLON";
    ctype2 = "GLAT";
    descr1 = "Galactic longitude";
    descr2 = "Galactic  latitude";
  } else if (hpxdat->crdsys == 'E') {
    /* Ecliptic, who-knows-what. */
    ctype1 = "ELON";
    ctype2 = "ELAT";
    descr1 = "Ecliptic longitude";
    descr2 = "Ecliptic  latitude";
  } else if (hpxdat->crdsys == 'Q') {
    /* Equatorial, who-knows-what. */
    ctype1 = "RA--";
    ctype2 = "DEC-";
    descr1 = "Right ascension";
    descr2 = "Declination";
  } else {
    /* Unknown. */
    ctype1 = "XLON";
    ctype2 = "XLAT";
    descr1 = "Longitude";
    descr2 = " Latitude";
  }

  sprintf(cval, "%s-%s", ctype1, pcode);
  sprintf(comment, "%s in an %s projection", descr1, pcode);
  fits_write_key_str(fptr, "CTYPE1", cval, comment, &status);
  sprintf(cval, "%s-%s", ctype2, pcode);
  sprintf(comment, "%s in an %s projection", descr2, pcode);
  fits_write_key_str(fptr, "CTYPE2", cval, comment, &status);


  crval1 = 0.0f + 90.0f * hpxdat->quad;
  if (hpxdat->layout == 0) {
    crval2 =   0.0f;
  } else if (hpxdat->layout == 1) {
    crval1 += 180.0f;
    crval2  =  90.0f;
  } else {
    crval1 += 180.0f;
    crval2  = -90.0f;
  }
  if (360.0f < crval1) crval1 -= 360.0f;

  sprintf(comment, "[deg] %s at the reference point", descr1);
  fits_write_key(fptr, TFLOAT, "CRVAL1", &crval1, comment, &status);
  sprintf(comment, "[deg] %s at the reference point", descr2);
  fits_write_key(fptr, TFLOAT, "CRVAL2", &crval2, comment, &status);

  if (hpxdat->layout) {
    lonpole = 180.0f;
    sprintf(comment, "[deg] Native longitude of the celestial pole");
    fits_write_key(fptr, TFLOAT, "LONPOLE", &lonpole, comment, &status);
  }

  if (hpxdat->layout == 0) {
    fits_write_key_lng(fptr, "PV2_1", (LONGLONG)4,
      "HPX H parameter (longitude)", &status);
    fits_write_key_lng(fptr, "PV2_2", (LONGLONG)3,
      "HPX K parameter  (latitude)", &status);
  }

  /* Commentary. */
  fits_write_record(fptr, " ", &status);
  if (hpxdat->layout == 0) {
    fits_write_comment(fptr,
      "Celestial map with FITS-standard HPX coordinate system generated by",
      &status);
  } else {
    fits_write_comment(fptr,
      "Celestial map with XPH coordinate system (polar HPX) generated by",
      &status);
  }

  fits_write_comment(fptr,
    "'HPXcvt' which reorganises HEALPix data without interpolation as",
    &status);
  fits_write_comment(fptr,
    "described in \"Mapping on the HEALPix grid\" by Mark Calabretta and",
    &status);
  fits_write_comment(fptr,
    "Boud Roukema.  See http://www.atnf.csiro.au/people/Mark.Calabretta",
    &status);

  return status;
}
