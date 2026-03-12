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
    const isKvConfigured = !!(process.env.KV_URL && process.env.KV_REST_API_TOKEN);

    if (isKvConfigured) {
        try {
            const projects = await kv.get<Project[]>(KV_KEY);
            console.log(`[DB] Fetched ${projects?.length || 0} projects from Vercel KV.`);
            return projects || [];
        } catch (error) {
            console.error('[DB] Error reading from Vercel KV:', error);
        }
    } else {
        console.warn('[DB] Vercel KV not fully configured. Missing KV_URL or KV_REST_API_TOKEN.');
    }

    // Fallback to local JSON storage for development
    try {
        if (!fs.existsSync(DATA_PATH)) {
            return [];
        }
        const data = fs.readFileSync(DATA_PATH, 'utf8');
        const projects = JSON.parse(data);
        console.log(`[DB] Fetched ${projects.length} projects from local JSON.`);
        return projects;
    } catch (error) {
        console.error('[DB] Error reading projects locally:', error);
        return [];
    }
}

export async function saveProject(project: Project): Promise<boolean> {
    const projects = await getProjects();

    // Check if project already exists (prevent duplicates if fetchProjects fails)
    if (projects.some(p => p.id === project.id)) {
        console.warn(`[DB] Project ${project.id} already exists. Skipping.`);
        return true;
    }

    projects.push(project);
    // Sort by score descending
    projects.sort((a, b) => b.totalScore - a.totalScore);

    const isKvConfigured = !!(process.env.KV_URL && process.env.KV_REST_API_TOKEN);

    if (isKvConfigured) {
        try {
            console.log(`[DB] Saving to Vercel KV...`);
            await kv.set(KV_KEY, projects);
            console.log(`[DB] ✓ Successfully saved to Vercel KV.`);
            return true;
        } catch (error) {
            console.error('[DB] Error saving to Vercel KV:', error);
            return false;
        }
    }

    // Local JSON storage
    try {
        console.log(`[DB] Saving to local JSON...`);
        fs.writeFileSync(DATA_PATH, JSON.stringify(projects, null, 2));
        console.log(`[DB] ✓ Successfully saved to local JSON.`);
        return true;
    } catch (error) {
        console.error('[DB] Error saving project locally:', error);
        return false;
    }
}
