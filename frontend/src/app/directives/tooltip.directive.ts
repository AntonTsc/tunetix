import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appTooltip]'
})
export class TooltipDirective {
  @Input('appTooltip') tooltipText: string = '';
  tooltip: HTMLElement | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  @HostListener('mouseenter') onMouseEnter() {
    if (!this.tooltip) {
      this.show();
    }
  }

  @HostListener('mouseleave') onMouseLeave() {
    if (this.tooltip) {
      this.hide();
    }
  }

  private show() {
    // Crear el tooltip
    this.tooltip = this.renderer.createElement('div');

    // Añadir la clase
    this.renderer.addClass(this.tooltip, 'custom-tooltip');

    // Crear el texto y añadirlo al tooltip
    const text = this.renderer.createText(this.tooltipText);
    this.renderer.appendChild(this.tooltip, text);

    // Aplicar estilos
    this.renderer.setStyle(this.tooltip, 'position', 'absolute');
    this.renderer.setStyle(this.tooltip, 'background', 'white');
    this.renderer.setStyle(this.tooltip, 'color', '#374151');
    this.renderer.setStyle(this.tooltip, 'padding', '8px 12px');
    this.renderer.setStyle(this.tooltip, 'border-radius', '6px');
    this.renderer.setStyle(this.tooltip, 'box-shadow', '0 2px 10px rgba(0, 0, 0, 0.15)');
    this.renderer.setStyle(this.tooltip, 'z-index', '9999');
    this.renderer.setStyle(this.tooltip, 'min-width', '180px');
    this.renderer.setStyle(this.tooltip, 'max-width', '300px');
    this.renderer.setStyle(this.tooltip, 'word-wrap', 'break-word');
    this.renderer.setStyle(this.tooltip, 'font-size', '12px');
    this.renderer.setStyle(this.tooltip, 'border', '1px solid #e5e7eb');

    // Añadir al DOM
    this.renderer.appendChild(document.body, this.tooltip);

    // Ahora que el tooltip está en el DOM, podemos obtener su posición
    // Posicionar el tooltip - Arreglamos el error verificando que this.tooltip no es null
    if (this.tooltip) { // Verificación adicional para TypeScript
      const hostPos = this.el.nativeElement.getBoundingClientRect();
      const tooltipPos = this.tooltip.getBoundingClientRect();

      const top = hostPos.top - tooltipPos.height - 10;
      const left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;

      // Ajustar posición para que no se salga de la pantalla
      const adjustedLeft = Math.max(10, Math.min(left, window.innerWidth - tooltipPos.width - 10));

      this.renderer.setStyle(this.tooltip, 'top', `${top + window.scrollY}px`);
      this.renderer.setStyle(this.tooltip, 'left', `${adjustedLeft}px`);
    }
  }

  private hide() {
    if (this.tooltip) {
      this.renderer.removeChild(document.body, this.tooltip);
      this.tooltip = null;
    }
  }
}
