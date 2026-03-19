import { Entity } from 'electrodb';
import { env } from '../../config/env';
import { dynamoClient } from '../client';

export const ScheduleEntity = new Entity(
  {
    model: {
      entity: 'schedule',
      version: '1',
      service: 'bnmallorca',
    },
    attributes: {
      id: { type: 'string', required: true },
      numberOfTheWeek: { type: 'number', required: true },
      hour: { type: 'number', required: true },
      minute: { type: 'number', required: true },
      name: { type: 'string', required: true },
      artist: { type: 'string', required: true },
      online: { type: 'boolean', required: true },
      podcastUrl: { type: 'string', required: true },
      thumbnailUrl: { type: 'string' },
    },
    indexes: {
      primary: {
        pk: { field: 'id', composite: ['id'], template: '${id}' },
      },
    },
  },
  { client: dynamoClient, table: env.scheduleTable },
);
