import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  internalEnqueueJob, 
  internalUpdateJobStatus, 
  internalRetryJob, 
  internalCancelJob 
} from '../lib/jobs.server';

// Mock Supabase
const mockResult = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
};

const mockFrom = vi.fn((_table: string) => mockResult as any);

vi.mock('../integrations/supabase/client.server', () => ({
  supabaseAdmin: {
    from: (table: string) => mockFrom(table),
  }
}));

describe('Jobs Layer - Smoke Tests', () => {
  const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock behavior
    mockResult.select.mockReturnThis();
    mockResult.insert.mockReturnThis();
    mockResult.update.mockReturnThis();
    mockResult.eq.mockReturnThis();
    mockResult.single.mockResolvedValue({ data: null, error: null });
  });

  it('1. internalEnqueueJob deve garantir owner_user_id como DEV_USER_ID', async () => {
    // First call: check existing job
    mockFrom.mockReturnValueOnce({
      ...mockResult,
      single: vi.fn().mockResolvedValue({ data: null, error: null })
    } as any);

    const mockInsert = vi.fn().mockReturnThis();
    mockFrom.mockReturnValue({
      ...mockResult,
      insert: mockInsert,
      single: vi.fn().mockResolvedValue({ data: { id: 'job-1' }, error: null })
    } as any);

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
      ...mockResult,
      single: vi.fn().mockResolvedValue({ data: { status: 'cancelled', cancel_requested: true }, error: null })
    } as any);

    const result = await internalUpdateJobStatus({
      jobId: 'job-1',
      status: 'done'
    });

    expect(result?.status).toBe('cancelled');
  });

  it('3. internalRetryJob só deve permitir retry em jobs falhos ou queued_external', async () => {
    mockFrom.mockReturnValue({
      ...mockResult,
      single: vi.fn().mockResolvedValue({ data: { status: 'done' }, error: null })
    } as any);

    await expect(internalRetryJob('job-1')).rejects.toThrow('Somente jobs falhos ou aguardando reprocessamento');
  });

  it('4. internalCancelJob deve marcar cancel_requested como true', async () => {
    const mockUpdate = vi.fn().mockReturnThis();
    
    // Setup sequential mock behavior
    mockFrom.mockReturnValueOnce({
      ...mockResult,
      single: vi.fn().mockResolvedValue({ data: { status: 'running' }, error: null })
    } as any).mockReturnValue({
      ...mockResult,
      update: mockUpdate,
      single: vi.fn().mockResolvedValue({ data: { status: 'cancelled' }, error: null })
    } as any);

    await internalCancelJob('job-1');
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      cancel_requested: true,
      status: 'cancelled'
    }));
  });
});