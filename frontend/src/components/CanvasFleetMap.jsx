import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Canvas Overlay Layer sub-component
function CanvasOverlay({ vehiclesRef, geofences, onFpsUpdate, onSelectVehicle }) {
  const map = useMap();
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastFpsTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      const size = map.getSize();
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = size.x * pixelRatio;
      canvas.height = size.y * pixelRatio;
      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    resizeCanvas();
    map.on("resize move zoom", resizeCanvas);

    // requestAnimationFrame Render Loop
    const render = (time) => {
      frameCountRef.current++;

      // FPS Measurement
      if (time - lastFpsTimeRef.current >= 1000) {
        const currentFps = Math.round((frameCountRef.current * 1000) / (time - lastFpsTimeRef.current));
        onFpsUpdate(currentFps);
        frameCountRef.current = 0;
        lastFpsTimeRef.current = time;
      }

      const size = map.getSize();
      ctx.clearRect(0, 0, size.x, size.y);

      // 1. Draw Geofence Polygons & Circles
      if (geofences && geofences.length) {
        geofences.forEach((gf) => {
          if (gf.center) {
            const centerPt = map.latLngToContainerPoint([gf.center[0], gf.center[1]]);
            const edgePt = map.latLngToContainerPoint([gf.center[0], gf.center[1] + (gf.radiusMeters || 5000) / 111320]);
            const radiusPx = Math.max(10, Math.abs(centerPt.x - edgePt.x));

            ctx.save();
            ctx.beginPath();
            ctx.arc(centerPt.x, centerPt.y, radiusPx, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(59, 130, 246, 0.12)";
            ctx.fill();
            ctx.strokeStyle = "#3b82f6";
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.stroke();
            ctx.restore();
          }
        });
      }

      // 2. Render Vehicles Batch
      const vehiclesMap = vehiclesRef.current;
      if (vehiclesMap) {
        const bounds = map.getBounds();

        vehiclesMap.forEach((v) => {
          const lat = v.location?.latitude;
          const lng = v.location?.longitude;

          if (lat === undefined || lng === undefined) return;

          // Viewport Spatial Culling (Performance optimization for 10,000+ points)
          if (lat < bounds.getSouth() || lat > bounds.getNorth() || lng < bounds.getWest() || lng > bounds.getEast()) {
            return;
          }

          const point = map.latLngToContainerPoint([lat, lng]);
          const speed = v.location?.speed || 0;
          const heading = v.location?.heading || 0;
          const isBreached = v.isBreached;

          ctx.save();
          ctx.translate(point.x, point.y);

          // Geofence Breach Animated Pulse Ring
          if (isBreached) {
            const pulse = (Math.sin(time / 150) + 1) * 6 + 10;
            ctx.beginPath();
            ctx.arc(0, 0, pulse, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(239, 68, 68, 0.35)";
            ctx.fill();
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          // Speed-based color gradient (Green -> Amber -> Red)
          let color = "#10b981"; // normal
          if (speed > 80) color = "#ef4444"; // high speed
          else if (speed > 50) color = "#f59e0b"; // moderate

          if (isBreached) color = "#dc2626";

          // Vehicle Direction Vector / Arrow
          ctx.rotate((heading * Math.PI) / 180);
          ctx.beginPath();
          ctx.moveTo(0, -9);
          ctx.lineTo(6, 7);
          ctx.lineTo(0, 4);
          ctx.lineTo(-6, 7);
          ctx.closePath();
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.restore();
        });
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    // Canvas click handler for vehicle selection
    const handleCanvasClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      let selected = null;
      vehiclesRef.current.forEach((v) => {
        const lat = v.location?.latitude;
        const lng = v.location?.longitude;
        if (lat === undefined || lng === undefined) return;

        const pt = map.latLngToContainerPoint([lat, lng]);
        const dist = Math.hypot(pt.x - clickX, pt.y - clickY);
        if (dist < 12) selected = v;
      });

      if (selected && onSelectVehicle) onSelectVehicle(selected);
    };

    canvas.addEventListener("click", handleCanvasClick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      map.off("resize move zoom", resizeCanvas);
      canvas.removeEventListener("click", handleCanvasClick);
    };
  }, [map, geofences, onFpsUpdate, onSelectVehicle, vehiclesRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "auto",
        zIndex: 400,
      }}
    />
  );
}

export default function CanvasFleetMap({ vehiclesRef, geofences, onFpsUpdate, onSelectVehicle, center = [12.9716, 77.5946], zoom = 12 }) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "520px" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: "100%", height: "100%", borderRadius: "12px" }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CanvasOverlay
          vehiclesRef={vehiclesRef}
          geofences={geofences}
          onFpsUpdate={onFpsUpdate}
          onSelectVehicle={onSelectVehicle}
        />
      </MapContainer>
    </div>
  );
}
