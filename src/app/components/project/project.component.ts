import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { ProjectsService } from '../../services/projectService/projects.service';
import { ShapefilesComponent } from '../shapefiles/shapefiles.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-project',
  imports: [CommonModule, FormsModule, ShapefilesComponent],
  templateUrl: './project.component.html',
  styleUrl: './project.component.css',
})
export class ProjectComponent implements OnInit, OnDestroy {
  map!: L.Map;
  private normalTileLayer!: L.TileLayer;
  private satelliteTileLayer!: L.TileLayer;
  private currentLayer: 'normal' | 'satellite' = 'normal';

  private listeners: Array<{
    type: string;
    handler: (...args: any[]) => void;
  }> = [];

  isSidebarOpen = false;
  shapeCount = 0;
  showAttributesTable = false;
  showShapefilesModal = false;
  shapeAttributes: Array<{ layer: L.Layer; properties: any; geometry: any }> = [];
  filteredAttributes: Array<{ layer: L.Layer; properties: any; geometry: any }> = [];
  private updateCountTimeout: any;

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  paginatedAttributes: Array<{ layer: L.Layer; properties: any; geometry: any }> = [];

  // Filter properties
  searchText = '';
  selectedAttributeFilter: string = '';
  attributeFilterValue = '';

  constructor(private projectsService: ProjectsService) {}

  ngOnInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (!this.map) return;

    // Clear any pending timeouts
    if (this.updateCountTimeout) {
      clearTimeout(this.updateCountTimeout);
    }

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
      // Disable editing initially - user can enable via Edit Mode button
      if ((layer as any).pm) {
        (layer as any).pm.disable();
      }
      if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
        layer.bindPopup('Click to edit or delete this shape');
      }
    });

    this.registerListener('pm:edit', (e) => {
      console.log('Shape edited', e);
      // Refresh attributes if table is open
      if (this.showAttributesTable) {
        this.loadShapeAttributes();
      }
    });
    this.registerListener('pm:remove', (e) => {
      this.projectsService.removeShape(e.layer);
      this.updateShapeCount();
      // Refresh attributes if table is open
      if (this.showAttributesTable) {
        this.loadShapeAttributes();
      }
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

  openShapefilesModal(): void {
    this.showShapefilesModal = true;
  }

  closeShapefilesModal(): void {
    this.showShapefilesModal = false;
  }

  onImportComplete(result: { success: boolean; message: string; count: number }): void {
    if (result.success) {
      this.updateShapeCount();
      // Refresh attributes if table is open
      if (this.showAttributesTable) {
        this.loadShapeAttributes();
      }
      Swal.fire({
        icon: 'success',
        title: 'Import Successful!',
        text: result.message,
        confirmButtonColor: '#4CAF50',
        timer: 3000,
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
  }

  clearAllShapes(): void {
    if (confirm('Are you sure you want to clear all shapes?')) {
      this.projectsService.clearAllShapes(this.map);
      this.updateShapeCount();
      // Refresh attributes if table is open
      if (this.showAttributesTable) {
        this.loadShapeAttributes();
      }
    }
  }

  private updateShapeCount(): void {
    // Debounce shape count updates to improve performance
    if (this.updateCountTimeout) {
      clearTimeout(this.updateCountTimeout);
    }
    this.updateCountTimeout = setTimeout(() => {
      this.shapeCount = this.projectsService.getShapeCount();
    }, 100);
  }

  showAttributesData(): void {
    this.resetFilters();
    this.loadShapeAttributes();
    this.showAttributesTable = true;
  }

  closeAttributesTable(): void {
    this.showAttributesTable = false;
    this.resetFilters();
  }

  private loadShapeAttributes(): void {
    this.shapeAttributes = this.projectsService.getAllShapesWithAttributes();
    this.applyFilters();
  }

  getAttributeKeys(): string[] {
    if (this.shapeAttributes.length === 0) return [];
    const allKeys = new Set<string>();
    this.shapeAttributes.forEach(shape => {
      Object.keys(shape.properties).forEach(key => allKeys.add(key));
    });
    return Array.from(allKeys).sort();
  }

  // Filter methods
  resetFilters(): void {
    this.searchText = '';
    this.selectedAttributeFilter = '';
    this.attributeFilterValue = '';
    this.currentPage = 1;
  }

  applyFilters(): void {
    let filtered = [...this.shapeAttributes];

    // Apply search text filter (searches across all properties)
    if (this.searchText.trim()) {
      const searchLower = this.searchText.toLowerCase();
      filtered = filtered.filter(shape => {
        // Search in all property values
        return Object.values(shape.properties).some(value => 
          value !== null && value !== undefined && 
          String(value).toLowerCase().includes(searchLower)
        ) || (shape.geometry?.type || '').toLowerCase().includes(searchLower);
      });
    }

    // Apply attribute-specific filter
    if (this.selectedAttributeFilter && this.attributeFilterValue.trim()) {
      const filterValue = this.attributeFilterValue.toLowerCase();
      filtered = filtered.filter(shape => {
        const propValue = shape.properties[this.selectedAttributeFilter];
        return propValue !== null && propValue !== undefined && 
               String(propValue).toLowerCase().includes(filterValue);
      });
    }

    this.filteredAttributes = filtered;
    this.totalPages = Math.ceil(this.filteredAttributes.length / this.itemsPerPage) || 1;
    this.currentPage = Math.min(this.currentPage, this.totalPages) || 1;
    this.updatePaginatedData();
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onAttributeFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  // Pagination methods
  updatePaginatedData(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedAttributes = this.filteredAttributes.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedData();
      // Scroll to top of table
      const modalBody = document.querySelector('.modal-body');
      if (modalBody) {
        modalBody.scrollTop = 0;
      }
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getDisplayRange(): string {
    if (this.filteredAttributes.length === 0) return '0 - 0';
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredAttributes.length);
    return `${start} - ${end}`;
  }

  get isNormalLayer(): boolean {
    return this.currentLayer === 'normal';
  }

  get isSatelliteLayer(): boolean {
    return this.currentLayer === 'satellite';
  }
}
