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
            return NextResponse.json({ success: false, error: 'Incomplete project data' }, { status: 400 });
        }

        const success = await saveProject(project);
        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, error: 'Failed to save project' }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
