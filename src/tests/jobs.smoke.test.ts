import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  internalEnqueueJob, 
  internalUpdateJobStatus, 
  internalRetryJob, 
  internalCancelJob 
} from '../lib/jobs.server';
import { supabaseAdmin } from '../integrations/supabase/client.server';

// Mock Supabase
const mockFrom = vi.fn();
vi.mock('../integrations/supabase/client.server', () => ({
  supabaseAdmin: {
    from: vi.fn((...args) => mockFrom(...args)),
  }
}));

describe('Jobs Layer - Smoke Tests', () => {
  const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. internalEnqueueJob deve garantir owner_user_id como DEV_USER_ID', async () => {
    // First call: check existing job
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null })
    });

    const mockInsert = vi.fn().mockReturnThis();
    mockFrom.mockReturnValue({
      insert: mockInsert,
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'job-1' }, error: null })
    });

    await internalEnqueueJob({
      tipo: 'test',
      payload: {},
      idempotencyKey: 'key-1',
      ownerUserId: DEV_USER_ID
    });

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      owner_user_id: DEV_USER_ID
    }));
  });

  it('2. internalUpdateJobStatus deve ignorar atualizações se job estiver cancelado', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { status: 'cancelled', cancel_requested: true } })
    });

    const result = await internalUpdateJobStatus({
      jobId: 'job-1',
      status: 'done'
    });

    expect(result?.status).toBe('cancelled');
  });

  it('3. internalRetryJob só deve permitir retry em jobs falhos ou queued_external', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { status: 'done' } })
    });

    await expect(internalRetryJob('job-1')).rejects.toThrow('Somente jobs falhos ou aguardando reprocessamento');
  });

  it('4. internalCancelJob deve marcar cancel_requested como true', async () => {
    const mockUpdate = vi.fn().mockReturnThis();
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { status: 'running' } }),
      update: mockUpdate,
      insert: vi.fn().mockResolvedValue({ error: null })
    });

    // Mock for the update call
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { status: 'running' } })
    }).mockReturnValue({
      update: mockUpdate,
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { status: 'cancelled' }, error: null })
    });

    await internalCancelJob('job-1');
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      cancel_requested: true,
      status: 'cancelled'
    }));
  });
});
