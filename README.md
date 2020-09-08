[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.4019782.svg)](https://doi.org/10.5281/zenodo.4019782)

[![Twitter](https://img.shields.io/twitter/url/https/twitter.com/espadrine.svg?style=social&label=Follow%20%40astrosoftware)](https://twitter.com/astrosoftware)

JS9: astronomical image display everywhere
==========================================

![JS9](images/js9Readme.png)

What does it do?
----------------

  - display FITS images, binary tables, data cubes, and multi-extension files
  - colormaps, scaling, pan, zoom, binning, blending, print, export ...
  - region support: create, manipulate, import, export, ...
  - drag and drop images, regions, catalogs
  - server-side and local analysis using the JS9 public API
  - control JS9 using scripts from the Linux shell or Python
  - runs on Macs, Linux, Windows, iPads, iPhones, ...
  - runs as a Desktop app in all modern browsers
  - utilizes WebAssembly (FITS processing at near native speed!)

How can I try it out?
---------------------

Go to [JS9 web site](https://js9.si.edu) and drag a
[FITS](https://fits.gsfc.nasa.gov/) data file onto the JS9 display:

    https://js9.si.edu

You can even specify a remote FITS file and associated image display parameters
as part of the URL:

    https://js9.si.edu/js9/js9.html?url=https://hea-www.cfa.harvard.edu/~eric/coma.fits.gz&colormap=cool

The JS9 web site also contains on-line documentation, demos, and
release downloads.


To install or not to install ...
--------------------------------

For many users, there is no need to install JS9: simply use the [JS9 web
site](https://js9.si.edu) to display your data. You can even upload your
FITS files to the web site and run our server-side analysis.

Installing JS9 allows you to create your own web pages, tailor site
parameters, and add your own local and server-based analysis tasks. Grab the
latest version from [JS9 on GitHub](https://github.com/ericmandel/js9):

    git clone https://github.com/ericmandel/js9

Load a local page into your browser:

    file:///path/to/js9/js9.html

(NB: Chrome needs to run with the --allow-file-access-from-files switch to use
the file URI.)

For Desktop use, install [Electron.js](https://www.electronjs.org/)
and use the *js9* script to start the Desktop app and load an image:

    js9 -a ~/data/m13.fits

For more advanced support (web-based support, support for handling large files),
build the JS9 helper and install JS9 in a web directory:

    # configure location to install the JS9 web files,
    # where to find cfitsio library and include files,
    # where to install programs and scripts,
    # what sort of helper to build:
    ./configure --with-webdir=[path_to_web_install] \
                --with-cfitsio=[path_to_cfitsio]    \
                --prefix=[path_to_prog_install]     \
                --with-helper=nodejs

    # the usual ...
    make
    make install

    # start helper
    cd path_to_web_install
    # in the bash shell:
    node js9Helper.js 1>~/logs/js9node.log 2>&1 &
    # or, in the tcsh shell:
    node js9Helper.js >& ~/logs/js9node.log &

What about scripting?
---------------------

The *js9* script allows you to control a JS9 web page from the Linux
command line using the JS9 Public API (scripting requires installation of
JS9 and either [node.js](https://nodejs.org/) or
[Electron.js](https://www.electronjs.org/)):

    js9 Load chandra.fits '{"scale":"log","colormap":"red","contrast":5.78,"bias":0.15}'
    js9 Load spitzer.fits '{"scale":"log","colormap":"blue","contrast":6.3,"bias":0.54}'
    js9 ReprojectData chandra.fits

Python users can install [pyjs9](https://github.com/ericmandel/pyjs9):

    git clone https://github.com/ericmandel/pyjs9
    ...
    import pyjs9
    j = pyjs9.JS9()
    j.Load('chandra.fits', '{"scale":"log","colormap":"red","contrast":5.78,"bias":0.15}')
    j.Load('spitzer.fits', '{"scale":"log","colormap":"blue","contrast":6.3,"bias":0.54}')
    j.ReprojectData('chandra.fits')

What's the license?
-------------------

JS9 is distributed under the terms of The MIT License.

What's the release history?
---------------------------
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.4019782.svg)](https://doi.org/10.5281/zenodo.4019782) __v3.1.0__ &nbsp; (09/08/2020)

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.3598590.svg)](https://doi.org/10.5281/zenodo.3598590) __v3.0.0__ &nbsp; (01/06/2020)

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.3382228.svg)](https://doi.org/10.5281/zenodo.3382228) __v2.5.0__ &nbsp; (08/30/2019)

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.3336303.svg)](https://doi.org/10.5281/zenodo.3336303) __v2.4.0__ &nbsp; (07/15/2019)

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.2656473.svg)](https://doi.org/10.5281/zenodo.2656473) __v2.3.0__ &nbsp; (05/1/2019)

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.1453307.svg)](https://doi.org/10.5281/zenodo.1453307) __v2.2.0__ &nbsp; (10/9/2018)

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.1244660.svg)](https://doi.org/10.5281/zenodo.1244660) __v2.1.0__ &nbsp; (05/10/2018)

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.1116902.svg)](https://doi.org/10.5281/zenodo.1116902) __v2.0.2__ &nbsp; (12/15/2017)

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.999343.svg)](https://doi.org/10.5281/zenodo.999343)&nbsp; __v2.0.1__ &nbsp; &nbsp;(09/29/2017)

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.998178.svg)](https://doi.org/10.5281/zenodo.998178)&nbsp; __v2.0.0__ &nbsp; (09/27/2017)

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.834742.svg)](https://doi.org/10.5281/zenodo.834742)&nbsp; __v1.12.0__ &nbsp; (07/25/2017)

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.235865.svg)](https://doi.org/10.5281/zenodo.235865)&nbsp; __v1.11.0__ &nbsp; (1/9/2017)

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.160117.svg)](https://doi.org/10.5281/zenodo.160117)&nbsp; __v1.10.0__&nbsp; (10/11/2016)

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.158950.svg)](https://doi.org/10.5281/zenodo.158950)&nbsp; __v1.9.0__ &nbsp; (6/8/2016)



Who's responsible?
------------------

Eric Mandel, Alexey Vikhlinin

Center for Astrophysics | Harvard & Smithsonian
