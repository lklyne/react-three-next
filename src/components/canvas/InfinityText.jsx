import { useFrame, useLoader } from '@react-three/fiber'
import React, { useRef, useEffect, useLayoutEffect } from 'react'
import { RGBELoader } from 'three-stdlib'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { extend } from '@react-three/fiber'
import { MeshTransmissionMaterial } from '@react-three/drei'
import { TextModel } from './TextModel.jsx'

extend({ TextGeometry })

export default function InfinityText({ config }) {
  const refMesh = useRef()
  const refMaterial = useRef()
  console.log(config, 'config!!!')
  const font = useLoader(FontLoader, './geist-mono-flipped.json')

  const texture = useLoader(RGBELoader, '/aerodynamics_workshop_1k.hdr')
  let geo = new TextGeometry(config.text, {
    font,
    size: config.fontSize,
    height: config.fontDepth,
    curveSegments: 10,
    bevelEnabled: false,
  })
  geo.center()
  geo.computeBoundingBox()
  let refUniforms = {
    uTime: { value: 0 },
    uTwistSpeed: { value: config.uTwistSpeed * -1.0 },
    uRotateSpeed: { value: config.uRotateSpeed },
    uTwists: { value: config.uTwists },
    uRadius: { value: config.uRadius },
    uMin: { value: { x: 0, y: 0, z: 0 } },
    uMax: { value: { x: 0, y: 0, z: 0 } },
  }

  useEffect(
    (state, delta) => {
      if (refMaterial.current.userData.shader) {
        refMaterial.current.userData.shader.uniforms.uRadius.value = config.uRadius
        refMaterial.current.userData.shader.uniforms.uTwists.value = config.uTwists

        refMaterial.current.userData.shader.uniforms.uTwistSpeed.value = config.uTwistSpeed
        refMaterial.current.userData.shader.uniforms.uRotateSpeed.value = config.uRotateSpeed
      }
    },
    [config],
  )

  useFrame((state, delta) => {
    if (refMaterial.current.userData.shader) {
      refMaterial.current.userData.shader.uniforms.uTime.value += delta
    }
  })

  useLayoutEffect(() => {
    refMesh.current.geometry = geo
    geo.computeBoundingBox()
    let shader = refMaterial.current.userData.shader
    if (shader) {
      shader.uniforms.uMin.value = geo.boundingBox.min
      shader.uniforms.uMax.value = geo.boundingBox.max
      shader.uniforms.uMax.value.x += config.fontSize / 6
    }
    refUniforms.uMin.value = geo.boundingBox.min
    refUniforms.uMax.value = geo.boundingBox.max
    // space after text
    refUniforms.uMax.value.x += config.fontSize / 6
  })

  const onBeforeCompile = (shader) => {
    shader.uniforms = { ...refUniforms, ...shader.uniforms }

    shader.vertexShader =
      `
    uniform float uTwistSpeed;
      uniform float uRotateSpeed;
      uniform float uTwists;
      uniform float uRadius;
      uniform vec3 uMin;
      uniform vec3 uMax;
      uniform float uTime;
      float PI = 3.141592653589793238;
    mat4 rotationMatrix(vec3 axis, float angle) {
      axis = normalize(axis);
      float s = sin(angle);
      float c = cos(angle);
      float oc = 1.0 - c;
      
      return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                  oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                  oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                  0.0,                                0.0,                                0.0,                                1.0);
  }
  
  vec3 rotate(vec3 v, vec3 axis, float angle) {
    mat4 m = rotationMatrix(axis, angle);
    return (m * vec4(v, 1.0)).xyz;
  }
  float mapRange(float value, float min1, float max1, float min2, float max2) {
    // return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
    return clamp( min2 + (value - min1) * (max2 - min2) / (max1 - min1), min2, max2 );
  }

    ` + shader.vertexShader

    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      '#include <beginnormal_vertex>' +
        `
          float xx = mapRange(position.x, uMin.x, uMax.x, -1., 1.0);
          // twistnormal
          objectNormal = rotate(objectNormal, vec3(-1.,0.,0.), 0.5*PI*uTwists*xx + 0.01*uTime*uTwistSpeed);
  
          // circled normal
          objectNormal = rotate(objectNormal, vec3(0.,0.,-1.), (xx + 0.01*uTime*uRotateSpeed)*PI);
      
      `,
    )

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>' +
        `
        vec3 pos = transformed;
        float theta = (xx + 0.01*uTime*uRotateSpeed)*PI;
        pos = rotate(pos,vec3(-1.,0.,0.), 0.5*PI*uTwists*xx + 0.01*uTime*uTwistSpeed);


        
        vec3 dir = vec3(sin(theta), cos(theta),pos.z);
        vec3 circled = vec3(dir.xy*uRadius,pos.z) + vec3(pos.y*dir.x,pos.y*dir.y,0.);

        transformed = circled;

      `,
    )

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <output_fragment>',
      '#include <output_fragment>',
      +`
      // gl_FragColor = vec4(1.,0.,0.,1.);
    `,
    )
    refMaterial.current.userData.shader = shader
  }

  const result = (
    <mesh ref={refMesh} castShadow>
      <bufferGeometry attach='geometry' geometry={geo} />
      {/* <meshPhysicalMaterial
        onBeforeCompile={onBeforeCompile}
        ref={refMaterial}
        attach="material"
        color={config.color}
      /> */}

      <MeshTransmissionMaterial
        ref={refMaterial}
        onBeforeCompile={onBeforeCompile}
        attach='material'
        background={texture}
        reflectivity={0.5}
        roughness={0.0}
        transmission={0.1}
        thickness={0.1}
        color={'#FAFAFA'}
        ior={0.1}
        distortionScale={0.5}
        distortion={0.5}
        temporalDistortion={0.4}
      />
    </mesh>
  )
  return result
}

// const InfinityText = () => {
//   // A basic r3f cube
//   return (
//     <mesh>
//       <boxGeometry args={[1, 1, 1]} />
//       <meshStandardMaterial attach='material' color='hotpink' />
//     </mesh>
//   )
// }

// export default InfinityText
