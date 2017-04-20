[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.235865.svg)](https://doi.org/10.5281/zenodo.235865)

JS9: astronomical image display everywhere
==========================================

![JS9](js9Readme.png)

What does it do?
----------------

  - display FITS images, binary tables, data cubes, and multi-extension files
  - colormaps, scaling, pan, zoom, binning, blending, print, export ...
  - region support: create, manipulate, import, export, ...
  - drag and drop images, regions, catalogs
  - server-side and local analysis using the JS9 public API
  - control JS9 using scripts from the Linux shell or Python
  - runs on Macs, Linux, Windows, iPads, iPhones, ...
  - as a Desktop app, in all modern browsers, mobile apps are coming ...

How can I try it out?
---------------------

Go to [JS9 web site](http://js9.si.edu) and drag a
[FITS](https://fits.gsfc.nasa.gov/) data file onto the JS9 display:

    http://js9.si.edu

The JS9 web site also contains on-line documentation, demos, and
release downloads.


To install or not to install ...
--------------------------------

For many users, there is no need to install: simply use the [JS9 web
site](http://js9.si.edu) to display your data. You can even upload your
FITS files to the web site and run our server-side analysis.

Installing JS9 allows you to create your own web pages, tailor site
parameters, and add your own local and server analysis tasks. Grab the
latest version from [JS9 on GitHub](https://github.com/ericmandel/js9):

    git clone https://github.com/ericmandel/js9

Load a local page into your browser:

    file:///path/to/js9/js9.html

(NB: Chrome needs to run with the --allow-file-access-from-files switch to use
the file URI.)

For Desktop use, install [Electron.js](http://electron.atom.io) and configure:

    ./mkjs9 -q

Use the *js9* script to start the Desktop app and load an image:

    js9 -a ~/data/m13.fits

What about scripting?
---------------------

The *js9* script allows you to control a JS9 web page from the Linux
command line using the JS9 Public API (scripting requires installation of
JS9 and either [node.js](https://nodejs.org/) or
[Electron.js](http://electron.atom.io)):

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

Who's responsible?
-------------------

Eric Mandel, Alexey Vikhlinin

Harvard-Smithsonian Center for Astrophysics
