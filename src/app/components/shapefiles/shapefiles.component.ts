import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { ProjectsService } from '../../services/projectService/projects.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-shapefiles',
  imports: [CommonModule, FormsModule],
  templateUrl: './shapefiles.component.html',
  styleUrl: './shapefiles.component.css'
})
export class ShapefilesComponent implements OnInit {
  @Input() map!: L.Map;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() importComplete = new EventEmitter<{ success: boolean; message: string; count: number }>();

  isImporting = false;
  uploadProgress = 0;
  selectedFile: File | null = null;
  dragOver = false;
  uploadStatus: 'idle' | 'uploading' | 'processing' | 'success' | 'error' = 'idle';
  uploadMessage = '';

  constructor(private projectsService: ProjectsService) {}

  ngOnInit(): void {
    // Component initialization
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.handleFileSelection(file);
    }
  }

  handleFileSelection(file: File): void {
    // Validate file type
    if (!file.name.endsWith('.zip')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Please upload a ZIP file containing shapefile components (.shp, .dbf, .shx)',
        confirmButtonColor: '#4CAF50',
      });
      return;
    }

    this.selectedFile = file;
    this.uploadStatus = 'idle';
    this.uploadMessage = `Selected: ${file.name} (${this.formatFileSize(file.size)})`;
  }

  async importShapefile(): Promise<void> {
    if (!this.selectedFile || !this.map) {
      return;
    }

    this.isImporting = true;
    this.uploadStatus = 'uploading';
    this.uploadProgress = 0;
    this.uploadMessage = 'Uploading file...';

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 10;
      }
    }, 200);

    try {
      this.uploadStatus = 'processing';
      this.uploadMessage = 'Processing shapefile...';
      this.uploadProgress = 90;

      const result = await this.projectsService.importShapefile(this.selectedFile, this.map);

      clearInterval(progressInterval);
      this.uploadProgress = 100;

      if (result.success) {
        this.uploadStatus = 'success';
        this.uploadMessage = result.message;
        
        // Emit success event
        this.importComplete.emit({
          success: true,
          message: result.message,
          count: result.count || 0
        });

        // Auto-close after success (optional)
        setTimeout(() => {
          this.closeModal();
        }, 2000);
      } else {
        this.uploadStatus = 'error';
        this.uploadMessage = result.message;
        this.importComplete.emit({
          success: false,
          message: result.message,
          count: 0
        });
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      this.uploadStatus = 'error';
      this.uploadMessage = 'Failed to import shapefile. Please try again.';
      this.importComplete.emit({
        success: false,
        message: 'An error occurred during import',
        count: 0
      });
    } finally {
      this.isImporting = false;
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.uploadStatus = 'idle';
    this.uploadMessage = '';
    this.uploadProgress = 0;
  }

  closeModal(): void {
    this.selectedFile = null;
    this.uploadStatus = 'idle';
    this.uploadMessage = '';
    this.uploadProgress = 0;
    this.dragOver = false;
    this.close.emit();
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('shapefileInput') as HTMLInputElement;
    fileInput?.click();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  getStatusIcon(): string {
    switch (this.uploadStatus) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'uploading':
      case 'processing':
        return '⟳';
      default:
        return '📁';
    }
  }

  isSpinning(): boolean {
    return this.uploadStatus === 'uploading' || this.uploadStatus === 'processing';
  }

  getStatusColor(): string {
    switch (this.uploadStatus) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#f44336';
      case 'uploading':
      case 'processing':
        return '#2196F3';
      default:
        return '#666';
    }
  }
}
