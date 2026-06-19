import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Remove provider states
content = content.replace(/const \[apiProvider, setApiProvider\] = useState\([\s\S]*?provider"\) \|\| "gemini_sdk",\s*\);/, '');
content = content.replace(/const \[providerInputVal, setProviderInputVal\] = useState\(apiProvider\);/, '');

// Replace selectedModel default
content = content.replace(/useState<string>\("gemini-3.5-flash"\);/, 'useState<string>("gpt-4o");');

// In handleSaveApiKey
content = content.replace(/providerToSave\?: string,/g, '');
content = content.replace(/const cleanedProvider = \([\s\S]*?trim\(\);/, '');
content = content.replace(/setApiProvider\(cleanedProvider\);/, '');
content = content.replace(/localStorage\.setItem\("openprompter_provider", cleanedProvider\);/, '');
content = content.replace(/handleSaveApiKey\((.*?),\s*(.*?),\s*(.*?),\s*(.*?)\)/g, 'handleSaveApiKey($1, $2, $4)');
content = content.replace(/handleSaveApiKey\("", "", "gemini_sdk", ""\)/, 'handleSaveApiKey("", "", "")');

// In handleOptimizePrompt
content = content.replace(/apiProvider: apiProvider,/g, '');
content = content.replace(/apiProvider === "openai_compatible" && customModel\s*\?\s*customModel\s*:\s*selectedModel/g, 'customModel || selectedModel');

// In the UI, remove API Provider Type select block
content = content.replace(/\{\/\* Choose API Provider Type \*\/\}[\s\S]*?<\/Select>\s*<\/div>/, '');

// Clean up providerInputVal usages in API Key section
content = content.replace(/\{providerInputVal === "gemini_sdk" \? \([\s\S]*?\) : \(/, '(');
content = content.replace(/Get OpenAI Key <ExternalLink className="w-2.5 h-2.5" \/>\s*<\/a>\s*\)/, 'Get OpenAI Key <ExternalLink className="w-2.5 h-2.5" />\n                    </a>');

content = content.replace(/placeholder=\{providerInputVal === "gemini_sdk" \? "AIzaSy\.\.\." : "sk-\.\.\."\}/, 'placeholder="sk-..."');

// Custom endpoint and custom model are now just part of the default BYOK view, remove condition
content = content.replace(/\{providerInputVal === "openai_compatible" && \(/g, '{true && (');

// Remove the default model selector which had Gemini
content = content.replace(/\{\/\* Pick API Model \*\/\}[\s\S]*?<\/Select>\s*<\/div>/, '');

// Remove mentions of Gemini in the UI text
content = content.replace(/Gemini is restructuring sections/g, 'The AI is restructuring sections');

fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log("App.tsx cleaned.");
