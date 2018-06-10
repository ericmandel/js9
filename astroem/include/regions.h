/*
 *	Copyright (c) 2015 Smithsonian Astrophysical Observatory
 */

/*
 *
 * regions.h - include file for "compile on the fly" region filtering
 *
 */

#ifndef	__regions_h
#define	__regions_h

/* the following record structure(s) must match those in imregions.h */
/* output mask struct */
typedef struct regmasks {
  int region;
  int y;
  int xstart, xstop;
} *RegionsMask, RegionsMaskRec;
/* end of common record structures */

typedef struct regrec {
  /* general information */
  char *mode;
  int method;
  int paint;
  int debug;
  /* the input regions string */
  char *regstr;
  int size;
  /* fits info */
  void *fhd;
  char *cards;
  /* compiled program info */
  char *code;
  char *prog;
  FILE *fp;
  /* method info */
  char *cc;
  char *cflags;
  char *objs;
  char *extra;
  char *shflags;
  /* process info */
  char *pname;
  int ptype;
  /* which type of pipe? */
  int pipeos;
  /* used by unix pipe */
  int pid;
  int ichan;
  int ochan;
  /* used by Windows pipe */
  void *process;
  void *ihandle;
  void *ohandle;
  /* used for dynamic linking */
  void *dl;
  /* prefix for each region (e.g. "Module." for emscripten) */
  char *reg_prefix;
  /* loadable drivers for each technique */
  /* NB: can't use typdef because we refer to this struct */
  int (*reg_start)(struct regrec *reg);
  int (*reg_open)(struct regrec *reg);
  int (*reg_prepend)(struct regrec *reg);
  int (*reg_write)(struct regrec *reg);
  int (*reg_append)(struct regrec *reg);
  int (*reg_close)(struct regrec *reg);
  int (*reg_compile)(struct regrec *reg);
  int (*reg_end)(struct regrec *reg);
  char *(*reg_name)(struct regrec *reg, char *name);
  char *(*reg_routine1)(struct regrec *reg, char *name);
  char *(*reg_routine2)(struct regrec *reg, char *name);
  char *(*reg_region1)(struct regrec *reg, char *name);
  char *(*reg_region2)(struct regrec *reg, char *name);
  /* returned from lexer */
  char *filter;
  int nroutine;
  int nreg;
  int nshape;
  char *radang;
} *Regions, RegionsRec;

extern Regions _null_region;
#define NOREGIONS _null_region

/* regions.c */
Regions OpenRegions(char *cards, char *regions, char *mode);
int FilterRegions(Regions reg, int x0, int x1, int y0, int y1, int block,
		  RegionsMask *mask, int *nreg);
int CloseRegions(Regions reg);

/* semi-public (shared by specific compiler implementations) */
char *_RegionsInitString(Regions reg);

#endif /* __regions.h */
