import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ProjectComponent } from './components/project/project.component';
import { ShapefilesComponent} from './components/shapefiles/shapefiles.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'project', component: ProjectComponent },
  { path: 'shapefile', component: ShapefilesComponent },

  { path: '**', redirectTo: '/home' },
];
