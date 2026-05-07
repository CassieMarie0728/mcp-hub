-- Production Schema Migration for MCP Hub
-- This migration sets up all necessary tables, indexes, and constraints

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================================
-- Users & Workspace Management
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer', -- admin, editor, viewer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workspace_id, user_id)
);

-- ============================================================================
-- MCP Servers & Tokens
-- ============================================================================

CREATE TABLE IF NOT EXISTS mcp_servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    server_type VARCHAR(50) NOT NULL, -- github, slack, notion, custom
    status VARCHAR(50) NOT NULL DEFAULT 'disconnected', -- connected, disconnected, error
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
    token_type VARCHAR(50) NOT NULL, -- bearer, api_key, basic
    encrypted_token TEXT NOT NULL,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    masked_token VARCHAR(50), -- Last 4 chars for display
    scopes TEXT[] DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- Workflows & Macros
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    steps JSONB NOT NULL DEFAULT '[]',
    enabled BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, running, success, failed, cancelled
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    error_message TEXT,
    execution_context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    step_index INTEGER NOT NULL,
    step_type VARCHAR(50) NOT NULL, -- tool, condition, loop, parallel
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Webhooks
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    secret VARCHAR(255) NOT NULL,
    events TEXT[] NOT NULL DEFAULT '{}',
    enabled BOOLEAN DEFAULT true,
    rate_limit_per_minute INTEGER DEFAULT 60,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, sent, failed
    attempts INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Analytics & Metrics
-- ============================================================================

CREATE TABLE IF NOT EXISTS execution_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    execution_id UUID REFERENCES workflow_executions(id) ON DELETE SET NULL,
    tool_name VARCHAR(255),
    server_id UUID REFERENCES mcp_servers(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL, -- success, failed, timeout
    duration_ms INTEGER,
    error_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Audit Logging
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Workspaces
CREATE INDEX idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_workspaces_created_at ON workspaces(created_at DESC);

-- Workspace Members
CREATE INDEX idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user_id ON workspace_members(user_id);

-- MCP Servers
CREATE INDEX idx_mcp_servers_workspace_id ON mcp_servers(workspace_id);
CREATE INDEX idx_mcp_servers_server_type ON mcp_servers(server_type);
CREATE INDEX idx_mcp_servers_status ON mcp_servers(status);

-- Tokens
CREATE INDEX idx_tokens_workspace_id ON tokens(workspace_id);
CREATE INDEX idx_tokens_server_id ON tokens(server_id);
CREATE INDEX idx_tokens_token_hash ON tokens(token_hash);
CREATE INDEX idx_tokens_expires_at ON tokens(expires_at);

-- Workflows
CREATE INDEX idx_workflows_workspace_id ON workflows(workspace_id);
CREATE INDEX idx_workflows_created_by ON workflows(created_by);
CREATE INDEX idx_workflows_created_at ON workflows(created_at DESC);
CREATE INDEX idx_workflows_enabled ON workflows(enabled);

-- Workflow Executions
CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_created_at ON workflow_executions(created_at DESC);
CREATE INDEX idx_workflow_executions_completed_at ON workflow_executions(completed_at DESC);

-- Workflow Steps
CREATE INDEX idx_workflow_steps_execution_id ON workflow_steps(execution_id);
CREATE INDEX idx_workflow_steps_status ON workflow_steps(status);

-- Webhooks
CREATE INDEX idx_webhooks_workspace_id ON webhooks(workspace_id);
CREATE INDEX idx_webhooks_enabled ON webhooks(enabled);

-- Webhook Events
CREATE INDEX idx_webhook_events_webhook_id ON webhook_events(webhook_id);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at DESC);

-- Execution Metrics
CREATE INDEX idx_execution_metrics_workspace_id ON execution_metrics(workspace_id);
CREATE INDEX idx_execution_metrics_execution_id ON execution_metrics(execution_id);
CREATE INDEX idx_execution_metrics_server_id ON execution_metrics(server_id);
CREATE INDEX idx_execution_metrics_created_at ON execution_metrics(created_at DESC);
CREATE INDEX idx_execution_metrics_status ON execution_metrics(status);

-- Error Logs
CREATE INDEX idx_error_logs_workspace_id ON error_logs(workspace_id);
CREATE INDEX idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);

-- Audit Logs
CREATE INDEX idx_audit_logs_workspace_id ON audit_logs(workspace_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================================
-- Composite Indexes for Common Queries
-- ============================================================================

CREATE INDEX idx_workflows_workspace_enabled ON workflows(workspace_id, enabled);
CREATE INDEX idx_executions_workflow_status_created ON workflow_executions(workflow_id, status, created_at DESC);
CREATE INDEX idx_metrics_workspace_created ON execution_metrics(workspace_id, created_at DESC);
CREATE INDEX idx_tokens_workspace_server ON tokens(workspace_id, server_id);

-- ============================================================================
-- Constraints & Triggers
-- ============================================================================

-- Update updated_at timestamp on users table
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at_trigger
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();

-- Update updated_at timestamp on workspaces table
CREATE OR REPLACE FUNCTION update_workspaces_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspaces_updated_at_trigger
BEFORE UPDATE ON workspaces
FOR EACH ROW
EXECUTE FUNCTION update_workspaces_updated_at();

-- ============================================================================
-- Initial Data
-- ============================================================================

-- Create default roles (if not exists)
INSERT INTO workspace_members (workspace_id, user_id, role)
SELECT w.id, u.id, 'admin'
FROM workspaces w
JOIN users u ON w.owner_id = u.id
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Partitioning for Large Tables (Optional for very high volume)
-- ============================================================================

-- Partition execution_metrics by date for better performance
-- CREATE TABLE execution_metrics_2026_05 PARTITION OF execution_metrics
--     FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

-- Partition workflow_executions by date
-- CREATE TABLE workflow_executions_2026_05 PARTITION OF workflow_executions
--     FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- View for workspace statistics
CREATE OR REPLACE VIEW workspace_stats AS
SELECT
    w.id,
    w.name,
    COUNT(DISTINCT wm.user_id) as member_count,
    COUNT(DISTINCT wf.id) as workflow_count,
    COUNT(DISTINCT ms.id) as server_count,
    COUNT(DISTINCT we.id) as execution_count
FROM workspaces w
LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
LEFT JOIN workflows wf ON w.id = wf.workspace_id
LEFT JOIN mcp_servers ms ON w.id = ms.workspace_id
LEFT JOIN workflow_executions we ON wf.id = we.workflow_id
GROUP BY w.id, w.name;

-- View for recent executions with details
CREATE OR REPLACE VIEW recent_executions AS
SELECT
    we.id,
    we.workflow_id,
    wf.name as workflow_name,
    we.status,
    we.duration_ms,
    we.created_at,
    we.completed_at,
    COUNT(ws.id) as step_count
FROM workflow_executions we
JOIN workflows wf ON we.workflow_id = wf.id
LEFT JOIN workflow_steps ws ON we.id = ws.execution_id
GROUP BY we.id, we.workflow_id, wf.name, we.status, we.duration_ms, we.created_at, we.completed_at
ORDER BY we.created_at DESC;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Log migration completion
SELECT 'Production schema migration completed successfully' as status;
