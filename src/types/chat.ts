export type ChatIntent = 'ask' | 'research' | 'agent_builder';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  intent?: ChatIntent;
  agent_specification?: AgentSpecification;
}

export interface Thread {
  thread_id: string;
  created_at: string;
  updated_at: string;
  last_message: string | null;
  display_name?: string;
  intent?: ChatIntent;
}

export type AgentType = 'growth' | 'alert';

export interface AgentSpecification {
  agent_type: AgentType;
  specification: {
    additional_context?: string;
    // Growth-agent fields
    cron_expression?: string;
    analysis_type?: string;
    // Alert-agent fields
    alert_name?: string;
    alert_metric?: string;
    alert_threshold_type?: 'gt' | 'lt';
    alert_threshold_value?: number;
    alert_frequency?: string;
  };
}

export interface AgentBuilderResponse {
  message: string;
  agent_specification?: AgentSpecification;
}

export interface ChatResponse {
  task_id: string;
}

export interface ChatStatusResponse {
  status: 'pending' | 'completed' | 'failed';
  thread_id?: string;
  response?: {
    message: string;
    agent_specification?: AgentSpecification;
  } | string; // Support both old and new format for backwards compatibility
  error?: string;
  intent?: ChatIntent;
  completed_at?: string;
  agent_specification?: AgentSpecification; // Keep for backwards compatibility
}

export interface ThreadsResponse {
  threads: Thread[];
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
}

export interface SendMessageRequest {
  message: string;
  thread_id?: string;
  intent?: ChatIntent;
}