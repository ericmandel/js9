/*
 *	Copyright (c) 2004-2009 Smithsonian Astrophysical Observatory
 */

/*
 *
 * xalloc -- safe memory allocation with error checking
 *
 */
#include "xalloc.h"

#define XALLOC_ERROR "ERROR: can't allocate memory (xalloc)\n"

#if XALLOC_SETJMP

static jmp_buf *xalloc_envptr=NULL;

void xalloc_savejmp(jmp_buf *env){
  xalloc_envptr = env;
}
#endif

static void _xalloc_error(void){
  write(1, XALLOC_ERROR, strlen(XALLOC_ERROR));
#if XALLOC_SETJMP
  if( xalloc_envptr ){
    longjmp(*xalloc_envptr, XALLOC_SETJMP);
  }
  else{
    exit(1);
  }
#else
  exit(1);
#endif
}

void *xmalloc(size_t n){
  void *p;
  if( !(p = (void *)malloc(n)) ){
    _xalloc_error();
  }
  return p;
}

void *xcalloc (size_t n, size_t s){
  void *p;
  if( !(p = (void *)calloc(n, s)) ){
    _xalloc_error();
  }
  return p;
}

void *xrealloc (void *p, size_t n){
  if( !p ){
    return xmalloc(n);
  }
  if( !(p = (void *)realloc(p, n)) ){
    _xalloc_error();
  }
  return p;
}

void xfree (void *p){
  if( p ){
    free(p);
  }
}

char *xstrdup (char *s){
  if( s ){
    return (char *)strcpy((char *)xmalloc((size_t)strlen(s)+1), s);
  } else{
    return NULL;
  }
}
