/**
 * Type for authentication-aware fetch function
 */
export type FetchFunction = (url: string, options?: RequestInit) => Promise<Response>;

/**
 * Base API response interface
 */
export interface ApiResponse {
  status: string;
  message?: string;
  error?: string;
  task_id?: string;
}

/**
 * Autopilot proposal status
 */
export type AutopilotStatus = 
  | 'processing' 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'refining'
  | 'executing'
  | 'executed'
  | 'failed'
  | 'ready'
  | 'success';

/**
 * Autopilot proposal interface
 */
export interface AutopilotProposal {
  id: string;
  proposal_id: string;
  status: AutopilotStatus;
  description: string;
  explanation?: string;
  parameters: Record<string, any>;
  expected_outcome?: string;
  created_at?: string;
  approved_at?: string;
}

/**
 * Autopilot result interface
 */
export interface AutopilotResult {
  summary: string;
  message?: string;
  details?: string | Record<string, any>;
  affected_items?: Array<{
    id: string;
    name: string;
    type: string;
    changes: string | Record<string, any>;
  }>;
}

/**
 * Autopilot status response
 */
export interface AutopilotStatusResponse extends ApiResponse {
  proposal_id?: string;
  status: AutopilotStatus;
  proposal?: AutopilotProposal;
  result?: AutopilotResult;
  error?: string;
  executed_at?: string;
  task_id?: string;
} 