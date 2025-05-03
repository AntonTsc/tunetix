export default interface Artist {
    name: string;        // nombre siempre requerido
    mbid?: string;       // mbid opcional
    url: string;
    image: Array<{
        '#text': string;
        size: string;
    }>;
    stats?: {
        listeners: string;
        playcount: string;
    };
}