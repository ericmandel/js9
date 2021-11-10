// generic size of 'large' buffers
#define IDXLEN 1024

// sort program name
#define SORTPROG "sortidx"

// looking for exact value?
#define INEXACT 0
#define EXACT 1

// left or right edge, if there are multiple values
#define LEFT_EDGE -1
#define RIGHT_EDGE 1

// limit ops
enum idxops {eq=1,ge,gt,le,lt};

// record struct for using an index
typedef struct idxrec {
  // fits file info
  fitsfile *fptr;
  // index file info
  char *filename;
  int fd;
  int fsize;
  // column info
  char *colname;
  int coltype;
  int coloffset;
  int rowsize;
  long nrow;
  // limit info
  int n;
  int ilim[2];
  double dlim[2];
  enum idxops op[2];
} *Idx, IdxRec;

// public routine for using an index
int idx_find_rows(fitsfile *fptr, char *filter, long firstrow, long nrow,
		  long *nselectrow, char *selectrow, int *status);
