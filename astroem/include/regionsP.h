/*
 *	Copyright (c) 2015 Smithsonian Astrophysical Observatory
 */

/*
 *
 * regionsP.h - private include file for "compile on the fly" region filtering
 *
 */

#ifndef	__regionsP_h
#define	__regionsP_h

#if HAVE_CONFIG_H
#include "conf.h"
#endif

#if __EMSCRIPTEN__
#include <emscripten.h>
#endif

/* give same results as funtools (phys coords are 0.5 off from cfitsio) */
#define FUNTOOLS_COMPATIBILITY 1

/* avoid use of system -- its not secure */
/* but we cannot use launch for the MinGW platform because the stdfiles
   support is missing in the launch_spawnvp() implementation of launch */
#ifndef USE_LAUNCH
#define USE_LAUNCH 1
#endif
#if HAVE_MINGW32 || defined(__EMSCRIPTEN__)
#undef USE_LAUNCH
#endif

#include "xutil.h"
#include "file.h"
#include "find.h"
#include "macro.h"
#include "word.h"
#include "strtod.h"
#include "xalloc.h"
#include "xerror.h"
#include "mkrtemp.h"
#if !defined(__EMSCRIPTEN__)
#include "winprocess.h"
#include "zprocess.h"
#include "dl.h"
#ifdef USE_LAUNCH
#include "xlaunch.h"
#endif
#endif
#include "wcs.h"

#if HAVE_CYGWIN||HAVE_MINGW32
#include <windows.h>
#endif

/* include file for the public */
#include "regions.h"

#ifndef OBJPATH
#define OBJPATH "."
#endif

#ifndef REGIONS_CC
#define REGIONS_CC NULL
#endif
     
#ifndef REGIONS_CFLAGS
#define REGIONS_CFLAGS NULL
#endif
     
/* define default wcs for regions */
#define DEFAULT_WCS "physical"

/* define methods of program generation */
#define METHOD_C	1
#define METHOD_EM	2

/* define types of regionsing process -- separate process, self-contained
   separate process, or dynamic load (if defined) */
#define PTYPE_PROCESS	1
#define PTYPE_CONTAINED	2
#define PTYPE_DYNAMIC	3

/* define how we connect the processes -- unix or windows pipes */
#define PIPE_UNIX	0
#define PIPE_WIN32	1

/* defaults which can be overridden by environment variables */
#if __EMSCRIPTEN__
#define DEFAULT_REGIONS_METHOD METHOD_EM
#else
#define DEFAULT_REGIONS_METHOD METHOD_C
#endif
#ifdef USE_DL
#define DEFAULT_REGIONS_PTYPE  PTYPE_DYNAMIC
#else
#define DEFAULT_REGIONS_PTYPE  PTYPE_PROCESS
#endif
#define DEFAULT_PAINT_MODE    "false"
#define DEFAULT_REGIONS_TMPDIR "/tmp"

/* default cordinate system for regions */
#define DEFAULT_COORDSYS "physical"

/* if we have gcc, we can use dynamic loading instead of a separate process */
#define GCC_SHARED_FLAGS "-g -fPIC -shared"

/* places to look for the compiler other than user's path */
#define CC_PATH "/bin:/usr/bin:/usr/local/bin/:/opt/local/bin:/opt/SUNWspro/bin"

/* define non-WCS coordinate systems we handle specially */
#define LCX_IMAGE	1
#define LCX_PHYS	2

/* the following defines must match those in imregions.h */
/* define type of important tokens */
#define TOK_EREG	1
#define TOK_NREG	2
#define TOK_IREG	4
#define TOK_RTINE	8
#define TOK_NAME	16
#define TOK_ACCEL	32
#define TOK_VARARGS	64
#define TOK_REG		(TOK_EREG|TOK_NREG|TOK_IREG)
/* end of common defines */

typedef RegionsMask (*RegionsImageCall)(
  int txmin, int txmax, int tymin, int tymax, int tblock, int *got
);

/* reg.l */
int regparse(Regions reg);
int regparseFree(Regions reg);
int regwrap(void);

/* regprog.c */
int RegionsProgStart(Regions reg);
int RegionsProgOpen(Regions reg);
int RegionsProgPrepend(Regions reg);
int RegionsProgWrite(Regions reg);
int RegionsProgAppend(Regions reg);
int RegionsProgClose(Regions reg);
int RegionsProgCompile(Regions reg);
int RegionsProgEnd(Regions reg);
char *RegionsLexName(Regions reg, char *name);
char *RegionsLexRoutine1(Regions reg, char *name);
char *RegionsLexRoutine2(Regions reg, char *name);
char *RegionsLexRegion1(Regions reg, char *name);
char *RegionsLexRegion2(Regions reg, char *name);

/* regprog_c.c */
int RegionsProgLoad_C(Regions reg);

#if __EMSCRIPTEN__
/* regprog_em.c */
int RegionsProgLoad_EM(Regions reg);
RegionsMask FilterRegions_EM(Regions reg,
			     int txmin, int txmax, int tymin, int tymax,
			     int tblock, int *got);
#endif

/* imregions.c */
void initimregions(void);

/* imfilter.c */
RegionsMask IMFILTRTN(int txmin, int txmax, int tymin, int tymax, int tblock,
		      int *got);


#endif /* __regionsP.h */
