import { Client } from "@upstash/qstash";

// Validate required environment variables
const validateQStashConfig = () => {
  const requiredVars = ["QSTASH_URL", "QSTASH_TOKEN"];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required QStash environment variables: ${missing.join(", ")}`);
  }
};

// Validate configuration on module load
validateQStashConfig();

// Initialize QStash client
const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN!,
});

export { qstashClient };
export default qstashClient;
