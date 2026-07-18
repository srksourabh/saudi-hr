"use client";

import { onLCP, onINP, onCLS, onFCP, onTTFB, type Metric } from "web-vitals";
import { useEffect } from "react";

function sendMetric(metric: Metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
    path: window.location.pathname,
  });
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/vitals", body);
  } else {
    void fetch("/api/vitals", { method: "POST", body, keepalive: true });
  }
}

export function WebVitalsReporter() {
  useEffect(() => {
    onLCP(sendMetric);
    onINP(sendMetric);
    onCLS(sendMetric);
    onFCP(sendMetric);
    onTTFB(sendMetric);
  }, []);
  return null;
}