/* Module: mNaN.h

Version  Developer        Date     Change
-------  ---------------  -------  -----------------------
2.0      John Good        17Nov14  Change to 'isfinite()' macro
*/

#ifndef _BSD_SOURCE
#define _BSD_SOURCE
#endif

#include <math.h>

#define mNaN(x) isnan(x) || !isfinite(x)

