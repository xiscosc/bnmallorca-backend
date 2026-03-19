import type { AlbumArtDto } from '../types/components.dto';
import { AlbumArtEntity } from './entities/album-art.entity';

export class AlbumArtRepository {
  public async getAlbumArt(trackId: string): Promise<AlbumArtDto | undefined> {
    const result = await AlbumArtEntity.get({ id: trackId }).go({ ignoreOwnership: true });
    return (result.data as AlbumArtDto) ?? undefined;
  }

  public async addAlbumArt(albumArt: AlbumArtDto) {
    await AlbumArtEntity.put(albumArt).go({ ignoreOwnership: true });
  }
}
