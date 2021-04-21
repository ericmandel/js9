#if MINIMIZE_INCLUDES

#include <stdarg.h>
int sscanf(const char *s, const char *format, ...);
typedef unsigned long size_t;
size_t strlen();
char *strcpy(), *strdup(), *strstr(), *getenv();
void *calloc(), *malloc(), *memset(), *memmove();
void exit();

/* lots of math functions from math.h */
extern double  acos(double);
extern double  asin(double);
extern double  atan(double);
extern double  atan2(double, double);
extern double  cos(double);
extern double  sin(double);
extern double  tan(double);
extern double  acosh(double);
extern double  asinh(double);
extern double  atanh(double);
extern double  cosh(double);
extern double  sinh(double);
extern double  tanh(double);
extern double exp (double);
extern double exp2 (double); 
extern double expm1 (double); 
extern double log (double);
extern double log10 (double);
extern double log2 (double);
extern double log1p (double);
extern double logb (double);
extern double modf (double, double *);
extern double ldexp (double, int);
extern double frexp (double, int *);
extern int ilogb (double);
extern double scalbn (double, int);
extern double scalbln (double, long int);
extern double  fabs(double);
extern double  cbrt(double);
extern double hypot (double, double);
extern double pow (double, double);
extern double  sqrt(double);
extern double  erf(double);
extern double  erfc(double);
extern double  lgamma(double);
extern double  tgamma(double);
extern double ceil (double);
extern double floor (double);
extern double nearbyint (double);
extern double rint (double);
extern long int lrint (double);
extern double round (double);
extern long int lround (double);
extern double trunc (double);
extern double fmod (double, double);
extern double remainder (double, double);
extern double remquo (double, double, int *);
extern double copysign (double, double);
extern double nan(const char *);
extern double nextafter (double, double);
extern double fdim (double, double);
extern double fmax (double, double);
extern double fmin (double, double);
extern double fma (double, double, double);
/* and math constants */
#define M_E         2.71828182845904523536028747135266250   /* e */
#define M_LOG2E     1.44269504088896340735992468100189214   /* log 2e */
#define M_LOG10E    0.434294481903251827651128918916605082  /* log 10e */
#define M_LN2       0.693147180559945309417232121458176568  /* log e2 */
#define M_LN10      2.30258509299404568401799145468436421   /* log e10 */
#define M_PI        3.14159265358979323846264338327950288   /* pi */
#define M_PI_2      1.57079632679489661923132169163975144   /* pi/2 */
#define M_PI_4      0.785398163397448309615660845819875721  /* pi/4 */
#define M_1_PI      0.318309886183790671537767526745028724  /* 1/pi */
#define M_2_PI      0.636619772367581343075535053490057448  /* 2/pi */
#define M_2_SQRTPI  1.12837916709551257389615890312154517   /* 2/sqrt(pi) */
#define M_SQRT2     1.41421356237309504880168872420969808   /* sqrt(2) */
#define M_SQRT1_2   0.707106781186547524400844362104849039  /* 1/sqrt(2) */

#else /* minimize includes */

#include <stdio.h>
#include <unistd.h>
#include <math.h>
#include <string.h>
#include <sys/types.h>
#ifdef __STDC__
#include <stdlib.h>
#include <stdarg.h>
#else
#include <varargs.h>
#endif

#endif /* minimize includes */

/* the following defines must match those in regionsP.h */
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

/* don't need these if we loaded regionsP.h */
#ifndef	__regions_h

/* the following record structure(s) must match those in regionsP.h */
/* output mask struct */
typedef struct regmasks {
  int region;
  int y;
  int xstart, xstop;
} *RegionsMask, RegionsMaskRec;
/* end of common record structures */

#endif

/* scan line record structure */
typedef struct scanrec{
  struct scanrec *next;
  int x;
} *Scan, ScanRec;

/* structs for use with region routines */
typedef struct shaperec {
  int init;
  double ystart, ystop;
  Scan *scanlist;
  /* varargs */
  int nv;
  double *xv;
  /* circle, annulus */
  double r1sq, r2sq;
  /* ellipse */
  double angl, sinangl, cosangl;
  double cossq, sinsq;
  double xradsq, yradsq;
  double a;
  /* polygon-style shapes */
  int npt;
  double *pts;
  /* line */
  int xonly;
  double x1, x2, y1;
  double invslope;
} *Shape, ShapeRec;

/* global record structure */
typedef struct gregrec {
  int nshape;			/* number of shapes */
  int maxshape;			/* number of shape records we allocate */
  Shape shapes;			/* array holding range limits for one shape */
  int rid;			/* first valid region for current pixel */
  int xmin, xmax, ymin, ymax;	/* section limits in original image coords */
  int block;			/* block factor */
  int x0, x1, y0, y1;		/* section limits in section coords */
  int *ybuf;			/* valid y row flags */
  int *x0s;			/* valid x start values */
  int *x1s;			/* valid x stop values */
} *GReg, GRegRec;

#ifndef M_PI
#define M_PI		3.14159265358979323846
#endif
#define SMALL_NUMBER	1.0E-24
#define LARGE_NUMBER	65535
/* must match reg.l */
/* 2**53 can be represented exactly in IEEE */
#define PSTOP		9007199254740992.0

#ifndef SZ_LINE
#define SZ_LINE 	4096
#endif
#ifndef min
#define min(x,y)	(((x)<(y))?(x):(y))
#endif
#ifndef max
#define max(x,y)	(((x)>(y))?(x):(y))
#endif
#ifndef abs
#define abs(x)		((x)<0?(-x):(x))
#endif
#ifndef feq
#define feq(x,y)	(fabs((double)x-(double)y)<=(double)1.0E-15)
#endif
#ifndef NULL
#define NULL 		(void *)0
#endif

#define PIXCEN(a)	(double)(a)
#define PIXNUM(a)	(int)((a)+0.5) 
#define PIXSTART(a)	((int)(a)+1)
#define PIXSTOP(a)	(((int)(a))==(a)?((int)(a)-1):((int)(a)))
/* to assure that geometrically adjoining regions touch but don't overlap */
/* when edge is exactly on a pixel center it goes to right or upper region. */
/* used for non-radially symetric regions instead of PIXSTART, PIXSTOP */
#define PIXINCL(a)	(int)((a)+1.0) 

#define XSNO    3

/* declare image init routines */
void imannulusi(GReg g, int rno, int sno, int flag, int type, 
		double x, double y,
		double xcen, double ycen, double iradius, double oradius);
void imboxi(GReg g, int rno, int sno, int flag, int type,
	    double x, double y,
	    double xcen, double ycen, double xwidth, double yheight,
	    double angle);
void imcirclei(GReg g, int rno, int sno, int flag, int type,
	       double x, double y,
	       double xcen, double ycen, double radius);
void imellipsei(GReg g, int rno, int sno, int flag, int type,
		double x, double y,
		double xcen, double ycen, double xrad, double yrad,
		double angle);
void imfieldi(GReg g, int rno, int sno, int flag, int type,
	      double x, double y);
void imlinei(GReg g, int rno, int sno, int flag, int type,
	     double x, double y,
	     double x0, double y0, double x1, double y1);
void impiei(GReg g, int rno, int sno, int flag,  int type,
	    double x, double y,
	    double xcen, double ycen, double angle1, double angle2);
void imqtpiei(GReg g, int rno, int sno, int flag,  int type,
	      double x, double y,
	      double xcen, double ycen, double angle1, double angle2);
void impointi(GReg g, int rno, int sno, int flag, int type,
	      double x, double y,
	      double xcen, double ycen);
void impandai(GReg g, int rno, int sno, int flag, int type,
	      double x, double y,
	      double xcen, double ycen,
	      double anglo, double anghi, double angn,
	      double radlo, double radhi, double radn);
void imbpandai(GReg g, int rno, int sno, int flag, int type,
	       double x, double y,
	       double xcen, double ycen,
	       double anglo, double anghi, double angn,
	       double xlo, double ylo, double xhi, double yhi, double radn,
	       double ang);
void imepandai(GReg g, int rno, int sno, int flag, int type,
	       double x, double y,
	       double xcen, double ycen,
	       double anglo, double anghi, double angn,
	       double xlo, double ylo, double xhi, double yhi, double radn,
	       double ang);
void imnannulusi(GReg g, int rno, int sno, int flag, int type,
		 double x, double y,
		 double xcen, double ycen,
		 double lo, double hi, int n);
void imnboxi(GReg g, int rno, int sno, int flag, int type,
	     double x, double y,
	     double xcen, double ycen,
	     double lox, double loy, double hix, double hiy, int n,
	     double angle);
void imnellipsei(GReg g, int rno, int sno, int flag, int type,
		 double x, double y,
		 double xcen, double ycen,
		 double lox, double loy, double hix, double hiy, int n,
		 double angle);
void imnpiei(GReg g, int rno, int sno, int flag, int type,
	     double x, double y,
	     double xcen, double ycen,
	     double lo, double hi, int n);

#ifdef __STDC__
void impolygoni(GReg g, int rno, int sno, int flag, int type,
		double x, double y, ...);
void imvannulusi(GReg g, int rno, int sno, int flag, int type,
		 double x, double y, double xcen, double ycen, ...);
void imvboxi(GReg g, int rno, int sno, int flag, int type,
	     double x, double y, double xcen, double ycen, ...);
void imvellipsei(GReg g, int rno, int sno, int flag, int type,
		 double x, double y, double xcen, double ycen, ...);
void imvpiei(GReg g, int rno, int sno, int flag, int type,
	     double x, double y, double xcen, double ycen, ...);
void imvpointi(GReg g, int rno, int sno, int flag, int type, 
	       double x, double y, ...);
#endif


/* declare image region routines */
int imannulus(GReg g, int rno, int sno, int flag, int type,
	      double x, double y,
	      double xcen, double ycen, double iradius, double oradius);
int imbox(GReg g, int rno, int sno, int flag, int type,
	  double x, double y,
	  double xcen, double ycen, double xwidth, double yheight,
	  double angle);
int imcircle(GReg g, int rno, int sno, int flag, int type,
	     double x, double y,
	     double xcen, double ycen, double radius);
int imellipse(GReg g, int rno, int sno, int flag, int type,
	      double x, double y,
	      double xcen, double ycen, double xrad, double yrad,
	      double angle);
int imfield(GReg g, int rno, int sno, int flag, int type,
	    double x, double y);
int imline(GReg g, int rno, int sno, int flag, int type,
	   double x, double y,
	   double x1, double y1, double x2, double y2);
int impie(GReg g, int rno, int sno, int flag, int type,
	  double x, double y,
	  double xcen, double ycen, double angle1, double angle2);
int imqtpie(GReg g, int rno, int sno, int flag, int type,
	    double x, double y,
	    double xcen, double ycen, double angle1, double angle2);
int impoint(GReg g, int rno, int sno, int flag, int type,
	    double x, double y,
	    double xcen, double ycen);
int impanda(GReg g, int rno, int sno, int flag, int type,
	     double x, double y,
	     double xcen, double ycen,
	     double anglo, double anghi, double angn,
	     double radlo, double radhi, double radn);
int imbpanda(GReg g, int rno, int sno, int flag, int type,
	     double x, double y,
	     double xcen, double ycen,
	     double anglo, double anghi, double angn,
	     double xlo, double ylo, double xhi, double yhi, double radn,
	     double ang);
int imepanda(GReg g, int rno, int sno, int flag, int type,
	     double x, double y,
	     double xcen, double ycen,
	     double anglo, double anghi, double angn,
	     double xlo, double ylo, double xhi, double yhi, double radn,
	     double ang);
int imnannulus(GReg g, int rno, int sno, int flag, int type,
	       double x, double y,
	       double xcen, double ycen,
	       double lo, double hi, int n);
int imnbox(GReg g, int rno, int sno, int flag, int type,
	   double x, double y,
	   double xcen, double ycen,
	   double lox, double loy, double hix, double hiy, int n,
	   double angle);
int imnellipse(GReg g, int rno, int sno, int flag, int type,
	       double x, double y,
	       double xcen, double ycen,
	       double lox, double loy, double hix, double hiy, int n,
	       double angle);
int imnpie(GReg g, int rno, int sno, int flag, int type,
	   double x, double y,
	   double xcen, double ycen,
	   double lo, double hi, int n);
#ifdef __STDC__
int impolygon(GReg g, int rno, int sno, int flag, int type,
	      double x, double y, ...);
int imvannulus(GReg g, int rno, int sno, int flag, int type,
	       double x, double y, double xcen, double ycen, ...);
int imvbox(GReg g, int rno, int sno, int flag, int type,
	   double x, double y, double xcen, double ycen, ...);
int imvellipse(GReg g, int rno, int sno, int flag, int type,
	       double x, double y, double xcen, double ycen, ...);
int imvpie(GReg g, int rno, int sno, int flag, int type,
	   double x, double y, double xcen, double ycen, ...);
int imvpoint(GReg g, int rno, int sno, int flag, int type,
	     double x, double y, ...);
#endif
