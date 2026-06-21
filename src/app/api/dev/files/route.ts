import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const localScriptsDir = path.join(process.cwd(), '.donna', 'scripts');
    if (!fs.existsSync(localScriptsDir)) {
      return NextResponse.json({ success: true, files: [] });
    }

    const fileNames = fs.readdirSync(localScriptsDir).filter(f => f.endsWith('.py'));
    
    // Read the content of the last 20 scripts
    const files = fileNames.slice(-20).map(name => {
      const content = fs.readFileSync(path.join(localScriptsDir, name), 'utf-8');
      const stat = fs.statSync(path.join(localScriptsDir, name));
      return {
        name,
        content,
        updatedAt: stat.mtime.toISOString(),
      };
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({ success: true, files });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
