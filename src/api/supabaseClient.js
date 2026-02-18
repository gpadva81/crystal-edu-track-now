import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ---------------------------------------------------------------------------
// SupabaseEntity — drop-in replacement for LocalEntity
// Provides: .create(), .bulkCreate(), .filter(), .update(), .delete()
// ---------------------------------------------------------------------------
class SupabaseEntity {
  constructor(table) {
    this.table = table;
  }

  async create(data) {
    const { data: row, error } = await supabase
      .from(this.table)
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return row;
  }

  async bulkCreate(dataArray) {
    const { data: rows, error } = await supabase
      .from(this.table)
      .insert(dataArray)
      .select();
    if (error) throw error;
    return rows;
  }

  async filter(conditions = {}, sortField, limit) {
    let query = supabase.from(this.table).select("*");

    for (const [key, value] of Object.entries(conditions)) {
      query = query.eq(key, value);
    }

    if (sortField) {
      const desc = sortField.startsWith("-");
      const field = desc ? sortField.slice(1) : sortField;
      query = query.order(field, { ascending: !desc });
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async update(id, data) {
    const { data: row, error } = await supabase
      .from(this.table)
      .update(data)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return row;
  }

  async filterIn(column, values, selectColumns = "*") {
    if (!values || values.length === 0) return [];
    const { data, error } = await supabase
      .from(this.table)
      .select(selectColumns)
      .in(column, values);
    if (error) throw error;
    return data;
  }

  async delete(id) {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { success: true };
  }
}

// ---------------------------------------------------------------------------
// Auth — wraps Supabase Auth + profiles table
// ---------------------------------------------------------------------------
const auth = {
  async me() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) throw error || new Error("Not authenticated");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (profileError) throw profileError;

    return { ...profile, email: user.email };
  },

  async updateMe(data) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: profile, error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", user.id)
      .select()
      .single();
    if (error) throw error;
    return { ...profile, email: user.email };
  },

  async logout() {
    await supabase.auth.signOut();
  },

  async changePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  },
};

// ---------------------------------------------------------------------------
// Integrations — kept as mocks (no external services yet)
// ---------------------------------------------------------------------------
const integrations = {
  Core: {
    async SendEmail({ to, subject }) {
      console.log(`[Mock Email] To: ${to}, Subject: ${subject}`);
      return { success: true };
    },
    async UploadFile({ file }) {
      const url = URL.createObjectURL(file);
      return { file_url: url };
    },
    async InvokeLLM({ response_json_schema }) {
      if (response_json_schema?.properties?.answer) {
        return {
          answer:
            "That's a great question! Let me help you think through this. What do you already know about this topic? Try breaking the problem down into smaller parts — what's the first step you can identify?",
          suggestions: [
            "Can you explain that differently?",
            "What's the next step?",
            "I'm still confused about one part",
          ],
          profile_updates: null,
        };
      }
      if (response_json_schema?.properties?.assignments) {
        return {
          assignments: [
            {
              title: "Sample Imported Assignment",
              class_name: "Sample Class",
              subject: "General",
              description:
                "This is a demo import. Connect an AI API for real extraction.",
              due_date: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
              ).toISOString(),
              teacher_name: "Demo Teacher",
              teacher_email: "",
              priority: "medium",
            },
          ],
        };
      }
      return "I'm running in demo mode without an AI backend. To enable the AI tutor, connect an API key.";
    },
  },
};

// ---------------------------------------------------------------------------
// App logs — no-op
// ---------------------------------------------------------------------------
const appLogs = {
  async logUserInApp() {},
};

// ---------------------------------------------------------------------------
// Export with identical shape to localClient
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// RPC helpers
// ---------------------------------------------------------------------------
const rpc = {
  async acceptParentInvite(token) {
    const { data, error } = await supabase.rpc("accept_parent_invite", {
      invite_token: token,
    });
    if (error) throw error;
    return data;
  },

  async getApiKey() {
    const { data, error } = await supabase.rpc("get_api_key");
    if (error) throw error;
    return data;
  },

  async updateApiKey(newApiKey) {
    const { data, error } = await supabase.rpc("update_api_key", {
      new_api_key: newApiKey,
    });
    if (error) throw error;
    return data;
  },

  async removeStudentParent(studentParentId) {
    const { data, error } = await supabase.rpc("admin_remove_student_parent", {
      p_student_parent_id: studentParentId,
    });
    if (error) throw error;
    return data;
  },
};

// ---------------------------------------------------------------------------
// Export with identical shape to localClient
// ---------------------------------------------------------------------------
export const base44 = {
  auth,
  entities: {
    Homework: new SupabaseEntity("homework"),
    Class: new SupabaseEntity("class"),
    Student: new SupabaseEntity("student"),
    TutorConversation: new SupabaseEntity("tutor_conversation"),
    StudentLearningProfile: new SupabaseEntity("student_learning_profile"),
    Achievement: new SupabaseEntity("achievement"),
    StudentParent: new SupabaseEntity("student_parent"),
    ParentInvite: new SupabaseEntity("parent_invite"),
    HomeworkComment: new SupabaseEntity("homework_comment"),
  },
  rpc,
  integrations,
  appLogs,
};
