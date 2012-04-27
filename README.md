NURBSForTHREE
=============

Implements NURBS curves and surfaces to use with THREE.js

It also provides classes that could be used for interactively modifying curves 
and surfaces and classes and functions for modelling surfaces.


Surface modelling mechanisms
===============================

There are three mechanisms for the modelling of surfaces: sweep, sum and rotate. 
(Look at src/NURBSSurfaceUtils.js:NURBSSurfaceBuilder)

sweep can be used to create a surface by 'sweeping' a NURBS curve along a 
vector.

sum can be used to 'sum' two curves together to create a surface.

rotate can be used to create surfaces of rotation by rotating a curve along an 
axis.
