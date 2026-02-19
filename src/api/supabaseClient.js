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
// RPC helpers (defined early — used by OpenRouter integration below)
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
    _cachedApiKey = null; // clear cache on update
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
// OpenRouter model mapping
// ---------------------------------------------------------------------------
const OPENROUTER_MODELS = {
  "deepseek-r1-free": "deepseek/deepseek-r1-0528:free",
  "gpt-4o": "openai/gpt-4o",
  "gpt-4o-mini": "openai/gpt-4o-mini",
  "claude-3-5-sonnet-20241022": "anthropic/claude-3.5-sonnet",
  "claude-3-5-haiku-20241022": "anthropic/claude-3.5-haiku",
  "gemini-2.0-flash-exp": "google/gemini-2.0-flash-exp",
};

let _cachedApiKey = null;

async function getOpenRouterKey() {
  if (_cachedApiKey) return _cachedApiKey;
  try {
    const result = await rpc.getApiKey();
    // RPC returns { api_key: "sk-or-..." }
    const key = result?.api_key || null;
    if (key) _cachedApiKey = key;
    return key;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Integrations — OpenRouter-powered AI + mocks for email/upload
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
    async InvokeLLM({ model, prompt, response_json_schema, file_urls }) {
      const apiKey = await getOpenRouterKey();

      // Fallback to demo mode if no API key
      if (!apiKey) {
        if (response_json_schema?.properties?.answer) {
          return {
            answer:
              "I'm running in demo mode without an AI backend. To enable the AI tutor, add your OpenRouter API key in Admin Settings.",
            suggestions: [
              "How do I get an API key?",
              "Where are Admin Settings?",
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
                  "This is a demo import. Add your OpenRouter API key in Admin Settings for real extraction.",
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
        return "I'm running in demo mode. To enable the AI tutor, add your OpenRouter API key in Admin Settings.";
      }

      // Build messages array for OpenRouter
      const messages = [];

      // If file_urls provided, build multimodal content
      if (file_urls && file_urls.length > 0) {
        const content = [
          { type: "text", text: prompt },
          ...file_urls.map((url) => ({
            type: "image_url",
            image_url: { url },
          })),
        ];
        messages.push({ role: "user", content });
      } else {
        messages.push({ role: "user", content: prompt });
      }

      const openRouterModel = OPENROUTER_MODELS[model] || model;

      const body = {
        model: openRouterModel,
        messages,
        max_tokens: 1024,
      };

      // Request JSON output when schema is provided
      if (response_json_schema) {
        // Use json_object (broadly supported) instead of json_schema
        body.response_format = { type: "json_object" };
        // Embed the schema in the prompt so all models understand the expected shape
        const schemaHint = `\n\nRespond with a JSON object matching this schema: ${JSON.stringify(response_json_schema)}`;
        if (Array.isArray(messages[0].content)) {
          messages[0].content[0].text += schemaHint;
        } else {
          messages[0].content += schemaHint;
        }
      }

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "StudyTrack",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        if (res.status === 402) {
          const friendly = "Your OpenRouter account needs more credits. Visit openrouter.ai/credits to add funds, then try again.";
          if (response_json_schema?.properties?.answer) {
            return { answer: friendly, suggestions: [], profile_updates: null };
          }
          return friendly;
        }
        throw new Error(`OpenRouter error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";

      // Parse JSON response if schema was requested
      if (response_json_schema) {
        try {
          return JSON.parse(text);
        } catch {
          // If JSON parsing fails, wrap in expected shape
          if (response_json_schema.properties?.answer) {
            return { answer: text, suggestions: [], profile_updates: null };
          }
          return text;
        }
      }

      return text;
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
