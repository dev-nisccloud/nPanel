import {
  CreateConfigurationSetCommand,
  CreateConfigurationSetEventDestinationCommand,
  DescribeConfigurationSetCommand,
  UpdateConfigurationSetTrackingOptionsCommand,
  DeleteConfigurationSetCommand,
  ListConfigurationSetsCommand,
  EventType,
} from "@aws-sdk/client-ses";
import { sesClient } from "./client";

export interface ConfigurationSetEventDestination {
  name: string;
  enabled: boolean;
  matchingEventTypes: EventType[];
  snsDestination?: {
    topicArn: string;
  };
}

export interface ConfigurationSetInfo {
  name: string;
  eventDestinations: ConfigurationSetEventDestination[];
  reputationOptions?: {
    reputationMetricsEnabled: boolean;
    lastFreshStart?: Date;
  };
  trackingOptions?: {
    customRedirectDomain?: string;
  };
}

/**
 * Create a new SES configuration set
 */
export async function createConfigurationSet(name: string): Promise<void> {
  try {
    const command = new CreateConfigurationSetCommand({
      ConfigurationSet: {
        Name: name,
      },
    });

    await sesClient.send(command);
  } catch (error) {
    console.error("Error creating configuration set:", error);
    throw new Error(`Failed to create configuration set ${name}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Add SNS event destination to configuration set
 */
export async function addSnsEventDestination(
  configSetName: string,
  snsTopicArn: string,
  eventTypes: EventType[] = [
    EventType.SEND,
    EventType.BOUNCE,
    EventType.COMPLAINT,
    EventType.DELIVERY,
    EventType.OPEN,
    EventType.CLICK,
    EventType.REJECT,
    EventType.RENDERING_FAILURE,
  ]
): Promise<void> {
  try {
    const command = new CreateConfigurationSetEventDestinationCommand({
      ConfigurationSetName: configSetName,
      EventDestination: {
        Name: `${configSetName}-sns-destination`,
        Enabled: true,
        MatchingEventTypes: eventTypes,
        SNSDestination: {
          TopicARN: snsTopicArn,
        },
      },
    });

    await sesClient.send(command);
  } catch (error) {
    console.error("Error adding SNS event destination:", error);
    throw new Error(`Failed to add SNS event destination to ${configSetName}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get configuration set details
 */
export async function getConfigurationSet(name: string): Promise<ConfigurationSetInfo | null> {
  try {
    const command = new DescribeConfigurationSetCommand({
      ConfigurationSetName: name,
    });

    const response = await sesClient.send(command);
    
    if (!response.EventDestinations) {
      return null;
    }

    return {
      name: name,
      eventDestinations: response.EventDestinations.map(dest => ({
        name: dest.Name || "",
        enabled: dest.Enabled || false,
        matchingEventTypes: dest.MatchingEventTypes || [],
        snsDestination: dest.SNSDestination ? {
          topicArn: dest.SNSDestination.TopicARN || "",
        } : undefined,
      })),
      reputationOptions: response.ReputationOptions ? {
        reputationMetricsEnabled: response.ReputationOptions.ReputationMetricsEnabled || false,
        lastFreshStart: response.ReputationOptions.LastFreshStart,
      } : undefined,
      trackingOptions: response.TrackingOptions ? {
        customRedirectDomain: response.TrackingOptions.CustomRedirectDomain,
      } : undefined,
    };
  } catch (error) {
    console.error("Error getting configuration set:", error);
    throw new Error(`Failed to get configuration set ${name}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Update configuration set
 */
export async function updateConfigurationSet(
  name: string,
  updates: {
    reputationMetricsEnabled?: boolean;
    customRedirectDomain?: string;
  }
): Promise<void> {
  try {
    // Note: AWS SDK v3 doesn't have a single UpdateConfigurationSet command
    // You need to use separate commands for different update types
    if (updates.customRedirectDomain !== undefined) {
      const command = new UpdateConfigurationSetTrackingOptionsCommand({
        ConfigurationSetName: name,
        CustomRedirectDomainEnabled: updates.customRedirectDomain ? true : undefined,
        CustomRedirectDomain: updates.customRedirectDomain,
      });
      await sesClient.send(command);
    }
    // ReputationOptions don't have an update command in v3, they are read-only
  } catch (error) {
    console.error("Error updating configuration set:", error);
    throw new Error(`Failed to update configuration set ${name}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Delete configuration set
 */
export async function deleteConfigurationSet(name: string): Promise<void> {
  try {
    const command = new DeleteConfigurationSetCommand({
      ConfigurationSetName: name,
    });

    await sesClient.send(command);
  } catch (error) {
    console.error("Error deleting configuration set:", error);
    throw new Error(`Failed to delete configuration set ${name}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * List all configuration sets
 */
export async function listConfigurationSets(): Promise<string[]> {
  try {
    const command = new ListConfigurationSetsCommand({});
    const response = await sesClient.send(command);
    
    return response.ConfigurationSets?.map(set => set.Name || "") || [];
  } catch (error) {
    console.error("Error listing configuration sets:", error);
    throw new Error(`Failed to list configuration sets: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Initialize default configuration set for email marketing
 */
export async function initializeDefaultConfigurationSet(
  configSetName: string,
  snsTopicArn: string
): Promise<void> {
  try {
    // Check if configuration set already exists
    const existing = await getConfigurationSet(configSetName);
    
    if (!existing) {
      // Create configuration set
      await createConfigurationSet(configSetName);
      
      // Add SNS event destination
      await addSnsEventDestination(configSetName, snsTopicArn);
      
      // Enable reputation metrics
      await updateConfigurationSet(configSetName, {
        reputationMetricsEnabled: true,
      });
    }
  } catch (error) {
    console.error("Error initializing default configuration set:", error);
    throw new Error(`Failed to initialize configuration set ${configSetName}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
