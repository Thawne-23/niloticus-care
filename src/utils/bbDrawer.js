import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Detection Card Component - Display individual detection information
 */
export function DetectionCard({ detection, index }) {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E2',
  ];

  const color = colors[index % colors.length];

  // Debug logging
  console.log(
    `[DetectionCard #${index + 1}] ${detection.className} | ` +
    `Pos:(${detection.x.toFixed(2)}, ${detection.y.toFixed(2)}) | ` +
    `Size:(${detection.width.toFixed(2)}x${detection.height.toFixed(2)}) | ` +
    `Conf:${(detection.confidence * 100).toFixed(1)}%`
  );

  return (
    <View style={[styles.detectionCard, { borderLeftColor: color }]}>
      <View style={styles.detectionCardHeader}>
        <View
          style={[
            styles.colorIndicator,
            { backgroundColor: color },
          ]}
        />
        <View style={styles.detectionInfo}>
          <Text style={styles.className}>{detection.className}</Text>
          <Text style={styles.confidence}>
            {(detection.confidence * 100).toFixed(1)}% Confidence
          </Text>
        </View>
      </View>
      <View style={styles.detectionCoordinates}>
        <Text style={styles.coordinateText}>
          Position: ({detection.x.toFixed(2)}, {detection.y.toFixed(2)})
        </Text>
        <Text style={styles.coordinateText}>
          Size: {detection.width.toFixed(2)}×{detection.height.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

/**
 * Bounding Box Overlay Component - Draws actual bounding boxes on image
 */
export function BoundingBoxOverlay({
  detections = [],
  imageWidth = 640,
  imageHeight = 640,
  containerWidth = '100%',
  containerHeight = '100%',
  debug = false,
}) {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E2',
  ];

  const [layoutSize, setLayoutSize] = useState({ width: 0, height: 0 });

  const safeDetections = useMemo(() => (Array.isArray(detections) ? detections : []), [detections]);

  const shortLabel = useCallback((className) => {
    const raw = String(className || '').trim();
    const normalized = raw === 'Healthy Fish' ? 'Healthy-Fish' : raw;
    const map = {
      Streptococcus: 'Str',
      'Tilapia Lake Virus': 'TiLV',
      'Bacterial Aeromonas Disease': 'Aer',
      'Healthy-Fish': 'H',
    };
    return map[normalized] || normalized.split('-')[0] || normalized;
  }, []);

  return (
    <View style={[
      styles.overlayContainer, 
      { 
        width: containerWidth,
        height: containerHeight,
        overflow: 'hidden',
      }
    ]}
    onLayout={(e) => {
      const { width, height } = e.nativeEvent.layout;
      setLayoutSize({ width, height });
      if (debug) {
        console.log(`[BoundingBoxOverlay] layout: ${width}x${height} | image: ${imageWidth}x${imageHeight} | detections: ${safeDetections.length}`);
      }
    }}>
      {safeDetections.map((detection, index) => {
        const color = colors[index % colors.length];
        
        // detection.x and detection.y are already normalized top-left coordinates (0-1)
        // detection.width and detection.height are already normalized dimensions (0-1)
        // Convert directly to percentage
        const leftPercent = detection.x * 100;
        const topPercent = detection.y * 100;
        const widthPercent = detection.width * 100;
        const heightPercent = detection.height * 100;

        if (debug) {
          const px = {
            left: (detection.x * layoutSize.width).toFixed(1),
            top: (detection.y * layoutSize.height).toFixed(1),
            width: (detection.width * layoutSize.width).toFixed(1),
            height: (detection.height * layoutSize.height).toFixed(1),
          };
          console.log(
            `[BoundingBox #${index + 1}] ${detection.className} (${(detection.confidence * 100).toFixed(1)}%)\n` +
            `  Normalized: x=${detection.x.toFixed(4)}, y=${detection.y.toFixed(4)}, w=${detection.width.toFixed(4)}, h=${detection.height.toFixed(4)}\n` +
            `  Percent: left=${leftPercent.toFixed(1)}%, top=${topPercent.toFixed(1)}%, width=${widthPercent.toFixed(1)}%, height=${heightPercent.toFixed(1)}%\n` +
            `  Px(layout ${layoutSize.width}x${layoutSize.height}): left=${px.left}px, top=${px.top}px, width=${px.width}px, height=${px.height}px`
          );
        }

        return (
          <View
            key={index}
            style={[
              styles.boundingBox,
              {
                left: `${Math.max(0, leftPercent)}%`,
                top: `${Math.max(0, topPercent)}%`,
                width: `${Math.min(100, widthPercent)}%`,
                height: `${Math.min(100, heightPercent)}%`,
                borderColor: color,
              },
            ]}
          >
            <Text style={[styles.boxLabel, { backgroundColor: color }]}>
              {shortLabel(detection.className)} {(detection.confidence * 100).toFixed(0)}%
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'relative',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 2,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  boxLabel: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    color: 'white',
    fontSize: 9,
    fontWeight: '600',
    marginTop: -1,
    marginLeft: -1,
  },
  container: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    fontSize: 14,
    color: '#636366',
    fontWeight: '500',
  },
  detectionCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  detectionInfo: {
    flex: 1,
  },
  className: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  confidence: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  detectionCoordinates: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  coordinateText: {
    fontSize: 11,
    color: '#636366',
    fontFamily: 'monospace',
  },
});

export default BoundingBoxOverlay;
