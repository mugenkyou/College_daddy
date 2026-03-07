/**
 * Script to add social sharing functionality and Open Graph meta tags to all roadmap HTML files
 * Run with: node scripts/add-share-to-roadmaps.js
 */

const fs = require('fs');
const path = require('path');

const roadmapDir = path.join(__dirname, '../roadmap_assets/html');
const roadmapFiles = fs.readdirSync(roadmapDir).filter(file => file.endsWith('.html') && file !== 'index.html');

// Roadmap metadata for Open Graph tags
const roadmapMetadata = {
    'ai-roadmap.html': {
        title: 'AI & Machine Learning Professional Roadmap',
        description: 'Master the future of technology. From foundational Mathematics to Large Language Models and Computer Vision, build job-ready skills with our structured AI & ML roadmap.'
    },
    'dsa-roadmap.html': {
        title: 'Data Structures & Algorithms Roadmap',
        description: 'A structured roadmap to guide learners from basic to advanced Data Structures and Algorithms. Master problem-solving skills essential for technical interviews.'
    },
    'web-dev-roadmap.html': {
        title: 'Web Development Roadmap',
        description: 'Learning web development to build interactive websites using JavaScript. Master frontend, backend, and full-stack development skills.'
    },
    'fullstack-roadmap.html': {
        title: 'Full Stack Developer Roadmap',
        description: 'Master both frontend and backend development. Build complete web applications from database to user interface.'
    },
    'generative-ai-roadmap.html': {
        title: 'Generative AI Roadmap',
        description: 'Master Generative AI, LLMs, and build intelligent agents from scratch. Learn to create AI systems that generate content, code, and solutions.'
    },
    'mobileapp-devloper-roadmap.html': {
        title: 'Mobile App Developer Roadmap',
        description: 'Create native and cross-platform mobile applications. Master iOS, Android, and React Native development.'
    },
    'cloud-computing-roadmap.html': {
        title: 'Cloud Computing Roadmap',
        description: 'Master cloud infrastructure and deployment. Learn AWS, Azure, GCP, and DevOps practices for scalable applications.'
    },
    'cyber-security-roadmap.html': {
        title: 'Cybersecurity Roadmap',
        description: 'Protect systems and networks from digital attacks. Learn ethical hacking, security protocols, and defense strategies.'
    },
    'devops-roadmap.html': {
        title: 'DevOps & SRE Roadmap',
        description: 'Build and manage scalable, reliable systems using modern automation and monitoring tools. Master CI/CD, containers, and infrastructure as code.'
    },
    'Blockchain-Web3-Roadmap.html': {
        title: 'Blockchain & Web3 Roadmap',
        description: 'Develop decentralized applications and smart contracts. Master blockchain technology, cryptocurrencies, and Web3 development.'
    },
    'Ai-Agent-Developer-Roadmap.html': {
        title: 'AI Agent & Automation Developer Roadmap',
        description: 'Build intelligent agents that automate workflows, integrate APIs, and use AI models like OpenAI and Gemini to create smart, self-operating systems.'
    },
    'Data-Analytics-Roadmap.html': {
        title: 'Data Analytics Roadmap',
        description: 'Learn to analyze data, build dashboards, and make data-driven decisions. Master SQL, visualization tools, and business intelligence.'
    },
    'Data-Science-Roadmap.html': {
        title: 'Data Science Roadmap',
        description: 'Master data analysis, machine learning, and AI-driven decision-making. Build predictive models and extract insights from complex datasets.'
    }
};

function addShareToRoadmap(filePath, filename) {
    let content = fs.readFileSync(filePath, 'utf8');
    const metadata = roadmapMetadata[filename] || {
        title: filename.replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: 'Explore this career roadmap on College Daddy - Your ultimate companion for academic success.'
    };

    // Check if already updated (has share.css)
    if (content.includes('share.css')) {
        console.log(`✓ ${filename} already has share functionality`);
        return;
    }

    // Update Open Graph meta tags if they exist, or add them
    const viewportMeta = /<meta\s+content="width=device-width[^>]*>/;
    const baseUrl = 'https://collegedaddy.vercel.app';
    const roadmapPath = `/roadmap_assets/html/${filename}`;
    
    if (viewportMeta.test(content)) {
        // Check if og:title already exists (update it) or add new tags
        if (content.includes('property="og:title"')) {
            // Update existing Open Graph tags
            content = content.replace(
                /<meta\s+property="og:title"[^>]*>/,
                `<meta property="og:title" content="${metadata.title} | College Daddy"/>`
            );
            content = content.replace(
                /<meta\s+property="og:description"[^>]*>/,
                `<meta property="og:description" content="${metadata.description}"/>`
            );
            content = content.replace(
                /<meta\s+property="og:url"[^>]*>/,
                `<meta property="og:url" content="${baseUrl}${roadmapPath}"/>`
            );
            content = content.replace(
                /<meta\s+property="og:image"[^>]*>/,
                `<meta property="og:image" content="${baseUrl}/assets/img/college-daddy-og.png"/>`
            );
            if (!content.includes('og:image:width')) {
                content = content.replace(
                    /(<meta\s+property="og:image"[^>]*\/>)/,
                    `$1\n    <meta property="og:image:width" content="1200"/>\n    <meta property="og:image:height" content="630"/>\n    <meta property="og:image:alt" content="College Daddy - Career Roadmaps &amp; Study Tools"/>`
                );
            }
            // Update Twitter tags
            if (content.includes('name="twitter:title"')) {
                content = content.replace(
                    /<meta\s+name="twitter:title"[^>]*>/,
                    `<meta name="twitter:title" content="${metadata.title} | College Daddy"/>`
                );
                content = content.replace(
                    /<meta\s+name="twitter:description"[^>]*>/,
                    `<meta name="twitter:description" content="${metadata.description}"/>`
                );
                content = content.replace(
                    /<meta\s+name="twitter:image"[^>]*>/,
                    `<meta name="twitter:image" content="${baseUrl}/assets/img/college-daddy-og.png"/>`
                );
            }
        } else {
            // Add new Open Graph tags
            const ogTags = `
    <meta name="description" content="${metadata.description}"/>
    
    <!-- Open Graph / Social Media Tags -->
    <meta property="og:title" content="${metadata.title} | College Daddy"/>
    <meta property="og:description" content="${metadata.description}"/>
    <meta property="og:url" content="${baseUrl}${roadmapPath}"/>
    <meta property="og:type" content="website"/>
    <meta property="og:site_name" content="College Daddy"/>
    <meta property="og:image" content="${baseUrl}/assets/img/college-daddy-og.png"/>
    <meta property="og:image:width" content="1200"/>
    <meta property="og:image:height" content="630"/>
    <meta property="og:image:alt" content="College Daddy - Career Roadmaps &amp; Study Tools"/>
    
    <!-- Twitter Card Tags -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="${metadata.title} | College Daddy"/>
    <meta name="twitter:description" content="${metadata.description}"/>
    <meta name="twitter:image" content="${baseUrl}/assets/img/college-daddy-og.png"/>
    `;
            content = content.replace(viewportMeta, (match) => match + ogTags);
        }
    }

    // Add share.css link before sub-roadmap.css
    if (content.includes('sub-roadmap.css')) {
        content = content.replace(
            /<link[^>]*sub-roadmap\.css[^>]*>/,
            (match) => match + '\n    <link href="../../assets/css/share.css" rel="stylesheet"/>'
        );
    }

    // Add share.js script before back-to-top.js
    if (content.includes('back-to-top.js')) {
        content = content.replace(
            /<script[^>]*back-to-top\.js[^>]*><\/script>/,
            '<script src="../../assets/js/components/share.js"></script>\n<script src="../../assets/js/components/back-to-top.js"></script>'
        );
    } else {
        // Add before closing body tag
        content = content.replace('</body>', '<script src="../../assets/js/components/share.js"></script>\n</body>');
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated ${filename}`);
}

// Process all roadmap files
console.log('Adding social sharing to roadmap files...\n');
roadmapFiles.forEach(filename => {
    const filePath = path.join(roadmapDir, filename);
    try {
        addShareToRoadmap(filePath, filename);
    } catch (error) {
        console.error(`✗ Error updating ${filename}:`, error.message);
    }
});

console.log('\n✓ All roadmap files updated!');
