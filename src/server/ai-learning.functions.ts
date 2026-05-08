import { createServerFn } from "@tanstack/react-start";
import { getSupabase, Logger } from "./leads-core";

export interface UserSalesProfile {
  id: string;
  user_id: string;
  preferred_tone: string;
  preferred_intensity: string;
  preferred_size: string;
  preferred_cta: string;
  preferred_channels: string[];
  top_triggers: string[];
  avg_message_length: number;
  messages_sent_count: number;
  messages_edited_count: number;
  success_rate_by_channel: Record<string, number>;
  success_rate_by_trigger: Record<string, number>;
  learning_paused: boolean;
}

export const getUserSalesProfile = createServerFn({ method: "GET" })
  .handler(async () => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    let { data, error } = await supabase
      .from("user_sales_profile")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data && !error) {
      // Create default profile if it doesn't exist
      const { data: newData, error: createError } = await supabase
        .from("user_sales_profile")
        .insert({ user_id: user.id })
        .select("*")
        .single();
      
      if (createError) {
        Logger.error("Error creating user sales profile", createError);
        return null;
      }
      return newData as UserSalesProfile;
    }

    return data as UserSalesProfile;
  });

export const updateUserSalesProfile = createServerFn({ method: "POST" })
  .inputValidator((input: Partial<UserSalesProfile>) => input)
  .handler(async ({ data: updates }) => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
      .from("user_sales_profile")
      .upsert({ ...updates, user_id: user.id, updated_at: new Date().toISOString() })
      .select("*")
      .single();

    if (error) {
      Logger.error("Error updating user sales profile", error);
      throw error;
    }

    return data as UserSalesProfile;
  });

export const recordLearningAction = createServerFn({ method: "POST" })
  .inputValidator((input: { 
    lead_id?: string; 
    action_type: string; 
    original_data?: any; 
    final_data?: any; 
    context?: any 
  }) => input)
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    // Check if learning is paused
    const { data: profile } = await supabase
      .from("user_sales_profile")
      .select("learning_paused")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (profile?.learning_paused) return { success: true, skipped: true };

    const { error } = await supabase.from("ai_adaptive_learning").insert({
      user_id: user.id,
      ...data
    });

    if (error) {
      Logger.error("Error recording learning action", error);
      return { success: false };
    }

    // Trigger profile update based on actions (async or periodic in real app, here simple update)
    if (data.action_type === 'send' || data.action_type === 'edit') {
        // Logic to update stats in user_sales_profile
    }

    return { success: true };
  });

export const analyzeUserStyle = createServerFn({ method: "POST" })
  .inputValidator((input: { content: string }) => input)
  .handler(async ({ data }) => {
    const { content } = data;
    
    // Simple analysis logic
    const length = content.length;
    const isDirect = content.length < 150;
    const hasQuestion = content.includes('?');
    
    const analysis = {
      length: length > 300 ? 'detailed' : length > 150 ? 'medium' : 'short',
      tone: content.toLowerCase().includes('posso') ? 'consultive' : 'direct',
      has_cta: hasQuestion
    };

    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("user_style_references").insert({
        user_id: user.id,
        content,
        analysis
      });
    }

    return analysis;
  });

export const getWinnerMessages = createServerFn({ method: "GET" })
  .handler(async () => {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("winner_messages")
      .select("*")
      .order("created_at", { ascending: false });
    return data || [];
  });
