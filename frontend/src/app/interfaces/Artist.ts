export default interface Artist{
    id: string;
    name: string;
    genres: string[];
    popularity: number;
    followers: number;
    images: { url: string; height: number; width: number }[]
}