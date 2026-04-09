"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/** Lightweight procedural terrain + subtle particles — respects reduced motion. Optional pointer parallax. */
export function TerrainScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const w = el.clientWidth;
    const h = el.clientHeight;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x111827, 0.072);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 2.2, 4.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    el.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const geo = new THREE.PlaneGeometry(6, 6, 64, 64);
    const pos = geo.attributes.position;
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1c2333,
      wireframe: true,
      transparent: true,
      opacity: 0.42,
      emissive: 0x0a1628,
      emissiveIntensity: 0.15,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2.2;
    group.add(mesh);

    const amb = new THREE.AmbientLight(0xffffff, 0.32);
    const dirWarm = new THREE.DirectionalLight(0xe85d04, 0.75);
    dirWarm.position.set(2, 4, 3);
    const dirCool = new THREE.DirectionalLight(0x4a90d9, 0.22);
    dirCool.position.set(-3, 2, -2);
    scene.add(amb, dirWarm, dirCool);

    const particles = new THREE.BufferGeometry();
    const count = 400;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = Math.random() * 2.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xfb8500,
      size: 0.018,
      transparent: true,
      opacity: 0.38,
    });
    const pts = new THREE.Points(particles, pMat);
    group.add(pts);

    const t0 = performance.now();
    let rafId = 0;

    const mouse = { x: 0, y: 0 };
    const targetRot = { x: 0, y: 0 };

    const onPointer = (e: MouseEvent) => {
      mouse.x = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      mouse.y = (e.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
    };
    window.addEventListener("mousemove", onPointer, { passive: true });

    const animate = (t: number) => {
      rafId = requestAnimationFrame(animate);
      const time = (t - t0) * 0.001;

      targetRot.y = mouse.x * 0.035;
      targetRot.x = mouse.y * -0.028;
      group.rotation.y += (targetRot.y - group.rotation.y) * 0.06;
      group.rotation.x += (targetRot.x - group.rotation.x) * 0.06;

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z =
          Math.sin(x * 2 + time * 0.8) * 0.12 + Math.cos(y * 2 + time * 0.5) * 0.08;
        pos.setZ(i, z);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
      pts.rotation.y = time * 0.05;
      renderer.render(scene, camera);
    };
    rafId = requestAnimationFrame(animate);

    const onResize = () => {
      if (!el) return;
      const nw = el.clientWidth;
      const nh = el.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onPointer);
      ro.disconnect();
      geo.dispose();
      mat.dispose();
      particles.dispose();
      pMat.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 h-full min-h-[520px] w-full"
      aria-hidden
    />
  );
}
