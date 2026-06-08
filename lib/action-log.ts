/* eslint-disable @typescript-eslint/no-explicit-any */
import { sbFetch } from '@/lib/admin-fetch'

interface LogParams {
  tenantId:         string
  userId:           string
  action:           string
  entityType:       string
  entityId?:        string
  entityName?:      string
  recordsAffected?: number
  description?:     string
  metadata?:        any
  status?:          'success'|'failed'|'partial'
  errorMessage?:    string
}

export async function logAction(params: LogParams): Promise<void> {
  try {
    await sbFetch('/action_logs', {
      method: 'POST',
      body: JSON.stringify({
        tenant_id:        params.tenantId,
        user_id:          params.userId,
        action:           params.action,
        entity_type:      params.entityType,
        entity_id:        params.entityId ?? null,
        entity_name:      params.entityName ?? null,
        records_affected: params.recordsAffected ?? 0,
        description:      params.description ?? null,
        metadata:         params.metadata ?? null,
        status:           params.status ?? 'success',
        error_message:    params.errorMessage ?? null,
      }),
    })
  } catch (e) {
    console.error('[logAction] error:', e)
  }
}