/*
 *	Copyright (c) 1999-2003 Smithsonian Astrophysical Observatory
 */

/*
 *
 * swap.c -- swap data between native and IEEE format
 *
 *
 */

#include <stdio.h>
#include "swap.h"

/*
 *
 * swap.c -- routines to swap parts of data
 *
 */

#define _idx(x, n)    ((unsigned char *) x)[n]

/* from Harbison&Steele by way of GNU cinfigure ...
   returns 1 for bigendian, 0 for littleendian */
int is_bigendian (void){
  union
  {
    long l;
    char c[sizeof (long)];
  } u;
  u.l = 1;
  return(u.c[sizeof (long) - 1] == 1);
}

void swap_short (short *buf, int n){
  int i;
  register short *ptr;
  short val;

  ptr = buf;
  for(i=0; i<n; i++){
    _idx(&val, 0) = _idx(ptr, 1);
    _idx(&val, 1) = _idx(ptr, 0);
    *ptr++ = val;
  }
}

void swap_ushort (unsigned short *buf, int n){
  int i;
  register unsigned short *ptr;
  unsigned short val;

  ptr = buf;
  for(i=0; i<n; i++){
    _idx(&val, 0) = _idx(ptr, 1);
    _idx(&val, 1) = _idx(ptr, 0);
    *ptr++ = val;
  }
}

void swap_int (int *buf, int n){
  int i;
  register int *ptr;
  int val;

  ptr = buf;
  for(i=0; i<n; i++){
    _idx(&val, 0) = _idx(ptr, 3);
    _idx(&val, 1) = _idx(ptr, 2);
    _idx(&val, 2) = _idx(ptr, 1);
    _idx(&val, 3) = _idx(ptr, 0);
    *ptr++ = val;
  }
}

void swap_uint (unsigned int *buf, int n){
  int i;
  register unsigned int *ptr;
  unsigned int val;

  ptr = buf;
  for(i=0; i<n; i++){
    _idx(&val, 0) = _idx(ptr, 3);
    _idx(&val, 1) = _idx(ptr, 2);
    _idx(&val, 2) = _idx(ptr, 1);
    _idx(&val, 3) = _idx(ptr, 0);
    *ptr++ = val;
  }
}

void swap_float (float *buf, int n){
  int i;
  register float *ptr;
  float val;

  ptr = buf;
  for(i=0; i<n; i++){
    _idx(&val, 0) = _idx(ptr, 3);
    _idx(&val, 1) = _idx(ptr, 2);
    _idx(&val, 2) = _idx(ptr, 1);
    _idx(&val, 3) = _idx(ptr, 0);
    *ptr++ = val;
  }
}

void swap_double (double *buf, int n){
  int i;
  register double *ptr;
  double val;

  ptr = buf;
  for(i=0; i<n; i++){
    _idx(&val, 0) = _idx(ptr, 7);
    _idx(&val, 1) = _idx(ptr, 6);
    _idx(&val, 2) = _idx(ptr, 5);
    _idx(&val, 3) = _idx(ptr, 4);
    _idx(&val, 4) = _idx(ptr, 3);
    _idx(&val, 5) = _idx(ptr, 2);
    _idx(&val, 6) = _idx(ptr, 1);
    _idx(&val, 7) = _idx(ptr, 0);
    *ptr++ = val;
  }
}

/*
 *

 *
 */
void swap_data(void *buf, int len, int dtype){
  /* set up input data pointer */
  switch(dtype){
  case TY_CHAR:
  case 'B':
    break;
  case TY_SHORT:
  case 'I':
    swap_short((short *)buf, len);
    break;
  case TY_USHORT:
  case 'U':
    swap_ushort((unsigned short *)buf, len);
    break;
  case TY_INT:
  case 'J':
    swap_int((int *)buf, len);
    break;
  case 'V':
    swap_uint((unsigned int *)buf, len);
    break;
  case TY_FLOAT:
  case 'E':
    swap_float((float *)buf, len);
    break;
  case TY_DOUBLE:
  case 'F':
    swap_double((double *)buf, len);
    break;
  default:
    fprintf(stderr, "ERROR: unknown input data type %d\n", dtype);
    break;
  }
}

