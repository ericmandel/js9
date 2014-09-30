#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <sys/types.h>
#include <sys/stat.h>
#include "wcs.h"
#include "strtod.h"
#include "casa.head"

extern char *optarg;
extern int optind;

/* zscale test */
#define PIPE "funimage ../fits/casa.fits'[511@4027,511@3944]' stdout bitpix=16 | dd bs=2880 skip=6 conv=swab 2>/dev/null"
#define ARRAY_DIM 511
#define ARRAY_BITPIX 16
/* from scale.tcl */
#define ZSCALE_CONTRAST 0.25
#define ZSCALE_OPTSIZE 600
#define ZSCALE_SAMPLES_PER_LINE 120

char *zscale(unsigned char *im, int nx, int ny, int bitpix, 
	     float contrast, int num_samples, int samples_per_line);

/* wcs test */
int initwcs(char *s, int n);
char *pix2wcsstr(int n, double d1, double d2);
char *wcs2pixstr(int n, double d1, double d2);
char *reg2wcsstr(int n, char *s);
char *wcssys(int n, char *s);

#define MAXWCS 5
char *wcssysa[MAXWCS] = {"FK4", "FK5", "ICRS", "galactic", "ecliptic"};

void usage(){
  fprintf(stderr, "First arg must be: zscale, wcs\n");
  fprintf(stderr, "    test zscale [-c contour -n num_samples -l samples_per_line]\n");
  fprintf(stderr, "or\n");
  fprintf(stderr, "    test wcs\n");
  fprintf(stderr, "    test wcs x1 y1 x2 y2 ...\n");
  exit(1);
}

char *readpipe(char *pipe)
{
  int got, cur, total=0;
  char *buf=NULL;
  FILE *fd;
  fd = popen(pipe, "r");
  if( fd ){
    cur = 5760;
    buf = malloc(cur);
    while( (got = fread(&buf[total], sizeof(char), 2880, fd)) > 0 ){
      total += 2880;
      if( total >= cur ){
	cur += 2880;
	buf = realloc(buf, cur);
      }
    }
    pclose(fd);
  }
  return(buf);
}

int main(int argc, char **argv){
  int i, j, c, cmd=0;
  int wcs;
  char *p, *s, *t, *zstr;
  unsigned char *buf;
  float contrast=ZSCALE_CONTRAST;
  int num_samples=ZSCALE_OPTSIZE;
  int samples_per_line=ZSCALE_SAMPLES_PER_LINE;
  double dval1, dval2;
  if( argc < 2 ){
    usage();
  }
  if( !strcmp(argv[1], "zscale") ){
    cmd = 1;
  } else if( !strcmp(argv[1], "wcs") ){
    cmd = 2;
  }
  switch(cmd){
  case 1:
    /* process switch arguments */
    optind = 2;
    while ((c = getopt(argc, argv, "c:n:l:")) != -1){
      switch(c){
      case 'c':
	contrast = atof(optarg);
	break;
      case 'n':
	num_samples = atoi(optarg);
	break;
      case 'l':
	samples_per_line = atoi(optarg);
	break;
      }
    }
    /* get array data in big endian format */
    buf = (unsigned char *)readpipe(PIPE);
    if( buf ){
      fprintf(stdout, "popen: %s\n", PIPE);
      fprintf(stdout, "contrast=%.2f num_samples=%d samples_per_line=%d\n",
	      contrast, num_samples, samples_per_line);
      zstr = zscale(buf, ARRAY_DIM, ARRAY_DIM, ARRAY_BITPIX,
		    contrast, num_samples, samples_per_line);
      fprintf(stderr, "zscale: %s\n", zstr);
      free(buf);
    }
    break;
  case 2:
    wcs = initwcs(header, strlen(header));
    if( argc == 2 ){
      dval1 = 512.0;
      dval2 = 512.0;
      s = pix2wcsstr(wcs, dval1, dval2);
      fprintf(stdout, "%.3f %.3f -> %s\n", dval1, dval2, s);
      /* now reverse it */
      dval1 = SAOstrtod(s, &t) / 24.0 * 360.0;
      dval2 = SAOstrtod(t, NULL);
      s = wcs2pixstr(wcs, dval1, dval2);
      fprintf(stdout, "wcs2pix: %.3f %.3f -> %s\n", dval1, dval2, s);
      return 0;
    }
    for(i=2, j=0; i<argc; i++, j++ ){
      dval1 = strtod(argv[i], &p);
      if( !p || !*p ){
	dval2 = strtod(argv[i+1], &p);
	wcssys(wcs, wcssysa[j%MAXWCS]);
	s = pix2wcsstr(wcs, dval1, dval2);
	fprintf(stdout, "pix2wcs: %.3f %.3f -> %s\n", dval1, dval2, s);
	/* now reverse it */
	dval1 = SAOstrtod(s, &t) / 24.0 * 360.0;
	dval2 = SAOstrtod(t, NULL);
	s = wcs2pixstr(wcs, dval1, dval2);
	fprintf(stdout, "wcs2pix: %.3f %.3f -> %s\n", dval1, dval2, s);
	i++;
      } else {
	s = reg2wcsstr(wcs, argv[i]);
	fprintf(stdout, "%s -> %s\n", argv[i], s);
      }
    }
    break;
  }
  return 0;
}
