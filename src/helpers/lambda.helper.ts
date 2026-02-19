import type { APIGatewayProxyResultV2, ProxyResult } from 'aws-lambda';

export function stringIsValid(value?: string | null): boolean {
  return !(value === null || value === undefined || value.replace(' ', '').length === 0);
}

export function badRequest(message: object): ProxyResult | APIGatewayProxyResultV2 {
  return getResponse(400, message);
}

export function internalServerError(message: object): ProxyResult | APIGatewayProxyResultV2 {
  return getResponse(500, message);
}

export function ok(message: object): ProxyResult | APIGatewayProxyResultV2 {
  return getResponse(200, message);
}

export function created(message: object): ProxyResult | APIGatewayProxyResultV2 {
  return getResponse(201, message);
}

function getResponse(statusCode: number, message: object): ProxyResult | APIGatewayProxyResultV2 {
  return {
    statusCode,
    body: JSON.stringify(message),
  };
}
