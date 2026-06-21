import fs from 'fs';
import path from 'path';

/**
 * Loads all SKILL.md files from the .donna/skills directory and returns their contents
 * as a formatted string to be injected into the LLM context.
 */
export async function loadSkills(): Promise<string> {
  const skillsDir = path.join(process.cwd(), '.donna', 'skills');
  let skillsContext = '--- AVAILABLE SKILLS START ---\n\n';

  try {
    if (!fs.existsSync(skillsDir)) {
      return '';
    }

    const folders = fs.readdirSync(skillsDir);
    let foundSkill = false;

    for (const folder of folders) {
      const skillPath = path.join(skillsDir, folder, 'SKILL.md');
      if (fs.existsSync(skillPath)) {
        foundSkill = true;
        const content = fs.readFileSync(skillPath, 'utf8');
        skillsContext += `### Skill: ${folder}\n${content}\n\n`;
      }
    }

    if (!foundSkill) return '';

    skillsContext += '--- AVAILABLE SKILLS END ---\n';
    return skillsContext;
  } catch (error) {
    console.error('[skills] Error loading skills:', error);
    return '';
  }
}
