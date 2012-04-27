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
function printArrayOfVector3(v)
{
  for (i = 0; i < v.length; i++)
  {
    console.log(i + "\t" + v[i].x + ", " +
                           v[i].y + ", " +
                           v[i].z);
  }
}


/**
 * @author santiago ferreira / http://lirius.org/
 */

// ============================================================================
// NURBS UTILITY FUNCTIONS
// ============================================================================

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
