/*
 *	Copyright (c) 2012 Smithsonian Astrophysical Observatory
 */
#include "js9helper.h"

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
  }
  else{
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
    }
    else{
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
  if( finfo->fname ) xfree(finfo->fname);
  if( finfo->ofitsfile ) xfree(finfo->ofitsfile);
  if( finfo->fitsfile ) xfree(finfo->fitsfile);
  if( finfo->fitscards ) xfree(finfo->fitscards);
  /* free wcs */
  if( finfo->wcs ) wcsfree(finfo->wcs);
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

/* create a new finfo record, open FITS file, init wcs */
static Finfo FinfoNew(char *fname)
{
  int i;
  char *s;
  unsigned char header[8];
  Finfo finfo;
  FITSHead iheader;  

  /* sanity check */
  if( !fname ) return NULL;
  /* return existing finfo, if possible */
  if( (finfo=FinfoLookup(fname)) ) return finfo;
  /* allocate record */
  if( !(finfo = (Finfo)xcalloc(sizeof(FinfoRec), 1)) ){
    gerror(stderr, "can't allocate rec for image\n");
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
  /* open file and get wcs */
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
	gerror(stderr, "can't open PNG file '%s'\n", fname);
	goto error;
      }
      fread(header, 1, 8, finfo->fp);
      if( png_sig_cmp(header, 0, 8) ){
	gerror(stderr, "not recognized as a PNG file '%s'\n", fname);
	goto error;
      }
      /* initialize stuff */
      finfo->png_ptr = png_create_read_struct(PNG_LIBPNG_VER_STRING, 
					      NULL, NULL, NULL);
      if( !finfo->png_ptr ){
	gerror(stderr, "png_create_read_struct failed '%s'\n", fname);
	goto error;
      }
      finfo->info_ptr = png_create_info_struct(finfo->png_ptr);
      if( !finfo->info_ptr ){
	gerror(stderr, "png_create_info_struct failed '%s'\n", fname);
	goto error;
      }
      if( setjmp(png_jmpbuf(finfo->png_ptr)) ){
	gerror(stderr, "error during png init_io '%s'\n", fname);
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
	    finfo->ofitsfile = xstrdup(finfo->text_ptr[i].text);
	    finfo->fitsfile = xstrdup(finfo->ofitsfile);
	    /* remove the extension */
	    s = strchr(finfo->fitsfile, '[');
	    if( s ){
	      *s = '\0';
	    }
	  } else if( !strcmp(finfo->text_ptr[i].key, FITSHEADER) ){
	    if( hlength(finfo->text_ptr[i].text, 0) >= 0 ){
	      finfo->fitscards = xstrdup(finfo->text_ptr[i].text);
	      finfo->wcs = wcsinit(finfo->fitscards);
	    }
	  }
	}
      }
    } else {
      gerror(stderr, "can't locate PNG file for '%s' (%s)\n", fname, datapath);
      goto error;
    }
    break;
    /* look for an error */
  case FTYPE_FITS:
    /* set data path */
    datapath = getenv("JS9_DATAPATH");
    /* look for path of the FITS file */
    s = Find(fname, "r", NULL, datapath);
    if( s && *s ){
      /* if found, open the file */
      if( !(finfo->fun = FunOpen(s, "r", NULL)) ){
	gerror(stderr, "can't open FITS file '%s'\n", fname);
	goto error;
      }
      /* look for WCS capability */
      FunInfoGet(finfo->fun, FUN_WCS, &(finfo->wcs), FUN_HEADER, &iheader, 0);
      finfo->fitscards = ft_cards(iheader);
      finfo->ofitsfile = xstrdup(s);
      finfo->fitsfile = xstrdup(finfo->ofitsfile);
      free(s);
    } else {
      gerror(stderr, "can't locate FITS file for '%s' (%s)\n", fname, datapath);
      goto error;
    }
    break;
  default:
    gerror(stderr, "unknown file type '%s'\n", fname);
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
static int ProcessCmd(char *cmd, char *args, int node, int tty)
{
  int offscl;
  int got=0;
  int ip=0;
  double dval1, dval2, dval3, dval4;
  double rval1, rval2, rval3, rval4;
  double sep;
  char tbuf[SZ_LINE];
  char rbuf1[SZ_LINE];
  char rbuf2[SZ_LINE];
  char *s=NULL, *t=NULL;;
  char *s1=NULL, *s2=NULL;
  char *targs=NULL, *targ=NULL;
  Finfo finfo, tfinfo;

  switch(*cmd){
  case 'f':
    if( !strcmp(cmd, "fitsFile") ){
      if( word(args, tbuf, &ip) ){
	if( !(tfinfo=FinfoLookup(tbuf)) ){
	  gerror(stderr, NOIMAGE, tbuf);
	  return 1;
	}
      } else if( !(tfinfo=FinfoGetCurrent()) ){
	gerror(stderr, NOFINFO, cmd);
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
  case 'h':
    if( !strcmp(cmd, "header") ){
      if( tty ){
	if( !(finfo=FinfoGetCurrent()) ){
	  gerror(stderr, NOFINFO, cmd);
	  return 1;
	}
	/* make sure we have a wcs */
	if( !finfo->wcs ){
	  return 0;
	}
	if( finfo->wcs ){
	  if( node ) fprintf(stdout, "header\r");
	  s = calloc(1, strlen(finfo->fitscards)+1);
	  nowhite(finfo->fitscards, s);
	  fprintf(stdout, "%s\n", s);
	  xfree(s);
	}
	fflush(stdout);
      }
      return 0;
    }
    break;
  case 'i':
    if( !strcmp(cmd, "image") ){
      if( !word(args, tbuf, &ip) ){
	gerror(stderr, WRONGARGS, cmd, 1, 0);
	return 1;
      }
      /* new image */
      if( !(finfo = FinfoNew(tbuf)) ){
	s = gerrorstring();
	if( !s ){
	  gerror(stderr, NONEW, cmd);
	}
	return 1;
      }
      /* make it current */
      FinfoSetCurrent(finfo);
      if( node ) fprintf(stdout, "image\r");
      /* return the FITS file name, if possible */
      fprintf(stdout, "%s %s ", 
	      finfo->fname, finfo->fitsfile? finfo->fitsfile : "?");
      /* client needs to know whether or not we have wcs */
      if( finfo->wcs ){
     	fprintf(stdout, "wcs %s\n", getradecsys(finfo->wcs));
      } else {
     	fprintf(stdout, "pix\n");
      }
      fflush(stdout);
      return 0;
    } else if( !strcmp(cmd, "image_") ){
      if( !word(args, tbuf, &ip) ){
	gerror(stderr, WRONGARGS, cmd, 1, 0);
	return 1;
      }
      /* new image */
      if( !(finfo = FinfoNew(tbuf)) ){
	s = gerrorstring();
	if( !s ){
	  gerror(stderr, NONEW, cmd);
	}
	return 1;
      }
      /* make it current */
      FinfoSetCurrent(finfo);
      /* no output! */
      return 0;
    } else if( !strcmp(cmd, "info") ){
      if( tty ){
	if( !(finfo=FinfoGetCurrent()) ){
	  gerror(stderr, NOFINFO, cmd);
	  return 1;
	}
	/* make sure we have a wcs */
	if( !finfo->wcs ){
	  return 0;
	}
	fprintf(stdout, "fname:\t%s\n", finfo->fname);
	fprintf(stdout, "ofits:\t%s\n", finfo->fitsfile?finfo->ofitsfile:"N/A");
	fprintf(stdout, "fits:\t%s\n", finfo->fitsfile?finfo->fitsfile:"N/A");
	fprintf(stdout, "wcs:\t%s\n", finfo->wcs?"true":"false");
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
  case 'p':
    if( !strncmp(cmd, "pix2wcs", 7) ){
      /* get current image */
      if( !(finfo=FinfoGetCurrent()) ){
	gerror(stderr, NOFINFO, cmd);
	return 1;
      }
      /* make sure we have a wcs */
      if( !finfo->wcs ){
	return 0;
      }
      /* plus version sets wcssys and wcsunits */
      if( !strcmp(cmd, "pix2wcs+") ){
	/* set wcssys, if possible */
	if( finfo->wcs && word(args, tbuf, &ip) && 
	    (!strcasecmp(tbuf, "galactic") || !strcasecmp(tbuf, "ecliptic") ||
	     !strcasecmp(tbuf, "linear")   || (wcsceq(tbuf) > 0.0)) ){
	  /* try to set the wcs output system */
	  wcsoutinit(finfo->wcs, tbuf);
	}
	if( word(args, tbuf, &ip) ){
	  if( !strcasecmp(tbuf, "degrees") ){
	    finfo->wcsunits = WCS_DEGREES;
	  } else if( !strcasecmp(tbuf, "sexagesimal") ){
	    finfo->wcsunits = WCS_SEXAGESIMAL;
	  } else {
	    strcpy(tbuf, "degrees");
	    finfo->wcsunits = WCS_DEGREES;
	  }
	}
      }
      /* get input args */
      if( (got=sscanf(&args[ip], "%lf %lf", &dval1, &dval2)) == 2 ){
	/* convert image x,y to ra,dec */
	pix2wcs(finfo->wcs, dval1, dval2, &rval1, &rval2);
	/* return results */
	if( node ) fprintf(stdout, "pix2wcs\r");
	/* convert to proper units */
	switch(finfo->wcsunits){
	case WCS_DEGREES:
	  fprintf(stdout, "%12.6f %12.6f\n", rval1, rval2);
	  break;
	case WCS_SEXAGESIMAL:
	  ra2str(rbuf1, SZ_LINE-1, rval1, 3);
	  dec2str(rbuf2, SZ_LINE-1, rval2, 3);
	  fprintf(stdout, "%s %s\n", rbuf1, rbuf2);
	  break;
	default:
	  fprintf(stdout, "%12.6f %12.6f\n", rval1, rval2);
	  break;
	}
	fflush(stdout);
	return 0;
      } else {
	gerror(stderr, WRONGARGS, cmd, 2, MAX(got,0));
	return 1;
      }
    } else if( !strcmp(cmd, "param") ){
      /* get current image */
      if( !(finfo=FinfoGetCurrent()) ){
	gerror(stderr, NOFINFO, cmd);
	return 1;
      }
      /* make sure we have the FITS cards */
      if( !finfo->fitscards ){
	return 0;
      }
      /* output param values, separated by semi-colon */
      while( word(args, tbuf, &ip) ){
	cluc(tbuf);
	if( !got ){
	  if( node ) fprintf(stdout, "param\r");
	} else {
	  fprintf(stdout, "%s ", ";");
	}
	fprintf(stdout, "%s=", tbuf);
	*rbuf1 = '\0';
	hgets(finfo->fitscards, tbuf, SZ_LINE-1, rbuf1);
	nowhite(rbuf1, rbuf2);
	fprintf(stdout, "%s", *rbuf2?rbuf2:"\"\"");
	got++;
      }
      fprintf(stdout, "\n");
      fflush(stdout);
    }
    return 0;
    break;
  case 'r':
    if( !strncmp(cmd, "reg2wcs", 7) ){
      /* get current image */
      if( !(finfo=FinfoGetCurrent()) ){
	gerror(stderr, NOFINFO, cmd);
	return 1;
      }
      /* make sure we have a wcs */
      if( !finfo->wcs ){
	return 0;
      }
      /* plus version sets wcssys and wcsunits */
      if( !strcmp(cmd, "reg2wcs+") ){
	/* set wcssys, if possible */
	if( finfo->wcs && word(args, tbuf, &ip) && 
	    (!strcasecmp(tbuf, "galactic") || !strcasecmp(tbuf, "ecliptic") ||
	     !strcasecmp(tbuf, "linear")   || (wcsceq(tbuf) > 0.0)) ){
	  /* try to set the wcs output system */
	  wcsoutinit(finfo->wcs, tbuf);
	}
	if( word(args, tbuf, &ip) ){
	  if( !strcasecmp(tbuf, "degrees") ){
	    finfo->wcsunits = WCS_DEGREES;
	  } else if( !strcasecmp(tbuf, "sexagesimal") ){
	    finfo->wcsunits = WCS_SEXAGESIMAL;
	  } else {
	    strcpy(tbuf, "degrees");
	    finfo->wcsunits = WCS_DEGREES;
	  }
	}
      }
      /* start with original input string */
      targs = (char *)strdup(&args[ip]);
      for(targ=(char *)strtok(targs, ";"); targ != NULL; 
	  targ=(char *)strtok(NULL,";")){
	s = targ;
	/* look for region type */
	t = strchr(s, ' ');
	if( t ){
	  s1 = t + 1;
	  *t = '\0';
	} else {
	  s = NULL;
	  s1 = "";
	}
	/* these are the coords of the region */
	if( (dval1=strtod(s1, &s2)) && (dval2=strtod(s2, &s1)) ){
	  /* output heading the first time through */
	  if( node && !got ) fprintf(stdout, "reg2wcs\r");
	  got++;
	  /* convert image x,y to ra,dec */
	  pix2wcs(finfo->wcs, dval1, dval2, &rval1, &rval2);
	  if( s ) fprintf(stdout, "%s(", s);
	  /* convert to proper units */
	  switch(finfo->wcsunits){
	  case WCS_DEGREES:
	    fprintf(stdout, "%.6f, %.6f", rval1, rval2);
	    break;
	  case WCS_SEXAGESIMAL:
	    ra2str(rbuf1, SZ_LINE-1, rval1, 3);
	    dec2str(rbuf2, SZ_LINE-1, rval2, 3);
	    fprintf(stdout, "%s, %s", rbuf1, rbuf2);
	    break;
	  default:
	    fprintf(stdout, "%.6f, %.6f", rval1, rval2);
	    break;
	  }
	  /* convert more positions */
	  if( !strcmp(s, "polygon") ){
	    /* convert successive image values to RA, Dec */
	    while( (dval1=strtod(s1, &s2)) && (dval2=strtod(s2, &s1)) ){
	      /* convert image x,y to ra,dec */
	      pix2wcs(finfo->wcs, dval1, dval2, &rval1, &rval2);
	      /* convert to proper units */
	      switch(finfo->wcsunits){
	      case WCS_DEGREES:
		fprintf(stdout, ", %.6f, %.6f", rval1, rval2);
		break;
	      case WCS_SEXAGESIMAL:
		ra2str(rbuf1, SZ_LINE-1, rval1, 3);
		dec2str(rbuf2, SZ_LINE-1, rval2, 3);
		fprintf(stdout, ", %s, %s", rbuf1, rbuf2);
		break;
	      default:
		fprintf(stdout, ", %.6f, %.6f", rval1, rval2);
		break;
	      }
	    }
	  } else {
	    /* use successive x1,y1,x2,y2 to calculate separation (arcsecs) */
	    while( (dval1=strtod(s1, &s2)) && (dval2=strtod(s2, &s1)) &&
		   (dval3=strtod(s1, &s2)) && (dval4=strtod(s2, &s1)) ){
	      /* convert image x,y to ra,dec */
	      pix2wcs(finfo->wcs, dval1, dval2, &rval1, &rval2);
	      /* convert image x,y to ra,dec */
	      pix2wcs(finfo->wcs, dval3, dval4, &rval3, &rval4);
	      /* calculate and output separation between the two points */
	      sep = wcsdist(rval1, rval2, rval3, rval4)*3600.0;
	      if( sep <= 60 ){
		fprintf(stdout, ", %.2f\"", sep);
	      } else if( sep <= 3600 ){
		fprintf(stdout, ", %.6f'", sep/60.0);
	      } else {
		fprintf(stdout, ", %.6fd", sep/3600.0);
	      }
	    }
	  }
	  /* output angle, as needed */
	  if( !strcmp(s, "box") || !strcmp(s, "ellipse") ){
	    while( dval1 < 0 ) dval1 += (2.0 * PI);
	    fprintf(stdout, ", %.3f", RAD2DEG(dval1));
	  }
	  /* close region */
	  if( s ) fprintf(stdout, ")");
	  fprintf(stdout, ";");
	} else {
	  break;
	}
      }
      if( targs ) free(targs);
      fprintf(stdout, "\n");
      fflush(stdout);
      return 0;
    }
    break;
  case 's':
    if( !strcmp(cmd, "setDataPath") ){
      if( word(args, tbuf, &ip) ){
	setenv("JS9_DATAPATH", tbuf, 1);
	if( node ) fprintf(stdout, "setDataPath\r");
	fprintf(stdout, "%s\n", getenv("JS9_DATAPATH"));
	fflush(stdout);
      } else {
	gerror(stderr, WRONGARGS, cmd, 1, 0);
	return 1;
      }
      return 0;
    }
    break;
  case 'u':
    if( !strcmp(cmd, "unimage") ){
      if( !word(args, tbuf, &ip) ){
	gerror(stderr, WRONGARGS, cmd, 1, 0);
	return 1;
      }
      /* close this image */
      FinfoFree(tbuf);
      return 0;
    }
    break;
  case 'w':
    if( !strcmp(cmd, "wcs2pix") ){
      /* get current image */
      if( !(finfo=FinfoGetCurrent()) ){
	gerror(stderr, NOFINFO, cmd);
	return 1;
      }
      /* make sure we have a wcs */
      if( !finfo->wcs ){
	return 0;
      }
      /* get input args */
      if( (got=sscanf(args, "%lf %lf", &dval1, &dval2)) == 2 ){
	/* get image pixels */
	wcs2pix(finfo->wcs, dval1, dval2, &rval1, &rval2, &offscl);
	/* return results */
	if( node ) fprintf(stdout, "wcs2pix\r");
	fprintf(stdout, "%12.2f %12.2f\n", rval1, rval2);
	fflush(stdout);
	return 0;
      } else {
	gerror(stderr, WRONGARGS, cmd, 2, MAX(got,0));
	return 1;
      }
    } else if( !strcmp(cmd, "wcssys") ){
      /* get current image */
      if( !(finfo=FinfoGetCurrent()) ){
	gerror(stderr, NOFINFO, cmd);
	return 1;
      }
      /* set wcssys, if possible */
      if( finfo->wcs && word(args, tbuf, &ip) && 
	  (!strcasecmp(tbuf, "galactic") || !strcasecmp(tbuf, "ecliptic") ||
	   !strcasecmp(tbuf, "linear")   || (wcsceq(tbuf) > 0.0)) ){
	/* try to set the wcs output system */
	wcsoutinit(finfo->wcs, tbuf);
      }
      /* always return current */
      strncpy(tbuf, getwcsout(finfo->wcs), SZ_LINE-1);
      if( !strcasecmp(tbuf, "galactic") ){
	strcpy(tbuf, "galactic");
      } else if( !strcasecmp(tbuf, "ecliptic") ){
	strcpy(tbuf, "ecliptic");
      } else {
	cluc(tbuf);
      }
      /* return results */
      if( node ) fprintf(stdout, "wcssys\r");
      fprintf(stdout, "%s\n", tbuf);
      fflush(stdout);
      return 0;
    } else if( !strcmp(cmd, "wcsunits") ){
      /* get current image */
      if( !(finfo=FinfoGetCurrent()) ){
	gerror(stderr, NOFINFO, cmd);
	return 1;
      }
      if( word(args, tbuf, &ip) ){
	if( !strcasecmp(tbuf, "degrees") ){
	  finfo->wcsunits = WCS_DEGREES;
	} else if( !strcasecmp(tbuf, "sexagesimal") ){
	  finfo->wcsunits = WCS_SEXAGESIMAL;
	} else {
	  strcpy(tbuf, "degrees");
	  finfo->wcsunits = WCS_DEGREES;
	}
	/* return results */
	if( node ) fprintf(stdout, "wcsunits\r");
	fprintf(stdout, "%s\n", tbuf);
	fflush(stdout);
	return 0;
      } else {
	gerror(stderr, WRONGARGS, cmd, 1, 0);
	return 1;
      }
    }
    break;
  case '#':
  case '\0':
    return 0;
  default:
    break;
  }

  /* if we reached here, we did not recognize the command */
  gerror(stderr, "unknown command '%s'\n", cmd);
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
  char *image=NULL;
  Finfo cur, tcur;

  /* don't automatically output errors */
  setgerror(0);
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
      if( ProcessCmd("image", image, 0, 0) != 0 ){
	fprintf(stderr, "%s", gerrorstring());
	return 1;
      } else {
	return 0;
      }
      break;
    case 1:
      /* set image (no info returned) */
      if( ProcessCmd("image_", image, 0, 0) != 0 ){
	fprintf(stderr, "%s", gerrorstring());
	return 1;
      }
      /* process command without args */
      if( ProcessCmd(argv[optind+0], NULL, 0, 0) == 0 ){
	return 0;
      } else {
	fprintf(stderr, "%s", gerrorstring());
	return 1;
      }
      break;
    case 2:
      /* set image (no info returned) */
      if( ProcessCmd("image_", image, 0, 0) != 0 ){
	fprintf(stderr, "%s", gerrorstring());
	return 1;
      }
      /* process command with args */
      if( ProcessCmd(argv[optind+0], argv[optind+1], 0, 0) == 0 ){
	return 0;
      } else {
	fprintf(stderr, "%s", gerrorstring());
	return 1;
      }
      break;
    default:
      break;
    }
  }
  /* if stdout is connected to a terminal, its not node */
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
    if( ProcessCmd(tbuf, &lbuf[ip], node, tty) != 0 ){
      fprintf(stderr, "%s", gerrorstring());
    }
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
