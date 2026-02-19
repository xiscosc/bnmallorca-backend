import type {
  APIGatewayEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  ProxyResult,
} from 'aws-lambda';
import { extractErrorMessage } from '../../helpers/error.helper';
import { internalServerError, ok } from '../../helpers/lambda.helper';
import { log } from '../../helpers/logger';
import { ScheduleService } from '../../service/schedule.service';
import type { ScheduleResponse } from '../../types/components';

export async function handler(
  event: APIGatewayEvent | APIGatewayProxyEventV2,
): Promise<ProxyResult | APIGatewayProxyResultV2> {
  try {
    const scheduleService = new ScheduleService();
    const days = await scheduleService.getSchedule();
    const response: ScheduleResponse = { days };
    return ok(response);
  } catch (err: unknown) {
    log.error(`Error getting schedule: ${extractErrorMessage(err)}`);
    return internalServerError({ message: 'Error obtaining the schedule' });
  }
}
