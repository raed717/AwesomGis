import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { ProjectsService } from '../../services/projectService/projects.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-project',
  imports: [CommonModule],
  templateUrl: './project.component.html',
  styleUrl: './project.component.css',
})
export class ProjectComponent implements OnInit, OnDestroy {
  private map!: L.Map;
  private normalTileLayer!: L.TileLayer;
  private satelliteTileLayer!: L.TileLayer;
  private currentLayer: 'normal' | 'satellite' = 'normal';

  isSidebarOpen = false;
  shapeCount = 0;

  constructor(private projectsService: ProjectsService) {}

  ngOnInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    // Initialize the map
    this.map = L.map('map', {
      center: [36.8065, 10.1815], // Tunis coordinates
      zoom: 13,
    });

    // Normal tile layer (OpenStreetMap)
    this.normalTileLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }
    );

    // Satellite tile layer
    this.satelliteTileLayer = L.tileLayer(
      'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      {
        maxZoom: 26,
        maxNativeZoom: 22,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      }
    );

    // Add default layer
    this.normalTileLayer.addTo(this.map);

    // Add Geoman controls
    this.map.pm.addControls({
      position: 'topleft',
      drawCircle: true,
      drawMarker: true,
      drawCircleMarker: true,
      drawPolyline: true,
      drawRectangle: true,
      drawPolygon: true,
      editMode: true,
      dragMode: true,
      cutPolygon: true,
      removalMode: true,
      rotateMode: true,
    });

    // Set up event listeners for drawing
    this.map.on('pm:create', (e: any) => {
      console.log('Shape created:', e);
      const layer = e.layer;

      // Add shape to service
      this.projectsService.addShape(layer);
      this.updateShapeCount();

      // Add popup to show shape info
      if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
        layer.bindPopup('Click to edit or delete this shape');
      }
    });

    this.map.on('pm:edit', (e: any) => {
      console.log('Shape edited:', e);
    });

    this.map.on('pm:remove', (e: any) => {
      console.log('Shape removed:', e);
      this.projectsService.removeShape(e.layer);
      this.updateShapeCount();
    });

    this.map.on('pm:cut', (e: any) => {
      console.log('Shape cut:', e);
    });

    this.map.on('pm:rotate', (e: any) => {
      console.log('Shape rotated:', e);
    });
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  switchLayer(layerType: 'normal' | 'satellite'): void {
    if (layerType === 'satellite' && this.currentLayer !== 'satellite') {
      this.map.removeLayer(this.normalTileLayer);
      this.satelliteTileLayer.addTo(this.map);
      this.currentLayer = 'satellite';
    } else if (layerType === 'normal' && this.currentLayer !== 'normal') {
      this.map.removeLayer(this.satelliteTileLayer);
      this.normalTileLayer.addTo(this.map);
      this.currentLayer = 'normal';
    }
  }

  saveShapes(): void {
    const geoJSON = this.projectsService.saveGeoJSON();
    console.log('Shapes saved:', geoJSON);
    alert('Shapes saved successfully!');
  }

  exportShapes(): void {
    if (this.shapeCount === 0) {
      alert('No shapes to export!');
      return;
    }
    const filename = prompt('Enter filename (without extension):', 'my-shapes');
    if (filename) {
      this.projectsService.exportGeoJSON(filename);
    }
  }

  clearAllShapes(): void {
    if (confirm('Are you sure you want to clear all shapes?')) {
      this.projectsService.clearAllShapes(this.map);
      this.updateShapeCount();
    }
  }

  private updateShapeCount(): void {
    this.shapeCount = this.projectsService.getShapeCount();
  }

  get isNormalLayer(): boolean {
    return this.currentLayer === 'normal';
  }

  get isSatelliteLayer(): boolean {
    return this.currentLayer === 'satellite';
  }
}
