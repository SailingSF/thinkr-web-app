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
  async checkStatus(options: { proposalId?: string; taskId?: string }) {
    const { proposalId, taskId } = options;
    
    if (!proposalId && !taskId) {
      throw new Error('Either proposalId or taskId is required');
    }
    
    const queryParam = taskId ? `task_id=${taskId}` : `proposal_id=${proposalId}`;
    console.log(`Checking status with: ${this.baseUrl}/autopilot/status/?${queryParam}`);
    
    const response = await this.authFetch(`${this.baseUrl}/autopilot/status/?${queryParam}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Status check error:', response.status, errorData);
      throw new Error(errorData.error || `Failed to check status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Status check response:', data);
    return data;
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