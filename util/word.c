/*
 *	Copyright (c) 1999-2003 Smithsonian Astrophysical Observatory
 */

/*
 *    word.c -- token parser, pattern matcher, macro expander, 
 *		and other word-related routines
 *
 */

#include <stdio.h>
#include <string.h>
#include <ctype.h>
#include <word.h>

/* SAOMOD_CTYPE -- work around Slackware/RedHat incompatibility */
#ifdef linux
#ifdef isalnum
#undef isalnum
#define isalnum(c) (isalpha(c)||isdigit(c))
#endif
#endif

/* **************************************************************************
 *
 *
 * 			PRIVATE ROUTINES AND DATA
 *
 *
 * **************************************************************************/

/* word */
#define MAXDELIM 256
#define MAXDTABLES 1024
#define BUFINC 5000

static char lastd;
static char dtable[MAXDELIM];
static char *dtables[MAXDTABLES];
static int ndtable=0;

/* tmatch */
#define ALL '*'
#define ANY '?'
#define RANGE '['
#define ENDRANGE ']'
#define RANGEDELIM '-'
#define NOTRANGE '~'

/*
 *----------------------------------------------------------------------------
 *
 * Routine:	checkrange (from tmatch)
 *
 * Purpose:	see if character is in specified range
 *
 * Returns:	1 if in range, otherwise 0
 *
 *----------------------------------------------------------------------------
 */
#ifdef ANSI_FUNC
static int 
checkrange (char *xtemplate, int *ptr, int c)
#else
static int checkrange(xtemplate, ptr, c)
     char *xtemplate;
     int *ptr;
     int c;
#endif
{
  int inrange, notrange;
  char lorange, hirange;
  int tptr;
  
  tptr = *ptr;	
  /* make sure we have a close bracket */
  if( strchr(&xtemplate[tptr], ENDRANGE) == NULL )
    return(0);
  /* check for negation - match if not in range */
  if( xtemplate [tptr+1] == NOTRANGE ){
    notrange = 1; tptr++;
  }
  else
    notrange = 0;
  /* start pessimistically */
  inrange = 0;
  /* point past RANGE character */
  tptr++;
  while( xtemplate[tptr] != ENDRANGE ){
    /* get lo range */
    lorange = xtemplate[tptr];
    /* and hi range */
    tptr++;
    if( xtemplate[tptr] != RANGEDELIM )
      hirange = lorange;
    else{
      tptr++;hirange = xtemplate[tptr];tptr++;
    }
    if( (c>=lorange) && (c<=hirange) ){
      inrange = 1; break;
    }
  }
  /* only exclusive OR of inrange and notrange is ok */
  if( (inrange ^ notrange) ==0 )
    return(0);
  else{
    *ptr = strchr(&xtemplate[tptr],']') - xtemplate + 1;
    return(1);
  }
}

/*
 *----------------------------------------------------------------------------
 *
 * Routine:	addstring (from macro)
 *
 * Purpose:	add a string to a buffer
 *
 * Returns:	none
 *
 *----------------------------------------------------------------------------
 */
#ifdef ANSI_FUNC
static void 
addstring (char **buf, int *blen, int *maxlen, char *str)
#else
static void addstring(buf, blen, maxlen, str)
     char **buf;
     int *blen;
     int *maxlen;
     char *str;
#endif
{
  int slen;

  slen = strlen(str) + 1;
  while( (*blen + slen) >= *maxlen ){
    *maxlen += BUFINC;
    *buf = (char *)xrealloc(*buf, *maxlen);
  }
  strcat(*buf, str);
  *blen += slen;
}

/*
 *----------------------------------------------------------------------------
 *
 * Routine:	addchar (from macro)
 *
 * Purpose:	add a single char to a buffer
 *
 * Returns:	none
 *
 *----------------------------------------------------------------------------
 */
#ifdef ANSI_FUNC
static void 
addchar (char **buf, int *blen, int *maxlen, int c)
#else
static void addchar(buf, blen, maxlen, c)
     char **buf;
     int *blen;
     int *maxlen;
     int c;
#endif
{
  char tbuf[2];

  tbuf[0] = c;
  tbuf[1] = '\0';
  addstring(buf, blen, maxlen, tbuf);
}

/*
 *----------------------------------------------------------------------------
 *
 * Routine:	lookupkeywords (from macro)
 *
 * Purpose:	lookup a name in a list of keywords
 *
 * Returns:	return the associated value or NULL
 *
 *----------------------------------------------------------------------------
 */
#ifdef ANSI_FUNC
static char *
lookupkeywords (char *name, char **keyword, char **value, int nkey)
#else
static char *lookupkeywords(name, keyword, value, nkey)
     char *name;
     char **keyword;
     char **value;
     int nkey;
#endif
{
  int i;
  for(i=0; i<nkey; i++){
    if( !strcmp(name, keyword[i]) )
      return(value[i]);
  }
  return(NULL);
}

/*
 *----------------------------------------------------------------------------
 *
 * Routine:	hexval (from strtoul16)
 *
 * Purpose:	return the int value corresponding to a hex character
 *
 * Returns:	hex value or -1 if the character is not legal hex
 *
 *----------------------------------------------------------------------------
 */
#ifdef ANSI_FUNC
static int
hexval (int c)
#else
static int hexval(c)
     int c;
#endif
{
  switch(c){
  case '0':     return  0;
  case '1':     return  1;
  case '2':     return  2;
  case '3':     return  3;
  case '4':     return  4;
  case '5':     return  5;
  case '6':     return  6;
  case '7':     return  7;
  case '8':     return  8;
  case '9':     return  9;
  case 'A':     return 10;
  case 'a':     return 10;
  case 'B':     return 11;
  case 'b':     return 11;
  case 'C':     return 12;
  case 'c':     return 12;
  case 'D':     return 13;
  case 'd':     return 13;
  case 'E':     return 14;
  case 'e':     return 14;
  case 'F':     return 15;
  case 'f':     return 15;
  default:	return -1;
  }
}

/* **************************************************************************
 *
 *
 * 			PUBLIC ROUTINES
 *
 *
 * **************************************************************************/

/*
 *----------------------------------------------------------------------------
 *
 * Routine:	word
 *
 * Purpose:	a simple spaced parser
 *
 * Returns:	1 if word was found, else 0
 *
 *----------------------------------------------------------------------------
 */
#ifdef ANSI_FUNC
int 
word (char *lbuf, char *tbuf, int *lptr)
#else
int word(lbuf, tbuf, lptr)
     char *lbuf;
     char *tbuf;
     int *lptr;
#endif
{
  int ip;
  int i;
  char quotes;

  /* reset last delimiter */
  lastd='\0';

  /* null out the output string */
  *tbuf = '\0';

  /* if no string was specified, just return */
  if( lbuf == NULL )
    return(0);

  /* just a more convenient pointer ... */
  ip = *lptr;

  /* if we are at the end of string, just return */
  if( lbuf[ip] == '\0' )
    return(0);

  /* skip over white space */
  while( isspace((int)lbuf[ip]) || (dtable[(int)lbuf[ip]]>0) ){
    if( lbuf[ip] == '\0' ){
      *lptr = ip;
      return(0);
    }
    else
      ip++;
  }

  /* check for an explicit quote */
  quotes = '\0';
  if( lbuf[ip] == '"' ){
    quotes = '"';
    lastd = '"';
  }
  if( lbuf[ip] == '\'' ){
    quotes = '\'';
    lastd = '\'';
  }

  /* grab next token */
  if( quotes  != '\0' ){
    /* bump past quotes */
    ip++;
    /* grab up to next quotes -- but skip escaped quotes */
    for(i=0; lbuf[ip] != '\0'; i++, ip++){
      if( (lbuf[ip] == quotes) && (lbuf[ip-1] != '\\') )
	break;
      else
	tbuf[i] = lbuf[ip];
    }
  }
  else{
    /* grab up to next whitespace */
    for(i=0;
	lbuf[ip] && !isspace((int)lbuf[ip]) && (dtable[(int)lbuf[ip]]==0);
	i++, ip++)
      tbuf[i] = lbuf[ip];
    /* save this delimiter */
    lastd = lbuf[ip];
  }
  /* bump past delimiter (but not null terminator) */
  if( lbuf[ip] )
    ip++;

  /* null terminate */
  tbuf[i] = '\0';
  
  /* got something */
  *lptr = ip;
  return(1);
}

/*
 *----------------------------------------------------------------------------
 *
 * Routine:	newdtable
 *
 * Purpose:	save the current delim table and init a new one
 *
 * Returns:	1 if another delim table can be allocated, 0 otherwise
 *
 *----------------------------------------------------------------------------
 */
#ifdef ANSI_FUNC
int 
newdtable (char *s)
#else
int newdtable(s)
     char *s;
#endif
{
  int i;
  char *cur;

  if( ndtable >= MAXDTABLES ){
    fprintf(stderr, "ERROR: no more delimiter tables available\n");
    return(0);
  }
  /* save another dtable */
  ndtable++;
  /* allocate new space for this table */
  dtables[ndtable-1] = (char *)xmalloc(MAXDELIM);
  cur = dtables[ndtable-1];
  /* copy and zero the old table */
  for(i=0; i<MAXDELIM; i++){
    cur[i] = dtable[i];
    dtable[i] = 0;
  }
  /* add delims to the new table */
  if( s != NULL ){
    for(; *s; s++)
      dtable[(int)*s] = 1;
  }
  return(1);
}

/*
 *----------------------------------------------------------------------------
 *
 * Routine:	freedtable
 *
 * Purpose:	restore last delim table as the current
 *
 * Returns:	1 if there is a table to restore, else 0
 *
 *----------------------------------------------------------------------------
 */
#ifdef ANSI_FUNC
int 
freedtable (void)
#else
int freedtable()
#endif
{
  int i;
  char *cur;

  if( ndtable <= 0 ){
    fprintf(stderr, "ERROR: no delimiter tables to restore\n");
    return(0);
  }
  cur = dtables[ndtable-1];
  /* copy the restored table into 'current' */
  for(i=0; i<MAXDELIM; i++){
    dtable[i] = cur[i];
  }
  /* free up this dtable */
  xfree((void *)cur);
  /* one less dtable to worry about */
  ndtable--;
  return(1);
}

/*
 *----------------------------------------------------------------------------
 *
 * Routine:	newdelim
 *
 * Purpose:	add a string delimiters to the parse table
 *
 * Returns:	none
 *
 *----------------------------------------------------------------------------
 */
#ifdef ANSI_FUNC
void 
newdelim (char *s)
#else
void newdelim(s)
     char *s;
#endif
{
  if( s != NULL ){
    for(; *s; s++)
      dtable[(int)*s] = 1;
  }
}

/*
 *----------------------------------------------------------------------------
 *
 * Routine:	freedelim
 *
 * Purpose:	remove delims from current delim table
 *
 * Returns:	none
 *
 *----------------------------------------------------------------------------
 */
#ifdef ANSI_FUNC
void 
freedelim (char *s)
#else
void freedelim(s)
     char *s;
#endif
{
  int i;

  if( s ){
    for(; *s; s++)
      if( dtable[(int)*s] > 0 ) 
	dtable[(int)*s] -= 1;
  }
  else{
    for(i=0; i<MAXDELIM; i++)
      if( dtable[i] > 0 ) 
	dtable[i] -= 1;
  }
}

/*
 *----------------------------------------------------------------------------
 *
 * Routine:	lastdelim
 *
 * Purpose:	return the last delimiter
 *
 * Returns:	delim character
 *
 *----------------------------------------------------------------------------
 */
#ifdef ANSI_FUNC
int 
lastdelim (void)
#else
int lastdelim()
#endif
{
  return((int)lastd);
}

/*
 *----------------------------------------------------------------------------
 *
 * Routine:	tmatch
 *
 * Purpose:	match string to a template
 *
 *	the legal meta characters in a template are just like the
 *	C-shell meta characters, i.e:
 *	?   		match any character, but there must be one
 *	*		match anything, or nothing
 *	[<c>...]	match an inclusive set
 *
 *
 * Returns:	non-zero if match, zero otherwise

 *
 *----------------------------------------------------------------------------
 */
#ifdef ANSI_FUNC
int 
tmatch (char *string, char *xtemplate)
#else
int tmatch(string, xtemplate)
     char *string;
     char *xtemplate;
#endif
{
  char *lastmeta=0;
  char *nonabsorbed=0;
  int sptr=0;
  int tptr=0;
  
  /* loop through string and template */
  while( (xtemplate[tptr] != '\0') || (string[sptr] != '\0') ){
    /* if exact match, just bump both pointers */
    if( string[sptr] == xtemplate[tptr] ){
      sptr++; tptr++; continue;
    }
    /* if range character, check ranges */
    if( xtemplate[tptr] == RANGE ){
      if( checkrange(xtemplate, &tptr, string[sptr]) == 0 ){
        /* no match - was there a meta character before */
	if( lastmeta == 0 ) return(0);
	/* if so, back up to it and try again */
	xtemplate = lastmeta; tptr=0;
	/* begin checking at the non-absorbed point */
	string = nonabsorbed; sptr=0;
	continue;
      }
      /* got a match, so bump past */
      else{
	sptr++; continue;
      }
    }
    /* if ANY, any character if fine, but there must be one */
    if( xtemplate[tptr] == ANY ){
      if( string[sptr] == '\0' )
	return(0);
      else{
	sptr++; tptr++; continue;
      }
    }			
    /* if ALL, we can match anything */
    if( xtemplate[tptr] == ALL ){
      /*  remember where the * is */
      lastmeta = &xtemplate[tptr];
      tptr++;
      /* no more template after this means a win */
      if( xtemplate[tptr] == '\0' ) return(1);
      /* if the next template char is not a meta,
	 we skip up to its match in the string */
      if( xtemplate[tptr] == RANGE){
	while( checkrange(xtemplate, &tptr, string[sptr]) == 0 ){
	  /* missing the next template char */
	  if( string[sptr] == '\0' ) return(0);
	  sptr++;
	}
				/* remember the first non-absorbed character */
	nonabsorbed = &string[sptr];nonabsorbed++;
	sptr++;
	continue;
      }
      /* skip past characters, if next template char is not a meta */
      else if( xtemplate[tptr] != ANY && xtemplate[tptr] != ALL ){
	while(string[sptr] != xtemplate[tptr]){
	  /* not finding the next template char
	     is bad */
	  if( string[sptr] == '\0' ) return(0);
	  sptr++;
	}
				/* remember the first non-absorbed character */
	nonabsorbed = &string[sptr];nonabsorbed++;
	continue;
      }
      else{
				/* remember the first non-absorbed character */
	nonabsorbed = &string[sptr];nonabsorbed++;
	continue;
      }
    }
    /* no match, no meta char - see if we once had a meta */
    else{
      if( lastmeta == 0 ) return(0);
      /* if so, back up to it and try again */
      xtemplate = lastmeta; tptr=0;
      /* begin checking at the non-absorbed point */
      string = nonabsorbed; sptr=0;
      continue;
    }
  }
  /* matched to the nulls - we win */
  return(1);
}

/*
 *----------------------------------------------------------------------------
 *
 * Routine:	keyword
 *
 * Purpose:	look for a keyword=<value> string inside another string,
 *		remove and return the <value> in another buffer
 *
 * Returns:	len if keyword was found, 0 otherwise
 *
 * NB: ibuf cannot be static, as it is modified in place
 *
 *----------------------------------------------------------------------------
 */
#ifdef ANSI_FUNC
int 
keyword (char *ibuf, char *key, char *obuf, int maxlen)
#else
int keyword(ibuf, key, obuf, maxlen)
     char *ibuf;
     char *key;
     char *obuf;
     int maxlen;
#endif
{
  int len;
  int qlev;
  char *s;
  char *t;
  char *u;
  char *v;
  char *iptr=NULL;
  char quote='\0';

  /* if we have no input string, we are done */
  if( (ibuf == NULL) || (*ibuf == '\0') ){
    return(0);
  }

  /* start out pessimistically */
  *obuf = '\0';
  iptr = ibuf;

  /* maxlen generally is 1 more than we can handle */
  maxlen--;

  /* keep trying */
  while( *iptr ){
    /* look for key from current position */
    if( (s = (char *)strstr(iptr, key)) == NULL )
      return(0);
    /* if we found a key, we need to make sure ... */
    /* it must be preceeded by beginning of string, beginning of bracket,
       or by a "," from previous keyword */
    if( (s == ibuf) || (*(s-1) == ',') || (*(s-1) == '[') ){
      /* it can be followed by spaces ... */
      t = s + strlen(key);
      while( isspace((int)*t) )
	t++;
      /* but must be followed by an "=" */
      if( *t == '=' ){
	t++;
	/* skip spaces again */
	while( isspace((int)*t) )
	  t++;
	/* this is where the actual value part of the string begins */
	u = t;
	/* this will be where it ends */
	v = t;
	/* gather up everything to the next "," or end of filter */
	if( (*t == '"') || (*t == '\'') || (*t == '(') || (*t == '[') ){
	  switch(*t){
	  case '"':
	  case '\'':
	    quote = *t;
	    break;
	  case '(':
	    quote = ')';
	    break;
	  case '[':
	    quote = ']';
	    break;
	  }
	  /* bump past opening quote char */
	  t++; u++; v++;
	  while( *t && (*t != quote) ){
	    t++; v++;
	  }
	  if( *t == quote ){
	    t++;
	  }
	}
	else{
	  qlev = 0;
	  while( *t && 
		 ((qlev != 0) || (*t != ',')) &&
		 ((qlev != 0) || (*t != ']')) ){
	    if( *t == '[' )
	      qlev++;
	    else if( *t == ']' )
	      qlev--;
	    t++; v++;
	  }
	}
	len = MIN(maxlen, v - u);
	strncpy(obuf, u, len);
	obuf[len] = '\0';
	/* remove keyword=value string from the original buffer */
	/* first remove preceding comma, if necessary */
	if( (s > ibuf) && (*(s-1) == ',') )
	  s--;
	/* but leave 1 comma in place */
	else if( *t == ',' )
	  t++;
	/* now overwrite original from where the keyword started */
	memmove(s, t, strlen(t)+1);
	return(len);
      }
    }
    /* start next search just past this one */
    iptr = s+1;
  }
  return(0);
}

/*
 *----------------------------------------------------------------------------
 *
 * Routine:	macro
 *
 * Purpose:	expand a macro using a client's callback
 *
 * Returns:	expanded macro as an allocated string
 *
 *----------------------------------------------------------------------------
 */
#ifdef ANSI_FUNC
char *
macro (char *icmd, char **keyword, char **value, int nkey,
       MacroCB client_callback, void *client_data)
#else
char *macro(icmd, keyword, value, nkey, client_callback, client_data)
     char *icmd;
     char **keyword;
     char **value;
     int nkey;
     MacroCB client_callback;
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
  result = (char *)xmalloc(BUFINC+1);
  maxlen = BUFINC;
  *result = '\0';
  for(i=0, ip=icmd; *ip; ip++){
    if( *ip != '$' ){
      addchar(&result, &i, &maxlen, *ip);
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
	  (s=lookupkeywords(tbuf, keyword, value, nkey)) != NULL ){
	   addstring(&result, &i, &maxlen, s);
      }
      /* execute the client routine to expand macros */
      else if( (client_callback != NULL) &&
	  ((s=(*client_callback)(tbuf, client_data)) != NULL) ){
	    addstring(&result, &i, &maxlen, s);
      }
      /* look for an environment variable */
      else if( (s = (char *)getenv(tbuf)) != NULL ){
	addstring(&result, &i, &maxlen, s);
      }
      /* if we don't recognize this macro, put it back onto the string */
      else{
	int len;
	len = ip - mip + 1;
	strncpy(tbuf1, mip, len);
	tbuf1[len] = '\0';
	addstring(&result, &i, &maxlen, tbuf1);
      }
    }
  }
  /* null terminate and save the string */
  result[i] = '\0';
  result = (char *)xrealloc(result, i+1);
  return(result);
}

/* **************************************************************************
 *
 *	misc word routines
 *
 * **************************************************************************/

/*
 *----------------------------------------------------------------------------
 *
 * Routine:	cluc
 *
 * Purpose:	convert lower to upper case string in place
 *
 * Returns:	none
 *
 *----------------------------------------------------------------------------
 */
#ifdef ANSI_FUNC
void 
cluc (char *s)
#else
void cluc(s)
     char *s;
#endif
{
  while(*s){
    if( islower((int)*s) )
      *s = toupper(*s);
    s++;
  }
}

/*
 *----------------------------------------------------------------------------
 *
 * Routine:	culc
 *
 * Purpose:	convert upper to lower case string in place
 *
 * Returns:	
 *
 *----------------------------------------------------------------------------
 */
#ifdef ANSI_FUNC
void 
culc (char *s)
#else
void culc(s)
     char *s;
#endif
{
  while(*s){
    if( isupper((int)*s) )
      *s = tolower(*s);
    s++;
  }
}

/*
 *----------------------------------------------------------------------------
 *
 * Routine:	nowhite
 *
 * Purpose:	removes all beginning and ending white space from string
 *
 * Returns:	returns the number of characters
 *
 *----------------------------------------------------------------------------
 */
#ifdef ANSI_FUNC
int 
nowhite (
    char *c,      /* buffer to be cleaned */
    char *cr     /* buffer for returned string */
)
#else
int nowhite(c,cr)
char *c;      /* buffer to be cleaned */
char *cr;     /* buffer for returned string */
#endif
{
  char *cr0;    /* initial value of cr */
  int n;        /* the number of characters */

  /* skip leading white space */
  while(*c && isspace((int)*c))
    c++;
  /* copy up to the null */
  cr0 = cr;
  while(*c)
    *cr++ = *c++;
  n = cr - cr0;   /* the number of characters */
  *cr-- = '\0';   /* Null and point to the last character */
  /* remove trailing white space */
  while( n && isspace((int)*cr) ){
    *cr-- = '\0';
    n--;
  }
  return(n);
}

/*
 *----------------------------------------------------------------------------
 *
 * Routine:	nocr
 *
 * Purpose:	remove trailing <CR> from a string (in place)
 *
 * Returns:	none
 *
 *----------------------------------------------------------------------------
 */
#ifdef ANSI_FUNC
void 
nocr (char *s)
#else
void nocr(s)
     char *s;
#endif
{
  int len;

  if( (s==NULL) || (*s=='\0') )
    return;
  len = strlen(s);
  if( s[len-1] == '\n' )
    s[len-1] = '\0';
}

/*
 *----------------------------------------------------------------------------
 *
 * Routine:	istrue
 *
 * Purpose:	check if a string is "true" or "yes" or "on"
 *
 * Returns:	1 if true string, 0 otherwise
 *
 *----------------------------------------------------------------------------
 */
#ifdef ANSI_FUNC
int 
istrue (char *s)
#else
int istrue(s)
     char *s;
#endif
{
  char *t;
  int result;

  if( (s==NULL) || (*s=='\0') )
    return(0);
  t = (char *)xmalloc(strlen(s)+1);
  nowhite(s, t);
  culc(t);
  result = (!strcmp(t, "true") || !strcmp(t, "yes") ||
	    !strcmp(t, "on")   || !strcmp(t, "1")   );
  xfree(t);
  return(result);
}


/*
 *----------------------------------------------------------------------------
 *
 * Routine:	isfalse
 *
 * Purpose:	check if a string is "false" or "no" or "off"
 *
 * Returns:	1 if false string, 0 otherwise
 *
 *----------------------------------------------------------------------------
 */
#ifdef ANSI_FUNC
int 
isfalse (char *s)
#else
int isfalse(s)
     char *s;
#endif
{
  char *t;
  int result;

  if( (s==NULL) || (*s=='\0') )
    return(0);
  t = (char *)xmalloc(strlen(s)+1);
  nowhite(s, t);
  culc(t);
  result = (!strcmp(t, "false") || !strcmp(t, "no") ||
	    !strcmp(t, "off")   || !strcmp(t, "0")  );
  xfree(t);
  return(result);
}


/*
 *----------------------------------------------------------------------------
 *
 * Routine:	strtoul16
 *
 * Purpose:	convert a string to an unsigned long hex value
 *
 * Returns:	converted hex value (end of converted string is in t)
 *
 *----------------------------------------------------------------------------
 */
#ifdef ANSI_FUNC
unsigned long strtoul16 (char *s, char **t)
#else
unsigned long strtoul16(s, t)
     char *s;
     char **t;
#endif
{
  unsigned long v=0;
  int h;

  while ( *s != ' '	&&
	  *s != '\n'	&&
	  *s != '\r'	&&
	  *s != '\0' 	){
    v *= 16;
    if( (h = hexval(*s)) >= 0 ){
      v += h;
      s++;
    }
    else{
      break;
    }
  }
  if( t != NULL )
    *t = s;
  return(v);
}
