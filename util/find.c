/*
 *	Copyright (c) 1999-2003 Smithsonian Astrophysical Observatory
 */

/*
 *
 * Find.c -- find files via the path environment variable
 * (and related routines)
 *
 */
#include <find.h>

/*
 *
 * 	private routines 
 *
 */

#define MAXBUFSIZE 8192

#ifndef HAVE_UNISTD_H
#define F_OK            0       /* does file exist */
#define X_OK            1       /* is it executable by caller */
#define W_OK            2       /* is it writable by caller */
#define R_OK            4       /* is it readable by caller */
#endif

/* not part of unistd.h but we need to differentiate directories */
#ifdef D_OK
#undef D_OK
#endif
#define D_OK            256       /* is it a directory */

#ifdef ANSI_FUNC
static int 
amparse (char *mode)
#else
static int amparse(mode)
     char *mode;
#endif
{
  int xmode = 0;

  xmode |= ( strpbrk(mode, "r") != NULL ? R_OK 	: 0 );
  xmode |= ( strpbrk(mode, "w") != NULL ? W_OK 	: 0 );
  xmode |= ( strpbrk(mode, "x") != NULL ? X_OK	: 0 );
  xmode |= ( strpbrk(mode, "f") != NULL ? F_OK 	: 0 );
  xmode |= ( strpbrk(mode, "d") != NULL ? D_OK 	: 0 );

  return xmode;
}	

#ifdef ANSI_FUNC
static char *
findpath (char *name, char *mode, char *path)
#else
static char *findpath(name, mode, path)
     char *name;
     char *mode;
     char *path;
#endif
{
  char	pathbuff[MAXBUFSIZE];
  char	namebuff[MAXBUFSIZE];
  char	tempbuff[MAXBUFSIZE];
  char	backmode[MAXBUFSIZE];
  char 	*here, *found;
  int	 len;
  int 	 mark = 0;
  int	 skip = strpbrk(mode, ">") != NULL;
  int	 pick = strpbrk(mode, "<") != NULL;

  if ( skip && pick ) return NULL;

  if ( (path==NULL) || ( name[0] == '.' && name[1] == '/' ) || name[0] == '/' )
    return Access(name, mode);

  strncpy(pathbuff, path, MAXBUFSIZE-1);
  pathbuff[MAXBUFSIZE-1] = '\0';
  path = pathbuff;

  if ( (here = strpbrk(pathbuff, ":;")) ) {
    mark = *here;
    *here++ = '\0';
  }
  while ( path ) {
    /* if there is an environment variable ... */
    if ( strchr(path, '$') ) {
      /* exand it */
      ExpandEnv(path, tempbuff, MAXBUFSIZE);
      /* make sure we could expand it (otherwise we get an infinite loop) */
      if( !strchr(tempbuff, '$') ){
	if ( (found = findpath(name, mode, tempbuff)) )
	  return found;
      }
    } else {      
      if ( !skip ) {      
	if ( !strcmp(".", path) ) path[0] = '\0';

	strncpy(namebuff, path, MAXBUFSIZE-1);
	namebuff[MAXBUFSIZE-1] = '\0';
	len = strlen(namebuff);
	if ( namebuff[0] && namebuff[len-1] != '/' ){
	  if( (len+1) <= (MAXBUFSIZE-1) ){
	    strcat(namebuff, "/");
	    len++;
	  }
	  /* filename is too large, so we can't find it */
	  else
	    return NULL;
	}
	if( len+strlen(name) <= MAXBUFSIZE-1 )
	  strcat(namebuff, name);
	/* filename is too large, so we can't find it */
	else
	  return NULL;

	if ( (found = Access(namebuff, mode)) )
	  return found;
      }
    }

    if ( mark == ';' ) {
      if ( skip ) {
	skip = 0;
	/* Knock down the skip mode to select all
	 * directories in path after the first ";"
	 */
	strncpy(backmode, mode, MAXBUFSIZE-1);
	backmode[MAXBUFSIZE-1] = '\0';
	mode = backmode;
      }
      if ( pick ) return NULL;
    }

    path = here;
    if ( here && (here = strpbrk(here, ":;")) ) {
      mark = *here;
      *here++ = '\0';
    }
  }

  return NULL;
}


/*
 *
 * 	public routines 
 *
 */

/*
 *
 * ResolvePath -- resolve the path to remove . and .. entries
 *
 */
#ifdef ANSI_FUNC
char *
ResolvePath (char *ibuf, char *obuf, int maxlen)
#else
char *ResolvePath(ibuf, obuf, maxlen)
     char *ibuf;
     char *obuf;
     int  maxlen;
#endif
{
  char path[MAXBUFSIZE];
  char *part[MAXBUFSIZE];
  char *tbuf;
  int i, j;
  int len;
  int npart=0;

  /* if we have no path separators, we really don't have much to do! */
  if( strchr(ibuf, '/') == NULL ){
    strncpy(obuf, ibuf, maxlen-1);
    obuf[maxlen-1] = '\0';
    return(obuf);
  }

  /* if its just "/" or "/.", its easy */
  if( !strcmp(ibuf, "/") || !strcmp(ibuf, "/.") ){
    strncpy(obuf, "/", maxlen-1);
    obuf[maxlen-1] = '\0';
    return(obuf);
  }

  /* if we have a relative path to deal with, get current directory */
  if( (*ibuf == '.') || ( (strchr(ibuf, '/') != NULL) && (*ibuf != '/') ) ){
    getcwd(path, MAXBUFSIZE);
  }
  else{
    *path = '\0';
  }

  /* construct the total string we have to deal with */
  len = strlen(path) + strlen(ibuf) + 1;
  tbuf = (char *)xmalloc(len+1);
  if( *path ){
    strcpy(tbuf, path);
    strcat(tbuf, "/");
    strcat(tbuf, ibuf);
  }
  else{
    strcpy(tbuf, ibuf);
  }
  
  /* construct the parts array from this string, removing / characters
     and null-terminating each part */
  for(i=0; i<len; i++){
    if( tbuf[i] == '/' ){
      tbuf[i] = '\0';
      /* skip adjacent slashes */
      if( tbuf[i+1] == '/' ) continue;
      part[npart] = &tbuf[i+1];
      npart++;
    }
  }

  /* loop through the parts array and resolve the  . and .. entries */
  for(i=0; i<npart; i++){
    /* for ".", just remove it */
    if( !strcmp(part[i], ".") ){
      part[i] = NULL;
    }
    /* for "..", also remove the previous part -- if possible */
    else if( !strcmp(part[i], "..") ){
      part[i] = NULL;
      for(j=i-1; j>=0; j--){
	if( part[j] ){
	  part[j] = NULL;
	  break;
	}
      }
    }
  }

  /* construct a new string from the remaining parts */
  *obuf = '\0';
  len = 0;
  for(i=0; i<npart; i++){
    if( part[i] != NULL ){
      if( len+(int)strlen(part[i])+1 <= maxlen-1 ){
	strcat(obuf, "/");
	strcat(obuf, part[i]);
	len += strlen(part[i])+1;
      }
      else{
	break;
      }
    }
  }

  /* free up buffer space */
  if( tbuf ) free(tbuf);

  /* return the string */
  return(obuf);
}

#ifdef ANSI_FUNC
void
ExpandEnv (char *name, char *envname, int maxlen)
#else
void ExpandEnv(name, envname, maxlen)
     char *name;
     char *envname;
     int maxlen;
#endif
{
  char brace[2];
  char tbuf[MAXBUFSIZE];
  char *fullname=NULL;
  char *mip;
  char *ip;
  char *s;
  int len;
  int i=0, j=0;

  /* allocate temp working buffer (so dest can be same as source) */
  if( !(fullname=(char *)xcalloc(maxlen, sizeof(char))) ) return;

  /* process each character */
  for(ip=name; *ip; ip++){
    /* if its not beginning of an env, just store and loop */
    if( *ip != '$' ){
      fullname[i++] = *ip;
      fullname[i] = '\0';
    }
    else{
      mip = ip;
      /* skip past '$' */
      ip++;
      /* skip past brace, if necessary */
      if( *ip == '{' ){
	brace[0] = '{';
	ip++;
      }
      else if( *ip == '(' ){
	brace[0] = '(';
	ip++;
      }
      else
	brace[0] = '\0';
      /* get variable up to next white space */
      for(*tbuf='\0', j=0;
	  (!isspace((int)*ip)) && (*ip != '"') && (*ip != '\'') && (*ip);
	  ip++){
	/* look for trailing brace, if necessary */
	if( *brace && *ip == (*brace == '(' ? ')' : '}') ){
	  ip++;
	  break;
	}
	/* a "/" will end the environment variable as well */
	if( *ip == '/' ){
	  break;
	}
	tbuf[j++] = *ip;
	tbuf[j] = '\0';
      }
      /* back up so we can process the white space in the outer loop */
      ip--;
      if( (s = (char *)getenv(tbuf)) != NULL ){
	i += strlen(s);
	if( i <= maxlen )
	  strcat(fullname, s);
      }
      /* if we don't recognize this macro, put it back onto the string */
      else{
	len = ip - mip + 1;
	i += len;
	if( i <= maxlen )
	  strncat(fullname, mip, len);
      }
    }
  }

  /* transfer to output buffer */
  strncpy(envname, fullname, maxlen);

  /* free up temp space */
  if( fullname ) xfree(fullname);
}

#ifdef ANSI_FUNC
char *
Access (char *name, char *mode)
#else
char *Access (name, mode)
     char *name;
     char *mode;
#endif
{
  struct stat info;
  char fullname[MAXBUFSIZE];
  char AccessName[MAXBUFSIZE];


  ExpandEnv(name, fullname, MAXBUFSIZE);
  if ( stat(fullname, &info) !=0 ) return NULL;

#if HAVE_MINGW32==0 && HAVE_CYGWIN==0
  if ( mode ) {
    int m = amparse(mode);

    /* distinguish between directories and files */
    if (  (m & D_OK) && !(info.st_mode & S_IFDIR) ) return NULL;
    if ( !(m & D_OK) &&  (info.st_mode & S_IFDIR) ) return NULL;

    if ( getuid() == info.st_uid ) {
	if ( m & R_OK && !(info.st_mode & S_IRUSR) ) return NULL;
	if ( m & W_OK && !(info.st_mode & S_IWUSR) ) return NULL;
	if ( m & X_OK && !(info.st_mode & S_IXUSR) ) return NULL;
    } else
      if ( getgid() == info.st_gid ) {
	if ( m & R_OK && !(info.st_mode & S_IRGRP) ) return NULL;
	if ( m & W_OK && !(info.st_mode & S_IWGRP) ) return NULL;
	if ( m & X_OK && !(info.st_mode & S_IXGRP) ) return NULL;
      } else {
	if ( m & R_OK && !(info.st_mode & S_IROTH) ) return NULL;
	if ( m & W_OK && !(info.st_mode & S_IWOTH) ) return NULL;
	if ( m & X_OK && !(info.st_mode & S_IXOTH) ) return NULL;
      }
  }
#endif

  ResolvePath(fullname, AccessName, MAXBUFSIZE);
  return(xstrdup(AccessName));
}

#ifdef ANSI_FUNC
char *
Find (char *name, char *mode, char *exten, char *path)
#else
char *Find (name, mode, exten, path)
     char *name;
     char *mode;
     char *exten;
     char *path;
#endif
{
  char	extenbuff[MAXBUFSIZE];
  char	namebuff[MAXBUFSIZE];
  char 	*here, *found;
  int    len;

  /* sanity check */
  if( !name || !*name )
    return NULL;

  /* if its a WWW file, we just say 'yes' */
  if( !strncmp(name, "ftp://",  6) ||
      !strncmp(name, "http://", 7) ){
    return(xstrdup(name));
  }

  if ( exten == NULL )
    return findpath(name, mode, path);
  
  strncpy(extenbuff, exten, MAXBUFSIZE-1);
  extenbuff[MAXBUFSIZE-1] = '\0';
  exten = extenbuff;

  if ( (here = strpbrk(extenbuff, ":;")) ) *here++ = '\0';

  while ( exten ) {
    if ( exten[0] == '$' ) {
      if ( (exten = (char *)getenv(&exten[1])) )
	if ( (found = Find(name, mode, exten, path)) )
	  return found;
    } else {
      char *e = strstr(name, exten);
      
      strncpy(namebuff, name, MAXBUFSIZE-1);
      namebuff[MAXBUFSIZE-1] = '\0';
      len = strlen(namebuff);
      if ( (e==NULL) || ( e && *(e + len)) ){
	if( len+strlen(exten) <= MAXBUFSIZE-1 )
	  strcat(namebuff, exten);
	/* filename is too large, so we can't find it */
	else
	  return NULL;
      }

      if ( (found = findpath(namebuff, mode, path)) )
	return found;
      
    }
    
    exten = here;
    if ( here && (here = strpbrk(here, ":;")) ) *here++ = '\0';
  }
  
  return NULL;
}
