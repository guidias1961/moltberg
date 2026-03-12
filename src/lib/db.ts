import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';

// Define the Project type based on the store but for server-side
export interface Project {
    id: string;
    name: string;
    pitch: string;
    niche: string;
    scores: {
        feasibility: number;
        marketDisruption: number;
        narrativeStrength: number;
    };
    totalScore: number;
    rationale: {
        feasibility: string;
        marketDisruption: string;
        narrativeStrength: string;
        verdict: string;
    };
    aiPowered: boolean;
    agentBreakdown?: any[];
    timestamp: number;
    submitter: string;
    submissionSource: 'human' | 'agent';
}

const DATA_PATH = path.join(process.cwd(), 'src/data/projects.json');
const KV_KEY = 'moltberg:projects';

export async function getProjects(): Promise<Project[]> {
    // Check if we are in an environment with Vercel KV configured
    if (process.env.KV_URL || process.env.KV_REST_API_URL) {
        try {
            const projects = await kv.get<Project[]>(KV_KEY);
            return projects || [];
        } catch (error) {
            console.error('Error reading from Vercel KV:', error);
            // Fallback to local if KV fails (optional, maybe better to error)
        }
    }

    // Fallback to local JSON storage for development
    try {
        if (!fs.existsSync(DATA_PATH)) {
            return [];
        }
        const data = fs.readFileSync(DATA_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading projects:', error);
        return [];
    }
}

export async function saveProject(project: Project): Promise<boolean> {
    const projects = await getProjects();
    projects.push(project);
    // Sort by score descending
    projects.sort((a, b) => b.totalScore - a.totalScore);

    if (process.env.KV_URL || process.env.KV_REST_API_URL) {
        try {
            await kv.set(KV_KEY, projects);
            return true;
        } catch (error) {
            console.error('Error saving to Vercel KV:', error);
            return false;
        }
    }

    // Local JSON storage
    try {
        fs.writeFileSync(DATA_PATH, JSON.stringify(projects, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving project locally:', error);
        return false;
    }
}
