export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  contact_email: string;
  shopify_user_id: number;
  store: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
  error?: string;
}

export interface OnboardingResponse {
  data: {
    name?: string;
    business_goals?: string[];
  };
} 