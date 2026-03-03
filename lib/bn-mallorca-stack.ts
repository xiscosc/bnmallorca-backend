import { Stack, type StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { createApi } from './constructs/api.construct';
import { createBuckets } from './constructs/bucket.construct';
import { createTables } from './constructs/database.construct';
import { createLambdas } from './constructs/lambda.construct';
import { createPermissions } from './constructs/permission.construct';
import { createQueues } from './constructs/queue.construct';
import { createTopics } from './constructs/topic.construct';
import { createTriggers } from './constructs/trigger.construct';

interface BnMallorcaStackProps extends StackProps {
  envName: string;
  centovaUrl: string;
  centovaStreamUrl: string;
  trackSource: string;
  iosAppSns: string;
  androidAppSns: string;
}

export class BnMallorcaStack extends Stack {
  private readonly props: BnMallorcaStackProps;
  constructor(scope: Construct, id: string, props: BnMallorcaStackProps) {
    super(scope, id, props);
    this.props = props;

    const tables = createTables(this, this.props.envName);
    const queues = createQueues(this, this.props.envName);
    const buckets = createBuckets(this, this.props.envName);
    const topics = createTopics(this, this.props.envName);
    const lambdas = createLambdas(
      this,
      this.props.envName,
      this.props.iosAppSns,
      this.props.androidAppSns,
      this.props.centovaUrl,
      this.props.centovaStreamUrl,
      this.props.trackSource,
      queues,
      tables,
      buckets,
      topics,
    );

    createApi(this, this.props.envName, lambdas);

    createTriggers(this, this.props.envName, queues, lambdas);

    createPermissions(
      this,
      this.props.envName,
      this.props.iosAppSns,
      this.props.androidAppSns,
      topics,
      tables,
      lambdas,
      queues,
      buckets,
    );
  }
}
