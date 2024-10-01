import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FaceMeshComponent } from '../../pages/face-mesh/face-mesh.component';


@Component({
  selector: 'app-template',
  standalone: true,
  imports: [RouterOutlet,FaceMeshComponent],
  templateUrl: './template.component.html',
  styleUrl: './template.component.scss'
})
export class TemplateComponent {

}
