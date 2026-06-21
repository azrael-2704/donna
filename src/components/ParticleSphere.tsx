'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleSphereProps {
  audioData: Uint8Array | null;
}

const vertexShader = `
uniform float uTime;
uniform float uAudioFreq;
varying vec3 vColor;

// Simplex 3D Noise function (ashima/webgl-noise)
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 1.0/7.0;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}

void main() {
  vec3 pos = position;
  
  // Calculate noise based on position and time
  float noiseFreq = 2.0;
  float noiseAmp = 0.4;
  vec3 noisePos = vec3(pos.x * noiseFreq + uTime, pos.y * noiseFreq + uTime, pos.z * noiseFreq);
  float noise = snoise(noisePos) * noiseAmp;

  // React to audio frequency
  float audioFactor = uAudioFreq * 0.01;
  float displacement = noise * audioFactor;
  
  // Base sphere breathing
  float breath = sin(uTime * 2.0) * 0.05 + 0.05;
  
  vec3 newPosition = pos + normal * (displacement + breath + (audioFactor * 0.2));

  vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;

  gl_Position = projectedPosition;
  
  // Dynamic point size based on distance and audio
  gl_PointSize = (10.0 + audioFactor * 10.0) * (1.0 / -viewPosition.z);

  // Dynamic colors based on position and audio
  vec3 color1 = vec3(0.3, 0.6, 1.0); // Blue
  vec3 color2 = vec3(0.8, 0.2, 1.0); // Purple
  
  float mixVal = (noise + 1.0) * 0.5 + audioFactor * 0.2;
  vColor = mix(color1, color2, clamp(mixVal, 0.0, 1.0));
  
  // Add intense white/cyan highlights on loud audio
  if (audioFactor > 1.0) {
     vColor = mix(vColor, vec3(0.5, 1.0, 1.0), (audioFactor - 1.0) * 0.5);
  }
}
`;

const fragmentShader = `
varying vec3 vColor;

void main() {
  // Make particles circular with soft edges
  vec2 xy = gl_PointCoord.xy - vec2(0.5);
  float ll = length(xy);
  if (ll > 0.5) discard;
  
  float alpha = smoothstep(0.5, 0.1, ll);
  gl_FragColor = vec4(vColor, alpha * 0.8);
}
`;

export default function ParticleSphere({ audioData }: ParticleSphereProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Points>(null);

  // Create sphere geometry points
  const [geometry, count] = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(2, 24); // High detail for points
    return [geo, geo.attributes.position.count];
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAudioFreq: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      
      // Calculate average frequency for base distortion
      let avgFreq = 0;
      if (audioData) {
        let sum = 0;
        // Use lower bins for bass reactivity
        const binsToUse = Math.min(32, audioData.length);
        for (let i = 0; i < binsToUse; i++) {
          sum += audioData[i];
        }
        avgFreq = sum / binsToUse;
      }
      
      // Smooth the audio uniform so it doesn't jump too harshly
      const targetFreq = avgFreq;
      const currentFreq = materialRef.current.uniforms.uAudioFreq.value;
      materialRef.current.uniforms.uAudioFreq.value = currentFreq + (targetFreq - currentFreq) * 0.2;
    }
    
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
      meshRef.current.rotation.x += 0.001;
    }
  });

  return (
    <points ref={meshRef}>
      <primitive object={geometry} attach="geometry" />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
