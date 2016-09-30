[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.158950.svg)](https://doi.org/10.5281/zenodo.158950)

JS9: image display right in your browser
========================================

What does it do?
----------------

JS9 brings astronomical image display to your browser:

  - display FITS images and tables in a web page
  - display FITS data cubes and multi-extension files
  - drag and drop FITS images and tables
  - retrieve FITS files from data archives
  - change the colormap and scale
  - image pan, zoom and blink, table binning
  - image arithmetic, Gaussian smoothing
  - blend images and apply RGB image filters
  - configure mouse movements and touch events
  - create and manipulate regions of interest
  - extend JS9 using plugins and the public API
  - perform data analysis (local and server-side)
  - configure and control JS9 from within a web page
  - control JS9 from a command shell or Python
  - print images, save images, etc ...

Where can I learn more ... or try it out?
---------------------------------------

The [JS9 web site](http://js9.si.edu) contains on-line documentation, demos, and release downloads:

    http://js9.si.edu

Just drag and drop your FITS files onto the JS9 display ...

Of course, the latest version is available here on GitHub:

    https://github.com/ericmandel/js9

Python users might want to look at pyjs9, the Python connection to JS9:

    https://github.com/ericmandel/pyjs9

To install or not to install ...
--------------------------------

JS9 is changing how we think about image display and analysis, moving
beyond the Desktop into the web. You can simply drag and drop a FITS
image from your computer onto a JS9 display. All of basic JS9/DS9
functionality is immediately available: zoom, pan, colormaps, scaling,
regions, WCS, etc.

So, in principle, there is no need to install anything: just use the 
[JS9 web site](http://js9.si.edu)
to view your FITS images. Simply drag and drop an image onto the JS9 display.

Obviously, more flexibility is available if you download JS9.
For full installation instructions, start with help/install.html. But
really, just clone or download the JS9 source, display the js9.html page
in your browser, and drag and drop a FITS file onto the JS9 display.

You can extend JS9 using the Plugin facility in combination with the
JS9 Public API. For example, you can perform browser-based analysis on
the displayed image. On the [JS9 web site](http://js9.si.edu), click the
Plugins tab, create a region, and move it around ...

In addition, URL-based data files support server-side analysis (using
the original data files on the back-end server).  Server-side analysis
can be run, for example, in response to region changes, with the results
displayed back in your browser. On the [JS9 web site](http://js9.si.edu),
click the Analysis tab, choose a task, create a region, and move it around ...

We are very interested in exploring new uses for JS9 as we evolve its
functionality in response to community needs. If you would like to 
join the fun, please contact me at: eric@cfa.harvard.edu.

What's the license?
-------------------

JS9 is distributed under the terms of The MIT License.

Who is responsible?
-------------------

Eric Mandel, Alexey Vikhlinin

Harvard-Smithsonian Center for Astrophysics
