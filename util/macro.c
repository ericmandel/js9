/*
 *	Copyright (c) 1999-2003 Smithsonian Astrophysical Observatory
 */

/*
 *
 * macro.c -- macro expansion routines
 *
 */

#include <macro.h>

/* SAOMOD_CTYPE -- work around Slackware/RedHat incompatibility */
#ifdef linux
#ifdef isalnum
#undef isalnum
#define isalnum(c) (isalpha(c)||isdigit(c))
#endif
#endif

#define BUFINC 5000

/*
 *
 * Private Routines
 *
 *
 */

/*
 *
 * AddString -- add a string to a buffer
 *
 */
#ifdef ANSI_FUNC
static void
AddString(char **buf, int *blen, int *maxlen, char *str)
#else
static void AddString(buf, blen, maxlen, str)
     char **buf;
     int *blen;
     int *maxlen;
     char *str;
#endif
{
  int slen;

  if( !str || !*str ) return;
  slen = strlen(str) + 1;
  while( (*blen + slen) >= *maxlen ){
    *maxlen += BUFINC;
    *buf = (char *)realloc(*buf, *maxlen);
  }
  strcat(*buf, str);
  *blen += slen;
}

/*
 *
 * AddChar -- add a single char to a buffer
 *
 */
#ifdef ANSI_FUNC
static void
AddChar(char **buf, int *blen, int *maxlen, int c)
#else
static void AddChar(buf, blen, maxlen, c)
     char **buf;
     int *blen;
     int *maxlen;
     int c;
#endif
{
  char tbuf[2];

  tbuf[0] = (char)c;
  tbuf[1] = '\0';
  AddString(buf, blen, maxlen, tbuf);
}

/*
 *
 * LookupKeywords -- lookup a name in a list fo keywords and
 * return the associated value.
 * (Should use quarks ...)
 *
 */
#ifdef ANSI_FUNC
static char *
LookupKeywords(char *name, char **keyword, char **value, int nkey)
#else
static char *LookupKeywords(name, keyword, value, nkey)
     char *name;
     char **keyword;
     char **value;
     int nkey;
#endif
{
  int i;
  for(i=0; i<nkey; i++){
    if( keyword[i] && !strcmp(name, keyword[i]) )
      return(value[i]);
  }
  return(NULL);
}

/*
 *
 * Public Routines
 *
 *
 */

/*
 *
 * ExpandMacro -- expand a macro using a client's callback
 * returns: expanded macro as an allocated string
 *
 */
#ifdef ANSI_FUNC
char *
ExpandMacro(char *icmd, char **keyword, char **value, int nkey,
	    MacroCall client_callback, void *client_data)
#else
char *ExpandMacro(icmd, keyword, value, nkey, client_callback, client_data)
     char *icmd;
     char **keyword;
     char **value;
     int nkey;
     MacroCall client_callback;
     void *client_data;
#endif
{
  int  i, j;
  int  maxlen;
  char brace;
  char *result;
  char tbuf[1000];
  char tbuf1[1000];
  char *s;
  char *ip;
  char *mip;

  /* make a new string using the command as a base, but substituting
     for "$" values as needed */
  result = (char *)malloc(BUFINC+1);
  maxlen = BUFINC;
  *result = '\0';
  for(i=0, ip=icmd; *ip; ip++){
    if( *ip != '$' ){
      AddChar(&result, &i, &maxlen, (int)*ip);
    }
    else{
      /* save beginning of macro */
      mip = ip;
      /* skip past '$' */
      ip++;
      /* check for brace mode */
      if( *ip == '{' ){
	brace = '{';
	ip++;
      }
      else if( *ip == '(' ){
	brace = '(';
	ip++;
      }
      else
	brace = '\0';
      /* get variable up to next non-alpha character or close brace */
      for(*tbuf='\0', j=0; *ip; ip++ ){
	/* if we are in brace mode, look for trailing brace */
	if( brace && *ip == (brace == '(' ? ')' : '}') ){
	  ip++;
	  break;
	}
	/* else look for a non-alpha character */
	else if( !isalnum((int)*ip) && *ip != '_'){
	  break;
	}
	else{
	  tbuf[j++] = *ip;
	  tbuf[j] = '\0';
	}
      }
      /* back up so the outer loop adds this delimiting char to the output */
      ip--;
      /* search for keyword from the list */
      if( (nkey > 0) && 
	  (s=LookupKeywords(tbuf, keyword, value, nkey)) != NULL ){
	   AddString(&result, &i, &maxlen, s);
      }
      /* execute the client routine to expand macros */
      else if( (client_callback != NULL) &&
	  ((s=(*client_callback)(tbuf, client_data)) != NULL) ){
	    AddString(&result, &i, &maxlen, s);
      }
      /* look for an environment variable */
      else if( (s = (char *)getenv(tbuf)) != NULL ){
	AddString(&result, &i, &maxlen, s);
      }
      /* if we don't recognize this macro, put it back onto the string */
      else{
	int len;
	len = ip - mip + 1;
	strncpy(tbuf1, mip, len);
	tbuf1[len] = '\0';
	AddString(&result, &i, &maxlen, tbuf1);
      }
    }
  }
  /* null terminate and save the string */
  result[i] = '\0';
  result = (char *)realloc(result, i+1);
  return(result);
}

