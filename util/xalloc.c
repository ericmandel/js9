/*
 *	Copyright (c) 2004-2009 Smithsonian Astrophysical Observatory
 */

/*
 *
 * xalloc -- safe memory allocation with error checking
 *
 */

/* this module is compiled within a funtools filter and must not require
   the header files */
#ifdef FILTER_PTYPE
#define ANSI_FUNC 1
#else
#include <xalloc.h>
#endif

#define XALLOC_ERROR "ERROR: can't allocate memory (xalloc)\n"

#if XALLOC_SETJMP

static jmp_buf *xalloc_envptr=NULL;

#ifdef ANSI_FUNC
void xalloc_savejmp(jmp_buf *env)
#else
void xalloc_savejmp(env)
     jmp_buf *env;
#endif
{
  xalloc_envptr = env;
}
#endif


#ifdef ANSI_FUNC
static void _xalloc_error(void)
#else
static void _xalloc_error()
#endif
{
  write(1, XALLOC_ERROR, strlen(XALLOC_ERROR));
#if XALLOC_SETJMP
  if( xalloc_envptr )
    longjmp(*xalloc_envptr, XALLOC_SETJMP);
  else
#endif
  exit(1);
}

#ifdef ANSI_FUNC
void *xmalloc(size_t n)
#else
void *xmalloc(n)
     size_t n;
#endif
{
  void *p;
  
  if( !(p = (void *)malloc(n)) )
    _xalloc_error();
  return p;
}

#ifdef ANSI_FUNC
void *xcalloc (size_t n, size_t s)
#else
void *xcalloc (n, s)
     size_t n, s;
#endif
{
  void *p;

  if( !(p = (void *)calloc(n, s)) )
    _xalloc_error();
  return p;
}

#ifdef ANSI_FUNC
void *xrealloc (void *p, size_t n)
#else
void *xrealloc (p, n)
     void *p;
     size_t n;
#endif
{
  if( !p )
    return xmalloc(n);
  if( !(p = (void *)realloc(p, n)) )
    _xalloc_error();
  return p;
}

#ifdef ANSI_FUNC
void xfree (void *p)
#else
void xfree (p)
     void *p;
#endif
{
  if( p )
    free(p);
}

#ifdef ANSI_FUNC
char *xstrdup (char *s)
#else
char *xstrdup (s)
     char *s;
#endif
{
  if( s )
    return((char *)strcpy((char *)xmalloc((size_t)strlen(s)+1), s));
  else
    return NULL;
}
