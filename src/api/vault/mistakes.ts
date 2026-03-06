import { API_PREFIX } from '../../config/api';
import { request } from '../_shared/request';
import type { ApiEnvelope, CreateErrorReq } from './types';

export const addMistake = async (data: CreateErrorReq): Promise<ApiEnvelope<any>> => {
  return request<ApiEnvelope<any>>(`${API_PREFIX.VAULT}/errors`, {
    method: 'POST',
    body: data,
  });
};
