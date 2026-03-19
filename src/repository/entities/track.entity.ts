import { Entity } from 'electrodb';
import { env } from '../../config/env';
import { dynamoClient } from '../client';

export const TrackEntity = new Entity(
  {
    model: {
      entity: 'track',
      version: '1',
      service: 'bnmallorca',
    },
    attributes: {
      id: { type: 'string', required: true },
      radio: { type: 'string', required: true },
      name: { type: 'string', required: true },
      artist: { type: 'string', required: true },
      timestamp: { type: 'number', required: true },
      deleteTs: { type: 'number', required: true },
    },
    indexes: {
      byRadio: {
        pk: { field: 'radio', composite: ['radio'], template: '${radio}' },
        sk: { field: 'timestamp', composite: ['timestamp'], template: '${timestamp}' },
      },
    },
  },
  { client: dynamoClient, table: env.trackListTable },
);
