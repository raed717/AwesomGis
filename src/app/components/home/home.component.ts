import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import * as THREE from 'three';

@Component({
  selector: 'app-home',
  imports: [CommonModule, NavbarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('threeContainer', { static: false }) threeContainer!: ElementRef;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private globe!: THREE.Mesh;
  private points!: THREE.Points;
  private animationId: number = 0;
  private raycaster!: THREE.Raycaster;
  private mouse!: THREE.Vector2;
  private hoveredPoint: number | null = null;
  private pointSizes!: Float32Array;
  private pointColors!: Float32Array;
  private originalSizes!: Float32Array;
  private originalColors!: Float32Array;

  // Project information
  projectInfo = {
    title:
      'Mapping and Analysis of Critical Infrastructure and Fiber-Optic Needs in a Web GIS Environment for the Impruneta Area (Italy)',
    degree:
      "Professional Master's Degree in Geomatics for Sustainable Development and the Environment",
    year: '2024–2025',
    collaborators: [
      'WOLO',
      'Faculty of Letters, Arts, and Humanities of Manouba',
    ],
    description:
      'This project aims to design and implement a WebGIS solution that centralizes, visualizes, and analyzes data related to critical infrastructure and fiber-optic requirements. The platform is intended to enhance understanding of the existing network, optimize the planning of future extensions, and support strategic decision-making for sustainable urban development.',
  };

  author = {
    name: 'Rania Hosni',
    title: 'Geomatics Technician',
    bio: 'A geomatics specialist passionate about spatial technologies and geographic data analysis, with solid experience in designing FTTH plans, digital mapping, and GIS project management. With strong skills in GIS tools such as QGIS, ArcGIS Pro, and AutoCAD, I provide effective solutions to challenges related to planning, environment, and connectivity. My professional background has allowed me to collaborate with engineers and field teams, manage technical projects, and maintain a high level of accuracy in data processing. I am also comfortable working in multilingual environments (Arabic, French, English) and have strong communication skills, which support teamwork and ensure client satisfaction.',
    image: 'rania.jpg',
    email: 'Hosnirania18@gmail.com',
    linkedin: 'www.linkedin.com/in/hosni-rania-9886a0255/',
  };

  features = [
    {
      icon: '🗺️',
      title: 'Interactive 2D Mapping',
      description:
        'Visualize critical infrastructure and fiber-optic networks on high-performance 2D maps with smooth pan and zoom capabilities.',
    },
    {
      icon: '📁',
      title: 'Shapefile Upload',
      description:
        'Easily upload and process ESRI shapefiles (.shp, .dbf, .shx) with automatic projection handling for infrastructure data.',
    },
    {
      icon: '🏗️',
      title: 'Infrastructure Analysis',
      description:
        'Analyze critical infrastructure networks and identify fiber-optic requirements for optimal urban planning.',
    },
    {
      icon: '📊',
      title: 'Attribute Analysis',
      description:
        'Query and analyze attribute data from your shapefiles with advanced filtering options for infrastructure management.',
    },
    {
      icon: '💾',
      title: 'Data Export',
      description:
        'Export your styled maps and analysis results in various formats including GeoJSON and KML.',
    },
  ];

  capabilities = [
    'Point, Line, and Polygon geometry support for infrastructure mapping',
    'Multi-layer management with transparency control',
    'Spatial reference system transformation',
    'Real-time coordinate display',
    'Measurement tools for distance and area',
    'Base map switching (OSM, Satellite, Terrain)',
    'Critical infrastructure network visualization',
    'Fiber-optic coverage analysis',
  ];

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // Wait for the DOM to actually paint before initializing Three
    requestAnimationFrame(() => {
      this.ensureContainerReady();
    });
  }

  private ensureContainerReady() {
    const container = this.threeContainer?.nativeElement;

    if (!container) return;

    const { clientWidth, clientHeight } = container;

    // If container hasn't been laid out yet, retry
    if (clientWidth === 0 || clientHeight === 0) {
      setTimeout(() => this.ensureContainerReady(), 30);
      return;
    }

    // Now it's safe to initialize ThreeJS
    this.initThreeJS();
    this.animate();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    // Remove mouse event listener
    const container = this.threeContainer?.nativeElement;
    if (container) {
      container.removeEventListener('mousemove', this.onMouseMove);
    }
  }

  private initThreeJS(): void {
    const container = this.threeContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.z = 5;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // Initialize raycaster and mouse for hover detection
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Points.threshold = 0.1; // Increase hover detection radius
    this.mouse = new THREE.Vector2();

    // Create globe with wireframe
    const geometry = new THREE.SphereGeometry(1.5, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    this.globe = new THREE.Mesh(geometry, material);
    this.scene.add(this.globe);

    // Add connection points
    this.createConnectionPoints();

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Add mouse move listener
    container.addEventListener('mousemove', this.onMouseMove);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private createConnectionPoints(): void {
    const pointsGeometry = new THREE.BufferGeometry();
    const pointsCount = 1000;
    const positions = new Float32Array(pointsCount * 3);
    this.pointSizes = new Float32Array(pointsCount);
    this.pointColors = new Float32Array(pointsCount * 3);
    this.originalSizes = new Float32Array(pointsCount);
    this.originalColors = new Float32Array(pointsCount * 3);

    // Default color (purple)
    const defaultColor = new THREE.Color(0x8b5cf6);

    for (let i = 0; i < pointsCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 1.5;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Initialize sizes
      const baseSize = 0.05 + Math.random() * 0.02;
      this.pointSizes[i] = baseSize;
      this.originalSizes[i] = baseSize;

      // Initialize colors
      this.pointColors[i * 3] = defaultColor.r;
      this.pointColors[i * 3 + 1] = defaultColor.g;
      this.pointColors[i * 3 + 2] = defaultColor.b;

      this.originalColors[i * 3] = defaultColor.r;
      this.originalColors[i * 3 + 1] = defaultColor.g;
      this.originalColors[i * 3 + 2] = defaultColor.b;
    }

    pointsGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    pointsGeometry.setAttribute(
      'size',
      new THREE.BufferAttribute(this.pointSizes, 1)
    );
    pointsGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(this.pointColors, 3)
    );

    const pointsMaterial = new THREE.PointsMaterial({
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(pointsGeometry, pointsMaterial);
    this.scene.add(this.points);
  }

  private onMouseMove = (event: MouseEvent): void => {
    const container = this.threeContainer.nativeElement;
    const rect = container.getBoundingClientRect();

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Check for intersections with points
    const intersects = this.raycaster.intersectObject(this.points);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      const index = intersect.index!;

      // If hovering over a new point
      if (this.hoveredPoint !== index) {
        // Reset previous hovered point
        if (this.hoveredPoint !== null) {
          this.resetPoint(this.hoveredPoint);
        }

        // Set new hovered point
        this.hoveredPoint = index;
        this.animatePoint(index);

        // Change cursor
        container.style.cursor = 'pointer';
      }
    } else {
      // No intersection - reset hovered point
      if (this.hoveredPoint !== null) {
        this.resetPoint(this.hoveredPoint);
        this.hoveredPoint = null;
        container.style.cursor = 'default';
      }
    }
  };

  private animatePoint(index: number): void {
    // Animate size - make it bigger
    this.pointSizes[index] = this.originalSizes[index] * 10;

    // Change color to cyan/bright color
    const hoverColor = new THREE.Color(0x00ffff);
    this.pointColors[index * 3] = hoverColor.r;
    this.pointColors[index * 3 + 1] = hoverColor.g;
    this.pointColors[index * 3 + 2] = hoverColor.b;

    // Mark attributes as needing update
    const geometry = this.points.geometry;
    const sizeAttribute = geometry.getAttribute(
      'size'
    ) as THREE.BufferAttribute;
    const colorAttribute = geometry.getAttribute(
      'color'
    ) as THREE.BufferAttribute;

    sizeAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
  }

  private resetPoint(index: number): void {
    // Reset to original size
    this.pointSizes[index] = this.originalSizes[index];

    // Reset to original color
    this.pointColors[index * 3] = this.originalColors[index * 3];
    this.pointColors[index * 3 + 1] = this.originalColors[index * 3 + 1];
    this.pointColors[index * 3 + 2] = this.originalColors[index * 3 + 2];

    // Mark attributes as needing update
    const geometry = this.points.geometry;
    const sizeAttribute = geometry.getAttribute(
      'size'
    ) as THREE.BufferAttribute;
    const colorAttribute = geometry.getAttribute(
      'color'
    ) as THREE.BufferAttribute;

    sizeAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    // Rotate globe
    if (this.globe) {
      this.globe.rotation.y += 0.002;
      this.globe.rotation.x += 0.001;
    }

    // Rotate points slightly different
    if (this.points) {
      this.points.rotation.y += 0.003;
    }

    this.renderer.render(this.scene, this.camera);
  };

  private onWindowResize(): void {
    const container = this.threeContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  scrollToFeatures(): void {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  }

  scrollToAuthor(): void {
    document.getElementById('author')?.scrollIntoView({ behavior: 'smooth' });
  }

  goToProject(): void {
    window.location.href = '/project';
  }

  goToAbout(): void {
    window.location.href = '/about';
  }
}