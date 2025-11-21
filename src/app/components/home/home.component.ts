import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-home',
  imports: [CommonModule, NavbarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  // Project information
  projectInfo = {
    title: 'Mapping and Analysis of Critical Infrastructure and Fiber-Optic Needs in a Web GIS Environment for the Impruneta Area (Italy)',
    degree: 'Professional Master\'s Degree in Geomatics for Sustainable Development and the Environment',
    year: '2024–2025',
    collaborators: ['WOLO', 'Faculty of Letters, Arts, and Humanities of Manouba'],
    description: 'This project aims to design and implement a WebGIS solution that centralizes, visualizes, and analyzes data related to critical infrastructure and fiber-optic requirements. The platform is intended to enhance understanding of the existing network, optimize the planning of future extensions, and support strategic decision-making for sustainable urban development.'
  };

  author = {
    name: 'Rania Hosni',
    title: 'Geomatics Technician',
    bio: 'A geomatics specialist passionate about spatial technologies and geographic data analysis, with solid experience in designing FTTH plans, digital mapping, and GIS project management. With strong skills in GIS tools such as QGIS, ArcGIS Pro, and AutoCAD, I provide effective solutions to challenges related to planning, environment, and connectivity. My professional background has allowed me to collaborate with engineers and field teams, manage technical projects, and maintain a high level of accuracy in data processing. I am also comfortable working in multilingual environments (Arabic, French, English) and have strong communication skills, which support teamwork and ensure client satisfaction.',
    image: 'https://media.licdn.com/dms/image/v2/D4E03AQHVZkBqYGGyWg/profile-displayphoto-shrink_800_800/B4EZYcwPhhHkAg-/0/1744239132942?e=1765411200&v=beta&t=_qbH6wQGmNnFvxpwanZv-Bf01XX0scUpq53P4XHy_p4',
    email: 'Hosnirania18@gmail.com',
    linkedin: 'www.linkedin.com/in/hosni-rania-9886a0255/',
  };

  features = [
    {
      icon: '🗺️',
      title: 'Interactive 2D Mapping',
      description: 'Visualize critical infrastructure and fiber-optic networks on high-performance 2D maps with smooth pan and zoom capabilities.',
    },
    {
      icon: '📁',
      title: 'Shapefile Upload',
      description: 'Easily upload and process ESRI shapefiles (.shp, .dbf, .shx) with automatic projection handling for infrastructure data.',
    },
    {
      icon: '🏗️',
      title: 'Infrastructure Analysis',
      description: 'Analyze critical infrastructure networks and identify fiber-optic requirements for optimal urban planning.',
    },
    {
      icon: '🎨',
      title: 'Custom Styling',
      description: 'Apply custom colors, symbols, and labels to infrastructure layers for better data visualization.',
    },
    {
      icon: '📊',
      title: 'Attribute Analysis',
      description: 'Query and analyze attribute data from your shapefiles with advanced filtering options for infrastructure management.',
    },
    {
      icon: '💾',
      title: 'Data Export',
      description: 'Export your styled maps and analysis results in various formats including GeoJSON and KML.',
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

  scrollToFeatures(): void {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  }

  scrollToAuthor(): void {
    document.getElementById('author')?.scrollIntoView({ behavior: 'smooth' });
  }

  goToProject(): void {
    window.location.href = '/project';
  }
}