// =====================================================
// LESSONS DATA — English Learning App
// Every English word/phrase MUST have a 'pronunciation'
// field written as PT-BR phonetics.
// =====================================================

export const LESSONS = [
  // ─────────────────────────────
  // MÓDULO 1: BÁSICO (Olá e Tchau)
  // ─────────────────────────────
  {
    id: 1, module: 1, title: "Saudações", icon: "👋", xpReward: 20, isAi: true,
    theme: "Basics of greetings and saying goodbye (Hello, Goodbye, Hi, See you)."
  },
  {
    id: 2, module: 1, title: "Apresentações", icon: "🤝", xpReward: 20, isAi: true,
    theme: "Basic introductions (My name is, Nice to meet you, I am from)."
  },

  // ─────────────────────────────
  // MÓDULO 2: NÚMEROS E CORES
  // ─────────────────────────────
  {
    id: 3, module: 2, title: "Números 1-10", icon: "🔢", xpReward: 25, isAi: true,
    theme: "English numbers from 1 to 10 and basic counting."
  },
  {
    id: 4, module: 2, title: "Cores Básicas", icon: "🎨", xpReward: 25, isAi: true,
    theme: "Common colors (Red, Blue, Green, Yellow, Black, White)."
  },

  // ─────────────────────────────
  // MÓDULO 3: NO RESTAURANTE
  // ─────────────────────────────
  {
    id: 5, module: 3, title: "Pedindo Comida", icon: "🍔", xpReward: 30, isAi: true,
    theme: "Ordering food in a restaurant (I would like, a coffee please, menu)."
  },
  {
    id: 6, module: 3, title: "A Conta, por favor", icon: "🧾", xpReward: 30, isAi: true,
    theme: "Paying the bill and restaurant courtesy (The bill please, keep the change)."
  },

  // ─────────────────────────────
  // MÓDULO 4: VIAGENS
  // ─────────────────────────────
  {
    id: 7, module: 4, title: "No Aeroporto", icon: "✈️", xpReward: 35, isAi: true,
    theme: "Airport vocabulary and situations (Passport, check-in, gate, flight)."
  },
  {
    id: 8, module: 4, title: "Pedindo Direções", icon: "🗺️", xpReward: 35, isAi: true,
    theme: "Asking for directions (Where is the hotel?, Go straight, Turn left)."
  },

  // ─────────────────────────────
  // MÓDULO 5: NO TRABALHO
  // ─────────────────────────────
  {
    id: 9, module: 5, title: "Apresentações", icon: "💼", xpReward: 40, isAi: true,
    theme: "Formal introductions and workplace basics (I work at, My job is, Meeting)."
  },
  {
    id: 10, module: 5, title: "Email e Ligações", icon: "📧", xpReward: 40, isAi: true,
    theme: "Basic office communication (Send an email, phone call, deadline)."
  },

  // ─────────────────────────────
  // MÓDULO 6: PRÁTICA EXTRA 🤖
  // ─────────────────────────────
  {
    id: 99, module: 6, title: "Revisão Geral", icon: "🔄", xpReward: 50, isAi: true,
    theme: "General review of all previous levels and common daily English."
  },
  {
    id: 100, module: 6, title: "Desafio Surpresa", icon: "🎲", xpReward: 60, isAi: true,
    theme: "Advanced situational English, idioms, and unexpected challenges."
  }
];
