// localStorage-based data layer replacing Base44 SDK
// Provides the same API surface: .create, .filter, .update, .delete, .bulkCreate

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

class LocalEntity {
  constructor(name) {
    this.name = name;
    this.storageKey = `studytrack_${name}`;
  }

  _getAll() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  _saveAll(items) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  async create(data) {
    const items = this._getAll();
    const newItem = {
      ...data,
      id: generateId(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };
    items.push(newItem);
    this._saveAll(items);
    return newItem;
  }

  async bulkCreate(dataArray) {
    const items = this._getAll();
    const newItems = dataArray.map((data) => ({
      ...data,
      id: generateId(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    }));
    items.push(...newItems);
    this._saveAll(items);
    return newItems;
  }

  async filter(conditions = {}, sortField, limit) {
    let items = this._getAll();

    // Apply filters
    if (conditions && Object.keys(conditions).length > 0) {
      items = items.filter((item) =>
        Object.entries(conditions).every(([key, value]) => item[key] === value)
      );
    }

    // Apply sorting
    if (sortField) {
      const desc = sortField.startsWith("-");
      const field = desc ? sortField.slice(1) : sortField;
      items.sort((a, b) => {
        const aVal = a[field] || "";
        const bVal = b[field] || "";
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return desc ? -cmp : cmp;
      });
    }

    // Apply limit
    if (limit) {
      items = items.slice(0, limit);
    }

    return items;
  }

  async update(id, data) {
    const items = this._getAll();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`${this.name} with id ${id} not found`);
    items[index] = {
      ...items[index],
      ...data,
      updated_date: new Date().toISOString(),
    };
    this._saveAll(items);
    return items[index];
  }

  async delete(id) {
    const items = this._getAll();
    const filtered = items.filter((item) => item.id !== id);
    this._saveAll(filtered);
    return { success: true };
  }
}

// Mock user data — account_type starts null to trigger setup flow
const mockUser = {
  id: "local-user-1",
  full_name: "Demo User",
  email: "demo@studytrack.app",
};

// Local auth mock
const auth = {
  async me() {
    const stored = localStorage.getItem("studytrack_user");
    if (stored) {
      const user = JSON.parse(stored);
      // Merge with defaults to ensure all fields present
      return { ...mockUser, ...user };
    }
    localStorage.setItem("studytrack_user", JSON.stringify(mockUser));
    return { ...mockUser };
  },
  async updateMe(data) {
    const current = await this.me();
    const updated = { ...current, ...data };
    localStorage.setItem("studytrack_user", JSON.stringify(updated));
    return updated;
  },
  logout(redirectUrl) {
    localStorage.removeItem("studytrack_user");
    if (redirectUrl) window.location.href = redirectUrl;
  },
  redirectToLogin() {
    // No-op in local mode
  },
};

// Mock integrations
const integrations = {
  Core: {
    async SendEmail({ to, subject, body }) {
      console.log(`[Mock Email] To: ${to}, Subject: ${subject}`);
      // Returns success — caller shows toast
      return { success: true };
    },
    async UploadFile({ file }) {
      // Create a local blob URL for the file
      const url = URL.createObjectURL(file);
      return { file_url: url };
    },
    async InvokeLLM({ prompt, model, response_json_schema, file_urls }) {
      // Return mock responses based on context
      if (response_json_schema?.properties?.answer) {
        // Tutor chat response
        return {
          answer: "That's a great question! Let me help you think through this. What do you already know about this topic? Try breaking the problem down into smaller parts — what's the first step you can identify?",
          suggestions: [
            "Can you explain that differently?",
            "What's the next step?",
            "I'm still confused about one part"
          ],
          profile_updates: null,
        };
      }
      if (response_json_schema?.properties?.assignments) {
        // Schoology import response
        return {
          assignments: [
            {
              title: "Sample Imported Assignment",
              class_name: "Sample Class",
              subject: "General",
              description: "This is a demo import. Connect an AI API for real extraction.",
              due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              teacher_name: "Demo Teacher",
              teacher_email: "",
              priority: "medium",
            },
          ],
        };
      }
      // Default: return the prompt response as a string
      return "I'm running in demo mode without an AI backend. To enable the AI tutor, connect an API key.";
    },
  },
};

// Mock app logs
const appLogs = {
  async logUserInApp() {
    // No-op in local mode
  },
};

// Export the local client with the same shape as base44
export const base44 = {
  auth,
  entities: {
    Homework: new LocalEntity("homework"),
    Class: new LocalEntity("class"),
    Student: new LocalEntity("student"),
    TutorConversation: new LocalEntity("tutor_conversation"),
    StudentLearningProfile: new LocalEntity("learning_profile"),
    Achievement: new LocalEntity("achievement"),
  },
  integrations,
  appLogs,
};
