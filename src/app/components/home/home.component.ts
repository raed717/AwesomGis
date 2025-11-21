import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  author = {
    name: 'Rania Hosni',
    title: 'Geomatics Technician',
    bio: 'A geomatics specialist passionate about spatial technologies and geographic data analysis, with solid experience in designing FTTH plans, digital mapping, and GIS project management. With strong skills in GIS tools such as QGIS, ArcGIS Pro, and AutoCAD, I provide effective solutions to challenges related to planning, environment, and connectivity. My professional background has allowed me to collaborate with engineers and field teams, manage technical projects, and maintain a high level of accuracy in data processing.I am also comfortable working in multilingual environments (Arabic, French, English) and have strong communication skills, which support teamwork and ensure client satisfaction.',
    image:
      'https://media.licdn.com/dms/image/v2/D4E03AQHVZkBqYGGyWg/profile-displayphoto-shrink_800_800/B4EZYcwPhhHkAg-/0/1744239132942?e=1765411200&v=beta&t=_qbH6wQGmNnFvxpwanZv-Bf01XX0scUpq53P4XHy_p4',
    email: 'rania@gismap.io',
    linkedin: 'https://www.linkedin.com/in/hosni-rania-9886a0255/',
  };

  features = [
    {
      icon: '🗺️',
      title: 'Interactive 2D Mapping',
      description:
        'Visualize your geospatial data on high-performance 2D maps with smooth pan and zoom capabilities.',
    },
    {
      icon: '📁',
      title: 'Shapefile Upload',
      description:
        'Easily upload and process ESRI shapefiles (.shp, .dbf, .shx) with automatic projection handling.',
    },
    {
      icon: '🎨',
      title: 'Custom Styling',
      description:
        'Apply custom colors, symbols, and labels to your layers for better data visualization.',
    },
    {
      icon: '📊',
      title: 'Attribute Analysis',
      description:
        'Query and analyze attribute data from your shapefiles with advanced filtering options.',
    },
    {
      icon: '💾',
      title: 'Data Export',
      description:
        'Export your styled maps and data in various formats including GeoJSON and KML.',
    },
    {
      icon: '⚡',
      title: 'Fast Performance',
      description:
        'Optimized rendering engine handles large datasets with thousands of features smoothly.',
    },
  ];

  capabilities = [
    'Point, Line, and Polygon geometry support',
    'Multi-layer management with transparency control',
    'Spatial reference system transformation',
    'Real-time coordinate display',
    'Measurement tools for distance and area',
    'Base map switching (OSM, Satellite, Terrain)',
  ];

  scrollToFeatures(): void {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  }

  //redirect to project component
  goToProject(): void {
    window.location.href = '/project';
  }
}