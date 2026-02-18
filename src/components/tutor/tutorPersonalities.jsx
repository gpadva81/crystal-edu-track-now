export const tutorPersonalities = {
  alex: {
    id: "alex",
    name: "Alex Taylor",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    description: "Patient and methodical",
    persona: "Alex is a calm, analytical tutor who breaks problems into logical steps. He uses real-world examples and asks thoughtful questions to help you discover solutions on your own.",
    color: "amber"
  },
  maria: {
    id: "maria",
    name: "Sarah Miller",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
    description: "Encouraging and creative",
    persona: "Sarah is an energetic, supportive tutor who celebrates every small win. She uses creative metaphors and encourages you to think outside the box while building your confidence.",
    color: "purple"
  },
  james: {
    id: "james",
    name: "James Wilson",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
    description: "Straightforward and practical",
    persona: "James is a no-nonsense tutor who gets straight to the point. He focuses on practical applications and helps you understand why concepts matter in the real world.",
    color: "blue"
  },
  priya: {
    id: "priya",
    name: "Priya Patel",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop",
    description: "Warm and detail-oriented",
    persona: "Priya is a patient, thorough tutor who ensures you understand every detail. She asks clarifying questions and helps you connect new concepts to what you already know.",
    color: "green"
  }
};

export const getTutorPersonality = (tutorId) => {
  return tutorPersonalities[tutorId] || tutorPersonalities.alex;
};