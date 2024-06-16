import dotenv from "dotenv";
dotenv.config();

export const config = {
  signalTableName: process.env.SIGNAL_TABLE_NAME || "",
  signalTableNameDev: process.env.SIGNAL_TABLE_NAME_DEV || "",
  roleArn: process.env.CRYPTO_WATCHER_ROLE_ARN || "",
  stage: process.env.NODE_ENV || "dev",
};
