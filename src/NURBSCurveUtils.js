// ============================================================================
// NURBS CURVES UTILITIES
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

  // TODO: make all this "this" public members private "var"

  this.curve = curve || THREE.NURBSCurve();
  this.name = name || "";

  // curve mesh
  this.curveGeometry = new THREE.NURBSCurveGeometry( this.curve, 100);

  // TODO: remove this from here:
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
