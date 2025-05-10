export default interface Cancion {
  name: string;
  mbid: string;
  url: string;
  duration: string;
  similar: any[];
  streamable: {
    '#text': string;
  };
  fulltrack: string;
  listeners: string;
  playcount: string;
  artist: Artist;
  album: Album;
  image: Image[];
  attr: {
    position: string;
  };
  toptags: {
    tag: Tag[];
  }
  wiki: Wiki;
}

interface Artist {
  name: string;
  mbid: string;
  url: string;
}

interface Album {
  artist: string;
  title: string;
  mbid: string;
  url: string;
  image: Image[]; // Imágenes del álbum
}

interface Image {
  '#text': string;
  size: string;
}

interface Tag {
  name: string;
  url: string;
}

interface Wiki {
  published: string;
  summary: string;
  content: string;
}
