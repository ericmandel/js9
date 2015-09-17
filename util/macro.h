/*
 *	Copyright (c) 2015 Smithsonian Astrophysical Observatory
 */

/*
 *
 * macro.h - include file for the macro expander
 *
 */

#ifndef	__macro_h
#define	__macro_h

#include "xutil.h"

typedef char *(*MacroCall)(char *s, void *client_data);

char *ExpandMacro(char *icmd, char **keyword, char **value, int nkey,
		  MacroCall client_callback, void *client_data);

#endif /* __macro.h */
