export interface Permission {
  group_id?: number;
  table_name?: string;
  column_name?: string;
  create_permission?: boolean;
  read_permission?: boolean;
  update_permission?: boolean;
  delete_permission?: boolean;
}

// associative table
export interface UsersUserGroup {
  user_id?: number;
  group_id?: number;
}

export interface UserGroup {
  id?: number;
  group_name?: string;
}

export interface User {
  id?: number;
  email?: string;
}

export interface PermissionQueryResult {
  column_name: string;
  create_permission?: boolean;
  read_permission?: boolean;
  update_permission?: boolean;
  delete_permission?: boolean;
}
