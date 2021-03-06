$NGL_shaderTextHash['SphereInstancing.frag'] = ["#define STANDARD",
"#define IMPOSTOR",
"",
"uniform vec3 diffuse;",
"uniform vec3 emissive;",
"uniform float roughness;",
"uniform float metalness;",
"uniform float opacity;",
"uniform float nearClip;",
"uniform mat4 projectionMatrix;",
"uniform float ortho;",
"",
"varying float vRadius;",
"varying float vRadiusSq;",
"varying vec3 vPoint;",
"varying vec3 vPointViewPosition;",
"",
"#ifdef PICKING",
"    uniform float objectId;",
"    varying vec3 vPickingColor;",
"#else",
"    #include common",
"    #include color_pars_fragment",
"    #include fog_pars_fragment",
"    #include bsdfs",
"    #include lights_pars",
"    #include lights_physical_pars_fragment",
"#endif",
"",
"bool flag2 = false;",
"bool interior = false;",
"vec3 cameraPos;",
"vec3 cameraNormal;",
"",
"// Calculate depth based on the given camera position.",
"float calcDepth( in vec3 cameraPos ){",
"    vec2 clipZW = cameraPos.z * projectionMatrix[2].zw + projectionMatrix[3].zw;",
"    return 0.5 + 0.5 * clipZW.x / clipZW.y;",
"}",
"",
"float calcClip( vec3 cameraPos ){",
"    return dot( vec4( cameraPos, 1.0 ), vec4( 0.0, 0.0, 1.0, nearClip - 0.5 ) );",
"}",
"",
"bool Impostor( out vec3 cameraPos, out vec3 cameraNormal ){",
"",
"    vec3 cameraSpherePos = -vPointViewPosition;",
"    cameraSpherePos.z += vRadius;",
"",
"    vec3 rayOrigin = mix( vec3( 0.0, 0.0, 0.0 ), vPoint, ortho );",
"    vec3 rayDirection = mix( normalize( vPoint ), vec3( 0.0, 0.0, 1.0 ), ortho );",
"    vec3 cameraSphereDir = mix( cameraSpherePos, rayOrigin - cameraSpherePos, ortho );",
"",
"    float B = dot( rayDirection, cameraSphereDir );",
"    float det = B * B + vRadiusSq - dot( cameraSphereDir, cameraSphereDir );",
"",
"    if( det < 0.0 ){",
"        discard;",
"        return false;",
"    }else{",
"        float sqrtDet = sqrt( det );",
"        float posT = mix( B + sqrtDet, B + sqrtDet, ortho );",
"        float negT = mix( B - sqrtDet, sqrtDet - B, ortho );",
"",
"        cameraPos = rayDirection * negT + rayOrigin;",
"",
"        #ifdef NEAR_CLIP",
"if( calcDepth( cameraPos ) <= 0.0 ){",
"    cameraPos = rayDirection * posT + rayOrigin;",
"    interior = true;",
"    return false;",
"}else if( calcClip( cameraPos ) > 0.0 ){",
"    cameraPos = rayDirection * posT + rayOrigin;",
"    interior = true;",
"    flag2 = true;",
"    return false;",
"}else{",
"    cameraNormal = normalize( cameraPos - cameraSpherePos );",
"}",
"        #else",
"if( calcDepth( cameraPos ) <= 0.0 ){",
"    cameraPos = rayDirection * posT + rayOrigin;",
"    interior = true;",
"    return false;",
"}else{",
"    cameraNormal = normalize( cameraPos - cameraSpherePos );",
"}",
"        #endif",
"",
"        return true;",
"    }",
"",
"    return false; // ensure that each control flow has a return",
"",
"}",
"",
"void main(void){",
"",
"    bool flag = Impostor( cameraPos, cameraNormal );",
"",
"    #ifdef NEAR_CLIP",
"        if( calcClip( cameraPos ) > 0.0 )",
"            discard;",
"    #endif",
"",
"    // FIXME not compatible with custom clipping plane",
"    //Set the depth based on the new cameraPos.",
"    gl_FragDepthEXT = calcDepth( cameraPos );",
"    if( !flag ){",
"",
"        // clamp to near clipping plane and add a tiny value to",
"        // make spheres with a greater radius occlude smaller ones",
"        #ifdef NEAR_CLIP",
"if( flag2 ){",
"    gl_FragDepthEXT = max( 0.0, calcDepth( vec3( - ( nearClip - 0.5 ) ) ) + ( 0.0000001 / vRadius ) );",
"}else if( gl_FragDepthEXT >= 0.0 ){",
"    gl_FragDepthEXT = 0.0 + ( 0.0000001 / vRadius );",
"}",
"        #else",
"if( gl_FragDepthEXT >= 0.0 ){",
"    gl_FragDepthEXT = 0.0 + ( 0.0000001 / vRadius );",
"}",
"        #endif",
"",
"    }",
"",
"    // bugfix (mac only?)",
"    if (gl_FragDepthEXT < 0.0)",
"        discard;",
"    if (gl_FragDepthEXT > 1.0)",
"        discard;",
"",
"    #ifdef PICKING",
"",
"        gl_FragColor = vec4( vPickingColor, objectId );",
"",
"    #else",
"",
"        vec3 vNormal = cameraNormal;",
"        vec3 vViewPosition = -cameraPos;",
"",
"        vec4 diffuseColor = vec4( diffuse, opacity );",
"        ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );",
"        vec3 totalEmissiveLight = emissive;",
"",
"        #include color_fragment",
"        #include roughnessmap_fragment",
"        #include metalnessmap_fragment",
"        #include normal_flip",
"        #include normal_fragment",
"        if( interior ){",
"            normal = vec3( 0.0, 0.0, 0.4 );",
"        }",
"",
"        // include lights_phong_fragment",
"        #include lights_physical_fragment",
"        #include lights_template",
"",
"        vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveLight;",
"",
"        gl_FragColor = vec4( outgoingLight, diffuseColor.a );",
"        //gl_FragColor = vec4( reflectedLight.directSpecular, diffuseColor.a );",
"",
"        #include premultiplied_alpha_fragment",
"        #include tonemapping_fragment",
"        #include encodings_fragment",
"        #include fog_fragment",
"",
"    #endif",
"",
"}"
].join("\n");
