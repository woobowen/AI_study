import { API_PREFIX } from '../../config/api';
import { request } from '../_shared/request';
import type { ApiEnvelope } from '../vault/types';

export interface UpdateProfilePayload {
  age: number | string;
  language: string;
  studyDuration: number | string;
  supplements: string;
}

export const updateProfile = async (
  data: Record<string, any>,
): Promise<ApiEnvelope<any>> => {
  const userServiceBase = API_PREFIX.USER.replace(/\/auth$/, '');
  return request<ApiEnvelope<any>>(`${userServiceBase}/profile`, {
    method: 'PUT',
    body: { profile: data },
  });
};
