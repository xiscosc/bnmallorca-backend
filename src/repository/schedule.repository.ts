import { log } from '../helpers/logger';
import type { ShowDto } from '../types/components.dto';
import { ScheduleEntity } from './entities/schedule.entity';

export class ScheduleRepository {
  public async getFullSchedule(): Promise<ShowDto[]> {
    try {
      const result = await ScheduleEntity.scan.go({ pages: 'all' });
      return result.data as ShowDto[];
    } catch (err) {
      log.error(`Error getting schedule from db ${err}`);
      return [];
    }
  }
}
