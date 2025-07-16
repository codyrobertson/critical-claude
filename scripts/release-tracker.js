#!/usr/bin/env node

/**
 * Critical Claude Release Tracker
 * Tracks and manages releases, updates documentation, and publishes packages
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ReleaseTracker {
  constructor() {
    this.packagePath = path.join(__dirname, '../package.json');
    this.changelogPath = path.join(__dirname, '../CHANGELOG.md');
    this.docsPath = path.join(__dirname, '../docs');
    this.pkg = require(this.packagePath);
  }

  async getCurrentVersion() {
    return this.pkg.version;
  }

  async getLastTag() {
    try {
      return execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
    } catch (error) {
      return null;
    }
  }

  async generateChangelog() {
    const lastTag = await this.getLastTag();
    const command = lastTag 
      ? `git log --oneline --pretty=format:"- %s" ${lastTag}..HEAD`
      : 'git log --oneline --pretty=format:"- %s"';
    
    try {
      const changes = execSync(command, { encoding: 'utf8' }).trim();
      return changes;
    } catch (error) {
      return 'No changes found';
    }
  }

  async updateChangelog(version, changes) {
    const date = new Date().toISOString().split('T')[0];
    const newEntry = `## [${version}] - ${date}\n\n${changes}\n\n`;
    
    if (fs.existsSync(this.changelogPath)) {
      const existingChangelog = fs.readFileSync(this.changelogPath, 'utf8');
      const updatedChangelog = `# Changelog\n\n${newEntry}${existingChangelog.replace(/^# Changelog\n\n/, '')}`;
      fs.writeFileSync(this.changelogPath, updatedChangelog);
    } else {
      fs.writeFileSync(this.changelogPath, `# Changelog\n\n${newEntry}`);
    }
  }

  async updateDocumentation(version) {
    const indexPath = path.join(this.docsPath, 'index.html');
    const installationPath = path.join(__dirname, '../INSTALLATION.md');
    
    if (fs.existsSync(indexPath)) {
      let content = fs.readFileSync(indexPath, 'utf8');
      content = content.replace(
        /npm install -g critical-claude.*/g,
        `npm install -g critical-claude # Latest: ${version}`
      );
      fs.writeFileSync(indexPath, content);
    }
    
    if (fs.existsSync(installationPath)) {
      let content = fs.readFileSync(installationPath, 'utf8');
      content = content.replace(
        /npm install -g critical-claude.*/g,
        `npm install -g critical-claude # Latest: ${version}`
      );
      fs.writeFileSync(installationPath, content);
    }
  }

  async createReleaseInfo(version, changes) {
    const releaseInfo = {
      version,
      release_date: new Date().toISOString(),
      changelog: changes,
      github_packages: {
        'critical-claude': 'https://github.com/critical-claude/critical-claude/pkgs/npm/critical-claude',
        'backlog-integration': 'https://github.com/critical-claude/critical-claude/pkgs/npm/backlog-integration'
      },
      npm_packages: {
        'critical-claude': 'https://www.npmjs.com/package/critical-claude',
        'backlog-integration': 'https://www.npmjs.com/package/@critical-claude/backlog-integration'
      },
      installation: {
        npm: 'npm install -g critical-claude',
        github: 'npm install -g @critical-claude/critical-claude --registry=https://npm.pkg.github.com'
      },
      docker: {
        image: `ghcr.io/critical-claude/critical-claude:${version}`,
        latest: 'ghcr.io/critical-claude/critical-claude:latest'
      }
    };
    
    const releaseDir = path.join(__dirname, '../dist/releases');
    if (!fs.existsSync(releaseDir)) {
      fs.mkdirSync(releaseDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(releaseDir, `${version}.json`),
      JSON.stringify(releaseInfo, null, 2)
    );
    
    // Update latest.json
    fs.writeFileSync(
      path.join(releaseDir, 'latest.json'),
      JSON.stringify(releaseInfo, null, 2)
    );
    
    return releaseInfo;
  }

  async publishRelease(type = 'patch') {
    console.log(`🚀 Starting ${type} release...`);
    
    // Generate changelog
    const changes = await this.generateChangelog();
    console.log('📝 Generated changelog');
    
    // Bump version
    execSync(`npm version ${type}`, { stdio: 'inherit' });
    const newVersion = require(this.packagePath).version;
    console.log(`📦 Bumped version to ${newVersion}`);
    
    // Update changelog
    await this.updateChangelog(newVersion, changes);
    console.log('📚 Updated changelog');
    
    // Update documentation
    await this.updateDocumentation(newVersion);
    console.log('📖 Updated documentation');
    
    // Create release info
    const releaseInfo = await this.createReleaseInfo(newVersion, changes);
    console.log('ℹ️  Created release info');
    
    // Commit changes
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "chore: Release ${newVersion}"`, { stdio: 'inherit' });
    
    // Create and push tag
    execSync(`git tag v${newVersion}`, { stdio: 'inherit' });
    execSync('git push --follow-tags', { stdio: 'inherit' });
    
    console.log(`✅ Release ${newVersion} completed!`);
    console.log('📊 Release Info:', JSON.stringify(releaseInfo, null, 2));
    
    return releaseInfo;
  }

  async checkPackageStatus() {
    const currentVersion = await this.getCurrentVersion();
    
    // Check npm registry
    let npmStatus = 'Unknown';
    try {
      execSync(`npm view critical-claude@${currentVersion} version`, { encoding: 'utf8' });
      npmStatus = 'Published';
    } catch (error) {
      npmStatus = 'Not Published';
    }
    
    // Check GitHub registry
    let githubStatus = 'Unknown';
    try {
      execSync(`npm view @critical-claude/critical-claude@${currentVersion} version --registry=https://npm.pkg.github.com`, { encoding: 'utf8' });
      githubStatus = 'Published';
    } catch (error) {
      githubStatus = 'Not Published';
    }
    
    const status = {
      version: currentVersion,
      npm: npmStatus,
      github: githubStatus,
      docker: 'Check manually at ghcr.io/critical-claude/critical-claude',
      github_url: 'https://github.com/critical-claude/critical-claude/releases',
      npm_url: 'https://www.npmjs.com/package/critical-claude',
      docker_url: 'https://ghcr.io/critical-claude/critical-claude'
    };
    
    console.log('📊 Package Status:', JSON.stringify(status, null, 2));
    return status;
  }
}

// CLI Interface
async function main() {
  const tracker = new ReleaseTracker();
  const command = process.argv[2];
  
  switch (command) {
    case 'patch':
      await tracker.publishRelease('patch');
      break;
    case 'minor':
      await tracker.publishRelease('minor');
      break;
    case 'major':
      await tracker.publishRelease('major');
      break;
    case 'status':
      await tracker.checkPackageStatus();
      break;
    case 'changelog':
      const changes = await tracker.generateChangelog();
      console.log('📝 Recent changes:');
      console.log(changes);
      break;
    default:
      console.log(`
🚀 Critical Claude Release Tracker

Usage:
  node scripts/release-tracker.js <command>

Commands:
  patch     - Create a patch release (1.0.0 -> 1.0.1)
  minor     - Create a minor release (1.0.0 -> 1.1.0)
  major     - Create a major release (1.0.0 -> 2.0.0)
  status    - Check package publication status
  changelog - Generate changelog from git history

Examples:
  node scripts/release-tracker.js patch
  node scripts/release-tracker.js status
  node scripts/release-tracker.js changelog
`);
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ReleaseTracker;