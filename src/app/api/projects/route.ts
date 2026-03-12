import { NextRequest, NextResponse } from 'next/server';
import { getProjects, saveProject } from '@/lib/db';

export async function GET() {
    try {
        const projects = await getProjects();
        return NextResponse.json({ success: true, projects });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch projects' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const project = await req.json();

        if (!project.id || !project.name || !project.submitter) {
            console.warn('[API/PROJECTS] Rejected: Incomplete project data', project);
            return NextResponse.json({ success: false, error: 'Incomplete project data' }, { status: 400 });
        }

        console.log(`[API/PROJECTS] Attempting to save project: ${project.name} (${project.id})`);
        const success = await saveProject(project);

        if (success) {
            console.log(`[API/PROJECTS] ✓ Saved successfully: ${project.name}`);
            return NextResponse.json({ success: true });
        } else {
            console.error(`[API/PROJECTS] ✗ Failed to save project: ${project.name}`);
            return NextResponse.json({ success: false, error: 'Failed to save project. Ensure database (KV/Redis) is connected.' }, { status: 500 });
        }
    } catch (error) {
        console.error('[API/PROJECTS] Internal error during post:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
