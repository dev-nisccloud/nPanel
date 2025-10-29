import { SESClient } from "@aws-sdk/client-ses";
import { SNSClient } from "@aws-sdk/client-sns";

// AWS SES Client Configuration
const sesClient = new SESClient({
  region: process.env.AWS_SES_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// AWS SNS Client Configuration
const snsClient = new SNSClient({
  region: process.env.AWS_SES_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Validate required environment variables
const validateConfig = () => {
  const requiredVars = [
    "AWS_SES_REGION",
    "AWS_ACCESS_KEY_ID", 
    "AWS_SECRET_ACCESS_KEY",
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
};

// Validate configuration on module load
validateConfig();

export { sesClient, snsClient };
export default sesClient;
