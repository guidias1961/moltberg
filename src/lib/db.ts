import fs from 'fs';
import path from 'path';

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

export async function getProjects(): Promise<Project[]> {
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
    try {
        const projects = await getProjects();
        projects.push(project);

        // Sort by score descending
        projects.sort((a, b) => b.totalScore - a.totalScore);

        fs.writeFileSync(DATA_PATH, JSON.stringify(projects, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving project:', error);
        return false;
    }
}
