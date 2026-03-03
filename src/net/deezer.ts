import { extractErrorMessage } from '../helpers/error.helper';
import { log } from '../helpers/logger';

export type DeezerSearchResponse = {
  data: DeezerTrack[];
  total: number;
  next?: string;
};

export type DeezerTrack = {
  id: number;
  title: string;
  artist: { id: number; name: string };
  album: {
    id: number;
    title: string;
    cover: string;
    md5_image: string;
    cover_small?: string;
    cover_medium?: string;
    cover_big?: string;
    cover_xl?: string;
  };
};

export async function getDeezerResults(
  name: string,
  artist: string,
  limit = 20,
): Promise<DeezerSearchResponse | undefined> {
  try {
    const q = `track:"${name}" artist:"${artist}"`;
    const url = new URL('https://api.deezer.com/search');
    url.searchParams.set('q', q);
    url.searchParams.set('limit', String(limit));

    const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Deezer search failed: ${res.status} ${res.statusText}`);

    return (await res.json()) as DeezerSearchResponse;
  } catch (err: unknown) {
    log.error(`Error downloading from Deezer: ${extractErrorMessage(err)} - ${name} / ${artist}`);
    return undefined;
  }
}
