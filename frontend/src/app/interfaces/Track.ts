export default interface Track {
    id: string;
    name: string; 
    artist: { id: string; name: string };
    album: {
        id: string;
        name: string;
        release_date: string
        images: { url: string; height: number; width: number }[];
    };
    explicit: boolean;
    popularity: number; 
    duration_ms: number; 
    preview_url: string | null; 
    isTrack: boolean;
}