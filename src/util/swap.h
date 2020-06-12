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

/* data types */
#define TY_CHAR		1
#define TY_USHORT	-2
#define TY_SHORT	2
#define TY_INT		4
#define TY_FLOAT	-4
#define TY_DOUBLE	-8

int is_bigendian(void);
void swap_short(short *buf, int n);
void swap_ushort(unsigned short *buf, int n);
void swap_int(int *buf, int n);
void swap_uint(unsigned int *buf, int n);
void swap_float(float *buf, int n);
void swap_double(double *buf, int n);
void swap_data(void *buf, int len, int dtype);

#endif
