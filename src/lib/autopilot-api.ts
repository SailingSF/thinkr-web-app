import { FetchFunction } from '../types/api';

/**
 * API client for Autopilot feature
 */
export class AutopilotApi {
  private baseUrl: string;
  private authFetch: FetchFunction;

  constructor(authFetch: FetchFunction) {
    this.baseUrl = `${process.env.NEXT_PUBLIC_API_URL}`;
    this.authFetch = authFetch;
  }

  /**
   * Create a new autopilot proposal based on user description
   */
  async createProposal(description: string, initialParameters: Record<string, any> = {}) {
    console.log(`Creating proposal at: ${this.baseUrl}/autopilot/create/`);
    console.log('Payload:', { description, initial_parameters: initialParameters });
    
    const response = await this.authFetch(`${this.baseUrl}/autopilot/create/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description,
        initial_parameters: initialParameters,
      }),
    });

    const data = await response.json().catch(e => {
      console.error('Error parsing response:', e);
      throw new Error('Failed to parse server response');
    });
    
    console.log('Create proposal response:', response.status, data);

    if (!response.ok) {
      console.error('Create proposal error:', data);
      throw new Error(data.error || `Failed to create proposal: ${response.status}`);
    }

    return data;
  }

  /**
   * Handle user feedback on an autopilot proposal
   */
  async handleFeedback(proposalId: string, action: 'approve' | 'reject' | 'refine', feedback?: string) {
    const payload: Record<string, any> = {
      proposal_id: proposalId,
      action,
    };

    if (action === 'refine' && feedback) {
      payload.feedback = feedback;
    }

    console.log(`Sending feedback to: ${this.baseUrl}/autopilot/feedback/`);
    console.log('Payload:', payload);

    const response = await this.authFetch(`${this.baseUrl}/autopilot/feedback/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(e => {
      console.error('Error parsing feedback response:', e);
      throw new Error('Failed to parse server response');
    });
    
    console.log('Feedback response:', response.status, data);

    if (!response.ok) {
      console.error('Feedback error:', data);
      throw new Error(data.error || `Failed to ${action} proposal: ${response.status}`);
    }

    return data;
  }

  /**
   * Check the status of an autopilot proposal or task
   */
  async checkStatus(options: { proposalId?: string; taskId?: string }, retryCount = 0): Promise<Record<string, any>> {
    const { proposalId, taskId } = options;
    const MAX_RETRIES = 3;
    
    if (!proposalId && !taskId) {
      throw new Error('Either proposalId or taskId is required');
    }
    
    const queryParam = taskId ? `task_id=${taskId}` : `proposal_id=${proposalId}`;
    const url = `${this.baseUrl}/autopilot/status/?${queryParam}`;
    console.log(`Checking status with: ${url}`);
    
    // Try the authenticated fetch first since we're having issues with simple fetch
    try {
      console.log(`Sending authenticated status check to: ${url}`);
      
      const response = await this.authFetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log(`Auth status check response code: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Status check error:', response.status, errorData);
        
        // If we get a 404 or 500+ error, retry a few times
        if ((response.status === 404 || response.status >= 500) && retryCount < MAX_RETRIES) {
          console.log(`Retrying status check (${retryCount + 1}/${MAX_RETRIES})...`);
          // Exponential backoff
          const backoff = Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, backoff));
          return this.checkStatus(options, retryCount + 1);
        }
        
        // Return a standardized error response instead of throwing
        return {
          status: 'error',
          message: `Failed to check status: ${response.status}`,
          error: errorData.error || 'Request failed'
        };
      }
      
      // Try to parse response
      const data = await response.json().catch(e => {
        console.error('Error parsing status response:', e);
        return {
          status: 'unknown',
          message: 'Could not parse server response'
        };
      });
      
      console.log('Status check response data:', data);
      
      // If response is empty or missing expected fields, add placeholders
      if (!data || Object.keys(data).length === 0) {
        console.warn('Empty response from status check');
        return {
          status: 'unknown',
          message: 'Empty response received'
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error in auth status check:', error);
      
      // Try the simpler fetch as a fallback
      try {
        console.log('Auth fetch failed, trying simple fetch with cookies');
        
        // Use window.fetch with credentials
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include', // Include cookies for auth
        });
        
        if (!response.ok) {
          throw new Error(`Simple fetch failed with status: ${response.status}`);
        }
        
        return await response.json();
      } catch (simpleFetchError) {
        console.error('Simple fetch also failed:', simpleFetchError);
        
        // Handle retries with exponential backoff
        if (retryCount < MAX_RETRIES) {
          console.log(`All fetch methods failed, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
          const backoff = Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, backoff));
          return this.checkStatus(options, retryCount + 1);
        }
        
        // If all retries failed, return a standard response instead of throwing
        return {
          status: 'error',
          message: 'Failed to check status after multiple attempts',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  }
  
  /**
   * Fallback method using authFetch for status checks
   * Only used when simple fetch fails with auth issues
   */
  private async authFetchStatus(options: { proposalId?: string; taskId?: string }, retryCount = 0): Promise<Record<string, any>> {
    const { proposalId, taskId } = options;
    
    const queryParam = taskId ? `task_id=${taskId}` : `proposal_id=${proposalId}`;
    const url = `${this.baseUrl}/autopilot/status/?${queryParam}`;
    
    try {
      console.log(`Trying authFetch for status: ${url}`);
      
      // Use authFetch but minimize headers to reduce preflight risks
      const response = await this.authFetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          status: 'error',
          message: `Auth fetch failed: ${response.status}`,
          error: errorData.error || 'Request failed'
        };
      }
      
      return await response.json().catch(() => ({
        status: 'unknown',
        message: 'Could not parse auth response'
      }));
    } catch (error) {
      console.error('Error in authFetch fallback:', error);
      return {
        status: 'error',
        message: 'Auth fetch failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Execute an autopilot action directly without review
   */
  async executeAction(description: string, parameters: Record<string, any> = {}) {
    const response = await this.authFetch(`${this.baseUrl}/autopilot/execute/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description,
        parameters,
        bypass_review: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to execute action');
    }

    return response.json();
  }
}

/**
 * Create an instance of the Autopilot API client
 */
export function createAutopilotApi(authFetch: FetchFunction) {
  return new AutopilotApi(authFetch);
} 