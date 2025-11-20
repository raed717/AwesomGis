import { Injectable } from '@angular/core';
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private drawnShapes: L.Layer[] = [];

  constructor() {}

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

        // Enable Geoman editing on loaded layers
        if ((layer as any).pm) {
          (layer as any).pm.enable();
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
}
