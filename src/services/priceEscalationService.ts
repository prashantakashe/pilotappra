// src/services/priceEscalationService.ts
// Service for Price Escalation Bill module project CRUD operations

import { v4 as uuidv4 } from 'uuid';

export interface PriceEscalationProject {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  status?: string;
  location?: string;
  value?: string;
  progress?: number;
  startDate?: string;
  completionDate?: string;
}

// In-memory mock for now
let projects: PriceEscalationProject[] = [];

export const priceEscalationService = {
  getProjects: async (): Promise<PriceEscalationProject[]> => {
    return projects;
  },
  createProject: async (project: Omit<PriceEscalationProject, 'id'>) => {
    const newProject = { ...project, id: uuidv4() };
    projects.push(newProject);
    return newProject.id;
  },
  deleteProject: async (id: string) => {
    projects = projects.filter(p => p.id !== id);
  },
  updateProject: async (id: string, data: Partial<PriceEscalationProject>) => {
    projects = projects.map(p => (p.id === id ? { ...p, ...data } : p));
  },
};
