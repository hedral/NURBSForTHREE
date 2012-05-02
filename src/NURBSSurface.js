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

/** NURBS Geometry
 *
 */
THREE.NURBSSurfaceGeometry = function ( surface, numPointsU, numPointsV ) {

	THREE.Geometry.call( this );

  this.surface = surface;
  this.numPointsU = numPointsU;
  this.numPointsV = numPointsV;

  this.build();

	this.computeCentroids();
};
THREE.NURBSSurfaceGeometry.prototype = new THREE.Geometry();
THREE.NURBSSurfaceGeometry.prototype.constructor = THREE.NURBSSurfaceGeometry;

THREE.NURBSSurfaceGeometry.prototype.build = function()
{
  // do we need to rebuild it?
  if (this.vertices.length > 0)
    this.vertices.splice(0, this.vertices.length);

  // Get Vertices
  for (var i = 0; i < this.numPointsU; i++)
  {
    var di = i / this.numPointsU;
    for (var j = 0; j <= this.numPointsV; j++)
    {
      var dj = j / this.numPointsV;

      // TODO: Is this way of arranging the vertices correct?
      this.vertices.push(new THREE.Vertex(this.surface.getPoint(dj, di)));
      this.vertices.push(new THREE.Vertex(
        this.surface.getPoint(dj, di + (1/this.numPointsU))));
    }
  }
  // TODO: faces, normals, etc.
};
