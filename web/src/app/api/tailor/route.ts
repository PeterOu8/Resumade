import OpenAI from 'openai';
import { env } from '../../env';
import { redactText } from '@/lib/textHelpers';
import { TailorResumeRequestSchema } from '@/lib/schemas';

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
const mockData = {
  summary:
    'Junior software developer with experience building scalable web applications from architecture to deployment. Skilled across front-end and back-end technologies including React, Next.js, TypeScript, C#, .NET, SQL, and Python. Demonstrated ability to design user-friendly interfaces, implement RESTful APIs, and integrate AI-driven solutions. Strong communicator with proven success in explaining complex technical concepts to non-technical audiences.',
  keySkills: [
    {
      category: 'Front-end',
      skills: [
        'JavaScript (ES6)',
        'TypeScript',
        'Next.js',
        'React',
        'HTML5',
        'CSS',
        'Tailwind CSS',
      ],
    },
    {
      category: 'Back-end',
      skills: [
        'C#',
        '.NET8/.NET9',
        'Java',
        'Node.js',
        'SQL Server',
        'PostgreSQL',
        'MongoDB',
        'Python',
        'Linux',
      ],
    },
    {
      category: 'Tooling',
      skills: ['Git', 'GitHub', 'Jira', 'Slack', 'Cursor'],
    },
    {
      category: 'Methodologies',
      skills: [
        'RESTful API',
        'CRUD Operations',
        'HTTP Methods',
        'Object-Oriented Programming (OOP)',
        'SDLC',
        'Test-Driven Development (TDD)',
        'Agile/Scrum',
        'Operating Systems',
        'Computer Networks',
      ],
    },
  ],
  experience: [
    {
      company: 'Red Bridge Capital',
      title: 'Frontend Developer',
      location: 'Melbourne',
      dates: 'Aug 2024 – Dec 2024',
      bullets: [
        'Translated design into HTML, CSS, and JavaScript with the UI and marketing team, improving the functionality of product landing pages.',
        'Resolved cross-platform compatibility issues to enhance mobile usability and accessibility.',
      ],
    },
    {
      company: 'Fitness First Australia',
      title: 'Membership Consultant',
      location: 'Melbourne',
      dates: 'Jan 2025 – Current',
      bullets: [
        'Ranked #1 and #2 nationwide in February and March 2025 respectively for sales volume across all FLG clubs.',
        'Drove over 35% of total club sales volume by building rapport with diverse clientele.',
        'Applied clear communication skills to explain fitness services in simple terms — a strength transferable to technical concept communication in software projects.',
      ],
    },
  ],
  projects: [
    {
      title: 'Dev Share',
      url: 'https://github.com/Ben0189/dev-share',
      bullets: [
        'Built a full-stack web platform for developers to share and discover resources, integrating AI and vector search for intelligent data retrieval.',
        'Designed and implemented AI endpoints with OpenAI APIs to enable natural language queries.',
        'Improved system stability by adding robust error handling for RESTful APIs.',
        'Developed chat completion API endpoints with .NET9 to enhance user search accuracy.',
      ],
      techStack: [
        '.NET9',
        'C#',
        'Qdrant',
        'Next.js',
        'React',
        'TypeScript',
        'Tailwind CSS',
        'Zod',
        'React Hook Form',
        'Shadcn',
      ],
    },
    {
      title: 'Blotz Task',
      url: 'https://blotz-task-app.vercel.app/',
      bullets: [
        'Led product architecture design, reviewed pull requests, and paired programmed with team members.',
        'Acted as tech lead in Agile practices including sprint planning, spec reviews, and feature iteration.',
        'Built reusable front-end components with React to improve development efficiency.',
        'Developed RESTful API endpoints with .NET8 for CRUD operations and resource lifecycle management.',
      ],
      techStack: [
        '.NET8',
        'C#',
        'SQL Server',
        'Next.js',
        'React',
        'TypeScript',
        'Tailwind CSS',
        'Shadcn',
      ],
    },
  ],
  education: [
    {
      school: 'The University of Queensland',
      degree:
        'Bachelor of Information Technology / Business Management (Software Design and Marketing)',
      dates: '2020 – 2024',
      location: 'Brisbane',
      awards: [
        'Best Software Project, Innovation Showcase 2022',
        'Best User Experience Design, Innovation Showcase 2023',
        'Project with the Most Commercial Potential, Innovation Showcase 2023',
      ],
    },
  ],
  atsHints: [
    'Emphasise experience with React, Next.js, TypeScript, and .NET in both projects and work history.',
    'Highlight AI integration and RESTful API development to align with modern software engineering roles.',
    'Show leadership in Agile practices and technical mentorship on projects.',
    'Include both technical and communication strengths for roles requiring cross-team collaboration.',
    'Tailor keywords to match job descriptions: scalable systems, API development, cloud technologies, DevOps tooling.',
  ],
};
export async function POST(req: Request) {
  return Response.json(mockData);
  const { resumePlainText, jobDescription, prompt } =
    TailorResumeRequestSchema.parse(await req.json());

  const system = `You are the head of human resource management with a background in software engineering and over 10 years of experience in hiring technical professionals. Rewrite resumes for ATS using AU spelling. Keep claims truthful and highlight skills listed in the job description with the provided resume's experience.  

Output JSON ONLY with keys:  
summary: string;  
keySkills: [{ category: string, skills: string[] }];  
experience: [{ company: string, title: string, location?: string, dates?: string, bullets: string[] }];  
projects: [{ title: string, url?: string, dates?: string, bullets: string[], techStack: string[] }];  
education: [{ school: string, degree: string, dates?: string, location?: string, awards?: string[] }];  
atsHints: string[];  
coverLetter?: string;`;

  const user = [
    `JOB DESCRIPTION:\n${jobDescription}`,
    `RESUME TEXT:\n${redactText(resumePlainText)}`,
    `ADDITIONAL PROMPT:\n${prompt}`,
    `CONSTRAINTS:
- Bullets ≤ 25 words, strong verbs, metrics where possible.
- Prioritise JD keywords; DO NOT invent experience.
- If a Job description must-have is missing, add to atsHints only.
- Preserve dates; do not change years.
- Reply with valid JSON only.`,
  ].join('\n\n');

  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  const raw = resp.choices[0].message.content || '{}';
  try {
    const json = JSON.parse(raw);
    return Response.json(json);
  } catch {
    return Response.json({ error: 'Invalid JSON from model' }, { status: 500 });
  }
}
