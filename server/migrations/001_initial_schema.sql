-- Initial Database Schema for MCP Hub

-- Tokens table
CREATE TABLE IF NOT EXISTS tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  server_id VARCHAR(255) NOT NULL,
  server_type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  encrypted_token TEXT NOT NULL,
  iv VARCHAR(255) NOT NULL,
  auth_tag VARCHAR(255) NOT NULL,
  masked_token VARCHAR(20) NOT NULL,
  scopes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_by VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_server_id (server_id),
  INDEX idx_server_type (server_type),
  INDEX idx_is_active (is_active)
);

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  steps LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_executed TIMESTAMP,
  execution_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- Workflow steps table
CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL,
  step_order INT NOT NULL,
  step_type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  config LONGTEXT,
  next_step_id UUID,
  on_error_step_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
  INDEX idx_workflow_id (workflow_id),
  INDEX idx_step_order (step_order)
);

-- Executions table
CREATE TABLE IF NOT EXISTS executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status VARCHAR(50) NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INT,
  result LONGTEXT,
  is_dry_run BOOLEAN DEFAULT FALSE,
  INDEX idx_workflow_id (workflow_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_started_at (started_at)
);

-- Execution errors table
CREATE TABLE IF NOT EXISTS execution_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL,
  step_id UUID,
  error_message TEXT NOT NULL,
  error_stack LONGTEXT,
  is_recoverable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE,
  INDEX idx_execution_id (execution_id),
  INDEX idx_created_at (created_at)
);

-- Analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  total_executions INT DEFAULT 0,
  successful_executions INT DEFAULT 0,
  failed_executions INT DEFAULT 0,
  total_duration_ms BIGINT DEFAULT 0,
  average_duration_ms INT DEFAULT 0,
  tools_used TEXT,
  servers_used TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_date (date)
);

-- OAuth state table
CREATE TABLE IF NOT EXISTS oauth_states (
  state VARCHAR(255) PRIMARY KEY,
  server_id VARCHAR(255) NOT NULL,
  server_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  INDEX idx_expires_at (expires_at)
);

-- Create indexes for performance
CREATE INDEX idx_tokens_user_server ON tokens(user_id, server_id);
CREATE INDEX idx_workflows_user_active ON workflows(user_id, is_active);
CREATE INDEX idx_executions_user_workflow ON executions(user_id, workflow_id);
CREATE INDEX idx_analytics_user_date ON analytics(user_id, date);
