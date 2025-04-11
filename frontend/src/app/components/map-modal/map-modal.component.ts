import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Feature, Map, View } from 'ol';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import { Icon, Style } from 'ol/style';

@Component({
  selector: 'app-map-modal',
  template: `
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-6xl">
        <div class="p-4 border-b flex justify-between items-center">
          <h3 class="text-xl font-semibold text-gray-800">{{ title }}</h3>
          <button (click)="onClose()" class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-4">
          <div #mapElement id="map" class="w-full h-[600px] rounded-lg"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .ol-zoom {
      top: 0.5em;
      left: 0.5em;
    }
    :host ::ng-deep .ol-zoom button {
      background-color: rgb(147 51 234);
      color: white;
      border: none;
      margin: 2px;
      font-size: 1.14em;
      cursor: pointer;
    }
    :host ::ng-deep .ol-zoom button:hover {
      background-color: rgb(126 34 206);
    }
  `]
})
export class MapModalComponent implements OnInit {
  @ViewChild('mapElement') mapElement!: ElementRef;
  @Input() longitude!: number;
  @Input() latitude!: number;
  @Input() title: string = 'Ubicación del evento';
  @Output() close = new EventEmitter<void>();

  private map!: Map;

  ngOnInit() {
    // Pequeño delay para asegurar que el DOM está listo
    setTimeout(() => this.initMap(), 100);
  }

  private initMap(): void {
    try {
      const coords = fromLonLat([this.longitude, this.latitude]);

      // Crear el marcador
      const marker = new Feature({
        geometry: new Point(coords)
      });

      // Capa de vector con el marcador
      const vectorLayer = new VectorLayer({
        source: new VectorSource({
          features: [marker]
        }),
        style: new Style({
          image: new Icon({
            anchor: [0.5, 1],
            src: 'assets/imgs/marker.webp',
            scale: 0.1
          })
        })
      });

      // Crear el mapa
      this.map = new Map({
        target: 'map',
        layers: [
          new TileLayer({
            source: new OSM()
          }),
          vectorLayer
        ],
        view: new View({
          center: coords,
          zoom: 15,
          maxZoom: 18
        }),
        controls: []
      });

    } catch (error) {
      console.error('Error al inicializar el mapa:', error);
    }
  }

  onClose(): void {
    this.close.emit();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.setTarget(undefined);
    }
  }
}
