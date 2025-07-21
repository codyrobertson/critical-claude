#!/usr/bin/env node

/**
 * Interactive Template Generator for Critical Claude
 * Creates custom task templates with guided prompts
 */

import readline from 'readline';
import fs from 'fs/promises';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility function to ask questions
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// TOML string escaping
function escapeToml(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

// Generate TOML array format
function tomlArray(arr) {
  return '[' + arr.map(item => `"${escapeToml(item)}"`).join(', ') + ']';
}

async function main() {
  console.log('🚀 Critical Claude Template Generator');
  console.log('=====================================');
  console.log('This tool will help you create a custom task template with your own fields and phases.\n');

  try {
    // Basic template info
    const templateName = await ask('Template name (lowercase, dash-separated): ');
    if (!templateName.match(/^[a-z0-9-]+$/)) {
      throw new Error('Template name must contain only lowercase letters, numbers, and dashes');
    }

    const displayName = await ask('Display name (human-readable): ');
    const description = await ask('Description: ');
    const author = await ask('Author (optional): ') || 'Critical Claude User';
    const tagsInput = await ask('Tags (comma-separated, optional): ');
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];

    // Custom fields
    console.log('\n📋 Custom Fields Setup');
    console.log('Add custom fields that tasks in your template will have.');
    console.log('Available types: string, text, number, boolean, array, select, date, url');
    
    const customFields = {};
    let addMoreFields = true;

    while (addMoreFields) {
      const fieldName = await ask('\nField name (or press Enter to finish): ');
      if (!fieldName) {
        addMoreFields = false;
        continue;
      }

      console.log('Field types:');
      console.log('  string - Short text (IDs, names)');
      console.log('  text   - Long text (descriptions, specifications)');
      console.log('  number - Numeric values');
      console.log('  boolean - True/false values');
      console.log('  array  - List of strings');
      console.log('  select - Choose from predefined options');
      console.log('  date   - Date values');
      console.log('  url    - URL values');

      const fieldType = await ask('Field type: ');
      const fieldRequired = (await ask('Required? (y/n): ')).toLowerCase() === 'y';
      const fieldDescription = await ask('Description: ');
      const fieldExample = await ask('Example value (optional): ');

      const field = {
        type: fieldType,
        required: fieldRequired,
        description: fieldDescription
      };

      if (fieldExample) field.example = fieldExample;

      // Handle select type options
      if (fieldType === 'select') {
        const optionsInput = await ask('Options (comma-separated): ');
        field.options = optionsInput.split(',').map(o => o.trim());
        const defaultOption = await ask('Default option (optional): ');
        if (defaultOption) field.default = defaultOption;
      }

      // Handle validation
      const addValidation = (await ask('Add validation rules? (y/n): ')).toLowerCase() === 'y';
      if (addValidation) {
        const validation = {};
        
        if (['string', 'text'].includes(fieldType)) {
          const pattern = await ask('Regex pattern (optional): ');
          if (pattern) validation.pattern = pattern;
          
          const minLength = await ask('Minimum length (optional): ');
          if (minLength) validation.minLength = parseInt(minLength);
          
          const maxLength = await ask('Maximum length (optional): ');
          if (maxLength) validation.maxLength = parseInt(maxLength);
        }
        
        if (fieldType === 'number') {
          const min = await ask('Minimum value (optional): ');
          if (min) validation.min = parseFloat(min);
          
          const max = await ask('Maximum value (optional): ');
          if (max) validation.max = parseFloat(max);
        }

        if (Object.keys(validation).length > 0) {
          field.validation = validation;
        }
      }

      customFields[fieldName] = field;
      console.log(`✅ Added field: ${fieldName}`);
    }

    // Variables
    console.log('\n🔧 Template Variables');
    console.log('Variables can be customized when loading the template.');
    
    const variables = {};
    let addMoreVariables = true;

    // Add default variables
    variables.project_prefix = 'TASK';
    variables.default_priority = 'medium';

    while (addMoreVariables) {
      const varName = await ask('\nVariable name (or press Enter to finish): ');
      if (!varName) {
        addMoreVariables = false;
        continue;
      }

      const varValue = await ask('Default value: ');
      variables[varName] = varValue;
      console.log(`✅ Added variable: ${varName} = ${varValue}`);
    }

    // Phases
    console.log('\n📊 Template Phases');
    console.log('Organize your tasks into phases.');
    
    const phases = {};
    let addMorePhases = true;

    // Add default phases
    phases.planning = 'Planning & Analysis';
    phases.implementation = 'Implementation';
    phases.testing = 'Testing & QA';

    const useDefault = (await ask('Use default phases (planning, implementation, testing)? (y/n): ')).toLowerCase() === 'y';
    
    if (!useDefault) {
      Object.keys(phases).forEach(key => delete phases[key]);
      
      while (addMorePhases) {
        const phaseName = await ask('\nPhase name (or press Enter to finish): ');
        if (!phaseName) {
          addMorePhases = false;
          continue;
        }

        const phaseDescription = await ask('Phase description: ');
        phases[phaseName] = phaseDescription;
        console.log(`✅ Added phase: ${phaseName}`);
      }
    }

    // Generate TOML content
    let tomlContent = `# ${displayName}
[metadata]
name = "${templateName}"
displayName = "${escapeToml(displayName)}"
description = "${escapeToml(description)}"
version = "1.0.0"
author = "${escapeToml(author)}"
tags = ${tomlArray(tags)}

`;

    // Add custom fields
    if (Object.keys(customFields).length > 0) {
      tomlContent += '# Custom field definitions\n';
      for (const [fieldName, field] of Object.entries(customFields)) {
        tomlContent += `[fields.${fieldName}]\n`;
        tomlContent += `type = "${field.type}"\n`;
        tomlContent += `required = ${field.required}\n`;
        tomlContent += `description = "${escapeToml(field.description)}"\n`;
        
        if (field.example) {
          if (field.type === 'array') {
            const exampleArray = field.example.split(',').map(s => s.trim());
            tomlContent += `example = ${tomlArray(exampleArray)}\n`;
          } else {
            tomlContent += `example = "${escapeToml(field.example)}"\n`;
          }
        }
        
        if (field.options) {
          tomlContent += `options = ${tomlArray(field.options)}\n`;
        }
        
        if (field.default) {
          tomlContent += `default = "${escapeToml(field.default)}"\n`;
        }
        
        if (field.validation) {
          const validation = [];
          for (const [key, value] of Object.entries(field.validation)) {
            if (typeof value === 'string') {
              validation.push(`${key} = "${escapeToml(value)}"`);
            } else {
              validation.push(`${key} = ${value}`);
            }
          }
          if (validation.length > 0) {
            tomlContent += `validation = { ${validation.join(', ')} }\n`;
          }
        }
        
        tomlContent += '\n';
      }
    }

    // Add variables
    tomlContent += '# Template variables\n[variables]\n';
    for (const [varName, varValue] of Object.entries(variables)) {
      tomlContent += `${varName} = "${escapeToml(varValue)}"\n`;
    }
    tomlContent += '\n';

    // Add phases
    tomlContent += '# Project phases\n[phases]\n';
    for (const [phaseName, phaseDesc] of Object.entries(phases)) {
      tomlContent += `${phaseName} = "${escapeToml(phaseDesc)}"\n`;
    }
    tomlContent += '\n';

    // Add sample tasks
    tomlContent += '# Sample tasks - customize these for your workflow\n';
    let taskCounter = 1;
    for (const [phaseName, phaseDesc] of Object.entries(phases)) {
      tomlContent += `[[tasks.${phaseName}]]\n`;
      tomlContent += `title = "{{project_prefix}}-${taskCounter.toString().padStart(3, '0')}: Sample ${phaseDesc} Task"\n`;
      tomlContent += `description = "Description for ${phaseDesc.toLowerCase()} task"\n`;
      tomlContent += `priority = "{{default_priority}}"\n`;
      tomlContent += `labels = ["${phaseName}", "sample"]\n`;
      tomlContent += `story_points = 3\n`;
      tomlContent += `estimated_hours = 4\n`;
      
      if (taskCounter > 1) {
        tomlContent += `dependencies = ["{{project_prefix}}-${(taskCounter-1).toString().padStart(3, '0')}: Sample ${Object.values(phases)[taskCounter-2]} Task"]\n`;
      }
      
      tomlContent += '\n';
      taskCounter++;
    }

    // Create templates directory if it doesn't exist
    const templatesDir = path.join(process.cwd(), '.critical-claude', 'templates');
    await fs.mkdir(templatesDir, { recursive: true });

    // Write template file
    const templateFile = path.join(templatesDir, `${templateName}.toml`);
    await fs.writeFile(templateFile, tomlContent);

    console.log(`\n✅ Template created successfully!`);
    console.log(`📁 Location: ${templateFile}`);
    console.log(`\n🚀 Next steps:`);
    console.log(`1. Edit the template file to customize the sample tasks`);
    console.log(`2. Test your template: cc task template show ${templateName}`);
    console.log(`3. Load your template: cc task template ${templateName}`);
    console.log(`4. View created tasks: cc task list`);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();