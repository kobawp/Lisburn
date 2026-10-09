import fs from 'fs';
import path from 'path';

function processClasses(classString) {
    const classes = classString.split(/\s+/).filter(Boolean);
    const darkClasses = classes.filter(c => c.startsWith('dark:'));
    
    // Map dark class to its prefix category
    const darkPrefixes = darkClasses.map(c => {
        // e.g. dark:bg-[#130F14] -> bg-
        // dark:text-zinc-300 -> text-
        // dark:hover:bg-[#1C151E] -> hover:bg-
        const withoutDark = c.substring(5); // remove 'dark:'
        
        // Extract prefix before the last '-' or the value part
        let match = withoutDark.match(/^(.*?)(?:-[^-]+|-\[[^\]]+\])$/);
        if (match) {
            return { original: c, withoutDark: withoutDark, prefix: match[1] + '-' };
        }
        return null;
    }).filter(Boolean);

    let finalClasses = [];
    for (const c of classes) {
        if (c.startsWith('dark:')) {
            finalClasses.push(c.substring(5)); // Just add the withoutDark version
            continue;
        }
        
        // If it's a light class, check if it's overridden by a dark class
        let isOverridden = false;
        for (const dp of darkPrefixes) {
            if (c.startsWith(dp.prefix)) {
                // Check if it's the same type (e.g. both are bg- colors, not one bg-opacity)
                // This is a simple heuristic: if it starts with the same prefix, we assume it's overridden.
                isOverridden = true;
                break;
            }
        }
        if (!isOverridden) {
            finalClasses.push(c);
        }
    }
    
    return finalClasses.join(' ');
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Process className="..." and className={`...`}
    // This simple regex handles both className=" " and className={' '} or {` `}
    content = content.replace(/(className\s*=\s*["'`])([^"'`]+)(["'`])/g, (match, p1, p2, p3) => {
        return p1 + processClasses(p2) + p3;
    });
    
    // Also handle template literals with variables inside classNames, e.g. className={`base ${cond ? 'a' : 'b'}`}
    // Since this can be complex, let's just do a global replace for things looking like tailwind classes
    // Wait, the above regex only catches classes without interpolation if we use backticks? 
    // No, if it has ${}, the regex [^"'`]+ will stop at $. 
    
    // A better approach: just regex replace all dark:xxx
    // Wait! If I just do regex replacement for the whole file?
    // Let's just rely on a slightly better parsing:
    const lines = content.split('\n');
    const processedLines = lines.map(line => {
        // Find all strings of classes
        return line.replace(/(["'`])([^"'`]*dark:[^"'`]*)(["'`])/g, (match, p1, p2, p3) => {
            return p1 + processClasses(p2) + p3;
        });
    });
    
    fs.writeFileSync(filePath, processedLines.join('\n'));
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

walkDir('src');
console.log('Done');
