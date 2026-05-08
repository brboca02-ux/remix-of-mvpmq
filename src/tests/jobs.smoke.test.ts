 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { 
   internalEnqueueJob, 
   internalUpdateJobStatus, 
   internalRetryJob, 
   internalCancelJob 
 } from '../server/jobs.server';
 import { supabaseAdmin } from '../integrations/supabase/client.server';
 
 // Mock Supabase
 vi.mock('../integrations/supabase/client.server', () => ({
   supabaseAdmin: {
     from: vi.fn(() => ({
       select: vi.fn().mockReturnThis(),
       insert: vi.fn().mockReturnThis(),
       update: vi.fn().mockReturnThis(),
       eq: vi.fn().mockReturnThis(),
       in: vi.fn().mockReturnThis(),
       single: vi.fn().mockReturnThis(),
       order: vi.fn().mockReturnThis(),
       limit: vi.fn().mockReturnThis(),
     }))
   }
 }));
 
 describe('Jobs Layer - Smoke Tests', () => {
   const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";
 
   beforeEach(() => {
     vi.clearAllMocks();
   });
 
   it('1. internalEnqueueJob deve garantir owner_user_id como DEV_USER_ID', async () => {
     const mockInsert = vi.fn().mockResolvedValue({ data: { id: 'job-1' }, error: null });
     (supabaseAdmin.from as any).mockReturnValue({
       select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }),
       insert: mockInsert,
       select: () => ({ single: () => Promise.resolve({ data: { id: 'job-1' }, error: null }) })
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
     (supabaseAdmin.from as any).mockReturnValue({
       select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { status: 'cancelled', cancel_requested: true } }) }) }),
       insert: vi.fn() // para o appendJobEvent
     });
 
     const result = await internalUpdateJobStatus({
       jobId: 'job-1',
       status: 'done'
     });
 
     expect(result.status).toBe('cancelled');
   });
 
   it('3. internalRetryJob só deve permitir retry em jobs falhos ou queued_external', async () => {
     (supabaseAdmin.from as any).mockReturnValue({
       select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { status: 'done' } }) }) })
     });
 
     await expect(internalRetryJob('job-1')).rejects.toThrow('Somente jobs falhos ou aguardando reprocessamento');
   });
 
   it('4. internalCancelJob deve marcar cancel_requested como true', async () => {
     const mockUpdate = vi.fn().mockReturnValue({
       select: () => ({ single: () => Promise.resolve({ data: { status: 'cancelled' }, error: null }) })
     });
 
     (supabaseAdmin.from as any).mockReturnValue({
       select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { status: 'running' } }) }) }),
       update: mockUpdate,
       insert: vi.fn() // para o appendJobEvent
     });
 
     await internalCancelJob('job-1');
     expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
       cancel_requested: true,
       status: 'cancelled'
     }));
   });
 });