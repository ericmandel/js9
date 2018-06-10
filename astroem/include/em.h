/*
 *	Copyright (c) 2018 Smithsonian Astrophysical Observatory
 */

/*
 *
 * em.h -- declarations for emscripten-specific calls
 *
 */

#ifndef	__em_h
#define	__em_h

#define EM_SETJMP setjmp(em_jmpbuf)

extern jmp_buf em_jmpbuf;

void em_exit(int n);

#endif
