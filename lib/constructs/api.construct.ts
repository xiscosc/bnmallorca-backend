import { type CfnStage, HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import type { Construct } from 'constructs';
import type { BnLambdas } from './lambda.construct';

export function createApi(
  scope: Construct,
  envName: string,
  {
    getTrackListLambda,
    getScheduleLambda,
    triggerRegisterDeviceLambda,
    unregisterDeviceLambda,
  }: BnLambdas,
) {
  // HTTP API
  const httpApi = new HttpApi(scope, `${envName}-httpTrackListApi`, {
    apiName: `HTTP TrackList API - ${envName}`,
  });

  // Add throttling via CfnStage override
  const defaultStage = httpApi.defaultStage?.node.defaultChild as CfnStage;
  defaultStage.addPropertyOverride('DefaultRouteSettings', {
    ThrottlingBurstLimit: 50,
    ThrottlingRateLimit: 30,
  });

  const getTrackListIntegrationHttp = new HttpLambdaIntegration(
    `${envName}-getTrackList`,
    getTrackListLambda,
  );
  const registerDeviceIntegrationHttp = new HttpLambdaIntegration(
    `${envName}-registerDevice`,
    triggerRegisterDeviceLambda,
  );
  const unregisterDeviceIntegrationHttp = new HttpLambdaIntegration(
    `${envName}-unregisterDevice`,
    unregisterDeviceLambda,
  );
  const getScheduleIntegrationHttp = new HttpLambdaIntegration(
    `${envName}-getSchedule`,
    getScheduleLambda,
  );

  httpApi.addRoutes({
    path: '/api/v1/tracklist',
    methods: [HttpMethod.GET],
    integration: getTrackListIntegrationHttp,
  });
  httpApi.addRoutes({
    path: '/api/v1/schedule',
    methods: [HttpMethod.GET],
    integration: getScheduleIntegrationHttp,
  });
  httpApi.addRoutes({
    path: '/api/v1/register',
    methods: [HttpMethod.POST],
    integration: registerDeviceIntegrationHttp,
  });
  httpApi.addRoutes({
    path: '/api/v1/unregister',
    methods: [HttpMethod.POST],
    integration: unregisterDeviceIntegrationHttp,
  });
}
