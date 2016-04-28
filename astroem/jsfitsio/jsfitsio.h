fitsfile *openFITSFile(char *ifile, char *extlist, int *hdutype, int *status);

fitsfile *openFITSMem(void **buf, size_t *buflen, char *extlist, 
		      int *hdutype, int *status);

fitsfile *filterTableToImage(fitsfile *fptr, char *filter, char **cols,
			     int *dims, double *cens, int bin, int *status);

int *getImageToArray(fitsfile *fptr, int *dims, double *cens, char *slice,
		     int *odim1, int *odim2, int *bitpix, int *status);

void getHeaderToString(fitsfile *fptr, char **cardstr, int *ncard, int *status);

void closeFITSFile(fitsfile *fptr, int *status);

