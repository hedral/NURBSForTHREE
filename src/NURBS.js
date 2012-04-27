/**
 * @author santiago ferreira / http://lirius.org/
 */

/**
 * B-Spline basis function
 * @param i start index
 * @param k order = degree + 1
 * @param u parametric variable, range: t[i] to t[i+1]
 * @param t knot vector
 */
function N ( i, k, u, t ) {

  if ( k == 1 ) {

    if ( t[i] <= u && u < t[i+1] )
      return 1;
    else
      return 0;
  
  }

  // Generate blending function, and check for division by zero: 
  //
  // ( u - t[i]  ) * N(i,   k-1, u, t) / (t[i+k-1] - t[i]  ) +
  // (-u + t[i+k]) * N(i+1, k-1, u, t) / (t[i+k]   - t[i+1]);
  //
  // d1, d2: denominators 1 and 2
  // n1, n2: numerators   1 and 2
  // s1, s2: segments     1 and 2
  //
  var d1 = (t[i+k-1] - t[i]);
  var n1 = (u - t[i]);
  var s1 = 0;
  if (d1 != 0 && n1 != 0)
    s1 = n1 * N(i, k-1, u, t) / d1;

  var d2 = (t[i+k] - t[i+1]);
  var n2 = (-u + t[i+k]);
  var s2 = 0;
  if (d2 != 0 && n2 != 0)
    s2 = n2 * N(i+1, k-1, u, t) / d2;

  return s1 + s2;
}


// ============================================================================
// NURBS CURVES
// ============================================================================
THREE.NURBSCurve = THREE.Curve.create(

  /**
   * constructor
   * @param points array of Vector3 control points
   * @param knots  array of knots
   * @param order degree of curve + 1
   */
  function ( points, knots, order ) {

    this.points = points || new Array();
    this.order = order || 3;
    this.knots = knots || new Array();
  },

  /**
   * getPoint( t )
   * @param t from 0 to 1
   */
  function ( t ) {

    // TODO: remove below, fix error when t = 1
    if (t >= 1) t = 0.999999;

    // Lineraly scale t
    var u = (1 - t) * this.knots[this.order - 1] +
                 t  * this.knots[this.points.length];

    // 1) Find knot indices
    var i_plus_1 = 0;
    for (; this.knots[i_plus_1] <= u; i_plus_1++) { }
    var i_plus_1_minus_k = i_plus_1 - this.order;

    // 2) check upper and lower bounds
    // TODO: no need to check for this anymore, create error log instead
    if (i_plus_1 > this.points.length) i_plus_1 = this.points.length;
    if (i_plus_1_minus_k < 0)          i_plus_1_minus_k = 0;

    // 3) Calculate point
    var v = new THREE.Vector3();
    for (var i = i_plus_1_minus_k; i < i_plus_1; i++)
    {
      var n = N( i, this.order, u, this.knots );
      v.x += this.points[i].x * n;
      v.y += this.points[i].y * n;
      v.z += this.points[i].z * n;
    }
    return v;
  }
);

/**
 * Defines 3D B-Spline geometry object
 * @param curve NURBSCurve object
 * @param numPoints number of interpolated points
 */
THREE.NURBSCurveGeometry = function ( curve, numPoints ) {

  THREE.Geometry.call( this );

  var scope = this;

  // TODO: check for type
  this.curve = curve || new THREE.NURBSCurve();

  // TODO: numPoints is currently ignored because of push_1000_vertices
  this.numPoints = numPoints || 100;

  // TODO: look for a way to get this and re generate
  //       I will need to first change this.curve
  this.vertices = new Array();

  for (var i = 0; i < this.numPoints; i++)
	  this.vertices.push( new THREE.Vertex(
                        this.curve.getPoint(i / (this.numPoints-1))) );

};
THREE.NURBSCurveGeometry.prototype = new THREE.Geometry();
THREE.NURBSCurveGeometry.prototype.constructor =
  THREE.NURBSCurveGeometry;




// ============================================================================
// NURBS SURFACES
// ============================================================================

/** NURBS Surface
 *
 * @param points[u][v] array of control points (array of array of Vector3)
 * @param knots.u      array of u knots
 * @param knots.v      array of v knots
 * @param orders.u     u order
 * @param orders.v     v order
 */
THREE.NURBSSurface = function ( points, knots, orders ) {

  // TODO: check input
  this.points = points;
  this.knots = knots;
  this.orders = orders;


  // TODO: find better way for printing logs, remove print_log_getPoint_s_t
  print_log_getPoint_s_t = true;

  /**
   * @returns NURBS surface point
   * @param s parameter variable, range: 0 to 1
   * @param t parameter variable, range: 0 to 1
   */
  this.getPoint = function (s, t) {

    // TODO: fix this, allow s, t = 1
    if (s >= 1) s = 0.999999;
    if (t >= 1) t = 0.999999;

    // Scale parameters linearly
    var u = (1 - s) * this.knots.u[this.orders.u - 1] +
                 s  * this.knots.u[this.knots.u.length - this.orders.u];
    var v = (1 - t) * this.knots.v[this.orders.v - 1] +
                 t  * this.knots.v[this.knots.v.length - this.orders.v];

    // TODO: remove below
    if (print_log_getPoint_s_t)
    {

      //if (points[0].length != (this.knots.v.length - this.orders.v) ||
      //    points.length    != (this.knots.u.length - this.orders.u))
      {
        //console.log("ERROR: incorrect u or v upper bound range/s");
        console.log("knots.u.length: " + this.knots.u.length +
                    "\torders.u: " + this.orders.u +
                    "\trange of u: " + (this.orders.u - 1) +
                    " - " + (this.knots.u.length - this.orders.u) +
                    "\tpoints.length: " + this.points.length);
        console.log("knots.v.length: " + this.knots.v.length +
                    "\torders.v: " + this.orders.v +
                    "\trange of v: " + (this.orders.v - 1) +
                    " - " + (this.knots.v.length - this.orders.v) +
                    "\tpoints[0].length: " + this.points[0].length);
      }
      print_log_getPoint_s_t = false;
    }

    // 1) Find knot indices
    var i_plus_1 = 0;
    for (; this.knots.u[i_plus_1] <= u; i_plus_1++) { }
    var i_plus_1_minus_k = i_plus_1 - this.orders.u;
    // TODO: no need to check for this anymore, create error log instead
    // 2) check upper and lower bounds
    if (i_plus_1 > this.points[0].length) i_plus_1 = this.points[0].length;
    if (i_plus_1_minus_k < 0)             i_plus_1_minus_k = 0;

    // 1) Find knot indices
    var j_plus_1 = 0;
    for (; this.knots.v[j_plus_1] <= v; j_plus_1++) { }
    var j_plus_1_minus_k = j_plus_1 - this.orders.v;
    // TODO: no need to check for this anymore, create error log instead
    // 2) check upper and lower bounds
    if (j_plus_1 > this.points.length) j_plus_1 = this.points.length;
    if (j_plus_1_minus_k < 0)          j_plus_1_minus_k = 0;

    // TODO: optimize
    var p = new THREE.Vector3();
    //for (var j = j_plus_1_minus_k; j < j_plus_1; j++)
    for (var j = 0; j < this.points[0].length; j++)
    {
      var pTemp = new THREE.Vector3();
      //for (var i = i_plus_1_minus_k; i < i_plus_1; i++)
      for (var i = 0; i < this.points.length; i++)
      {
        var n_u = N( i, this.orders.u, u, this.knots.u );     // u blend func
        pTemp.x += this.points[i][j].x * n_u;
        pTemp.y += this.points[i][j].y * n_u;
        pTemp.z += this.points[i][j].z * n_u;
      }
      var n_v = N( j, this.orders.v, v, this.knots.v );       // v blend func
      p.x += pTemp.x * n_v;
      p.y += pTemp.y * n_v;
      p.z += pTemp.z * n_v;
    }
    return p;
  };
};

// TODO
/** NURBS Geometry
 *
 */
THREE.NURBSSurfaceGeometry = function ( surface, numPointsU, numPointsV ) {

	THREE.Geometry.call( this );

  // Get Vertices
  for (var i = 0; i < numPointsU; i++)
  {
    var di = i / numPointsU;
    for (var j = 0; j <= numPointsV; j++)
    {
      var dj = j / numPointsV;

      // TODO: Is this way of arranging the vertecis correct?
      this.vertices.push(new THREE.Vertex(surface.getPoint(dj, di)));
      this.vertices.push(new THREE.Vertex(surface.getPoint(dj, di + (1/numPointsU))));
    }
  }

  // TODO: faces, normals, etc.


	this.computeCentroids();
};
THREE.NURBSSurfaceGeometry.prototype = new THREE.Geometry();
THREE.NURBSSurfaceGeometry.prototype.constructor = THREE.NURBSSurfaceGeometry;

