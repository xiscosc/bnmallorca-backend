import { Entity } from 'electrodb';
import { env } from '../../config/env';
import { dynamoClient } from '../client';

export const DeviceEntity = new Entity(
  {
    model: {
      entity: 'device',
      version: '1',
      service: 'bnmallorca',
    },
    attributes: {
      token: { type: 'string', required: true },
      status: { type: 'number', required: true },
      type: { type: 'string', required: true },
      endpointArn: { type: 'string', required: true },
      subscriptionArn: { type: 'string', required: true },
      subscribedAt: { type: 'number', required: true },
    },
    indexes: {
      primary: {
        pk: { field: 'token', composite: ['token'], template: '${token}' },
      },
      byStatus: {
        index: 'statusIndex',
        pk: { field: 'status', composite: ['status'], template: '${status}' },
        sk: { field: 'token', composite: ['token'], template: '${token}' },
      },
      byStatusSubscribedAt: {
        index: 'statusSubscribedAtIndex',
        pk: { field: 'status', composite: ['status'], template: '${status}' },
        sk: {
          field: 'subscribedAt',
          composite: ['subscribedAt'],
          template: '${subscribedAt}',
        },
      },
    },
  },
  { client: dynamoClient, table: env.deviceTable },
);
