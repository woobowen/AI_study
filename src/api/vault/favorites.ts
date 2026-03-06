import { API_PREFIX } from '../../config/api';
import { request } from '../_shared/request';
import type { ApiEnvelope, CreateBookmarkReq } from './types';

export const addFavorite = async (data: CreateBookmarkReq): Promise<ApiEnvelope<any>> => {
  return request<ApiEnvelope<any>>(`${API_PREFIX.VAULT}/bookmarks`, {
    method: 'POST',
    body: data,
  });
};
