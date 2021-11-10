/*
 *	Copyright (c) 2012-2020 Smithsonian Astrophysical Observatory
 */

#include "js9helper.h"

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
  int len;
  char *e=NULL;
  char *f=NULL;
  char *s=NULL;
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
  if( (s = strrchr(fname, '.')) &&
      (!strcasecmp(s, ".png")   ||
       !strcasecmp(s, ".jpg")   ||
       !strcasecmp(s, ".jpeg")) ){
    finfo->ftype = FTYPE_IMG;
  } else {
    /* FITS type */
    finfo->ftype = FTYPE_FITS;
  }
  /* open file */
  switch(finfo->ftype){
  case FTYPE_IMG:
    break;
 case FTYPE_FITS:
    /* fits file can have an extension */
    f = FileRoot(fname);
    /* get data path */
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
      xfree(e);
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

#if HAVE_CFITSIO

/* this version of cfitio has a broken fits_calc_binning routine */
#if ((CFITSIO_MAJOR == 3) && (CFITSIO_MINOR == 44))
    #warning "The unpatched cfitsio v3440 breaks JS9. Please ensure you have added the patched 'histo.c' file to your cfitsio library. See https://heasarc.gsfc.nasa.gov/fitsio/fitsio.html for details."
#endif

#define SLEN 33

int parseSection(fitsfile *fptr, int hdutype, char *s,
		 int *xlims, int *ylims, int *dims, double *cens, double *block,
		 int *mode){
  int got=0;
  int status=0;
  long naxes[2];
  double tx0=0, tx1=0, ty0=0, ty1=0;
  char s1[SLEN], s2[SLEN], s3[SLEN], s4[SLEN], s5[SLEN];
  char *t;
  // init mode to "sum"
  *mode = 0;
  /* look for different ways of specifying the section -- order counts! */
  /* specify limits, with and without blocking factor */
  if(sscanf(s,
     "%32[-0-9.dDeE] : %32[-0-9.dDeE] , %32[-0-9.dDeE] : %32[-0-9.dDeE] , %32[-0-9.dDeEas]",
     s1, s2, s3, s4, s5) == 5){
    tx0 = atof(s1);
    tx1 = atof(s2);
    ty0 = atof(s3);
    ty1 = atof(s4);
    *block = strtod(s5, &t);
    if( t && *t && (tolower(*t) == 'a') ){
      *mode = 1;
    }
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
	    "%32[-0-9.dDeE] : %32[-0-9.dDeE] , %32[-0-9.dDeEas]",
	    s1, s2, s3) == 3){
    tx0 = atof(s1);
    tx1 = atof(s2);
    ty0 = tx0;
    ty1 = tx1;
    *block = strtod(s3, &t);
    if( t && *t && (tolower(*t) == 'a') ){
      *mode = 1;
    }
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
  /* specify dimensions and center, with and without blocking factor */
  } else if(sscanf(s,
	    "%32[0-9.dDeE] @ %32[-0-9.dDeE] , %32[0-9.dDeE] @ %32[-0-9.dDeE] , %32[-0-9.dDeEas]",
	    s1, s2, s3, s4, s5) == 5){
    dims[0] = atof(s1);
    cens[0] = atof(s2);
    dims[1] = atof(s3);
    cens[1] = atof(s4);
    *block = strtod(s5, &t);
    if( t && *t && (tolower(*t) == 'a') ){
      *mode = 1;
    }
    got = 2;

  } else if(sscanf(s,
	    "%32[0-9.dDeE] @ %32[-0-9.dDeE] , %32[0-9.dDeE] @ %32[-0-9.dDeE]",
	     s1, s2, s3, s4) == 4){
    dims[0] = atof(s1);
    cens[0] = atof(s2);
    dims[1] = atof(s3);
    cens[1] = atof(s4);
    *block = 1;
    got = 2;
  } else if(sscanf(s,
	    "%32[0-9.dDeE] @ %32[-0-9.dDeE] , %32[-0-9.dDeEas]",
	    s1, s2, s3) == 3){
    dims[0] = atof(s1);
    cens[0] = atof(s2);
    dims[1] = dims[0];
    cens[1] = cens[0];
    *block = strtod(s3, &t);
    if( t && *t && (tolower(*t) == 'a') ){
      *mode = 1;
    }
    got = 2;
  } else if(sscanf(s,
	    "%32[0-9.dDeE] @ %32[-0-9.dDeE]",
	    s1, s2) == 2){
    dims[0] = atof(s1);
    cens[0] = atof(s2);
    dims[1] = dims[0];
    cens[1] = cens[0];
    *block = 1;
    got = 2;
  /* specify dimensions, with and without blocking factor */
  } else if(sscanf(s,
	    "%32[0-9.dDeE] , %32[-0-9.dDeE] , %32[-0-9.dDeEas]",
	    s1, s2, s3) == 3){
    dims[0] = atof(s1);
    cens[0] = 0;
    dims[1] = atof(s2);
    cens[1] = 0;
    *block = strtod(s3, &t);
    if( t && *t && (tolower(*t) == 'a') ){
      *mode = 1;
    }
    got = 3;
  } else if(sscanf(s,
	    "%32[0-9.dDeE] , %32[-0-9.dDeE]",
	    s1, s2) == 2){
    dims[0] = atof(s1);
    cens[0] = 0;
    dims[1] = atof(s2);
    cens[1] = 0;
    *block = 1;
    got = 3;
  }
  /*
     if we have dims but no cens:
       image: we can easily calculate cens as center of whole image
       table: we leave cens as 0,0 and pass back dims, cens but no limits
  */
  if( got == 3 ){
    if( hdutype == IMAGE_HDU ){
      fits_get_img_size(fptr, 2, naxes, &status);
      if( status == 0 ){
	cens[0] = naxes[0] / 2;
	cens[1] = naxes[1] / 2;
	/* we now have dims and cens, so change to got == 2 */
	got = 2;
      } else {
	/* this will end up as an error */
	got = 0;
      }
    }
  }
  /* final processing */
  if( got == 1 ){
    /* now we can integerize limits and set the output values */
    xlims[0] = (int)tx0;
    xlims[1] = (int)tx1;
    ylims[0] = (int)ty0;
    ylims[1] = (int)ty1;
    /* calculate dims and cens from limits */
    dims[0] = xlims[1] - xlims[0] + 1;
    dims[1] = ylims[1] - ylims[0] + 1;
    cens[0] = (xlims[1] + xlims[0]) / 2;
    cens[1] = (ylims[1] + ylims[0]) / 2;
  } else if( got == 2 ){
    /* if we are processing dim@center, we need to calculate section values */
    tx0 = cens[0] - (dims[0]/2) + 1;
    ty0 = cens[1] - (dims[1]/2) + 1;
    tx1 = cens[0] + (dims[0]/2);
    ty1 = cens[1] + (dims[1]/2);
    xlims[0] = (int)tx0;
    xlims[1] = (int)tx1;
    ylims[0] = (int)ty0;
    ylims[1] = (int)ty1;
  }
  return got;
}

/* copy image section from input to output, with binning */
int copyImageSection(fitsfile *ifptr, fitsfile *ofptr,
		     int *dims, double *cens, double bin, int binMode,
		     char *slice, int *status)
{
  int i;
  void *buf;
  char card[FLEN_CARD];
  char tbuf[SZ_LINE];
  int numkeys, nkey, bitpix, dtype;
  int start[4];
  int end[4];
  int naxis = 2;
  long nelements;
  long naxes[2];
  long fpixel[2] = {1,1};
  double amin[2];
  // get binning parameter
  // negative bin => 1/abs(bin)
  if( bin == 0 ){
    bin = 1.0;
  } else if( bin < 0 ){
    bin = 1.0 / fabs(bin);
  }
  // get array
  buf = getImageToArray(ifptr, dims, cens, bin, binMode, slice, NULL,
			start, end, &bitpix, status);
  if( !buf || *status ){
    fits_get_errstatus(*status, tbuf);
    fprintf(stderr, "ERROR: could not create section for output image: %s\n",
	    tbuf);
    return *status;
  }
  /* get image size and total number of elements */
  naxes[0] = (int)((end[0] - start[0] + 1) / bin);
  naxes[1] = (int)((end[1] - start[1] + 1) / bin);
  nelements = naxes[0] * naxes[1];
  /* convert bitpix to cfitio data type */
  switch(bitpix){
  case 8:
    dtype = TBYTE;
    break;
  case 16:
    dtype = TSHORT;
    break;
  case -16:
    dtype = TUSHORT;
    break;
  case 32:
    dtype = TINT;
    break;
  case 64:
    dtype = TLONGLONG;
    break;
  case -32:
    dtype = TFLOAT;
    break;
  case -64:
    dtype = TDOUBLE;
    break;
  default:
    fprintf(stderr, "ERROR: unknown data type for image section\n");
    return -1;
  }
  /* this code is modeled after cfitsio/cfileio.c/fits_copy_image_section() */
  fits_create_img(ofptr, bitpix, naxis, naxes, status);
  /* copy all other non-structural keywords from the input to output file */
  fits_get_hdrspace(ifptr, &numkeys, NULL, status);
  for(nkey=4; nkey<=numkeys; nkey++) {
    fits_read_record(ifptr, nkey, card, status);
    if (fits_get_keyclass(card) > TYP_CMPRS_KEY){
      /* write the record to the output file */
      fits_write_record(ofptr, card, status);
    }
  }
  if( *status > 0 ){
    fprintf(stderr,
	    "ERROR: can't copy header from input image to output section");
    return(*status);
  }
  /* write image to FITS file */
  fits_write_pix(ofptr, dtype, fpixel, nelements, buf, status);
  /* update basic WCS and LTM/TLV values in header */
  for(i=0; i<2; i++){
    amin[i] = (float)start[i];
  }
  updateWCS(ifptr, ofptr,
	    (int)((end[0] + start[0]) / 2), (int)((end[1] + start[1]) / 2),
	    (int)(end[0] - start[0] + 1), (int)(end[1] - start[1] + 1),
	    bin, amin);
  /* free up space */
  if( buf ){
    free(buf);
  }
  /* return status */
  return *status;
}
#endif

/* process this command */
static int ProcessCmd(char *cmd, char **args, int narg, int node, int tty)
{
  char *tfilter=NULL;
  char *s=NULL;
  char *t=NULL;
  char *jdir=NULL;
  char tbuf[SZ_LINE];
  Finfo finfo, tfinfo;
#if HAVE_CFITSIO
  int i, j, binMode;
  int xlims[2], ylims[2], got, hdutype, hdunum, ncard;
  int status=0, tstatus=0;
  int dims[2];
  double bin;
  double cens[2];
  char extname[FLEN_CARD];
  char *cols = "X Y";
  char *ofile="stdout";
  char *section=NULL;
  char *filter=NULL;
  char *slice=NULL;
  char *cardstr=NULL;
  char *ncardstr=NULL;
  void *tcens=NULL;
  fitsfile *ifptr, *ofptr, *tfptr;
#endif
  switch(*cmd){
  case 'f':
    if( !strcmp(cmd, "fitsFile") ){
      if( narg ){
	if( !(tfinfo=FinfoLookup(args[0])) ){
	  fprintf(stderr, NOIMAGE, args[0]);
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
      if( !narg ){
	fprintf(stderr, WRONGARGS, cmd, 1, 0);
	return 1;
      }
      /* new image */
      if( !(finfo = FinfoNew(args[0])) ){
	return 1;
      }
      /* make it current */
      FinfoSetCurrent(finfo);
      if( node ) fprintf(stdout, "image\r");
      s = finfo->fitsfile ? finfo->fitsfile : "?";
      /* get install directory (which we want to hide) */
      jdir = getenv("JS9_DIR");
      // hide install directory with environment variable
      if( jdir && *jdir ){
	t = strstr(s, jdir);
	if( t && *t && !strcmp(t, s) ){
	  strncpy(tbuf, "${JS9_DIR}", SZ_LINE-1);
	  strncat(tbuf, &s[strlen(jdir)], SZ_LINE-1);
	  xfree(s);
	  s = tbuf;
	}
      }
      /* return the FITS file name, if possible */
      fprintf(stdout, "%s %s\n", finfo->fname, s);
      fflush(stdout);
      return 0;
    } else if( !strcmp(cmd, "image_") ){
      if( !narg ){
	fprintf(stderr, WRONGARGS, cmd, 1, 0);
	return 1;
      }
      /* new image */
      if( !(finfo = FinfoNew(args[0])) ){
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
      if( narg < 2 ){
	fprintf(stderr, WRONGARGS2, cmd, 2);
	return 1;
      }
      ifptr = openFITSFile(finfo->fitsfile, READONLY, EXTLIST, NULL, &hdutype,
			   &status);
      if( status ){
	fprintf(stderr, "ERROR: can't open FITS file '%s'\n", finfo->fitsfile);
	return 1;
      }
      /* process args */
      ofile = args[0];
      section = args[1];
      if( narg >= 3 && args[2] ){
	tfilter = strdup(args[2]);
	filter = (char *)tfilter;
	t = strstr(tfilter, "@@");
	if( t ){
	  *t = '\0';
	  cols = t+2;
	}
      }
      if( narg >= 4 && args[3] ){
	slice = args[3];
      }
      if( !section || !(got = parseSection(ifptr, hdutype, section,
					   xlims, ylims, dims, cens,
					   &bin, &binMode)) ){
	fprintf(stderr,
		"ERROR: can't parse section for '%s' [%s]\n",
		finfo->fitsfile, (args && args[0]) ? args[0] : "NONE");
	return 1;
      }
      /* output image */
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
	/* image: let cfitsio make a section */
	if( copyImageSection(ifptr, ofptr, dims, cens, bin, binMode,
			     slice, &status) ){
	  fits_get_errstatus(status, tbuf);
	  fprintf(stderr,
		  "ERROR: can't copy image section for '%s' [%s]\n",
		  finfo->fitsfile, tbuf);
	  return 1;
	}
	break;
      default:
	/* table: let jsfitsio create an image section by binning the table */
	tfptr = filterTableToImage(ifptr, filter, cols, dims, cens, 1, NULL,
				   &status);
	if( status ){
	  fits_get_errstatus(status, tbuf);
	  fprintf(stderr,
		  "ERROR: can't create image from table for '%s' [%s]\n",
		  finfo->fitsfile, tbuf);
	  return 1;
	}
	fits_read_key(tfptr, TSTRING, "CTYPE1", tbuf, NULL, &status);
	if( status == 0 ){
	  if( strstr(tbuf, "--HPX") || strstr(tbuf, "--hpx") ){
	    tcens = cens;
	  }
	}
	status = 0;
	/* copy section to new image */
	if( copyImageSection(tfptr, ofptr, dims, tcens, bin, binMode,
			     NULL, &status) ){
	  fits_get_errstatus(status, tbuf);
	  fprintf(stderr,
		  "ERROR: can't copy image section for '%s' [%s]\n",
		  finfo->fitsfile, tbuf);
	  return 1;
	}
	tstatus = 0;
	closeFITSFile(tfptr, &tstatus);
	break;
      }
      if( status ){
	fits_get_errstatus(status, tbuf);
	fprintf(stderr,
		"ERROR: can't create section FITS file for '%s' [%s]\n",
		finfo->fitsfile, tbuf);
	closeFITSFile(ofptr, &status);
	return 1;
      }
#ifndef __EMSCRIPTEN__
      /* return a json object with info about original data */
      fprintf(stdout, "{\"file\":\"%s\"", finfo->fitsfile);
      fprintf(stdout, ",\"type\":%d", hdutype);
      ffghdn(ifptr, &hdunum);
      fprintf(stdout, ",\"extnum\":%d", hdunum-1);
      tstatus=0;
      ffgky(ifptr, TSTRING, "EXTNAME", extname, NULL, &tstatus);
      if( !tstatus ){
	fprintf(stdout, ",\"extname\":\"%s\"", extname);
      }
      fprintf(stdout, ",\"binstr\":\"%g %c\"", bin, binMode == 0 ? 's' : 'a');
      fprintf(stdout, ",\"hdus\":");
      _listhdu(finfo->fitsfile, NULL);
      tstatus=0;
      // get header cards as a string
      getHeaderToString(ifptr, &cardstr, &ncard, &tstatus);
      // clean header cards for json
      ncardstr = calloc(sizeof(char), strlen(cardstr)*2+1);
      for(i=0, j=0; i<(int)strlen(cardstr); i++, j++){
	if( cardstr[i] == '"' ){
	  ncardstr[j++] = '\\';
	}
	ncardstr[j] = cardstr[i];
      }
      if( ncardstr ){
	fprintf(stdout, ",\"ncard\":%d", ncard);
	fprintf(stdout, ",\"cardstr\":\"%s\"", ncardstr);
	free(ncardstr);
      }
      if( cardstr ){
	free(cardstr);
      }
      fprintf(stdout, "}\n");
      fflush(stdout);
#endif
      tstatus=0;
      closeFITSFile(ifptr, &tstatus);
      tstatus=0;
      closeFITSFile(ofptr, &tstatus);
      if( tfilter ){
	free(tfilter);
      }
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
#if HAVE_CFITSIO
    } else if( !strcmp(cmd, "listhdus") ){
      if( !(finfo=FinfoGetCurrent()) ){
	fprintf(stderr, NOFINFO, cmd);
	return 1;
      }
      _listhdu(finfo->fitsfile, NULL);
      fflush(stdout);
      return 0;
#endif
    }
    break;
  case 's':
    if( !strcmp(cmd, "setDataPath") ){
      if( narg ){
	setenv("JS9_DATAPATH", args[0], 1);
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
      if( !narg ){
	fprintf(stderr, WRONGARGS, cmd, 1, 0);
	return 1;
      }
      /* close this image */
      FinfoFree(args[0]);
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

#ifdef __EMSCRIPTEN__
int js9helper(int argc, char **argv)
#else
int main(int argc, char **argv)
#endif
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
  /* parse args from beginning */
  optind = 1;
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
      if( ProcessCmd("image", &image, 1, 0, 0) == 0 ){
	FinfoFree(image);
	return 0;
      } else {
	return 1;
      }
      break;
    case 1:
      /* set image (no info returned) */
      if( ProcessCmd("image_", &image, 1, 0, 0) != 0 ){
	return 1;
      }
      /* process command without args */
      if( ProcessCmd(argv[optind+0], NULL, 0, 0, 0) == 0 ){
	FinfoFree(image);
	return 0;
      } else {
	return 1;
      }
      break;
    default:
      /* set image (no info returned) */
      if( ProcessCmd("image_", &image, 1, 0, 0) != 0 ){
	return 1;
      }
      /* process command with args */
      if( ProcessCmd(argv[optind+0], &(argv[optind+1]), args-1, 0, 0) == 0 ){
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
    ProcessCmd(tbuf, &p, 1, node, tty);
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
