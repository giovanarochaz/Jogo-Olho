import { Component, ElementRef, AfterViewInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as bootstrap from 'bootstrap';
import { ApiService } from '../../service/blink-events';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-nivel-medio',
  templateUrl: './nivel-medio.component.html',
  styleUrls: ['./nivel-medio.component.scss']
})
export class NivelMedioComponent implements AfterViewInit, OnDestroy {

  private carouselInstance?: bootstrap.Carousel;
  private intervalId?: any;
  private buttons: HTMLElement[] = [];
  blinkData: string[] = [];

  constructor(
    private elementRef: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.buttons = Array.from(this.elementRef.nativeElement.querySelectorAll('.carousel-item .action-button')) as HTMLElement[];
      this.initializeCarousel();
      this.startAutoSlide();
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private initializeCarousel(): void {
    const carouselElement = this.elementRef.nativeElement.querySelector('.carousel') as HTMLElement;
    if (carouselElement) {
      this.carouselInstance = new bootstrap.Carousel(carouselElement, {
        interval: 3000,
        ride: 'carousel'
      });
    }
  }

  private startAutoSlide(): void {
    this.intervalId = setInterval(() => {
      this.carouselInstance?.next();
    }, 3000); 
  }

  sistemaSolar(): void {
    const tipo = this.route.snapshot.paramMap.get('tipo');
    if (tipo) {
      this.router.navigate(['/sistema-solar', tipo]);
    } else {
      console.error('Tipo não encontrado na rota');
    }
  }
}
