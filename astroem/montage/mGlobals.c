/*
 * mGlobals.c -- allocate space for variables that are global to Montage
 *
 * added by EGM 11/19/19 to fix "multiply-defined" errors (emscripten 1.39.x)
 *
 */

#include <stdio.h>
FILE *fstatus = NULL;
int coord_debug = 0;
