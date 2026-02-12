
import { XCredentials, PostContent } from "../types";

/**
 * Verifies the provided X credentials.
 * In a production app, this would call the X API /2/users/me endpoint.
 */
export const verifyXCredentials = async (credentials: XCredentials): Promise<{ success: boolean; username?: string; error?: string }> => {
  console.log("Verifying X credentials...");
  
  if (!credentials.consumerKey || !credentials.consumerSecret || !credentials.bearerToken) {
    return { success: false, error: "Missing required credential fields." };
  }

  try {
    // Simulate API network latency
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Note: Direct browser calls to api.twitter.com usually fail due to CORS.
    // This simulation represents a successful verification of the token format.
    // In a real implementation, you would use a backend proxy.
    
    if (credentials.bearerToken.length < 20) {
       return { success: false, error: "Invalid Bearer Token format." };
    }

    return { 
      success: true, 
      username: "BrandAmbassador_AI" // Mocking a verified handle
    };
  } catch (error) {
    return { success: false, error: "Connection to X.com failed. Please check your credentials." };
  }
};

/**
 * Service for interacting with X API.
 */
export const postToX = async (credentials: XCredentials, post: PostContent): Promise<{ success: boolean; message: string }> => {
  console.log("Attempting to post to X with credentials:", credentials);
  
  const fullText = `${post.caption}\n\n${post.hashtags.map(h => `#${h}`).join(' ')}`;

  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log("POSTING CONTENT TO X:", fullText);
    
    return { 
      success: true, 
      message: "Successfully published to X! (Simulated due to CORS environment)" 
    };
  } catch (error) {
    console.error("X Posting Error:", error);
    return { success: false, message: "Failed to post to X. Check console for details." };
  }
};
