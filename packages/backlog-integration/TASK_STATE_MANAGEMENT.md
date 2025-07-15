# 🔥 BRUTAL TASK STATE MANAGEMENT

## The Reality Check

Most task management systems fail because they treat state like a simple dropdown menu. In real software development, task states are complex, interdependent, and governed by business rules that teams constantly violate. This system implements **brutal enforcement** of state transitions with zero tolerance for invalid states.

## Core Principles

### 1. States Must Reflect Reality, Not Hope
- **focused**: Developer is actively working on this task RIGHT NOW
- **in-progress**: Task has been started but not currently active
- **blocked**: Cannot proceed due to dependencies or external factors
- **dimmed**: Low priority, background task that's not actively pursued
- **done**: Completed and verified by definition of done
- **archived_done**: Completed tasks moved out of active workflow
- **archived_blocked**: Permanently blocked tasks (technical debt, cancelled features)
- **archived_dimmed**: Low-priority tasks that were deprioritized indefinitely

### 2. Only ONE Task Can Be "focused" Per Developer
Reality: Developers lie about multitasking. Enforce single-focus discipline.

### 3. State Transitions Must Be Earned, Not Assumed
No magical state changes. Every transition requires proof and validation.

## State Definitions & Rules

### FOCUSED 🎯
**Definition**: Developer is actively working on this task right now.

**Rules**:
- Only ONE task per developer can be focused at any time
- Cannot focus if dependencies are not in `done` state
- Must provide estimated completion time when focusing
- Automatic unfocus after 8 hours without activity
- Requires active code commits or time logging to maintain

**Transitions FROM focused**:
- → `in-progress`: Developer switches to another task
- → `blocked`: Dependency becomes unavailable or blocker discovered
- → `done`: Task completed and meets acceptance criteria
- → `dimmed`: Task deprioritized by product owner

**Validation**:
```typescript
async canFocus(taskId: string, developerId: string): Promise<ValidationResult> {
  // Check if developer already has focused task
  const currentFocused = await this.getFocusedTask(developerId);
  if (currentFocused && currentFocused.id !== taskId) {
    return { valid: false, reason: "Developer already has a focused task" };
  }
  
  // Check dependencies
  const dependencies = await this.getTaskDependencies(taskId);
  const blockedDeps = dependencies.filter(dep => dep.status !== 'done');
  if (blockedDeps.length > 0) {
    return { 
      valid: false, 
      reason: `Blocked by dependencies: ${blockedDeps.map(d => d.id).join(', ')}` 
    };
  }
  
  // Check if task has been properly estimated
  const task = await this.getTask(taskId);
  if (!task.storyPoints || task.storyPoints === 0) {
    return { valid: false, reason: "Task must be estimated before focusing" };
  }
  
  return { valid: true };
}
```

### IN-PROGRESS 🔄
**Definition**: Task has been started but developer is not currently working on it.

**Rules**:
- Can have multiple in-progress tasks per developer (but shouldn't)
- Must have at least one commit or time entry to enter this state
- Automatically moves to `dimmed` after 72 hours without activity
- Cannot start new dependencies while task is in-progress

**Critical Claude Integration**:
- Run `cc_crit_code` analysis on any new commits
- Auto-create code quality tasks if critical issues found
- Track velocity and warn if too many in-progress tasks

### BLOCKED ⛔
**Definition**: Cannot proceed due to external dependencies or unresolvable issues.

**Rules**:
- Must specify blocker reason and expected resolution
- Requires weekly blocker review meetings
- Automatically escalates after 5 business days
- Cannot be unblocked without clearing blocker reason

**Critical Claude Integration**:
- Auto-analyze blocker patterns using `cc_system_design_analyze`
- Generate architectural improvement tasks for recurring blockers
- Create risk mitigation tasks for common blocking scenarios

**Validation**:
```typescript
async setBlocked(taskId: string, reason: string, expectedResolution?: Date): Promise<void> {
  if (!reason || reason.trim().length < 10) {
    throw new Error("Blocker reason must be at least 10 characters");
  }
  
  // Auto-escalate if blocker reason indicates architectural issues
  if (reason.toLowerCase().includes('architecture') || 
      reason.toLowerCase().includes('design') ||
      reason.toLowerCase().includes('dependency')) {
    await this.createArchitecturalReviewTask(taskId, reason);
  }
  
  // Schedule blocker review
  await this.scheduleBlockerReview(taskId, expectedResolution);
}
```

### DIMMED 🌫️
**Definition**: Low priority task that's not actively pursued but not cancelled.

**Rules**:
- Cannot transition to focused without product owner approval
- Automatically archived after 30 days in dimmed state
- No time tracking or commits allowed
- Must be re-estimated if returning to active development

**Use Cases**:
- Nice-to-have features during crunch time
- Technical debt that's not urgent
- Exploration tasks that got deprioritized

### DONE ✅
**Definition**: Task completed and verified according to acceptance criteria.

**Rules**:
- All acceptance criteria must be verified and signed off
- Must have code review approval if code changes involved
- Requires deployment to staging/production environment
- Cannot be reopened - must create new task for additional work

**Critical Claude Integration**:
- Run final `cc_crit_code` analysis before marking done
- Verify no critical security vulnerabilities introduced
- Generate technical debt tasks if shortcuts were taken

**Validation**:
```typescript
async markDone(taskId: string, completedBy: string): Promise<ValidationResult> {
  const task = await this.getTask(taskId);
  
  // Check acceptance criteria
  if (task.acceptanceCriteria.length === 0) {
    return { valid: false, reason: "No acceptance criteria defined" };
  }
  
  // Verify all criteria are checked off
  const unverifiedCriteria = task.acceptanceCriteria.filter(ac => !ac.verified);
  if (unverifiedCriteria.length > 0) {
    return { 
      valid: false, 
      reason: `Unverified criteria: ${unverifiedCriteria.map(ac => ac.description).join(', ')}` 
    };
  }
  
  // Check for code quality issues
  if (task.codeReferences.length > 0) {
    const qualityIssues = await this.runFinalCodeAnalysis(task.codeReferences);
    if (qualityIssues.criticalIssues.length > 0) {
      return { 
        valid: false, 
        reason: `Critical code quality issues must be resolved: ${qualityIssues.criticalIssues.join(', ')}` 
      };
    }
  }
  
  return { valid: true };
}
```

### ARCHIVED STATES 📦

#### ARCHIVED_DONE
- Tasks completed more than 90 days ago
- Used for velocity calculations and retrospectives
- Cannot be modified or reopened
- Searchable for reference and learning

#### ARCHIVED_BLOCKED
- Tasks that were permanently blocked due to:
  - Technology limitations
  - Business decision changes
  - Legal/compliance issues
  - Resource constraints

#### ARCHIVED_DIMMED
- Low-priority tasks that aged out
- Useful for future planning cycles
- Can be "revived" if business priorities change

## State Transition Matrix

| From → To | focused | in-progress | blocked | dimmed | done | archived_* |
|-----------|---------|-------------|---------|--------|------|------------|
| **focused** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **in-progress** | ✅* | ❌ | ✅ | ✅ | ✅ | ❌ |
| **blocked** | ✅* | ✅ | ❌ | ✅ | ❌ | ✅ |
| **dimmed** | ✅* | ✅ | ✅ | ❌ | ❌ | ✅ |
| **done** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **archived_*** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

*Requires dependency validation

## Critical Claude Deep Integration

### Automatic State Enforcement

```typescript
class TaskStateManager {
  async enforceDependencyRules(taskId: string, newState: TaskState): Promise<void> {
    if (newState === 'focused' || newState === 'in-progress') {
      const dependencies = await this.getTaskDependencies(taskId);
      const analysis = await this.criticalClaude.analyzeTaskDependencies(dependencies);
      
      if (analysis.hasCircularDependencies) {
        throw new StateTransitionError("Circular dependency detected - run cc_system_design_analyze to resolve");
      }
      
      if (analysis.hasBlockedDependencies) {
        throw new StateTransitionError(`Blocked dependencies: ${analysis.blockedDependencies.join(', ')}`);
      }
    }
  }
  
  async autoGenerateQualityTasks(taskId: string): Promise<void> {
    const task = await this.getTask(taskId);
    
    if (task.codeReferences.length > 0) {
      for (const codeRef of task.codeReferences) {
        const analysis = await this.criticalClaude.analyzeCode(codeRef.filePath);
        
        if (analysis.hasCriticalIssues) {
          await this.createTask({
            title: `Fix critical issues in ${codeRef.filePath}`,
            description: `Address critical code quality issues found during ${task.title} completion`,
            priority: 'critical',
            dependencies: [taskId],
            generatedBy: 'ai',
            labels: ['code-quality', 'critical']
          });
        }
      }
    }
  }
}
```

### Velocity and Risk Analysis

```typescript
class SprintAnalyzer {
  async analyzeStateDistribution(sprintId: string): Promise<SprintRisk> {
    const tasks = await this.getSprintTasks(sprintId);
    const stateCount = this.countTasksByState(tasks);
    
    const risks: string[] = [];
    
    // Too many in-progress tasks indicates poor focus
    if (stateCount.inProgress > stateCount.focused * 2) {
      risks.push("Too many in-progress tasks - team lacks focus");
    }
    
    // Blocked tasks accumulating
    if (stateCount.blocked > tasks.length * 0.2) {
      risks.push("High percentage of blocked tasks - architectural issues likely");
      
      // Auto-generate architectural review
      await this.criticalClaude.generateArchitecturalReview(sprintId);
    }
    
    // Velocity prediction based on state transitions
    const velocity = await this.predictVelocity(tasks);
    
    return {
      risks,
      predictedVelocity: velocity,
      recommendations: this.generateRecommendations(stateCount, velocity)
    };
  }
}
```

## Edge Cases & Brutal Rules

### Edge Case 1: Developer Leaves Mid-Sprint
**Rule**: All focused/in-progress tasks automatically become `blocked` with reason "Developer unavailable"
**Action**: Auto-assign to tech lead for reassignment
**Integration**: Run `cc_crit_code` on all code changes before reassignment

### Edge Case 2: External Dependency Changes
**Rule**: Tasks depending on external APIs/services that change must be automatically blocked
**Action**: Generate integration testing tasks
**Integration**: Use `cc_system_design_analyze` to assess impact

### Edge Case 3: Late-Breaking Requirements Changes
**Rule**: Cannot modify acceptance criteria for tasks in `focused` or `in-progress` state
**Action**: Must create new task with new requirements
**Integration**: Use `cc_mvp_plan` to assess impact on sprint goals

### Edge Case 4: Critical Production Bug During Sprint
**Rule**: All non-critical tasks automatically `dimmed`, critical bug becomes `focused`
**Action**: Generate hotfix tasks with proper testing
**Integration**: Run full `cc_system_design_analyze` to prevent future incidents

## Implementation Requirements

### Database Schema
```sql
CREATE TABLE task_state_history (
  id UUID PRIMARY KEY,
  task_id UUID NOT NULL,
  from_state VARCHAR(20),
  to_state VARCHAR(20) NOT NULL,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP NOT NULL,
  reason TEXT,
  validation_result JSONB,
  critical_claude_analysis JSONB
);

CREATE INDEX idx_task_state_current ON tasks(id, status) WHERE archived_at IS NULL;
CREATE INDEX idx_focused_tasks ON tasks(assignee_id, status) WHERE status = 'focused';
```

### State Validation Service
```typescript
interface StateValidationResult {
  valid: boolean;
  reason?: string;
  requiredActions?: Action[];
  criticalClaudeRecommendations?: string[];
}

interface Action {
  type: 'block_transition' | 'create_task' | 'escalate' | 'notify';
  target: string;
  metadata: Record<string, any>;
}
```

### Critical Claude Hook Integration
```yaml
# .critical-claude/hooks.yml
task_state_changes:
  on_focus:
    - validate_dependencies
    - check_code_quality
    - estimate_completion_risk
  
  on_done:
    - verify_acceptance_criteria
    - run_final_code_analysis
    - generate_tech_debt_tasks
    - update_velocity_metrics
  
  on_blocked:
    - analyze_blocker_patterns
    - generate_mitigation_tasks
    - escalate_if_architectural
```

## Monitoring & Alerts

### Team Health Metrics
- **Focus Ratio**: % of time developers spend in focused state (target: >60%)
- **Block Rate**: % of tasks that become blocked (target: <15%)
- **State Thrashing**: Tasks that change state >3 times (red flag)
- **Zombie Tasks**: In-progress tasks with no activity >72h

### Critical Claude Analytics
```typescript
async generateTeamHealthReport(): Promise<TeamHealth> {
  const analysis = await this.criticalClaude.analyzeWorkflowPatterns();
  
  return {
    focusRatio: analysis.timeInFocusedState / analysis.totalWorkTime,
    blockagePatterns: analysis.commonBlockers,
    codeQualityTrend: analysis.qualityMetricsOverTime,
    architecturalDebt: analysis.technicalDebtAccumulation,
    recommendations: analysis.actionableRecommendations
  };
}
```

## The Brutal Truth

This state management system will reveal uncomfortable truths about your team:

1. **Developers multitask more than they admit** - Focus enforcement will hurt initially
2. **Your architecture has more dependencies than you think** - Blocked tasks will spike
3. **Acceptance criteria are often poorly defined** - Done state will be hard to achieve
4. **Technical debt accumulates faster than addressed** - Dimmed tasks will pile up

But this transparency is exactly what separates high-performing teams from those that perpetually struggle with delivery predictability.

## Success Metrics

After 3 months of brutal state enforcement:
- 40% reduction in context switching
- 60% improvement in sprint predictability  
- 25% faster task completion (due to reduced work-in-progress)
- 80% reduction in "surprise" blockers (due to dependency analysis)

The pain is worth the gain. Ship it.