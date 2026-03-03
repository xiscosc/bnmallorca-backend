import { env } from '../config/env';
import { log } from '../helpers/logger';
import { findArtistInDeezerTracks, isBNTrack } from '../helpers/track.helper';
import { albumArtUrlToBuffer } from '../net/album-art.downloader';
import { getDeezerResults } from '../net/deezer';
import { triggerAsyncLambda } from '../net/lambda';
import { getAlbumArtWithUrl, storeAlbumArtInS3 } from '../net/s3';
import { AlbumArtRepository } from '../repository/album-art.repository';
import type { AlbumArt, Track } from '../types/components';
import type { AlbumArtDto } from '../types/components.dto';

export interface IAlbumCacheRequest {
  trackId: string;
  trackName: string;
  artist: string;
  albumArt: AlbumArt[];
}
export class AlbumArtService {
  private albumArtRepository: AlbumArtRepository;

  constructor() {
    this.albumArtRepository = new AlbumArtRepository();
  }

  public async getAlbumArt(track: Track, onlyCache: boolean = false): Promise<AlbumArt[]> {
    if (isBNTrack(track)) {
      log.info(
        { trackId: track.id, track: track.name, artist: track.artist, source: 'bn_track' },
        'Skipped album art',
      );
      return [];
    }

    const cachedAlbumArt = await this.getAlbumArtFromCache(track.id!);
    if (cachedAlbumArt) {
      log.info(
        { trackId: track.id, track: track.name, artist: track.artist, source: 'cache' },
        'Got album art',
      );
      return cachedAlbumArt;
    }

    if (onlyCache) {
      log.info(
        { trackId: track.id, track: track.name, artist: track.artist, source: 'cache_miss' },
        'No album art',
      );
      return [];
    }

    const remoteAlbumArt = await AlbumArtService.getAlbumArtFromDeezer(track);
    if (remoteAlbumArt.length > 0) {
      const cacheRequest: IAlbumCacheRequest = {
        trackId: track.id!,
        trackName: track.name,
        artist: track.artist,
        albumArt: remoteAlbumArt,
      };
      await triggerAsyncLambda(env.cacheLambdaArn, cacheRequest);
      log.info(
        {
          trackId: track.id,
          track: track.name,
          artist: track.artist,
          source: 'deezer',
          cacheLambdaTriggered: true,
        },
        'Got album art',
      );
      return remoteAlbumArt;
    }

    log.info(
      { trackId: track.id, track: track.name, artist: track.artist, source: 'not_found' },
      'No album art',
    );
    return [];
  }

  public async cacheAlbumArt({ trackId, albumArt }: IAlbumCacheRequest): Promise<string[]> {
    if (albumArt.length === 0) {
      return [];
    }

    const results = await Promise.all(
      albumArt.map((sAA: AlbumArt) => AlbumArtService.processSingleAlbumArt(trackId, sAA)),
    );
    const storedSizes: string[] = [];
    results.forEach((v) => {
      if (v) storedSizes.push(v);
    });

    if (storedSizes.length === 0) {
      return [];
    }

    await this.albumArtRepository.addAlbumArt({ id: trackId, sizes: storedSizes });
    return storedSizes;
  }

  private async getAlbumArtFromCache(trackId: string): Promise<AlbumArt[] | null> {
    const dto = await this.albumArtRepository.getAlbumArt(trackId);
    return dto ? await AlbumArtService.transformAlbumArtDtoToModel(dto) : null;
  }

  private static async getAlbumArtFromDeezer(track: Track): Promise<AlbumArt[]> {
    const results = await getDeezerResults(track.name, track.artist);
    if (!results) {
      return [];
    }
    const deezerTrack = findArtistInDeezerTracks(results.data, track.artist);
    if (!deezerTrack || !deezerTrack.album?.md5_image) {
      return [];
    }

    return AlbumArtService.buildDeezerCoverUrlsFromMd5(deezerTrack.album.md5_image, [
      '640x640',
      '300x300',
      '64x64',
    ]);
  }

  private static async transformAlbumArtDtoToModel(dto: AlbumArtDto): Promise<AlbumArt[]> {
    return await Promise.all(dto.sizes.map((s) => getAlbumArtWithUrl(dto.id, s)));
  }

  private static async processSingleAlbumArt(
    trackId: string,
    albumArt: AlbumArt,
  ): Promise<string | undefined> {
    const buffer = await albumArtUrlToBuffer(albumArt.downloadUrl);
    if (buffer === undefined) return undefined;
    await storeAlbumArtInS3(trackId, albumArt.size, buffer);
    return albumArt.size;
  }

  private static buildDeezerCoverUrlsFromMd5(md5: string, sizes: string[]): AlbumArt[] {
    const base = `https://cdn-images.dzcdn.net/images/cover/${md5}`;

    return sizes.map((size) => ({
      downloadUrl: `${base}/${size}-000000-80-0-0.jpg`,
      size,
    }));
  }
}
