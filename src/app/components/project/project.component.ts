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

  private listeners: Array<{
    type: string;
    handler: (...args: any[]) => void;
  }> = [];

  isSidebarOpen = false;
  shapeCount = 0;
  isImporting = false;

  constructor(private projectsService: ProjectsService) {}

  ngOnInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (!this.map) return;

    // 1. Remove custom listeners
    this.listeners.forEach((l) => this.map.off(l.type, l.handler));
    this.listeners = [];

    // 2. Remove Geoman completely
    // @ts-ignore
    if (this.map.pm) {
      // @ts-ignore
      this.map.pm.removeControls();
      // Remove Geoman event listeners
      const geomanEvents = [
        'pm:create',
        'pm:edit',
        'pm:remove',
        'pm:cut',
        'pm:rotate',
      ];
      geomanEvents.forEach((ev) => this.map.off(ev));
    }

    // 3. Remove layers
    if (this.map.hasLayer(this.normalTileLayer))
      this.map.removeLayer(this.normalTileLayer);
    if (this.map.hasLayer(this.satelliteTileLayer))
      this.map.removeLayer(this.satelliteTileLayer);

    // 4. Remove all drawn shapes from service (optional but cleaner)
    this.projectsService.clearAllShapes(this.map);

    // 5. Fully destroy Leaflet map
    this.map.remove();
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [36.8065, 10.1815],
      zoom: 13,
    });

    this.normalTileLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { maxZoom: 19, attribution: '© OpenStreetMap contributors' }
    );

    this.satelliteTileLayer = L.tileLayer(
      'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      {
        maxZoom: 26,
        maxNativeZoom: 22,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      }
    );

    this.normalTileLayer.addTo(this.map);

    // Add Geoman
    // @ts-ignore
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

    this.registerListener('pm:create', (e: any) => {
      const layer = e.layer;
      this.projectsService.addShape(layer);
      this.updateShapeCount();
      if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
        layer.bindPopup('Click to edit or delete this shape');
      }
    });

    this.registerListener('pm:edit', (e) => console.log('Shape edited', e));
    this.registerListener('pm:remove', (e) => {
      this.projectsService.removeShape(e.layer);
      this.updateShapeCount();
    });

    this.registerListener('pm:cut', (e) => console.log('Shape cut', e));
    this.registerListener('pm:rotate', (e) => console.log('Rotate', e));
  }

  private registerListener(type: string, handler: (...args: any[]) => void) {
    this.map.on(type, handler);
    this.listeners.push({ type, handler });
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
      Swal.fire({
        icon: 'warning',
        title: 'No Shapes',
        text: 'There are no shapes to export!',
        confirmButtonColor: '#4CAF50',
      });
      return;
    }
    const filename = prompt('Enter filename (without extension):', 'my-shapes');
    if (filename) {
      this.projectsService.exportGeoJSON(filename);
      Swal.fire({
        icon: 'success',
        title: 'Exported!',
        text: `Shapes exported as ${filename}.geojson`,
        timer: 2000,
        showConfirmButton: false,
      });
    }
  }

  async onFileSelected(event: any): Promise<void> {
    const file: File = event.target.files[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (!file.name.endsWith('.zip')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Please upload a ZIP file containing shapefile components (.shp, .dbf, .shx)',
        confirmButtonColor: '#4CAF50',
      });
      event.target.value = ''; // Reset file input
      return;
    }

    this.isImporting = true;

    // Show loading
    Swal.fire({
      title: 'Importing Shapefile...',
      text: 'Please wait while we process your file',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const result = await this.projectsService.importShapefile(file, this.map);

      if (result.success) {
        this.updateShapeCount();
        Swal.fire({
          icon: 'success',
          title: 'Import Successful!',
          text: result.message,
          confirmButtonColor: '#4CAF50',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Import Failed',
          text: result.message,
          footer:
            '<a href="https://desktop.arcgis.com/en/arcmap/latest/manage-data/shapefiles/what-is-a-shapefile.htm" target="_blank">What is a Shapefile?</a>',
          confirmButtonColor: '#4CAF50',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Something went wrong while importing the shapefile!',
        footer:
          '<a href="https://desktop.arcgis.com/en/arcmap/latest/manage-data/shapefiles/what-is-a-shapefile.htm" target="_blank">Why do I have this issue?</a>',
        confirmButtonColor: '#4CAF50',
      });
    } finally {
      this.isImporting = false;
      event.target.value = ''; // Reset file input
    }
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById(
      'shapefileInput'
    ) as HTMLInputElement;
    fileInput?.click();
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
