#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <math.h>
#include <ctype.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>

#define SZ_LINE 8192
#define ROOTDIR "./"

/* static return buffer */
static char rstr[SZ_LINE];

static int nreproj = 0;

int mProjectPP(int argc, char **argv);

static int filecontents(char *path, char *obuf, int osize){
  int got;
  FILE *fd;
  /* open the file */
  if( !(fd=fopen(path, "r")) ){
    return -1;
  }
  /* get contents */
  got = fread(obuf, sizeof(char), osize-1, fd);
  fclose(fd);
  obuf[got] = '\0';
  return got;
}

int main(int argc, char **argv){
  char iname[SZ_LINE], oname[SZ_LINE], wname[SZ_LINE];
  int got, i;
  char *sbuf;
  char *args[7];
  char tbuf0[SZ_LINE];
  char tbuf1[SZ_LINE];
  char tbuf2[SZ_LINE];
  char tbuf3[SZ_LINE];
  char lbuf[SZ_LINE];
  while( 1 ){
    fprintf(stdout, "mproject> ");
    fflush(stdout);
    fgets(lbuf, SZ_LINE-1, stdin);
    got = sscanf(lbuf, "%s %s %s\n", iname, oname, wname);
    if( !strcmp(iname, "q")  ){
      return 0;
    }
    i = 0;
    args[i++] = "mProjectPP";
    args[i++] = "-s";
    snprintf(tbuf0, SZ_LINE-1, "%sstatus_%d.txt", ROOTDIR, nreproj++);
    args[i++] = tbuf0;
    snprintf(tbuf1, SZ_LINE-1, "%s%s", ROOTDIR, iname);
    args[i++] = tbuf1;
    snprintf(tbuf2, SZ_LINE-1, "%s%s", ROOTDIR, oname);
    args[i++] = tbuf2;
    snprintf(tbuf3, SZ_LINE-1, "%s%s", ROOTDIR, wname);
    args[i++] = tbuf3;
    fprintf(stdout, "mProjectPP: %s %s %s\n", tbuf1, tbuf2, tbuf3);
    /* make the reprojection call */
    mProjectPP(i, args);
    /* look for a return value */
    if( filecontents(tbuf0, rstr, SZ_LINE) >= 0 ){
      unlink(tbuf0);
      fprintf(stdout, "result: %s\n", rstr);
    } else {
      fprintf(stdout, "Error: reproject failed; no status file created\n");
    }
  }
  return 0;
}
