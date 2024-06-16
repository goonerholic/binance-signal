import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { config } from "./config";
import { SurgeDetectedEvent } from "./watcher";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const ddbClient = new DynamoDBClient({ region: "ap-northeast-2" });

export async function initDDBClient() {
  if (config.stage === "development") {
    const sts = new STSClient({
      region: "ap-northeast-2",
    });

    if (!config.roleArn) {
      throw new Error("Missing role ARN");
    }

    const assumeRoleCommand = new AssumeRoleCommand({
      RoleArn: config.roleArn,
      RoleSessionName: "crypto-watcher-local",
    });

    const { Credentials } = await sts.send(assumeRoleCommand);

    return new DynamoDBClient({
      region: "ap-northeast-2",
      credentials: {
        accessKeyId: Credentials!.AccessKeyId!,
        secretAccessKey: Credentials!.SecretAccessKey!,
        sessionToken: Credentials!.SessionToken!,
      },
    });
  }

  return Promise.resolve(ddbClient);
}

export async function putSignalToDB(signal: SurgeDetectedEvent) {
  const client = await initDDBClient();

  const command = new PutItemCommand({
    TableName: config.signalTableName,
    Item: {
      PK: {
        S: `SIGNAL#${signal.timestamp}`,
      },
      SK: {
        S: `TICKER#${signal.ticker}`,
      },
      ticker: {
        S: signal.ticker,
      },
      timestamp: {
        N: signal.timestamp.toString(),
      },
      price: {
        N: signal.price.toString(),
      },
      rate: {
        N: signal.rate.toString(),
      },
      ttl: {
        N: (signal.timestamp + 60 * 60 * 24 * 7).toString(), // Fix me
      },
    },
  });

  await client.send(command);
}
