import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import shp from 'shpjs';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private drawnShapes: L.Layer[] = [];

  constructor() {}

  // Get all shapes with their attributes
  getAllShapesWithAttributes(): Array<{
    layer: L.Layer;
    properties: any;
    geometry: any;
  }> {
    return this.drawnShapes.map((layer) => {
      const geoJSON = (layer as any).toGeoJSON
        ? (layer as any).toGeoJSON()
        : null;
      return {
        layer,
        properties: geoJSON?.properties || {},
        geometry: geoJSON?.geometry || null,
      };
    });
  }

  // Add a drawn shape to the collection
  addShape(layer: L.Layer): void {
    this.drawnShapes.push(layer);
  }

  // Remove a shape from the collection
  removeShape(layer: L.Layer): void {
    const index = this.drawnShapes.indexOf(layer);
    if (index > -1) {
      this.drawnShapes.splice(index, 1);
    }
  }

  // Get all drawn shapes as GeoJSON
  getShapesAsGeoJSON(): any {
    const featureGroup = L.featureGroup(this.drawnShapes);
    return featureGroup.toGeoJSON();
  }

  // Export shapes as GeoJSON file
  exportGeoJSON(filename: string = 'shapes'): void {
    const geoJSON = this.getShapesAsGeoJSON();
    const dataStr = JSON.stringify(geoJSON, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.geojson`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Save GeoJSON data (returns the data)
  saveGeoJSON(): any {
    return this.getShapesAsGeoJSON();
  }

  // Load GeoJSON data to the map
  loadGeoJSON(geoJSONData: any, map: L.Map): void {
    this.drawnShapes = [];
    L.geoJSON(geoJSONData, {
      onEachFeature: (feature, layer) => {
        this.drawnShapes.push(layer);
        layer.addTo(map);

        // Don't enable Geoman editing automatically - let user enable it via Edit Mode button
        // This prevents performance issues when loading many shapes
        if ((layer as any).pm) {
          (layer as any).pm.disable();
        }
      },
    });
  }

  // Get the count of drawn shapes
  getShapeCount(): number {
    return this.drawnShapes.length;
  }

  // Clear all shapes
  clearAllShapes(map: L.Map): void {
    this.drawnShapes.forEach((layer) => {
      map.removeLayer(layer);
    });
    this.drawnShapes = [];
  }

  // Import shapefile from a zip file
  async importShapefile(
    file: File,
    map: L.Map
  ): Promise<{
    success: boolean;
    message: string;
    count?: number;
    error?: any;
  }> {
    try {
      // Read the file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Parse the shapefile using shpjs
      const geojson = await shp(arrayBuffer);

      if (!geojson) {
        return {
          success: false,
          message:
            'Failed to parse shapefile. The file may be corrupted or invalid.',
        };
      }

      let featureCount = 0;
      const shapefileNames: string[] = [];
      let shapefileData: Array<{ name: string; data: any }> = [];

      // Handle both single shapefile and multiple shapefiles in zip
      if (Array.isArray(geojson)) {
        // Multiple shapefiles returned as array
        // Each GeoJSON object has a 'fileName' property with the .shp name
        geojson.forEach((data) => {
          if (data && data.features) {
            // Clean the fileName: remove path and extension
            let shapefileName =
              data.fileName || `shapefile_${shapefileData.length + 1}`;
            shapefileName = this.cleanShapefileName(shapefileName);

            shapefileData.push({ name: shapefileName, data });
            shapefileNames.push(shapefileName);
          }
        });
      } else if (geojson.features) {
        // Single shapefile returned as GeoJSON object
        let shapefileName = geojson.fileName || 'shapefile_1';
        shapefileName = this.cleanShapefileName(shapefileName);

        shapefileData.push({ name: shapefileName, data: geojson });
        shapefileNames.push(shapefileName);
      } else {
        // Object with shapefile names as keys (alternative format)
        Object.keys(geojson).forEach((key) => {
          const data = (geojson as any)[key];
          if (data && data.features) {
            // Extract shapefile name from key
            let cleanName = this.cleanShapefileName(key);

            if (!cleanName) {
              cleanName = `shapefile_${shapefileData.length + 1}`;
            }

            shapefileData.push({ name: cleanName, data });
            shapefileNames.push(cleanName);
          }
        });
      }

      if (shapefileData.length === 0) {
        return {
          success: false,
          message: 'The shapefile contains no valid features or geometries.',
        };
      }

      // Process each shapefile
      shapefileData.forEach(({ name: shapefileName, data }) => {
        if (data && data.features && data.features.length > 0) {
          // Create GeoJSON layer group
          const geoJsonLayer = L.geoJSON(data, {
            onEachFeature: (feature, layer) => {
              // Add or override the "name" attribute with the shapefile name
              if (!feature.properties) {
                feature.properties = {};
              }
              // Set the name attribute to the .shp filename
              feature.properties.name = shapefileName;

              // Disable Geoman editing initially
              if ((layer as any).pm) {
                (layer as any).pm.disable();
              }

              // Add popup with feature properties
              const props = Object.entries(feature.properties)
                .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
                .join('<br>');
              layer.bindPopup(props || 'No properties');

              // Store layer reference
              this.drawnShapes.push(layer);
              featureCount++;
            },
            style: () => ({
              color: '#3388ff',
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.3,
            }),
          });

          // Add the entire layer group to map
          geoJsonLayer.addTo(map);
        }
      });

      if (featureCount === 0) {
        return {
          success: false,
          message: 'The shapefile contains no valid features or geometries.',
        };
      }

      // Fit map bounds to the imported shapes
      if (this.drawnShapes.length > 0) {
        const group = L.featureGroup(this.drawnShapes);
        map.fitBounds(group.getBounds(), { padding: [50, 50] });
      }

      // Create success message
      const shapefileCount = shapefileData.length;
      let message = `Successfully imported ${featureCount} feature(s)`;
      if (shapefileCount > 1) {
        message += ` from ${shapefileCount} shapefile(s): ${shapefileNames.join(
          ', '
        )}`;
      } else {
        message += ` from ${shapefileData[0].name}`;
      }
      message += '. Each feature has been assigned a "name" attribute.';

      return {
        success: true,
        message,
        count: featureCount,
      };
    } catch (error: any) {
      console.error('Error importing shapefile:', error);

      let errorMessage = 'Failed to import shapefile. ';

      if (error.message && error.message.includes('shp')) {
        errorMessage += 'The .shp file is missing or corrupted.';
      } else if (error.message && error.message.includes('dbf')) {
        errorMessage += 'The .dbf file is missing or corrupted.';
      } else if (error.message && error.message.includes('shx')) {
        errorMessage += 'The .shx file is missing (optional but recommended).';
      } else {
        errorMessage +=
          'Please ensure your ZIP contains .shp, .dbf, and .shx files.';
      }

      return {
        success: false,
        message: errorMessage,
        error: error,
      };
    }
  }

  // Clean shapefile name: remove path, extension, and trim
  private cleanShapefileName(name: string): string {
    return name
      .replace(/^.*[\\\/]/, '') // Remove path (works for both / and \)
      .replace(/\.shp$/i, '') // Remove .shp extension
      .trim();
  }
}
