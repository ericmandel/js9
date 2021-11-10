fitsfile *openFITSFile(char *ifile, int iomode, char *extlist, char *opts,
		       int *hdutype, int *status);

fitsfile *openFITSMem(void **buf, size_t *buflen, char *extlist, char *opts,
		      int *hdutype, int *status);

void getHeaderToString(fitsfile *fptr,
		       char **cardstr, int *ncard, int *status);

void updateWCS(fitsfile *fptr, fitsfile *ofptr,
	       int xcen, int ycen, int dim1, int dim2, double bin,
	       double *amin);

void *getImageToArray(fitsfile *fptr,
		      int *dims, double *cens, double bin, int binMode,
		      char *slice, char *opts,
		      int *start, int *stop, int *bitpix, int *status);

fitsfile *filterTableToImage(fitsfile *fptr,
			     char *filter, char *cols,
			     int *dims, double *cens, double bin, char *opts,
			     int *status);

fitsfile *createCubeFromTable(fitsfile *fptr,
			      char *filter, char *cols,
			      int *dims, double *cens, double bin, char *opts,
			      int *status);

void closeFITSFile(fitsfile *fptr, int *status);
