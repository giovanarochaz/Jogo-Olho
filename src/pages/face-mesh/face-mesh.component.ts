import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { Camera } from '@mediapipe/camera_utils';
import { BlinkDetectionService } from '../../service/BlinkDetectionService';
import { isPlatformBrowser } from '@angular/common';
import { FaceMesh } from '@mediapipe/face_mesh';

@Component({
  selector: 'app-face-mesh',
  standalone: true,
  imports: [],
  templateUrl: './face-mesh.component.html',
  styleUrls: ['./face-mesh.component.scss'] // corrected styleUrl to styleUrls
})
export class FaceMeshComponent implements OnInit, AfterViewInit {
  @ViewChild('videoElement') videoElement!: ElementRef;
  @ViewChild('canvasElement') canvasElement!: ElementRef;
  private faceMesh: any;
  private camera!: Camera;

  constructor(
    private blinkDetectionService: BlinkDetectionService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Subscribe to the blink detection event
    this.blinkDetectionService.blinkDetected.subscribe(() => {
      // Emit an event or call a method to notify the other component
      console.log('Blink detected in FaceMeshComponent');
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeFaceMesh();
      console.log('this.platformId',this.platformId);

    }
  }

  private async initializeFaceMesh(): Promise<void> {
    const { FaceMesh } = await import('@mediapipe/face_mesh');

    this.faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    console.log('teste',this.faceMesh);


    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.faceMesh.onResults(this.onResults.bind(this));

    this.camera = new Camera(this.videoElement.nativeElement, {
      onFrame: async () => {
        await this.faceMesh.send({ image: this.videoElement.nativeElement });
      },
      width: 640,
      height: 480
    });

    this.camera.start();
  }

  private onResults(results: any): void {
    const canvasCtx = this.canvasElement.nativeElement.getContext('2d');
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, this.canvasElement.nativeElement.width, this.canvasElement.nativeElement.height);

    canvasCtx.drawImage(
      results.image,
      0,
      0,
      this.canvasElement.nativeElement.width,
      this.canvasElement.nativeElement.height
    );

    if (results.multiFaceLandmarks) {
      for (const landmarks of results.multiFaceLandmarks) {
        const leftEyeTop = landmarks[159];
        const leftEyeBottom = landmarks[145];

        const leftEyeTopY = leftEyeTop.y * this.canvasElement.nativeElement.height;
        const leftEyeBottomY = leftEyeBottom.y * this.canvasElement.nativeElement.height;
        const currentEyeHeight = leftEyeBottomY - leftEyeTopY;

        this.blinkDetectionService.registerEyeHeight(currentEyeHeight);

        this.blinkDetectionService.detectBlink(currentEyeHeight);
        
        canvasCtx.beginPath();
        canvasCtx.moveTo(leftEyeTop.x * this.canvasElement.nativeElement.width, leftEyeTopY);
        canvasCtx.lineTo(leftEyeBottom.x * this.canvasElement.nativeElement.width, leftEyeBottomY);
        canvasCtx.strokeStyle = 'red';
        canvasCtx.lineWidth = 2;
        canvasCtx.stroke();
      }
    }

    canvasCtx.restore();
  }

  private isDragging = false;
  private offset = { x: 0, y: 0 };

  startDrag(event: MouseEvent): void {
    this.isDragging = true;
  
    const target = event.target as HTMLElement;
  
    this.offset.x = event.clientX - target.getBoundingClientRect().left;
    this.offset.y = event.clientY - target.getBoundingClientRect().top;
  
    document.addEventListener('mousemove', this.onDrag.bind(this));
    document.addEventListener('mouseup', this.stopDrag.bind(this));
  }
  
  private onDrag(event: MouseEvent): void {
    if (this.isDragging) {
      const floatingHelp = document.querySelector('.floating-help') as HTMLElement;
      floatingHelp.style.left = `${event.clientX - this.offset.x}px`;
      floatingHelp.style.top = `${event.clientY - this.offset.y}px`;
    }
  }

  private stopDrag(): void {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.onDrag.bind(this));
    document.removeEventListener('mouseup', this.stopDrag.bind(this));
  }
}
