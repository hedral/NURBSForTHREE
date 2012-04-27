// TODO: move these functions away from here
function printVerticesPosition(v)
{
  for (i = 0; i < v.length; i++)
  {
    console.log(i + "\t" + v[i].position.x + ", " +
                           v[i].position.y + ", " +
                           v[i].position.z);
  }
}

/**
 * @author santiago ferreira / http://lirius.org/
 */

// ============================================================================
// MISC UTILITY FUNCTIONS
// ============================================================================

/** converts worldPos to screen coordinates **/
function worldToScreen ( worldPos ) {

  var windowHalfX = window.innerWidth  / 2;
  var windowHalfY = window.innerHeight / 2;

  var screenPos = worldPos.clone();
  projector.projectVector( screenPos, camera );
  screenPos.x = ( screenPos.x + 1 ) * windowHalfX;
  screenPos.y = ( - screenPos.y + 1) * windowHalfY;
  return screenPos;
}

// TODO: this is not working
function screenToWorld ( screenPos ) {

  var windowHalfX = window.innerWidth  / 2;
  var windowHalfY = window.innerHeight / 2;

  var worldPos = screenPos.clone();
  worldPos.x = worldPos.x / windowHalfX - 1;
  worldPos.y = - worldPos.y / windowHalfY + 1;
  projector.unprojectVector( worldPos, camera );
  return worldPos;                    
}

/**
 * @param A a point in the line
 * @param V line direction vector, Note: V returns normalized
 * @param P point outside of the line
 * @returns vector from P to line defined by A and V
 */
function vectorFromLineToPoint ( A, V, P ) {

  V.normalize();
  var A_minus_P = new THREE.Vector3(0,0,0);
  A_minus_P.x = A.x - P.x;
  A_minus_P.y = A.y - P.y;
  A_minus_P.z = A.z - P.z;

  var A_minus_P_dot_V = A_minus_P.x * V.x +
                        A_minus_P.y * V.y +
                        A_minus_P.z * V.z;

  var A_minus_P_dot_V_times_V = new THREE.Vector3(0,0,0);
  A_minus_P_dot_V_times_V.x = A_minus_P_dot_V * V.x;
  A_minus_P_dot_V_times_V.y = A_minus_P_dot_V * V.y;
  A_minus_P_dot_V_times_V.z = A_minus_P_dot_V * V.z;

  // v: vector from point to line
  var v = new THREE.Vector3(0,0,0);
  v.x = A_minus_P_dot_V_times_V.x - A_minus_P.x ;
  v.y = A_minus_P_dot_V_times_V.y - A_minus_P.y ;
  v.z = A_minus_P_dot_V_times_V.z - A_minus_P.z ;

  return v;
};



// ============================================================================
// NURBS CURVES
// ============================================================================

/**
 * Defines NURBS bounding box geometry
 * @param curve NURBSCurve object
 */
THREE.NURBSCurveBoxGeometry = function ( curve ) {

  THREE.Geometry.call( this );

  var scope = this;

  // TODO: check for type
  this.curve = curve || new THREE.NURBSCurve();

  this.vertices = new Array();

  //for ( p in this.curve.points ) {
  for (p = 0; p < this.curve.points.length; p++) {

    this.vertices.push( new THREE.Vertex(this.curve.points[p]) );

  }
};
THREE.NURBSCurveBoxGeometry.prototype = new THREE.Geometry();
THREE.NURBSCurveBoxGeometry.prototype.constructor =
  THREE.NURBSCurveBoxGeometry;


/**
 * Builds NURBS curve, its bounding box and its control points.
 * This is meant to be used as a tool for modelling NURBS curves interactively
 * @param curve THREE.NURBSCurve object
 */
NURBSCurveBuilder = function ( curve, name ) {

  this.curve = curve || THREE.NURBSCurve();
  this.name = name || "";

  // curve mesh
  this.curveGeometry = new THREE.NURBSCurveGeometry( this.curve, 100);
  this.curveGeometry.dynamic = true;

  this.curveMaterial = new THREE.LineBasicMaterial(
                           {color:     0x550000,
                            opacity:   1,
                            linewidth: 3});

  this.curveMesh = new THREE.Line( this.curveGeometry, this.curveMaterial );
  this.curveMesh.name = this.name + "_curve";
  

  // bounding box
  this.boundBoxGeometry = new THREE.NURBSCurveBoxGeometry(this.curve);

  this.boundBoxMaterial = new THREE.LineBasicMaterial(
                              {color: 0x005555,
                               opacity: 1,
                               linewidth: 1});

  this.boundBoxMesh = new THREE.Line(this.boundBoxGeometry,
                                     this.boundBoxMaterial);

  this.boundBoxMesh.name = this.name + "_bbox";
  
  
  // control points
  // TODO: better way to determine radius of control points
  controlPointRadius = (this.curveGeometry.boundingSphere.radius) * 0.0125;
  this.controlPointGeometry = new THREE.SphereGeometry( controlPointRadius );

  this.controlPointsGroup = new THREE.Object3D();

  for (p in this.curve.points) {
  
    this.cPointMaterial = new THREE.MeshBasicMaterial( { color: 0x006699,
                                                         opacity: 1 } );

    var cPoint  = new THREE.Mesh( this.controlPointGeometry,
                                  this.cPointMaterial );

    cPoint.translateX( this.curve.points[p].x );
    cPoint.translateY( this.curve.points[p].y );
    cPoint.translateZ( this.curve.points[p].z );
    
    cPoint.name = this.name + "_cpoint_" + p;

    this.controlPointsGroup.add( cPoint );
  }
};

NURBSCurveBuilder.prototype.addToScene = function( scene ) {

  scene.add( this.curveMesh );
  scene.add( this.boundBoxMesh );
  scene.add( this.controlPointsGroup );
};


/** Fills screenCoord array with the screen coordinates corresponding to the 
 *  curve's control points
 */
NURBSCurveBuilder.prototype.updateScreenCoordinates = function() {

  // define screenCoord in NURBSCurveBuilder constructor and update here
  this.screenCoord = new Array();
  for ( p = 0; p < this.controlPointsGroup.children.length; p++ ) {

    this.screenCoord.push(
      worldToScreen(this.controlPointsGroup.children[p].position) );
  }
};

/**
 * Moves control point cpIndex with vector v
 */
NURBSCurveBuilder.prototype.moveControlPoint = function( cpIndex, v ) {

  if (cpIndex >= 0 && cpIndex < this.controlPointsGroup.children.length) {

    // control point
    var cp = this.controlPointsGroup.children[cpIndex];
    cp.position.addSelf(v);

    // bounding box and curve
    var bb = this.boundBoxMesh.geometry.vertices[cpIndex];
    bb.position.addSelf(v);
  }
};

// TODO: this function needs to be optimized, it is not necessary to 
//       rebuild the whole curve, only the affected spans
NURBSCurveBuilder.prototype.rebuild = function( ) {

  v = this.curveGeometry.vertices;
  n = this.curveGeometry.numPoints;

  for (var i = 0; i < n; i++)
    v.push(new THREE.Vertex(this.curve.getPoint(i / (n-1))));

  this.curveGeometry.vertices.splice(0, n);
};

/**
 * Set control point cpIndex to point p
 */
NURBSCurveBuilder.prototype.setControlPoint = function( cpIndex, p ) {

  if (cpIndex >= 0 && cpIndex < this.controlPointsGroup.children.length) {

    // control point
    var cp = this.controlPointsGroup.children[cpIndex];
    cp.position = p;

    // bounding box and curve
    var bb = this.boundBoxMesh.geometry.vertices[cpIndex];
    bb.position = p;
  }
};





// ============================================================================
// NURBS SURFACES
// ============================================================================

// TODO: create bound box geometry like with NURBS curves

/**
 * @param technique:  0: sweep curve by vector auxParam
 *                    1: sum two curves
 *                    3: create rotaion surface
 *
 * @param auxParam: if technique = 0, then: auxParam should be a sweep vector
 *                  if technique = 1, then: auxParam should be the summing curve
 *                  if technique = 2, then: auxParam should be an array defining
 *                                          the axis of ratation
 *                                          
 */
NURBSSurfaceBuilder = function ( curve, technique, auxParam, name ) {

  this.name = name || "";
  this.technique = technique || 0;

  // auxParam is THREE.Vector3
  if (technique == 0)
    this.doSweep( curve, auxParam );

  // auxParam is NURBSCurve
  else if (technique == 1)
    this.doSum( curve, auxParam );

  else if (technique == 2)
    this.doRotate( curve, auxParam );
}

/**
 * Creates sweep surface
 */
NURBSSurfaceBuilder.prototype.doSweep = function ( curve, sweepVector ) {

  // BUILD SURFACE
  // ==========================================================================
  // Control Points
  var points = new Array();
  points[0] = new Array();   // points[u = 0][] original curve
  points[1] = new Array();   // points[u = 1][] sweep curve
  for (var i = 0; i < curve.points.length; i++)
  {
    points[0][i] = new THREE.Vector3();
    points[1][i] = new THREE.Vector3();
    points[0][i].x = curve.points[i].x;                    // u = 0
    points[0][i].y = curve.points[i].y;
    points[0][i].z = curve.points[i].z;
    points[1][i].x = curve.points[i].x + sweepVector.x;    // u = 1
    points[1][i].y = curve.points[i].y + sweepVector.y;
    points[1][i].z = curve.points[i].z + sweepVector.z;
  }

  // Knot vectors
  var knots = new Object();
  knots.v = curve.knots.slice();
  knots.u = [0, 0, 1, 1];

  // Orders
  var orders = new Object();
  orders.v = curve.order;     // original curve and translated curve
  orders.u = 2;               // straight lines

  this.surface = new THREE.NURBSSurface( points, knots, orders );
  // ==========================================================================

  // bound box, control points and surface
  this.buildBoundBox();
  this.buildControlPoints();
  this.buildSurface();
};

/**
 * Creates surface by summing curve and sumCurve
 * @param sumCurve sumCurve is summed to curve.
 */
NURBSSurfaceBuilder.prototype.doSum = function( curve, sumCurve ) {

  // BUILD SURFACE
  // ==========================================================================
  // Control Points
  // -- calculate relative summing curve (first point = 0,0,0)
  var sumCurveFirst = new THREE.Vector3();
  sumCurveFirst.x = sumCurve.points[0].x;
  sumCurveFirst.y = sumCurve.points[0].y;
  sumCurveFirst.z = sumCurve.points[0].z;

  for (var i = 0; i < sumCurve.points.length; i++)
  {
    sumCurve.points[i].x -= sumCurveFirst.x;
    sumCurve.points[i].y -= sumCurveFirst.y;
    sumCurve.points[i].z -= sumCurveFirst.z;
  }

  var points = new Array();
  for (var i = 0; i < curve.points.length; i++)
  {
    points[i] = new Array();
    for (var j = 0; j < sumCurve.points.length; j++)
    {
      points[i][j] = new THREE.Vector3();
      points[i][j].x = curve.points[i].x + sumCurve.points[j].x;
      points[i][j].y = curve.points[i].y + sumCurve.points[j].y;
      points[i][j].z = curve.points[i].z + sumCurve.points[j].z;
    }
  }
  // Knot vectors
  var knots = new Object();
  knots.u = curve.knots.slice();
  knots.v = sumCurve.knots.slice();

  // Orders
  var orders = new Object();
  orders.u = curve.order;     
  orders.v = sumCurve.order;

  this.surface = new THREE.NURBSSurface( points, knots, orders );
  // == END BUILD SURFACE =====================================================

  // bound box, control points and surface
  this.buildBoundBox();
  this.buildControlPoints();
  this.buildSurface();
};

/**
 * Creates surface of rotation by rotating curve along line
 * @param line equation of the line X = A + tU
 * line[0] = a point on the line (A)
 * line[1] = direction vector    (U)
 */
NURBSSurfaceBuilder.prototype.doRotate = function( curve, line ) {

  // BUILD SURFACE
  // ==========================================================================
  // Control Points
  var points = new Array();

  // equation of the line: X = A + tU
  // A point on the line
  // U direction vector
  var A = line[0];
  var U = line[1];
    console.log("\nA: " + A.x + ", " + A.y + ", " + A.z);
    console.log("u: " + U.x + ", " + U.y + ", " + U.z);

  for (var i = 0; i < curve.points.length; i++)
  {
    points[i] = new Array();
    var P = curve.points[i];

    // NOTE: U returns normalized
    var v = vectorFromLineToPoint( A, U, P );

    // b: point projectd in line (P - v)
    var b = new THREE.Vector3(P.x - v.x, P.y - v.y, P.z - v.z);

    // w: vector perpendicular to v and U
    var w = new THREE.Vector3();
    w.cross(U, v);
    w.x = -w.x; w.y = -w.y; w.z = -w.z;

    if (w.length() == 0)
      console.log("ERROR: NURBSSurfaceBuilder.doRotate: zero cross product");
    w.x = v.length() * w.x / w.length();
    w.y = v.length() * w.y / w.length();
    w.z = v.length() * w.z / w.length();

    var v_plus_w = new THREE.Vector3(v.x + w.x, v.y + w.y, v.z + w.z);
    var v_minu_w = new THREE.Vector3(v.x - w.x, v.y - w.y, v.z - w.z);
    console.log("\nP: " + P.x + ", " + P.y + ", " + P.z);
    console.log(  "b: " + b.x + ", " + b.y + ", " + b.z);
    console.log(  "v: " + v.x + ", " + v.y + ", " + v.z);
    console.log(  "w: " + w.x + ", " + w.y + ", " + w.z);
    console.log(  "v_plus_w: " + v_plus_w.x + ", " + v_plus_w.y + ", " + 
                  v_plus_w.z);
    console.log(  "v_minu_w: " + v_minu_w.x + ", " + v_minu_w.y + ", " + 
                  v_minu_w.z);
                
    // 9 control points corresponding to a circle
    points[i][0] = new THREE.Vector3(v.x + b.x,
                                     v.y + b.y,
                                     v.z + b.z);
    console.log("v.x:          " + (v.x + b.x) + ", " +
                                   (v.y + b.y) + ", " +
                                   (v.z + b.z))
    points[i][1] = new THREE.Vector3(v_plus_w.x + b.x,
                                     v_plus_w.y + b.y,
                                     v_plus_w.z + b.z);
    console.log("v_plus_w.x:   " + (v_plus_w.x + b.x) + ", " +
                                   (v_plus_w.y + b.y) + ", " +
                                   (v_plus_w.z + b.z))
    points[i][2] = new THREE.Vector3(w.x + b.x,
                                     w.y + b.y,
                                     w.z + b.z);
    console.log("w.x:          " + (w.x + b.x) + ", " +
                                   (w.y + b.y) + ", " +
                                   (w.z + b.z))
    points[i][3] = new THREE.Vector3(-v_minu_w.x + b.x,
                                     -v_minu_w.y + b.y,
                                     -v_minu_w.z + b.z);
    console.log("-v_minus_w.x: " + (-v_minu_w.x + b.x) + ", " +
                                   (-v_minu_w.y + b.y) + ", " +
                                   (-v_minu_w.z + b.z))
    points[i][4] = new THREE.Vector3(-v.x + b.x,
                                     -v.y + b.y,
                                     -v.z + b.z);
    console.log("-v.x:         " + (-v.x + b.x) + ", " +
                                   (-v.y + b.y) + ", " +
                                   (-v.z + b.z))
    points[i][5] = new THREE.Vector3(-v_plus_w.x + b.x,
                                     -v_plus_w.y + b.y,
                                     -v_plus_w.z + b.z);
    points[i][6] = new THREE.Vector3(-w.x + b.x,
                                     -w.y + b.y,
                                     -w.z + b.z);
    points[i][7] = new THREE.Vector3(v_minu_w.x + b.x,
                                     v_minu_w.y + b.y,
                                     v_minu_w.z + b.z);
    points[i][8] = new THREE.Vector3(v.x + b.x,
                                     v.y + b.y,
                                     v.z + b.z);
  }
  // Knot vectors
  var knots = new Object();
  knots.u = curve.knots.slice();
  knots.v = [0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 4];

  // Orders
  var orders = new Object();
  orders.u = curve.order;     
  orders.v = 3;

  this.surface = new THREE.NURBSSurface( points, knots, orders );
  // == END BUILD SURFACE =====================================================

  // bound box, control points and surface
  this.buildBoundBox();
  this.buildControlPoints();
  this.buildSurface();

};



/** Builds bounding box for this NURBS surface
 */
NURBSSurfaceBuilder.prototype.buildBoundBox = function( ) {
  this.bbGeom = new Array();
  this.bbMatU = new THREE.LineBasicMaterial( {color:     0x5555FF,
                                              opacity:   1,
                                              linewidth: 1});
  this.bbMatV = new THREE.LineBasicMaterial( {color:     0xAAFF55,
                                              opacity:   1,
                                              linewidth: 1});
  this.bbMeshU = new THREE.Object3D();
  this.bbMeshU.name = this.name + "_bbMeshU";
  this.bbMeshV = new THREE.Object3D();
  this.bbMeshV.name = this.name + "_bbMeshV";

  // u control points
  for (var i = 0; i < this.surface.points.length; i++)
  {
    this.bbGeom[i] = new THREE.Geometry();
    for (var j = 0; j < this.surface.points[0].length; j++)
      this.bbGeom[i].vertices.push( new THREE.Vertex(this.surface.points[i  ][j  ]) );

    this.bbMeshU.add( new THREE.Line(this.bbGeom[i], this.bbMatU) );
  }

  // v control points
  for (var i = 0; i < this.surface.points[0].length; i++)
  {
    this.bbGeom[i] = new THREE.Geometry();
    for (var j = 0; j < this.surface.points.length; j++)
      this.bbGeom[i].vertices.push( new THREE.Vertex(this.surface.points[j][i]) );

    this.bbMeshV.add( new THREE.Line(this.bbGeom[i], this.bbMatV) );
  }
};

/** Builds set of control points for this NURBS surface
 */
NURBSSurfaceBuilder.prototype.buildControlPoints = function( ) {

  // TODO: relative controlPointRadius
  var controlPointRadius = 0.05;
  this.controlPointGeometry = new THREE.SphereGeometry( controlPointRadius );
  this.controlPointsGroup = new THREE.Object3D();

  for (var i = 0; i < this.surface.points.length; i++)
  {
    this.bbGeom[i] = new THREE.Geometry();
    for (var j = 0; j < this.surface.points[0].length; j++)
    {
      this.cPointMaterial = new THREE.MeshBasicMaterial( { color: 0x006699,
                                                           opacity: 1 } );
      var cPoint  = new THREE.Mesh( this.controlPointGeometry,
                                    this.cPointMaterial );

      cPoint.translateX( this.surface.points[i][j].x );
      cPoint.translateY( this.surface.points[i][j].y );
      cPoint.translateZ( this.surface.points[i][j].z );
      
      //cPoint.name = this.name + "_cpoint_" + p;

      this.controlPointsGroup.add( cPoint );
    }

  }
};

/** Builds NURBS surface mesh
 */
NURBSSurfaceBuilder.prototype.buildSurface = function( ) {

  var surfLineMaterial = new THREE.LineBasicMaterial( {color:     0x550000,
                                                       opacity:   1,
                                                       linewidth: 1});

  var surfGeom = new THREE.NURBSSurfaceGeometry( this.surface, 30, 30 );
  this.surfMesh = new THREE.Line( surfGeom, surfLineMaterial );
};

NURBSSurfaceBuilder.prototype.addToScene = function( scene ) {

  scene.add( this.bbMeshU );
  scene.add( this.bbMeshV );
  scene.add( this.controlPointsGroup);
  scene.add( this.surfMesh );
};

// TODO
NURBSSurfaceBuilder.prototype.updateScreenCoordinates = function() {

  this.screenCoord = new Array();
  for ( p = 0; p < this.controlPointsGroup.children.length; p++ ) {

    this.screenCoord.push(
      worldToScreen(this.controlPointsGroup.children[p].position) );
  }
};

// TODO: not working
NURBSSurfaceBuilder.prototype.moveControlPoint = function(cpIndex, v) {

  if (cpIndex >= 0 && cpIndex < this.controlPointsGroup.children.length) {

    // control point
    var cp = this.controlPointsGroup.children[cpIndex];
    cp.position.addSelf(v);

    // TODO
    //console.log("NURBSSurfaceBuilder.moveControlPoint.cpIndex: " + cpIndex);
    //// bounding box and curve
    //bb = this.surface.points[0][0];
    //bb.addSelf(v);
    //this.surface.points
  }
};

// TODO:
NURBSSurfaceBuilder.prototype.rebuild = function( ) {

  //this.surfMesh.children = [];
  //this.buildBoundBox();
  //this.buildControlPoints();

  //this.buildSurface();
  //this.surfMesh.children.splice(0, this.surfMesh.children.length-1);
};
