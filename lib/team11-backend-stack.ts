import {
  aws_apigateway,
  aws_ec2,
  aws_lambda,
  aws_rds,
  aws_secretsmanager,
  Duration,
  Stack,
  StackProps,
  aws_lambda_nodejs,
} from 'aws-cdk-lib'
import { Construct } from 'constructs'

export class Team11BackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // Virtual Private Cloud

    const vpc = aws_ec2.Vpc.fromLookup(this, 'vpc', {
      isDefault: true,
    })

    // Secret Value

    const databaseSecret = new aws_secretsmanager.Secret(
      this,
      'database-secret',
      {
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'adminUser' }),
          generateStringKey: 'password',
          excludeCharacters: '/@"',
        },
      }
    )

    // Database

    const securityGroup = new aws_ec2.SecurityGroup(this, 'mysql-database-sg', {
      vpc,
      description: 'Allow public connections',
    })

    securityGroup.addIngressRule(
      aws_ec2.Peer.ipv4('0.0.0.0/0'),
      aws_ec2.Port.tcp(3306)
    )
    securityGroup.addIngressRule(
      aws_ec2.Peer.anyIpv4(),
      aws_ec2.Port.allTraffic()
    )

    const rdsInstance = new aws_rds.DatabaseInstance(
      this,
      'team11-db-v5',
      {
        vpc: vpc,
        engine: aws_rds.DatabaseInstanceEngine.MYSQL,
        instanceIdentifier: 'team11-db-v5',
        allocatedStorage: 10,
        instanceType: aws_ec2.InstanceType.of(aws_ec2.InstanceClass.T3, aws_ec2.InstanceSize.MICRO),
        maxAllocatedStorage: 10,
        deleteAutomatedBackups: true,
        backupRetention: Duration.millis(0),
        credentials: {
          username: databaseSecret
            .secretValueFromJson('username')
            .unsafeUnwrap()
            .toString(),
          password: databaseSecret.secretValueFromJson('password'),
        },
        securityGroups: [securityGroup],
        publiclyAccessible: true,
        vpcSubnets: {
          subnetType: aws_ec2.SubnetType.PUBLIC,
        },
      }
    )

    // Get Secret

    const secret = aws_secretsmanager.Secret.fromSecretAttributes(
      this,
      'ImportedSecret',
      {
        secretCompleteArn:
          'arn:aws:secretsmanager:eu-west-1:394261647652:secret:databasesecret6A44CD8F-Wk9XSvKVBbLc-cjE3XH',
        // If the secret is encrypted using a KMS-hosted CMK, either import or reference that key:
        // encryptionKey: ...
      }
    )

    //  ------ Lambda Functions -------

    const healthLambda = new aws_lambda_nodejs.NodejsFunction(
      this,
      'backend-health',
      {
        runtime: aws_lambda.Runtime.NODEJS_18_X,
        entry: 'lib/api/health.ts',
        handler: 'handler',
      }
    )

    const healthLambdaIntegration = new aws_apigateway.LambdaIntegration(
      healthLambda
    )

    // Login Lambda

    const loginLambda = new aws_lambda_nodejs.NodejsFunction(
      this,
      'backend-login',
      {
        runtime: aws_lambda.Runtime.NODEJS_18_X,
        entry: 'lib/api/login.ts',
        handler: 'handler',
        environment: {
          USERNAME: databaseSecret
            .secretValueFromJson('username')
            .unsafeUnwrap()
            .toString(),
          PASSWORD: databaseSecret
            .secretValueFromJson('password')
            .unsafeUnwrap()
            .toString(),
        },
      }
    )

    const loginLambdaIntegration = new aws_apigateway.LambdaIntegration(
      loginLambda
    )

    // Register Lambda

    // Login Lambda

    const registerLambda = new aws_lambda_nodejs.NodejsFunction(
      this,
      'backend-register',
      {
        runtime: aws_lambda.Runtime.NODEJS_18_X,
        entry: 'lib/api/register.ts',
        handler: 'handler',
        environment: {
          USERNAME: databaseSecret
            .secretValueFromJson('username')
            .unsafeUnwrap()
            .toString(),
          PASSWORD: databaseSecret
            .secretValueFromJson('password')
            .unsafeUnwrap()
            .toString(),
        },
      }
    )

    const registerLambdaIntegration = new aws_apigateway.LambdaIntegration(
      registerLambda
    )

    // API Gateway

    const apiGateway = new aws_apigateway.RestApi(this, 'backend-apigw', {
      defaultCorsPreflightOptions: {
        allowOrigins: aws_apigateway.Cors.ALL_ORIGINS,
        allowMethods: aws_apigateway.Cors.ALL_METHODS,
      },
    })

    const rootUrl = apiGateway.root.addResource('team11') // <-- Update to app name

    const healthUrl = rootUrl
      .addResource('health')
      .addMethod('GET', healthLambdaIntegration)

    const loginUrl = rootUrl
      .addResource('login')
      .addMethod('POST', loginLambdaIntegration) // <-- Should be post

    const registerUrl = rootUrl
      .addResource('register')
      .addMethod('POST', registerLambdaIntegration)
  }
}
