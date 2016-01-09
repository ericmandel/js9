/*
 * wcswrapper.c -- enscripten wrapper functions
 *
 * Eric Mandel 10/11/2013 (during the Great Government Shutdown)
 *
 * The main reasons for writing this module are:
 * 1. I couldn't figure out how to call subroutines and fill in indirect args
 * 2. I didn't seem to be able to return the wcs struct to javascript
 * 3. I didn't see much help in the scant documentation
 * 4. I got tired of banging my head against the wall regarding #1, #2, #3
 * 
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <ctype.h>
#include "wcs.h"
#include "strtod.h"
#include "cdl.h"

#define PI		3.141592653589793238462643
#define DEG2RAD(a)	((PI/180.0)*a)
#define RAD2DEG(a)	((180.0/PI)*a)

#define WCS_SEXAGESIMAL 0
#define WCS_DEGREES 1

#define NDEC 3

#define SZ_LINE 4096

/* static return buffer */
char rstr[SZ_LINE];

/* hold information about wcs for individual images */
typedef struct infostruct {
  struct WorldCoor *wcs;
  int wcsunits;
  char str[SZ_LINE];
} *Info, InfoRec;

/* management of info records */
static Info infos=NULL;
static int ninfo = 1;
static int maxinfo = 0;
static int maxinc = 10;

/*
 *
 * private routines
 *
 */

/* upper to lower case */
static void culc(char *s)
{
  while(*s){
    if( isupper((int)*s) )
      *s = tolower(*s);
    s++;
  }
}

/* lower to upper case */
static void cluc(char *s)
{
  while(*s){
    if( islower((int)*s) )
      *s = toupper(*s);
    s++;
  }
}

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

/* add a new Info record with a valid wcs struct */
static int newinfo(struct WorldCoor *wcs){
  int n;
  if( maxinfo == 0 ){
    maxinfo = maxinc;
    infos = malloc(maxinfo * sizeof(InfoRec));
    if( !infos ){
      return -4;
    }
  }
  while( ninfo >= maxinfo ){
    maxinfo += maxinc;
    infos = realloc(infos, maxinfo * sizeof(InfoRec));
    if( !infos ){
      return -3;
    }
  }
  if( wcs ){
    n = ninfo;
    infos[ninfo].wcs = wcs;
    infos[ninfo].wcsunits = WCS_SEXAGESIMAL;
    *infos[ninfo].str = '\0';
    ninfo++;
  } else {
    n = -1;
  }
  return n;
}

/* return Info record for this id */
static Info getinfo(int n){
  if( (n < 1) || (n >= maxinfo) ){
    return NULL;
  } else {
    return &infos[n];
  }
}

/*
 *
 * public routines: these are exported to javascript
 *
 */

/* init the wcs struct and create a new info record */
int initwcs(char *s, int n){
  struct WorldCoor *wcs;
  if( n > 0 ){
    wcs = wcsninit(s, n);
  } else {
    wcs = wcsinit(s);
  }
  if( wcs ){
    wcsoutinit(wcs, getradecsys(wcs));
  }
  return newinfo(wcs);
}

/* return important info about the wcs (used by region parsing) */
char *wcsinfo(int n){
  Info info = getinfo(n);
  char *str = NULL;
  int imflip=0;
  double cdelt1=0.0, cdelt2=0.0, crot=0.0;
  if( info->wcs ){
    if( !info->wcs->coorflip ){
      cdelt1 = info->wcs->cdelt[0];
      cdelt2 = info->wcs->cdelt[1];
    }
    else{
      cdelt1 = info->wcs->cdelt[1];
      cdelt2 = info->wcs->cdelt[0];
    }
    if ( info->wcs->imflip ) {
	crot = -info->wcs->rot;
    } else {
	crot =  info->wcs->rot;
    }
    imflip = info->wcs->imflip;
  }
  // convert to 1-indexed image coords
  str = info->str;
  snprintf(str, SZ_LINE-1,
  "{\"cdelt1\": %.14g, \"cdelt2\": %.14g, \"crot\": %.14g, \"imflip\": %d}",
   cdelt1, cdelt2, crot, imflip);
  return str;
}

/* convert pixels to wcs and return string */
char *pix2wcsstr(int n, double xpix, double ypix){
  Info info = getinfo(n);
  char *str = NULL;
  if( info->wcs ){
    str = info->str;
    *str = '\0';
    /* convert image x,y to ra,dec (convert 1-index to 0-index) */
    pix2wcst(info->wcs, xpix-1, ypix-1, str, SZ_LINE);
  }
  return str;
}

/* convert pixels to wcs and return string */
char *wcs2pixstr(int n, double ra, double dec){
  Info info = getinfo(n);
  char str[SZ_LINE];
  double xpix, ypix;
  int offscale;
  if( info->wcs ){
    wcs2pix(info->wcs, ra, dec, &xpix, &ypix, &offscale);
    // convert to 1-indexed image coords
    snprintf(str, SZ_LINE-1, "%.3f %.3f", xpix+1, ypix+1);
    nowhite(str, info->str);
    return info->str;
  } else {
    return NULL;
  }
}

/* set or get wcssys (FK4, FK5, etc) */
char *wcssys(int n, char *s){
  Info info = getinfo(n);
  char *str = NULL;  
  if( info->wcs ){
    str = info->str;
    *str = '\0';
    if( s && *s && 
	(!strcasecmp(s, "galactic") || !strcasecmp(s, "ecliptic") ||
	 !strcasecmp(s, "linear")   || (wcsceq(s) > 0.0)) ){
      /* try to set the wcs output system */
      wcsoutinit(info->wcs, s);
    }
    /* always return current */
    strncpy(str, getwcsout(info->wcs), SZ_LINE);
    if( !strcasecmp(str, "galactic") ){
      strcpy(str, "galactic");
    } else if( !strcasecmp(str, "ecliptic") ){
      strcpy(str, "ecliptic");
    } else {
      cluc(str);
    }
  }
  return str;
}

/* set or get wcs units (degrees or sexigesimal) */
char *wcsunits(int n, char *s){
  Info info = getinfo(n);
  char *str = NULL;
  if( info->wcs ){
    str = info->str;
    *str = '\0';
    if( s && *s ){
      if( !strcasecmp(s, "degrees") ){
	setwcsdeg(info->wcs, WCS_DEGREES);
	info->wcsunits = WCS_DEGREES;
      } else {
	setwcsdeg(info->wcs, WCS_SEXAGESIMAL);
	info->wcsunits = WCS_SEXAGESIMAL;
      }
    }
    switch(info->wcsunits){
    case WCS_DEGREES:
      strncpy(str, "degrees", SZ_LINE-1);
    break;
    case WCS_SEXAGESIMAL:
      strncpy(str, "sexagesimal", SZ_LINE-1);
    break;
    }
    culc(str);
  }
  return str;
}

/* convert image values to wcs values in a region (see fitshelper.c) */
char *reg2wcsstr(int n, char *regstr){
  Info info = getinfo(n);
  char tbuf[SZ_LINE];
  char rbuf1[SZ_LINE];
  char rbuf2[SZ_LINE];
  char *str = NULL;
  char *s=NULL, *t=NULL;;
  char *s1=NULL, *s2=NULL;
  char *targs=NULL, *targ=NULL;
  char *mywcssys=NULL;
  int alwaysdeg = 0;
  double dval1, dval2, dval3, dval4;
  double rval1, rval2, rval3, rval4;
  double sep;

  if( info->wcs ){
    mywcssys = wcssys(n, NULL);
    if( !strcmp(mywcssys, "galactic") ||
	!strcmp(mywcssys, "ecliptic") ||
	!strcmp(mywcssys, "linear") ){
      alwaysdeg = 1;
    }
    str = info->str;
    *str = '\0';
    /* start with original input string */
    targs = (char *)strdup(regstr);
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
	/* convert image x,y to ra,dec (convert 1-index to 0-index) */
	pix2wcs(info->wcs, dval1-1, dval2-1, &rval1, &rval2);
	if( s ){
	  snprintf(tbuf, SZ_LINE, "%s(", s);
	  strncat(str, tbuf, SZ_LINE-1);
	}
	/* convert to proper units */
	switch(info->wcsunits){
	case WCS_DEGREES:
	  snprintf(tbuf, SZ_LINE, "%.6f, %.6f", rval1, rval2);
	  strncat(str, tbuf, SZ_LINE-1);
	  break;
	case WCS_SEXAGESIMAL:
	  if( alwaysdeg ){
	    dec2str(rbuf1, SZ_LINE-1, rval1, NDEC);
	  } else {
	    ra2str(rbuf1, SZ_LINE-1, rval1, NDEC);
	  }
	  dec2str(rbuf2, SZ_LINE-1, rval2, NDEC);
	  snprintf(tbuf, SZ_LINE, "%s, %s", rbuf1, rbuf2);
	  strncat(str, tbuf, SZ_LINE-1);
	  break;
	default:
	  snprintf(tbuf, SZ_LINE, "%.6f, %.6f", rval1, rval2);
	  strncat(str, tbuf, SZ_LINE-1);
	  break;
	}
	/* for text, just copy the rest */
	if( !strcmp(s, "text") ){
	  snprintf(tbuf, SZ_LINE, ",%s", s1);
	  strncat(str, tbuf, SZ_LINE-1);
	} else if( !strcmp(s, "polygon") ){
	  /* for polygons, convert successive image values to RA, Dec */
	  while( (dval1=strtod(s1, &s2)) && (dval2=strtod(s2, &s1)) ){
	    /* convert image x,y to ra,dec (convert 1-index to 0-index) */
	    pix2wcs(info->wcs, dval1-1, dval2-1, &rval1, &rval2);
	    /* convert to proper units */
	    switch(info->wcsunits){
	    case WCS_DEGREES:
	      snprintf(tbuf, SZ_LINE, ", %.6f, %.6f", rval1, rval2);
	      strncat(str, tbuf, SZ_LINE-1);
	      break;
	    case WCS_SEXAGESIMAL:
	      if( alwaysdeg ){
		dec2str(rbuf1, SZ_LINE-1, rval1, NDEC);
	      } else {
		ra2str(rbuf1, SZ_LINE-1, rval1, NDEC);
	      }
	      dec2str(rbuf2, SZ_LINE-1, rval2, NDEC);
	      snprintf(tbuf, SZ_LINE, ", %s, %s", rbuf1, rbuf2);
	      strncat(str, tbuf, SZ_LINE-1);
	      break;
	    default:
	      snprintf(tbuf, SZ_LINE, ", %.6f, %.6f", rval1, rval2);
	      strncat(str, tbuf, SZ_LINE-1);
	      break;
	    }
	  }
	} else {
	  /* use successive x1,y1,x2,y2 to calculate separation (arcsecs) */
	  while( (dval1=strtod(s1, &s2)) && (dval2=strtod(s2, &s1)) &&
		 (dval3=strtod(s1, &s2)) && (dval4=strtod(s2, &s1)) ){
	    /* convert image x,y to ra,dec (convert 1-index to 0-index) */
	    pix2wcs(info->wcs, dval1-1, dval2-1, &rval1, &rval2);
	    pix2wcs(info->wcs, dval3-1, dval4-1, &rval3, &rval4);
	    /* calculate and output separation between the two points */
	    sep = wcsdist(rval1, rval2, rval3, rval4)*3600.0;
	    if( sep <= 60 ){
	      snprintf(tbuf, SZ_LINE, ", %.6f\"", sep);
	      strncat(str, tbuf, SZ_LINE-1);
	    } else if( sep <= 3600 ){
	      snprintf(tbuf, SZ_LINE, ", %.6f'", sep/60.0);
	      strncat(str, tbuf, SZ_LINE-1);
	    } else {
	      snprintf(tbuf, SZ_LINE, ", %.6fd", sep/3600.0);
	      strncat(str, tbuf, SZ_LINE-1);
	    }
	  }
	}
	/* output angle, as needed */
	if( !strcmp(s, "box") || !strcmp(s, "ellipse") ){
	  while( dval1 < 0 ) dval1 += (2.0 * PI);
	  snprintf(tbuf, SZ_LINE, ", %.6f", RAD2DEG(dval1));
	  strncat(str, tbuf, SZ_LINE-1);
	}
	/* close region */
	if( s ){
	  snprintf(tbuf, SZ_LINE, ")");
	  strncat(str, tbuf, SZ_LINE-1);
	}
	snprintf(tbuf, SZ_LINE, ";");
	strncat(str, tbuf, SZ_LINE-1);
      }
    }
  }
  if( targs ) free(targs);
  return str;
}

/* convert string to float (includes sexagesimal strings) */
double saostrtod(char *s){
  return SAOstrtod(s, NULL);
}

/* return last delimiter from saostrtod call */
int saodtype(){
  return SAOdtype;
}

/* required by cdlzscale.c */
int cdl_debug=0;

/* calculate zscale parameters */
char *zscale(unsigned char *im, int nx, int ny, int bitpix, 
	     float contrast, int numsamples, int perline){
  float z1, z2;
  char tbuf[SZ_LINE];
  cdl_zscale(im, nx, ny, bitpix, &z1, &z2, contrast, numsamples, perline);
  /* encode in a string for easy return */
  snprintf(tbuf, SZ_LINE-1, "%f %f", z1, z2);
  nowhite(tbuf, rstr);;
  return rstr;
}
