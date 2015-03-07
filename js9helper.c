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
#if HAVE_CFITSIO
  int status = 0;
#endif
  /* sanity check */
  if( !finfo ) return 1;
  /* remove from list of finfos */
  FinfoListDel(&finfohead, finfo);
  /* free up strings */
  if( finfo->fname ) xfree(finfo->fname);
  if( finfo->ofitsfile ) xfree(finfo->ofitsfile);
  if( finfo->fitsfile ) xfree(finfo->fitsfile);
  /* free up png structs */
  if( finfo->png_ptr || finfo->info_ptr ){
    png_destroy_read_struct(&finfo->png_ptr, &finfo->info_ptr, NULL);
  }
  /* close file */
  if( finfo->fp ){
    fclose(finfo->fp);
  }
#if HAVE_CFITSIO
  if( finfo->fptr ){
    fits_close_file(finfo->fptr, &status);
  }
#elif HAVE_FUNTOOLS
  if( finfo->fun ){
    FunClose(finfo->fun);
  }
#endif
  /* free up enclosing record */
  xfree(finfo);
  /* return the news */
  return 0;
}

/* create a new finfo record, open FITS file */
static Finfo FinfoNew(char *fname)
{
  int i, len;
#if HAVE_CFITSIO
  int status = 0;
#endif
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
	    finfo->ofitsfile = xstrdup(finfo->text_ptr[i].text);
	    finfo->fitsfile = xstrdup(finfo->ofitsfile);
	    /* remove the extension */
	    s = strchr(finfo->fitsfile, '[');
	    if( s ){
	      *s = '\0';
	    }
	  }
	}
      }
    } else {
      fprintf(stderr, "ERROR: can't locate PNG file for '%s' (%s)\n",
	      fname, datapath);
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
    if( f ) xfree(f);
    if( s && *s ){
      e = FileExtension(fname);
      /* if found, open the file */
#if HAVE_CFITSIO
      fits_open_file(&(finfo->fptr), s, 0, &status);
      if( status ){
	fprintf(stderr, "ERROR: can't open FITS file '%s'\n", fname);
	goto error;
      }
#elif HAVE_FUNTOOLS
      if( !(finfo->fun = FunOpen(s, "r", NULL)) ){
	fprintf(stderr, "ERROR: can't open FITS file '%s'\n", fname);
	goto error;
      }
#endif
      len = strlen(s) + 1;
      if( e ){
	len += strlen(e);
      }
      finfo->ofitsfile = malloc(len);
      strcpy(finfo->ofitsfile, s);
      if( e ){
	strcat(finfo->ofitsfile, e);
      }
      finfo->fitsfile = xstrdup(finfo->ofitsfile);
      if( e ) xfree(e);
      xfree(s);
    } else {
      fprintf(stderr, "ERROR: can't locate FITS file for '%s' (%s)\n", 
	      fname, datapath);
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
static int ProcessCmd(char *cmd, char *args, int node, int tty)
{
  int ip=0;
  char tbuf[SZ_LINE];
  Finfo finfo, tfinfo;

  switch(*cmd){
  case 'f':
    if( !strcmp(cmd, "fitsFile") ){
      if( word(args, tbuf, &ip) ){
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
      if( !word(args, tbuf, &ip) ){
	fprintf(stderr, WRONGARGS, cmd, 1, 0);
	return 1;
      }
      /* new image */
      if( !(finfo = FinfoNew(tbuf)) ){
	fprintf(stderr, NONEW, cmd);
	return 1;
      }
      /* make it current */
      FinfoSetCurrent(finfo);
      if( node ) fprintf(stdout, "image\r");
      /* return the FITS file name, if possible */
      fprintf(stdout, "%s %s %s\n", 
	      finfo->fname,
	      finfo->fitsfile? finfo->fitsfile : "?",
	      finfo->ofitsfile? finfo->ofitsfile : "?");
      fflush(stdout);
      return 0;
    } else if( !strcmp(cmd, "image_") ){
      if( !word(args, tbuf, &ip) ){
	fprintf(stderr, WRONGARGS, cmd, 1, 0);
	return 1;
      }
      /* new image */
      if( !(finfo = FinfoNew(tbuf)) ){
	fprintf(stderr, NONEW, cmd);
	return 1;
      }
      /* make it current */
      FinfoSetCurrent(finfo);
      /* no output! */
      return 0;
    } else if( !strcmp(cmd, "info") ){
      if( tty ){
	if( !(finfo=FinfoGetCurrent()) ){
	  fprintf(stderr, NOFINFO, cmd);
	  return 1;
	}
	/* make sure we have a wcs */
	fprintf(stdout, "fname:\t%s\n", finfo->fname);
	fprintf(stdout, "ofits:\t%s\n", finfo->fitsfile?finfo->ofitsfile:"N/A");
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
      if( word(args, tbuf, &ip) ){
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
      if( !word(args, tbuf, &ip) ){
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
      if( ProcessCmd("image", image, 0, 0) != 0 ){
	return 1;
      } else {
	return 0;
      }
      break;
    case 1:
      /* set image (no info returned) */
      if( ProcessCmd("image_", image, 0, 0) != 0 ){
	return 1;
      }
      /* process command without args */
      if( ProcessCmd(argv[optind+0], NULL, 0, 0) == 0 ){
	return 0;
      } else {
	return 1;
      }
      break;
    case 2:
      /* set image (no info returned) */
      if( ProcessCmd("image_", image, 0, 0) != 0 ){
	return 1;
      }
      /* process command with args */
      if( ProcessCmd(argv[optind+0], argv[optind+1], 0, 0) == 0 ){
	return 0;
      } else {
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
    ProcessCmd(tbuf, &lbuf[ip], node, tty);
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
