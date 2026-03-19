import { Entity } from 'electrodb';
import { env } from '../../config/env';
import { dynamoClient } from '../client';

export const AlbumArtEntity = new Entity(
  {
    model: {
      entity: 'albumArt',
      version: '1',
      service: 'bnmallorca',
    },
    attributes: {
      id: { type: 'string', required: true },
      sizes: { type: 'list', items: { type: 'string' }, required: true },
    },
    indexes: {
      primary: {
        pk: { field: 'id', composite: ['id'], template: '${id}' },
      },
    },
  },
  { client: dynamoClient, table: env.albumArtTable },
);
