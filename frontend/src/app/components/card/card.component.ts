import { Component, Input } from '@angular/core';
import Artist from 'src/app/interfaces/Artist';
import Track from 'src/app/interfaces/Track';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent {
  @Input() data: any = undefined;
  @Input() loading: boolean = false;

  getUrlImage(){
    if(!this.data) return '';
    if('images' in this.data){
      return this.data.images[0].url;
    }else if('album' in this.data){
      return this.data.album.images[0].url;
    }
    return '';
  }
}
