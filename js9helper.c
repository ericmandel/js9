/*
 *	Copyright (c) 2012 Smithsonian Astrophysical Observatory
 */
#include "js9helper.h"

#define SLEN 33

int parseSection(char *s, int *x0, int *x1, int *y0, int *y1, int *block){
  int itype=0, got=0;
  double tx0=0, tx1=0, ty0=0, ty1=0;
  double dim1, dim2, cen1, cen2;
  char s1[SLEN], s2[SLEN], s3[SLEN], s4[SLEN], s5[SLEN];
  char *t;
  /* look for different ways of specifying the section -- order counts! */
  if(sscanf(s,
     "%32[-0-9.dDeE] : %32[-0-9.dDeE] , %32[-0-9.dDeE] : %32[-0-9.dDeE] , %32[0-9]",
     s1, s2, s3, s4, s5) == 5){
    tx0 = atof(s1);
    tx1 = atof(s2);
    ty0 = atof(s3);
    ty1 = atof(s4);
    *block = MAX(1, atof(s5));
    got = 1;
  } else if(sscanf(s,
	  "%32[-0-9.dDeE] : %32[-0-9.dDeE] , %32[-0-9.dDeE] : %32[-0-9.dDeE]",
	  s1, s2, s3, s4) == 4){
    tx0 = atof(s1);
    tx1 = atof(s2);
    ty0 = atof(s3);
    ty1 = atof(s4);
    *block = 1;
    got = 1;
  } else if(sscanf(s,
	    "%32[-0-9.dDeE] : %32[-0-9.dDeE] , %32[0-9as]",
	    s1, s2, s3) == 3){
    tx0 = atof(s1);
    tx1 = atof(s2);
    ty0 = tx0;
    ty1 = tx1;
    *block = MAX(1, atof(s3));
    got = 1;
  } else if(sscanf(s,
	    "%32[-0-9.dDeE] : %32[-0-9.dDeE]",
	    s1, s2) == 2){
    tx0 = atof(s1);
    tx1 = atof(s2);
    ty0 = tx0;
    ty1 = tx1;
    *block = 1;
    got = 1;
  } else if(sscanf(s,
	    "%32[0-9.dDeE] @ %32[-0-9.dDeE] , %32[0-9.dDeE] @ %32[-0-9.dDeE] , %32[0-9]",
	    s1, s2, s3, s4, s5) == 5){
    dim1 = atof(s1);
    cen1 = atof(s2);
    dim2 = atof(s3);
    cen2 = atof(s4);
    *block = MAX(1, strtol(s5, &t, 0));
    itype = 1;
    got = 1;
  } else if(sscanf(s,
	    "%32[0-9.dDeE] @ %32[-0-9.dDeE] , %32[0-9.dDeE] @ %32[-0-9.dDeE]",
	     s1, s2, s3, s4) == 4){
    dim1 = atof(s1);
    cen1 = atof(s2);
    dim2 = atof(s3);
    cen2 = atof(s4);
    *block = 1;
    itype = 1;
    got = 1;
  } else if(sscanf(s,
	    "%32[0-9.dDeE] @ %32[-0-9.dDeE]  , %32[0-9]",
		   s1, s2, s3) == 3){
    dim1 = atof(s1);
    cen1 = atof(s2);
    dim2 = dim1;
    cen2 = cen1;
    *block = MAX(1, strtol(s3, &t, 0));
    itype = 1;
    got = 1;
  } else if(sscanf(s,
	    "%32[0-9.dDeE] @ %32[-0-9.dDeE]",
	    s1, s2) == 2){
    dim1 = atof(s1);
    cen1 = atof(s2);
    dim2 = dim1;
    cen2 = cen1;
    itype = 1;
    got = 1;
  }
  /* if we are processing dim@center, we need to calculate section values */
  if( itype ){
    tx0 = cen1 - ((dim1+1)/2) + 1;
    ty0 = cen2 - ((dim2+1)/2) + 1;
    /* this method maintains the center and changes the dimensions */
    /* Frank, Eric, and John all prefer this method, so that the user
       gets the center he asked for, even if the image is reduced */
    tx1 = cen1 + (dim1/2);
    ty1 = cen2 + (dim2/2);
  }
  /* now we can integerize and set the output values */
  *x0 = (int)tx0;
  *x1 = (int)tx1;
  *y0 = (int)ty0;
  *y1 = (int)ty1;
  return got;
}

/* the Finfo stuff supports using js9helper as a server, as opposed
   to simply exec'ing it as needed */

/* this is the head of the global list -- too lazy to do anything more */
static Finfo finfohead=NULL;

/* currently active finfo */
static Finfo finfocur=NULL;

/* search path for data */
static char *datapath=NULL;

/* add this finfo to the list */
static void FinfoListAdd (Finfo *head, Finfo finfo)
{
  Finfo cur;

  if( *head == NULL ){
    *head = finfo;
  } else {
    for(cur=*head; cur->next!=NULL; cur=cur->next)
      ;
    cur->next = finfo;
  }
}

/* remove this finfo from the list */
static void FinfoListDel (Finfo *head, Finfo finfo)
{
  Finfo cur;

  /* remove from list of finfos */
  if( *head ){
    if( *head == finfo ){
      *head = finfo->next;
    } else {
      for(cur=*head; cur!=NULL; cur=cur->next){
	if( cur->next == finfo ){
	  cur->next = finfo->next;
	  break;
	}
      }
    }
  }
}

/* lookup this finfo by file name */
static Finfo FinfoLookup(char *fname)
{
  char *s;
  int pos;
  Finfo cur=NULL;

  /* sanity check */
  if( !fname ) return NULL;
  /* look for a finfo with the right file name */
  for(cur=finfohead; cur!=NULL; cur=cur->next){
    if( (s=strstr(cur->fname, fname)) != NULL ){
      pos = s - cur->fname;
      if( (strlen(s) == strlen(fname)) &&
	  ((pos == 0) || (cur->fname[pos-1] == '/')) ){
	return cur;
      }
    }
  }
  return NULL;
}

/* list all finfos */
static int FinfoList(FILE *fp)
{
  int n=0;
  Finfo cur=NULL;
  /* look for a finfo with the right file name */
  for(cur=finfohead; cur!=NULL; cur=cur->next){
    if( n ) fprintf(fp, " ");
    fprintf(fp, "%s", cur->fname);
    n++;
  }
  if( n ) fprintf(fp, "\n");
  fflush(fp);
  return 0;
}

/* free this finfo and remove from list */
static int _FinfoFree(Finfo finfo)
{
  /* sanity check */
  if( !finfo ) return 1;
  /* remove from list of finfos */
  FinfoListDel(&finfohead, finfo);
  /* free up strings */
  xfree(finfo->fname);
  xfree(finfo->fitsfile);
  /* free up png structs */
  if( finfo->png_ptr || finfo->info_ptr ){
    png_destroy_read_struct(&finfo->png_ptr, &finfo->info_ptr, NULL);
  }
  /* close file */
  if( finfo->fp ){
    fclose(finfo->fp);
  }
  /* free up enclosing record */
  xfree(finfo);
  /* return the news */
  return 0;
}

/* create a new finfo record, open FITS file */
static Finfo FinfoNew(char *fname)
{
  int i, len;
  char *e=NULL;
  char *f=NULL;
  char *s=NULL;
  unsigned char header[8];
  Finfo finfo;

  /* sanity check */
  if( !fname ) return NULL;
  /* return existing finfo, if possible */
  if( (finfo=FinfoLookup(fname)) ) return finfo;
  /* allocate record */
  if( !(finfo = (Finfo)xcalloc(sizeof(FinfoRec), 1)) ){
    fprintf(stderr, "ERROR: can't allocate rec for image\n");
    return NULL;
  }
  /* save file name */
  finfo->fname = xstrdup(fname);
  /* check for file type */
  if( (s = strrchr(fname, '.')) && !strcasecmp(s, ".png") ){
    /* its a PNG */
    finfo->ftype = FTYPE_PNG;
  } else {
    /* assume FITS type */
    finfo->ftype = FTYPE_FITS;
  }
  /* open file */
  switch(finfo->ftype){
  case FTYPE_PNG:
    /* code taken from "PNG: The Definitive Guide" by Greg Roelofs,
       Chapter 13 "Reading PNG Images" */
    /* set data path */
    datapath = getenv("JS9_DATAPATH");
    /* look for path of the PNG file */
    s = Find(fname, "r", NULL, datapath);
    if( s && *s ){
      if( !(finfo->fp = fopen(s, "rb")) ){
	fprintf(stderr, "ERROR: can't open PNG file '%s'\n", fname);
	goto error;
      }
      fread(header, 1, 8, finfo->fp);
      if( png_sig_cmp(header, 0, 8) ){
	fprintf(stderr, "ERROR: not recognized as a PNG file '%s'\n", fname);
	goto error;
      }
      /* initialize stuff */
      finfo->png_ptr = png_create_read_struct(PNG_LIBPNG_VER_STRING,
					      NULL, NULL, NULL);
      if( !finfo->png_ptr ){
	fprintf(stderr, "ERROR: png_create_read_struct failed '%s'\n", fname);
	goto error;
      }
      finfo->info_ptr = png_create_info_struct(finfo->png_ptr);
      if( !finfo->info_ptr ){
	fprintf(stderr, "ERROR: png_create_info_struct failed '%s'\n", fname);
	goto error;
      }
      if( setjmp(png_jmpbuf(finfo->png_ptr)) ){
	fprintf(stderr, "ERROR: during png init_io '%s'\n", fname);
	goto error;
      }
      png_init_io(finfo->png_ptr, finfo->fp);
      png_set_sig_bytes(finfo->png_ptr, 8);
      png_read_info(finfo->png_ptr, finfo->info_ptr);
      /* get the text chunks that come before the image */
      if( png_get_text(finfo->png_ptr, finfo->info_ptr,
		       &(finfo->text_ptr), &(finfo->num_text)) > 0 ){
	/* process all known PNG keywords */
	for(i=0; i<finfo->num_text; i++){
	  if( !strcmp(finfo->text_ptr[i].key, FITSFILE) ){
	    finfo->fitsfile = xstrdup(finfo->text_ptr[i].text);
	    /* remove the extension that was used to generate png */
	    s = strchr(finfo->fitsfile, '[');
	    if( s ){
	      *s = '\0';
	    }
	  }
	}
      }
    } else {
      fprintf(stderr, "ERROR: can't find PNG file '%s' [data path: %s]\n",
	      fname, datapath?datapath:"none");
      goto error;
    }
    break;
    /* look for an error */
  case FTYPE_FITS:
    /* fits file can have an extension */
    f = FileRoot(fname);
    /* set data path */
    datapath = getenv("JS9_DATAPATH");
    /* look for path of the FITS file */
    s = Find(f, "r", NULL, datapath);
    xfree(f);
    if( s && *s ){
      len = strlen(s) + 1;
      /* construct full path to fits file + extension */
      e = FileExtension(fname);
      if( e ){
        len += strlen(e);
      }
      finfo->fitsfile = xmalloc(len);
      strcpy(finfo->fitsfile, s);
      if( e ){
        strcat(finfo->fitsfile, e);
      }
      xfree(s);
    } else {
      fprintf(stderr, "ERROR: can't find FITS file '%s' [data path: %s]\n",
	      fname, datapath?datapath:"none");
      goto error;
    }
    break;
  default:
    fprintf(stderr, "ERROR: unknown file type '%s'\n", fname);
    goto error;
    break;
  }
  /* add this finfo to end of list of existing finfos */
  FinfoListAdd(&finfohead, finfo);
  /* return the news */
  return finfo;
error:
  /* free up struct and return nothing */
  _FinfoFree(finfo);
  return NULL;
}

/* set current finfo */
static Finfo FinfoSetCurrent(Finfo finfo)
{
  Finfo ofinfo;

  /* save old current */
  ofinfo = finfocur;
  /* set new current */
  finfocur = finfo;
  /* return old finfo */
  return ofinfo;
}

/* return current finfo */
static Finfo FinfoGetCurrent()
{
  /* return the news */
  return finfocur;
}

/* free this finfo and remove from list */
static int FinfoFree(char *fname)
{
  Finfo finfo;

  /* sanity check */
  if( !fname ) return 1;
  /* look for the appropriate finfo */
  if( (finfo=FinfoLookup(fname)) != NULL ){
    if( FinfoGetCurrent() == finfo ) FinfoSetCurrent(NULL);
    _FinfoFree(finfo);
    return 0;
  }
  return 1;
}

/* process this command */
static int ProcessCmd(char *cmd, char **args, int node, int tty)
{
  int ip=0;
  char tbuf[SZ_LINE];
  Finfo finfo, tfinfo;
#if HAVE_CFITSIO
  int x0, x1, y0, y1, bin;
  int xcolnum, ycolnum, hdunum, hdutype;
  int status=0, status2=0;
  int dims[2];
  double cens[2];
  char *cols[2] = {"X", "Y"};
  char *ofile=NULL;
  char *omode=NULL;
  fitsfile *ifptr, *ofptr, *tfptr;
#endif

  switch(*cmd){
  case 'f':
    if( !strcmp(cmd, "fitsFile") ){
      if( args && word(args[0], tbuf, &ip) ){
	if( !(tfinfo=FinfoLookup(tbuf)) ){
	  fprintf(stderr, NOIMAGE, tbuf);
	  return 1;
	}
      } else if( !(tfinfo=FinfoGetCurrent()) ){
	fprintf(stderr, NOFINFO, cmd);
	return 1;
      }
      if( tfinfo->fitsfile ){
	if( node ) fprintf(stdout, "fitsFile\r");
	fprintf(stdout, "%s %s\n", tfinfo->fname, tfinfo->fitsfile);
	fflush(stdout);
      }
      return 0;
    }
    break;
    break;
  case 'i':
    if( !strcmp(cmd, "image") ){
      if( !args || !word(args[0], tbuf, &ip) ){
	fprintf(stderr, WRONGARGS, cmd, 1, 0);
	return 1;
      }
      /* new image */
      if( !(finfo = FinfoNew(tbuf)) ){
	return 1;
      }
      /* make it current */
      FinfoSetCurrent(finfo);
      if( node ) fprintf(stdout, "image\r");
      /* return the FITS file name, if possible */
      fprintf(stdout, "%s %s\n",
	      finfo->fname, finfo->fitsfile ? finfo->fitsfile : "?");
      fflush(stdout);
      return 0;
    } else if( !strcmp(cmd, "image_") ){
      if( !args || !word(args[0], tbuf, &ip) ){
	fprintf(stderr, WRONGARGS, cmd, 1, 0);
	return 1;
      }
      /* new image */
      if( !(finfo = FinfoNew(tbuf)) ){
	return 1;
      }
      /* make it current */
      FinfoSetCurrent(finfo);
      /* no output! */
      return 0;
    } else if( !strcmp(cmd, "imsection") ){
#if HAVE_CFITSIO
      if( !(finfo=FinfoGetCurrent()) ){
	fprintf(stderr, NOFINFO, cmd);
	return 1;
      }
      ifptr = openFITSFile(finfo->fitsfile, EXTLIST, &hdutype, &status);
      if( status ){
	fprintf(stderr, "ERROR: can't open FITS file '%s'\n", finfo->fitsfile);
	return 1;
      }
      if( !args || !parseSection(args[0], &x0, &x1, &y0, &y1, &bin) ){
	fprintf(stderr,
		"ERROR: can't parse section for '%s' [%s]\n",
		finfo->fitsfile, (args && args[1]) ? args[1] : "NONE");
	return 1;
      }
      if( args[1] ){
	omode = args[1];
      } else {
	omode = "native";
      }
      ofile = "stdout";
      // create image if ifile is an image or omode is not native
      if( (hdutype == IMAGE_HDU) || strcmp(omode, "native") ){
	fits_create_file(&ofptr, ofile, &status);
	if( status ){
	  fits_get_errstatus(status, tbuf);
	  fprintf(stderr,
		  "ERROR: can't open output FITS file to section '%s' [%s]\n",
		  finfo->fitsfile, tbuf);
	  return 1;
	}
	switch(hdutype){
	case IMAGE_HDU:
	  if( bin != 1 ){
	    fprintf(stderr,
		    "ERROR: imsection of an image must use bin 1 for '%s'\n",
		    finfo->fitsfile);
	    return 1;
	  }
	  snprintf(tbuf, SZ_LINE-1, "%d:%d,%d:%d", x0, x1, y0, y1);
	  fits_copy_image_section(ifptr, ofptr, tbuf, &status);
	  break;
	default:
	  dims[0] = x1 - x0 + 1;
	  dims[1] = y1 - y0 + 1;
	  cens[0] = (x0 + x1) / 2;
	  cens[1] = (y0 + y1) / 2;
	  tfptr = filterTableToImage(ifptr, NULL, cols, dims, cens, bin,
				     &status);
	  if( status ){
	    fits_get_errstatus(status, tbuf);
	    fprintf(stderr,
		    "ERROR: can't create image from table for '%s' [%s]\n",
		    finfo->fitsfile, tbuf);
	    return 1;
	  }
	  fits_copy_image_section(tfptr, ofptr, "*,*", &status);
	  closeFITSFile(tfptr, &status2);
	  break;
	}
	if( status ){
	  fits_get_errstatus(status, tbuf);
	  fprintf(stderr,
		  "ERROR: can't write section FITS file for '%s' [%s]\n",
		  finfo->fitsfile, tbuf);
	  closeFITSFile(ofptr, &status);
	  return 1;
	}
	closeFITSFile(ofptr, &status);
      } else {
	// extract (native) table
	snprintf(tbuf, SZ_LINE-1,
		 "x >= %d && x <= %d && y >= %d && y <= %d",
		 x0, x1, y0, y1);
	// ffselect_table(&ifptr, ofile, tbuf, &status);
	// copied from cfileio.c/ffselect_table()
	/* create new empty file to hold copy of the image */
	if (ffinit(&ofptr, ofile, &status) > 0) {
	  fits_get_errstatus(status, tbuf);
	  fprintf(stderr,
		  "ERROR: can't init section file for '%s' [%s]\n",
		  finfo->fitsfile, tbuf);
	  return 1;
	}
	/* save current HDU number in input file */
	fits_get_hdu_num(ifptr, &hdunum);
	/* copy the primary array */
	fits_movabs_hdu(ifptr, 1, NULL, &status);
	if( fits_copy_hdu(ifptr, ofptr, 0, &status) > 0){
	  fits_get_errstatus(status, tbuf);
	  fprintf(stderr,
		  "ERROR: can't copy primary for section file '%s' [%s]\n",
		  finfo->fitsfile, tbuf);
	  fits_close_file(ofptr, &status);
	  return 1;
	}
	/* back to current hdu */
	fits_movabs_hdu(ifptr, hdunum, NULL, &status);
	/* copy all the header keywords from the input to output file */
	if (fits_copy_header(ifptr, ofptr, &status) > 0){
	  fits_get_errstatus(status, tbuf);
	  fprintf(stderr,
		  "ERROR: can't copy header for section file '%s' [%s]\n",
		  finfo->fitsfile, tbuf);
	  fits_close_file(ofptr, &status);
	  return 1;
	}
	/* set number of rows = 0 */
	/* warning: start of cfitsio black magic */
	fits_modify_key_lng(ofptr, "NAXIS2", 0, NULL, &status);
	(ofptr->Fptr)->numrows = 0;
	(ofptr->Fptr)->origrows = 0;
	/* force the header to be scanned */
	if (ffrdef(ofptr, &status) > 0){
	  fits_get_errstatus(status, tbuf);
	  fprintf(stderr,
		  "ERROR: can't rdef for section file '%s' [%s]\n",
		  finfo->fitsfile, tbuf);
	  fits_close_file(ofptr, &status);
	  return 1;
	}
	/* warning: end of cfitsio black magic */
	/* select filtered rows and write to output file */
	if (fits_select_rows(ifptr, ofptr, tbuf, &status) > 0){
	  fits_get_errstatus(status, tbuf);
	  fprintf(stderr,
		  "ERROR: can't select rows for section file '%s' [%s]\n",
		  finfo->fitsfile, tbuf);
	  fits_close_file(ofptr, &status);
	  return 1;
	}
	/* update params for this section */
	if( (fits_get_colnum(ofptr, CASEINSEN, "X", &xcolnum, &status) > 0) ||
	    (fits_get_colnum(ofptr, CASEINSEN, "Y", &ycolnum, &status) > 0) ){
	  fits_get_errstatus(status, tbuf);
	  fprintf(stderr,
		  "ERROR: can't find X,Y cols for section file '%s' [%s]\n",
		  finfo->fitsfile, tbuf);
	  fits_close_file(ofptr, &status);
	  return 1;
	}
	/* we can ignore errors here */
	status = 0;
	snprintf(tbuf, SZ_LINE-1, "TALEN%d", xcolnum);
	fits_modify_key_lng(ofptr, tbuf, x1-x0, NULL, &status);
	status = 0;
	snprintf(tbuf, SZ_LINE-1, "TALEN%d", ycolnum);
	fits_modify_key_lng(ofptr, tbuf, y1-y0, NULL, &status);
	status = 0;
	snprintf(tbuf, SZ_LINE-1, "TLMIN%d", xcolnum);
	fits_modify_key_flt(ofptr, tbuf, x0, 6, NULL, &status);
	status = 0;
	snprintf(tbuf, SZ_LINE-1, "TLMAX%d", xcolnum);
	fits_modify_key_flt(ofptr, tbuf, x1, 6, NULL, &status);
	status = 0;
	snprintf(tbuf, SZ_LINE-1, "TLMIN%d", ycolnum);
	fits_modify_key_flt(ofptr, tbuf, y0, 6, NULL, &status);
	status = 0;
	snprintf(tbuf, SZ_LINE-1, "TLMAX%d", ycolnum);
	fits_modify_key_flt(ofptr, tbuf, y1, 6, NULL, &status);
	/* close the output file */
	status = 0;
	fits_close_file(ofptr, &status);
      }
      closeFITSFile(ifptr, &status);
      return 0;
#else
      fprintf(stderr,
	      "ERROR: for section support, build js9helper with cfitsio\n");
      return 1;
#endif
    } else if( !strcmp(cmd, "info") ){
      if( tty ){
	if( !(finfo=FinfoGetCurrent()) ){
	  fprintf(stderr, NOFINFO, cmd);
	  return 1;
	}
	/* make sure we have a wcs */
	fprintf(stdout, "fname:\t%s\n", finfo->fname);
	fprintf(stdout, "fits:\t%s\n", finfo->fitsfile?finfo->fitsfile:"N/A");
	fflush(stdout);
      }
      return 0;
    }
    break;
  case 'l':
    /* list all images */
    if( !strcmp(cmd, "list") ){
      FinfoList(stdout);
      return 0;
    }
    break;
  case 's':
    if( !strcmp(cmd, "setDataPath") ){
      if( args && word(args[0], tbuf, &ip) ){
	setenv("JS9_DATAPATH", tbuf, 1);
	if( node ) fprintf(stdout, "setDataPath\r");
	fprintf(stdout, "%s\n", getenv("JS9_DATAPATH"));
	fflush(stdout);
      } else {
	fprintf(stderr, WRONGARGS, cmd, 1, 0);
	return 1;
      }
      return 0;
    }
    break;
  case 'u':
    if( !strcmp(cmd, "unimage") ){
      if( !args || !word(args[0], tbuf, &ip) ){
	fprintf(stderr, WRONGARGS, cmd, 1, 0);
	return 1;
      }
      /* close this image */
      FinfoFree(tbuf);
      return 0;
    }
    break;
  case '#':
  case '\0':
    return 0;
  default:
    break;
  }
  /* if we reached here, we did not recognize the command */
  fprintf(stderr, "ERROR: unknown command '%s'\n", cmd);
  /* return the news */
  return 2;
}

int main(int argc, char **argv)
{
  int c;
  int args;
  int ip=0;
  int verbose=0;
  int node=0;
  int tty=0;
  char lbuf[SZ_LINE];
  char tbuf[SZ_LINE];
  char *p;
  char *image=NULL;
  Finfo cur, tcur;

  /* we want the args in the same order in which they arrived, and
     gnu getopt sometimes changes things without this */
  putenv("POSIXLY_CORRECT=true");
  /* process switch arguments */
  while ((c = getopt(argc, argv, "i:v")) != -1){
    switch(c){
    case 'i':
      image = optarg;
      break;
    case 'v':
      verbose++;
      break;
    }
  }
  /* process remaining args */
  args = argc - optind;
  /* if image was specified, this is a batch job */
  if( image ){
    switch(args){
    case 0:
      /* get image info and exit */
      if( ProcessCmd("image", &image, 0, 0) == 0 ){
	FinfoFree(image);
	return 0;
      } else {
	return 1;
      }
      break;
    case 1:
      /* set image (no info returned) */
      if( ProcessCmd("image_", &image, 0, 0) != 0 ){
	return 1;
      }
      /* process command without args */
      if( ProcessCmd(argv[optind+0], NULL, 0, 0) == 0 ){
	FinfoFree(image);
	return 0;
      } else {
	return 1;
      }
      break;
    default:
      /* set image (no info returned) */
      if( ProcessCmd("image_", &image, 0, 0) != 0 ){
	return 1;
      }
      /* process command with args */
      if( ProcessCmd(argv[optind+0], &(argv[optind+1]), 0, 0) == 0 ){
	FinfoFree(image);
	return 0;
      } else {
	return 1;
      }
      break;
    }
  }
  /* stdout is connected to terminal => not connected to the node helper */
  if( isatty(1) ){
    node = 0;
    tty = 1;
  } else {
    node = 1;
    tty = 0;
  }
  /* initial prompt */
  if( !node ){
    fprintf(stdout, "js9helper> ");
    fflush(stdout);
  }
  /* command loop */
  while( fgets(lbuf, SZ_LINE-1, stdin) ){
    /* first arg: command */
    ip = 0;
    if( !word(lbuf, tbuf, &ip) ) continue;
    /* look for quit */
    if( !node ){
      if( !strcasecmp(tbuf, "quit") ){
	break;
      }
    }
    /* process this command */
    p = &lbuf[ip];
    ProcessCmd(tbuf, &p, node, tty);
    /* re-prompt, if necessary */
    if( !node ){
      fprintf(stdout, "js9helper> ");
      fflush(stdout);
    }
  }
  /* clean up */
  for(cur=finfohead; cur!=NULL; ){
    tcur = cur->next;
    _FinfoFree(cur);
    cur = tcur;
  }
  /* all done */
  return 0;
}
