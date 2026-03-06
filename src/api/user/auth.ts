import { API_PREFIX } from '../../config/api';
import { request } from '../_shared/request';
import type { ApiEnvelope } from '../vault/types';

export interface AuthPayload {
  username: string;
  password: string;
}

export interface AuthData {
  token: string;
}

export const register = async (data: AuthPayload): Promise<ApiEnvelope<AuthData>> => {
  return request<ApiEnvelope<AuthData>>(`${API_PREFIX.USER}/register`, {
    method: 'POST',
    body: data,
  });
};

export const login = async (data: AuthPayload): Promise<ApiEnvelope<AuthData>> => {
  return request<ApiEnvelope<AuthData>>(`${API_PREFIX.USER}/login`, {
    method: 'POST',
    body: data,
  });
};
