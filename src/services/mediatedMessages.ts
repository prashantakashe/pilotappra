// src/services/mediatedMessages.ts
import { getFunctions, httpsCallable } from 'firebase/functions';

interface SendMessageParams {
  toUserId: string;
  content: string;
  subject?: string;
}

interface SendMessageResponse {
  success: boolean;
  messageId: string;
  message?: string;
}

/**
 * Mediated message service - all client-to-client communication goes through Cloud Functions
 * Never write messages directly to Firestore from client
 */
export const mediatedMessages = {
  /**
   * Send a mediated message via Cloud Function
   * This prevents direct client contact exposure
   */
  async sendMessage(params: SendMessageParams): Promise<SendMessageResponse> {
    try {
      const functions = getFunctions();
      const sendMediatedMessage = httpsCallable<SendMessageParams, SendMessageResponse>(
        functions,
        'sendMediatedMessage'
      );

      const result = await sendMediatedMessage(params);
      return result.data;
    } catch (error: any) {
      console.error('Error sending mediated message:', error);
      throw new Error(error.message || 'Failed to send message');
    }
  },

  /**
   * Alternative: HTTP endpoint version
   * Use this if httpsCallable is not working
   */
  async sendMessageHttp(params: SendMessageParams, idToken: string): Promise<SendMessageResponse> {
    try {
      // Replace with your Cloud Function HTTP endpoint
      const endpoint = 'https://us-central1-app-pilot-60ce3.cloudfunctions.net/sendMediatedMessageHttp';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error sending mediated message (HTTP):', error);
      throw new Error(error.message || 'Failed to send message');
    }
  },
};
