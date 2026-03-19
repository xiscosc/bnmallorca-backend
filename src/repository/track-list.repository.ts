import type { TrackDto } from '../types/components.dto';
import { TrackEntity } from './entities/track.entity';

export class TrackListRepository {
  public async putTrack(track: TrackDto) {
    await TrackEntity.put(track).go();
  }

  public async getLastTracks(
    limit: number = 1,
    lastSongKey?: number,
  ): Promise<{ tracksDto: Array<TrackDto>; lastKey?: number }> {
    if (limit <= 0 || limit > 25) {
      throw Error('Limit is not between 1 and 25');
    }

    const radio = TrackListRepository.getPartitionKeyValue();

    const results = await TrackEntity.query.byRadio({ radio }).go({
      order: 'desc',
      limit,
      cursor:
        lastSongKey != null
          ? JSON.stringify({
              radio,
              timestamp: lastSongKey,
            })
          : undefined,
    });

    const tracksDto = results.data as Array<TrackDto>;
    let lastKey: number | undefined;

    if (results.cursor) {
      try {
        const parsed = JSON.parse(results.cursor) as Record<string, unknown>;
        lastKey = parsed['timestamp'] as number | undefined;
      } catch {
        lastKey = undefined;
      }
    }

    return { tracksDto, lastKey };
  }

  public static getPartitionKeyValue(): string {
    return 'BNMALLORCA';
  }
}
