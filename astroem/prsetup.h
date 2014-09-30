/*
 *	Copyright (c) 1999-2003 Smithsonian Astrophysical Observatory
 */

/* prsetup.h -- define variables for ANSI prototyping */

#ifndef _prsetup
#define _prsetup

#ifdef NO_ANSI_FUNC
#define _PRbeg
#define _PRend
#define _PRx(s) ()
#ifdef ANSI_FUNC
#undef ANSI_FUNC
#endif
#else
#if defined(__cplusplus) || defined(c_plusplus)
#define _PRbeg extern "C" {   /* do not leave open across includes */
#define _PRend }
#define _PRx(s) s
#define ANSI_FUNC 1
#else
#if defined(__STDC__)
#define _PRbeg
#define _PRend
#define _PRx(s) s
#define ANSI_FUNC 1
#else
#define _PRbeg
#define _PRend
#define _PRx(s) ()
#ifdef ANSI_FUNC
#undef ANSI_FUNC
#endif
#endif
#endif
#endif

/* the ever-present */
#ifndef SZ_LINE
#define SZ_LINE 4096
#endif

#ifndef MIN
#define MIN(a,b) (((a)<(b))?(a):(b))
#endif

#ifndef MAX
#define MAX(a,b) (((a)>(b))?(a):(b))
#endif

#ifndef ABS
#define ABS(x)		((x)<0?(-x):(x))
#endif

#endif

