/**
 * @author Jiyao Wang <wangjiy@ncbi.nlm.nih.gov> / https://github.com/ncbi/icn3d
 */

// modified from iview (http://istar.cse.cuhk.edu.hk/iview/)
iCn3D.prototype.createSurfaceRepresentation = function (atoms, type, wireframe, opacity) {
    if(Object.keys(atoms).length == 0) return;

    var geo;

    var extent = this.getExtent(atoms);

    // surface from 3Dmol
    var distance = 5; // consider atom 5 angstrom from the selected atoms

    var extendedAtoms = [];

    if(this.bConsiderNeighbors) {
        extendedAtoms = Object.keys(this.unionHash(atoms, this.getAtomsWithinAtom(this.atoms, atoms, distance)));
    }
    else {
        extendedAtoms = Object.keys(atoms);
    }

    var ps = $3Dmol.SetupSurface({
        extent: extent,
        allatoms: this.atoms,
        atomsToShow: Object.keys(atoms),
        extendedAtoms: extendedAtoms,
        type: type,
        threshbox: this.threshbox
    });

    var verts = ps.vertices;
    var faces = ps.faces;

    var me = this;

    geo = new THREE.Geometry();
    geo.vertices = verts.map(function (v) {
        var r = new THREE.Vector3(v.x, v.y, v.z);
        r.atomid = v.atomid;
        return r;
    });
    geo.faces = faces.map(function (f) {
        //return new THREE.Face3(f.a, f.b, f.c);
        var vertexColors = ['a', 'b', 'c' ].map(function (d) {
            var atomid = geo.vertices[f[d]].atomid;
            return me.atoms[atomid].color;
        });

        return new THREE.Face3(f.a, f.b, f.c, undefined, vertexColors);
    });

    // remove the reference
    ps = null;
    verts = null;
    faces = null;

    geo.computeFaceNormals();
    geo.computeVertexNormals(false);

    geo.colorsNeedUpdate = true;

/*
    geo.faces.forEach(function (f) {
        f.vertexColors = ['a', 'b', 'c' ].map(function (d) {
            var atomid = geo.vertices[f[d]].atomid;
            return me.atoms[atomid].color;
        });
    });
*/

    geo.type = 'Surface'; // to be recognized in vrml.js for 3D printing

/*
    var mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ overdraw: me.overdraw,
        vertexColors: THREE.VertexColors,
        wireframe: wireframe,
        opacity: opacity,
        transparent: true,
    }));
*/
    var mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ overdraw: me.overdraw,
        specular: this.frac,
        shininess: 10, //30,
        emissive: 0x000000,
        vertexColors: THREE.VertexColors,
        wireframe: wireframe,
        opacity: opacity,
        transparent: true,
        side: THREE.DoubleSide
    }));

    me.mdl.add(mesh);

    this.prevSurfaces.push(mesh);

    // remove the reference
    geo = null;

    // do not add surface to raycasting objects for pk
};

// http://soledadpenades.com/articles/three-js-tutorials/drawing-the-coordinate-axes/
iCn3D.prototype.buildAxes = function (radius) {
    var axes = new THREE.Object3D();

    axes.add( this.createSingleLine( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0 + radius, 0, 0 ), 0xFF0000, false, 0.5 ) ); // +X
    axes.add( this.createSingleLine( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0 - radius, 0, 0 ), 0x800000, true, 0.5) ); // -X

    axes.add( this.createSingleLine( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0 + radius, 0 ), 0x00FF00, false, 0.5 ) ); // +Y
    axes.add( this.createSingleLine( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0 - radius, 0 ), 0x008000, true, 0.5 ) ); // -Y

    axes.add( this.createSingleLine( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 0 + radius ), 0x0000FF, false, 0.5 ) ); // +Z
    axes.add( this.createSingleLine( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 0 - radius ), 0x000080, true, 0.5 ) ); // -Z

    this.scene.add( axes );
};

iCn3D.prototype.createLines = function(lines) { // show extra lines, not used for pk, so no this.objects
   if(lines !== undefined) {
     for(var name in lines) {
         var lineArray = lines[name];

         for(var i = 0, il = lineArray.length; i < il; ++i) {
           var line = lineArray[i];

           var p1 = line.position1;
           var p2 = line.position2;

           var dashed = (line.dashed) ? line.dashed : false;
           var dashSize = 0.3;

           //this.mdl.add(this.createSingleLine( p1, p2, colorHex, dashed, dashSize ));

           var radius = this.lineRadius;

           var colorStr = '#' + line.color.replace(/\#/g, '');

           var color = new THREE.Color(colorStr);

           if(!dashed) {
                if(name == 'stabilizer') {
                    this.createBrick(p1, p2, radius, color);
                }
                else {
                    this.createCylinder(p1, p2, radius, color);
                }
           }
           else {
             var distance = p1.distanceTo(p2);

             var nsteps = parseInt(distance / dashSize);
             var step = p2.clone().sub(p1).multiplyScalar(dashSize/distance);

             var start, end;
             for(var j = 0; j < nsteps; ++j) {
                 if(j % 2 == 1) {
                      start = p1.clone().add(step.clone().multiplyScalar(j));
                      end = p1.clone().add(step.clone().multiplyScalar(j + 1));

                      if(name == 'stabilizer') {
                        this.createBrick(start, end, radius, color);
                      }
                      else {
                        this.createCylinder(start, end, radius, color);
                      }
                  }
             }
           }
         }
     }
   }

   // do not add the artificial lines to raycasting objects
};

iCn3D.prototype.createBrick = function (p0, p1, radius, color) {
    var cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 4, 1);

    var mesh = new THREE.Mesh(cylinderGeometry, new THREE.MeshPhongMaterial({ overdraw: this.overdraw, specular: this.frac, shininess: 30, emissive: 0x000000, color: color }));

    mesh.position.copy(p0).add(p1).multiplyScalar(0.5);
    mesh.matrixAutoUpdate = false;
    mesh.lookAt(p0);
    mesh.updateMatrix();

    mesh.matrix.multiply(new THREE.Matrix4().makeScale(radius, radius, p0.distanceTo(p1))).multiply(new THREE.Matrix4().makeRotationX(Math.PI * 0.5));

    this.mdl.add(mesh);
};

