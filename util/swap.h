/*
 *	Copyright (c) 1999-2003 Smithsonian Astrophysical Observatory
 */

/*
 *
 * swap.h -- declarations for swap
 *
 */

#ifndef	__swap_h
#define	__swap_h

#include <prsetup.h>

/* data types */
#define TY_CHAR		1
#define TY_USHORT	-2
#define TY_SHORT	2
#define TY_INT		4
#define TY_FLOAT	-4
#define TY_DOUBLE	-8

_PRbeg

int is_bigendian _PRx((void));
void swap_short _PRx((short *buf, int n));
void swap_ushort _PRx((unsigned short *buf, int n));
void swap_int _PRx((int *buf, int n));
void swap_uint _PRx((unsigned int *buf, int n));
void swap_float _PRx((float *buf, int n));
void swap_double _PRx((double *buf, int n));
void swap_data _PRx((void *buf, int len, int dtype));

_PRend

#endif
