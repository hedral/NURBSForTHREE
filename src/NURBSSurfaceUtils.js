// ============================================================================
// NURBS SURFACES UTILITIES
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
 * TODO: create bound box geometry NURBSSurfaceBoxGeometry
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
      // TODO: bbGeom[].vertices references surface.points...
      //       It could be nice if control points spheres posisitions were a
      //       reference too

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
  this.controlPointsIndices = new Array();

  for (var i = 0; i < this.surface.points.length; i++)
  {
    this.bbGeom[i] = new THREE.Geometry();
    this.controlPointsIndices[i] = new Array();
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
      this.controlPointsIndices[i][j] = cPoint;
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

  // TODO: remove from here
  surfGeom.dynamic = true;

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

NURBSSurfaceBuilder.prototype.moveControlPoint = function(cpIndex, v) {

  if (cpIndex >= 0 && cpIndex < this.controlPointsGroup.children.length) {

    // control point
    var cp = this.controlPointsGroup.children[cpIndex];
    cp.position.addSelf(v);

    console.log("NURBSSurfaceBuilder.moveControlPoint: " + cpIndex);

    // find 2D control point index in controlPointsIndices
    var controlPoint = this.controlPointsGroup.children[cpIndex];
    var found = false;
    for (var i in this.controlPointsIndices)
    {
      for (var j in this.controlPointsIndices[i])
      {
        if (this.controlPointsIndices[i][j] == this.controlPointsGroup.children[cpIndex])
        {
          console.log(i + ", " + j);
          found = true;
          break;
        }
      }
      if (found) break;
    }
    console.log(i + ", " + j);
    // bounding box and curve
    this.bbMeshU.children[i].geometry.vertices[j].position.addSelf(v);
    //console.log(this.surface.points[i][j].x);
  }
};

NURBSSurfaceBuilder.prototype.rebuild = function( ) {

  var n = this.surfMesh.geometry.vertices.length;
  this.surfMesh.geometry.build();
};
