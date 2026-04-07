// In its own file to avoid circular dependencies
export const FILE_EDIT_TOOL_NAME = 'Edit'

// Permission pattern for granting session-level access to the project's .codepilot/ folder
export const codepilot_FOLDER_PERMISSION_PATTERN = '/.codepilot/**'

// Permission pattern for granting session-level access to the global ~/.codepilot/ folder
export const GLOBAL_codepilot_FOLDER_PERMISSION_PATTERN = '~/.codepilot/**'

export const FILE_UNEXPECTEDLY_MODIFIED_ERROR =
  'File has been unexpectedly modified. Read it again before attempting to write it.'
