#if HAVE_CONFIG_H
#include <conf.h>
#endif
#include <stdio.h>
#include <ctype.h>
#include <string.h>
#include <stdlib.h>
double strtod();
#include <math.h>

int SAOdtype=0;

double	SAOstrtod(str, ptr)
	char	 *str;
	char	**ptr;
{
	double	 d = 0.0;
	double	 m = 0.0;
	double	 s = 0.0;
	char	*p, *px;
        char     c;

        SAOdtype = 0;
 
        if ( ptr == NULL ) ptr = &p;
        while ( *str == ' ' ) str++;
 
 
        /* No base implied (yet).
         */
        d = strtod(str, ptr);
	px = *ptr;

	if( strchr(str, (int)'.') )
	   SAOdtype = '.';

        if ( ( c = **ptr )
          && ( c == 'h' || c == 'd' || c == ':' || c == ' ' || c == 'm' )
          && ( (*ptr - str) <= 4 )
          && ( ( isdigit((int)*((*ptr)+1)) )
	    || ( (*((*ptr)+1)) == ' ' && isdigit((int)*((*ptr)+2)) ) ) ) {
                double   sign = 1.0;

	    SAOdtype = c;
            (*ptr)++;
 
            if ( *str == '-' ) {
                sign = -1.0;
                d = -d;
            }

	    m = strtod(*ptr, ptr);

	    if ( c == 'm' ) {
		s = m;
		m = d;
		d = 0.0;
	    } else
		if ( ( c = **ptr )
		  && ( c == ':' || c == ' ' || c == 'm' )
		  && ( (*ptr - px) <= 3 )
		  && ( ( isdigit((int)*((*ptr)+1)) ) 
 	         || ( (*((*ptr)+1)) == ' ' && isdigit((int)*((*ptr)+2))))) {
     
		    (*ptr)++;

		    s = strtod(*ptr, ptr);
		}
 
            return sign * (d + m / 60 + s / 3600);
        } else if( (c = **ptr) &&
		   (c == 'd' || c == 'r' || c == '\'' || c == '"') && 
		   ((*((*ptr)+1)) == '\0') ){
	  SAOdtype = c;
	  (*ptr)++;
	  return d;
	}
 
        /* I guess that there weren't really any units.
	 */
	return d;
}

char *SAOconvert(buff, val, type, prec)
	char	*buff;
	double	 val;
	int	 type;
	int	 prec;
{
                char    fmt[32];
                char   *sign = "";
 
                float   degrees = val;
                float   minutes;
                float   seconds; 
 
                char    ch1, ch2;
 
        switch ( type ) {
         case 'b': {
		int		v = val;
		unsigned int	i;
		int		c = 2;

		buff[0] = '0';
		buff[1] = 'b';

		for ( i = 0x8000; i; i /= 2 ) {
			if ( v & i || c > 2 ) {
				buff[c] = v & i ? '1' : '0';
				c++;
			}
		}

		buff[c] = '\0';
                return buff;
	 }
         case 'o':
                sprintf(buff, "0o%o", (int) val);
                return buff;
 
         case 'x':
                sprintf(buff, "0x%x", (int) val);
                return buff;
 
         case ':':      ch1 = ':';      ch2 = ':';      break;
         case ' ':      ch1 = ' ';      ch2 = ' ';      break;
         case 'h':      ch1 = 'h';      ch2 = 'm';      break;
         case 'd':      ch1 = 'd';      ch2 = 'm';      break;
         case 'm':      ch1 = 'm';      ch2 = 'm';      break;
         default: 	return 0;
        }
 
        if ( degrees < 0.0 ) {
                sign = "-";
                degrees = - degrees;
        }

	minutes = (degrees - ((int) degrees)) * 60;
	if ( minutes < 0 ) minutes = 0.0;
	seconds = (minutes - ((int) minutes)) * 60;
	if ( seconds < 0 ) seconds = 0.0;
 
	if ( prec == -1 ){
	    if ( type == 'h' ) prec = 4;
	    else	       prec = 3;
	}
	if ( prec == -2 ) {
 	  	if ( type  == 'm' ){
		     if ( seconds < 10.0 )
			sprintf(buff, "%s%d%c0%g"
			    , sign, (int)(minutes+degrees*60), ch2, seconds);
		     else
			sprintf(buff, "%s%d%c%g"
			    , sign, (int)(minutes+degrees*60), ch2, seconds);
		}
		else if ( seconds < 10.0 )
			sprintf(buff, "%s%d%c0%2d%c0%g"
			    , sign, (int) (degrees)
			    , ch1 , (int) (minutes)
			    , ch2, seconds);
		else
			sprintf(buff, "%s%d%c%2d%c%g"
			    , sign, (int) (degrees)
			    , ch1 , (int) (minutes)
			    , ch2, seconds);
	} else {
		double 	p = pow(10.0, (double) prec);
		int 	m = minutes;
		int 	d = degrees;

                if ( (((int)(seconds * p + .5))/ p) >= 60 ) {
                        seconds  = 0.0;
                        m++;
                        if ( m >= 60 ) {
                                m = 0;
                                d++;
                        }
                }

                if ( (((int)(seconds * p + .5))/ p) < 10.0 )
			sprintf(fmt, "%%s%%d%c%%2.2d%c0%%.%df", ch1, ch2, prec);
		else
			sprintf(fmt, "%%s%%d%c%%2.2d%c%%.%df" , ch1, ch2, prec);

                sprintf(buff, fmt, sign, d, m, seconds);
	}

	return buff;
}

