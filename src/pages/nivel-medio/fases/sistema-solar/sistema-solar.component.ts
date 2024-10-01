import { Component, ElementRef, Inject, PLATFORM_ID, AfterViewInit, Renderer2, HostListener, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../../service/blink-events';
import { BlinkDetectionService } from '../../../../service/BlinkDetectionService';

@Component({
  selector: 'app-sistema-solar',
  standalone: true,
  imports: [],
  templateUrl: './sistema-solar.component.html',
  styleUrls: ['./sistema-solar.component.scss']
})
export class SistemaSolarComponent implements OnInit {
  @ViewChild('gameContainer', { static: true }) gameContainer!: ElementRef<HTMLElement>;

  personagem: HTMLElement | null = null;
  coracoes: HTMLElement[] = [];
  vidas: number = 5;
  planetasColetados: HTMLElement | null = null;

  ordemPlanetas: string[] = ["Mercúrio", "Vênus", "Terra", "Marte", "Júpiter", "Saturno", "Urano", "Netuno"];
  imagensPlanetas: { [key: string]: string } = {
    "Mercúrio": "../../../../assets/img/fases/medio/sistema-solar/mercurio.png",
    "Vênus": "../../../../assets/img/fases/medio/sistema-solar/venus.png",
    "Terra": "../../../../assets/img/fases/medio/sistema-solar/terra.png",
    "Marte": "../../../../assets/img/fases/medio/sistema-solar/marte.png",
    "Júpiter": "../../../../assets/img/fases/medio/sistema-solar/jupiter.png",
    "Saturno": "../../../../assets/img/fases/medio/sistema-solar/saturno.png",
    "Urano": "../../../../assets/img/fases/medio/sistema-solar/urano.png",
    "Netuno": "../../../../assets/img/fases/medio/sistema-solar/netuno.png"
  };
  imagemMeteoro: string = "../../../../assets/img/fases/medio/sistema-solar/meteoro.png";
  indicePlanetaAtual: number = 0;

  blinkData: string[] = [];
  acao: boolean = false;
  primeiraPiscadaDetectada: boolean = false;
  ultimoPlaneta: string | null = null;

  constructor(
    private blinkDetectionService: BlinkDetectionService,
    private renderer: Renderer2,
    private elementRef: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.personagem = this.elementRef.nativeElement.querySelector('#personagem');
    this.coracoes = Array.from(this.elementRef.nativeElement.querySelectorAll('.coracao'));
    this.planetasColetados = this.elementRef.nativeElement.querySelector('#planetas-coletados');
    this.iniciarGeracaoPlanetas();

    this.blinkDetectionService.blinkDetected.subscribe(() => {
      if (!this.acao) {
        this.subir();
        this.acao = true;
      } else {
        this.descer();
        this.acao = false;
      }
    });
  }

  iniciarGeracaoPlanetas(): void {
    setInterval(() => this.criarPlaneta(), 3000);
    setInterval(() => this.criarMeteoro(), 5000);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.subir();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.descer();
    }
  }

  subir(): void {
    if (this.personagem) {
      this.animatePersonagem('70%');
    }
  }

  descer(): void {
    if (this.personagem) {
      this.animatePersonagem('50px');
    }
  }

  animatePersonagem(targetPosition: string): void {
    if (this.personagem) {
      this.renderer.setStyle(this.personagem, 'transition', 'bottom 0.7s');
      this.renderer.setStyle(this.personagem, 'bottom', targetPosition);
    }
  }

  criarPlaneta(): void {
    const planetasRestantes = this.ordemPlanetas.slice(this.indicePlanetaAtual);
    if (planetasRestantes.length === 0) {
      return;
    }

    const planetasParaEscolher = planetasRestantes.slice(0, 3);
    let nomePlaneta: string;

    if (planetasRestantes.length === 1) {
      nomePlaneta = planetasRestantes[0];
    } else {
      const planetasFiltrados = planetasParaEscolher.filter(nome => nome !== this.ultimoPlaneta);
      nomePlaneta = planetasFiltrados.length === 0 
        ? planetasParaEscolher[Math.floor(Math.random() * planetasParaEscolher.length)] 
        : planetasFiltrados[Math.floor(Math.random() * planetasFiltrados.length)];
    }

    this.ultimoPlaneta = nomePlaneta;

    let planeta = this.renderer.createElement('div');
    this.renderer.addClass(planeta, 'planeta');
    this.renderer.setStyle(planeta, 'backgroundImage', `url(${this.imagensPlanetas[nomePlaneta]})`);
    this.renderer.setAttribute(planeta, 'data-name', nomePlaneta);
    this.renderer.setStyle(planeta, 'bottom', `${500 + Math.random() * 80}px`);
    
    this.renderer.appendChild(this.gameContainer.nativeElement, planeta);
    this.moverPlaneta(planeta);
  }

  moverPlaneta(planeta: HTMLElement): void {
    const mover = () => {
      let planetaRight = parseInt(getComputedStyle(planeta).right);
      if (planetaRight >= window.innerWidth) {
        planeta.remove();
      } else {
        planeta.style.right = (planetaRight + 5) + 'px';
        requestAnimationFrame(mover);
      }

      let personagemBottom = parseInt(getComputedStyle(this.personagem!).bottom);
      let planetaLeft = window.innerWidth - planetaRight - 50;
      let planetaTop = parseInt(getComputedStyle(planeta).bottom);
      let planetaBottom = planetaTop + planeta.offsetHeight;

      if (
        planetaLeft < parseInt(getComputedStyle(this.personagem!).left) &&
        planetaLeft + planeta.offsetWidth > parseInt(getComputedStyle(this.personagem!).left) &&
        personagemBottom < planetaBottom &&
        personagemBottom + this.personagem!.offsetHeight > planetaTop
      ) {
        let nomePlaneta = planeta.getAttribute('data-name')!;
        if (nomePlaneta === this.ordemPlanetas[this.indicePlanetaAtual]) {
          this.planetasColetados!.innerHTML += `<div><img src="${this.imagensPlanetas[nomePlaneta]}" alt="${nomePlaneta}" width="100%" height="100%"></div>`;
          this.indicePlanetaAtual++;
          this.regenerarVida();

          if (this.indicePlanetaAtual === this.ordemPlanetas.length) {
            this.showPopup('win', 'Parabéns!! Você concluiu sua missão');
          }
        } else {
          this.perderVida();
        }
        planeta.remove();
      }
    };
    mover();
  }

  criarMeteoro(): void {
    let meteoro = this.renderer.createElement('div');
    this.renderer.addClass(meteoro, 'meteoro');
    this.renderer.setStyle(meteoro, 'backgroundImage', `url(${this.imagemMeteoro})`);
    this.renderer.setStyle(meteoro, 'bottom', '60px');
    this.renderer.setStyle(meteoro, 'right', '-90px');

    this.renderer.appendChild(this.gameContainer.nativeElement, meteoro);
    this.moverMeteoro(meteoro);
  }

  moverMeteoro(meteoro: HTMLElement): void {
    const mover = () => {
      let meteoroRight = parseInt(getComputedStyle(meteoro).right);
      if (meteoroRight >= window.innerWidth) {
        meteoro.remove();
      } else {
        meteoro.style.right = (meteoroRight + 5) + 'px';
        requestAnimationFrame(mover);
      }

      let personagemBottom = parseInt(getComputedStyle(this.personagem!).bottom);
      let personagemLeft = parseInt(getComputedStyle(this.personagem!).left);
      let meteoroLeft = window.innerWidth - meteoroRight - 50;

      if (
        meteoroLeft < personagemLeft + this.personagem!.offsetWidth &&
        meteoroLeft + meteoro.offsetWidth > personagemLeft &&
        personagemBottom < 100
      ) {
        this.perderVida();
        meteoro.remove();
      }
    };
    mover();
  }

  perderVida(): void {
    if (this.vidas > 0) {
      this.vidas--;
      this.coracoes[this.vidas].style.display = 'none';
    }
    if (this.vidas === 0) {
      // Handle game over scenario
    }
  }

  regenerarVida(): void {
    if (this.vidas < 5) {
      this.coracoes[this.vidas].style.display = 'inline-block';
      this.vidas++;
    }
  }

  showPopup(status: 'win' | 'lose', message: string): void {
    // Implemente lógica para mostrar popup
  }

  hidePopup(): void {
    // Implemente lógica para esconder popup
  }

  goToHome(): void {
    this.router.navigate(['',]);
  }

  resetGame(): void {
    this.vidas = 5;
    this.coracoes.forEach(coracao => coracao.style.display = 'inline-block');
    this.indicePlanetaAtual = 0;
    this.planetasColetados!.innerHTML = '';
  }
}
