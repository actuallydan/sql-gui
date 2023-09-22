-- Users table (lowercase and plural)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE
);

-- Groups table (lowercase and plural)
CREATE TABLE user_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL UNIQUE
);

-- Associative table for users in groups (many-to-many)
CREATE TABLE users_user_groups (
    user_id INT,
    group_id INT,
    PRIMARY KEY (user_id, group_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (group_id) REFERENCES user_groups(id)
);

-- Permissions table (lowercase and plural)
CREATE TABLE permissions (
    group_id INT,
    table_name VARCHAR(255) NOT NULL,
    column_name VARCHAR(255) NOT NULL,
    create_permission BOOLEAN DEFAULT FALSE,
    read_permission BOOLEAN DEFAULT FALSE,
    update_permission BOOLEAN DEFAULT FALSE,
    delete_permission BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (group_id, table_name, column_name),
    FOREIGN KEY (group_id) REFERENCES user_groups(id)
);



-- Insert a new user into the 'users' table
INSERT INTO users (email) VALUES ('user@example.com');

-- Insert a new group into the 'groups' table
INSERT INTO user_groups (group_name) VALUES ('admin');

-- Insert a record into the 'users_user_groups' table to associate the user with the 'admin' group
INSERT INTO users_user_groups (user_id, group_id) VALUES (
    (SELECT id FROM users WHERE email = 'user@example.com'),
    (SELECT id FROM user_groups WHERE group_name = 'admin')
);


# function generateStatements(table, fields=[], groupID){
#     return fields.map(f => (
#         `INSERT INTO permissions (group_id, table_name, column_name, create_permission, read_permission, update_permission, delete_permission) VALUES (
#     '${groupID}',
#     '${table}',
#     '${f}',
#     TRUE,
#     TRUE,
#     TRUE,
#     TRUE
# );`
#     )).join(`
# `)
# }
-- Grant complete permissions for each column of the 'users' table to the 'admin' group
INSERT INTO permissions (group_id, table_name, column_name, create_permission, read_permission, update_permission, delete_permission) VALUES (
    (SELECT id FROM user_groups WHERE group_name = 'admin'),
    'users',
    'id',
    TRUE,
    TRUE,
    TRUE,
    TRUE
);

INSERT INTO permissions (group_id, table_name, column_name, create_permission, read_permission, update_permission, delete_permission) VALUES (
    (SELECT id FROM user_groups WHERE group_name = 'admin'),
    'users',
    'email',
    TRUE,
    TRUE,
    TRUE,
    TRUE
);


-- Retrieve permissions for a specific group and table
SELECT * FROM permissions
WHERE group_id = (SELECT id FROM user_groups WHERE group_name = 'admin')
AND table_name = 'users';


-- Get all permissions for user
SELECT p.*
FROM permissions p
JOIN users_user_groups ug ON p.group_id = ug.group_id
WHERE ug.user_id = 1;


-- Get all permissions for user for table
SELECT p.*
FROM permissions p
JOIN users_user_groups ug ON p.group_id = ug.group_id
WHERE ug.user_id = 1 and table_name = 'users';

-- Grant complete permissions for each column of the 'permissions' table to the 'admin' group
INSERT INTO permissions (group_id, table_name, column_name, create_permission, read_permission, update_permission, delete_permission) VALUES (
    '1',
    'permissions',
    'group_id',
    TRUE,
    TRUE,
    TRUE,
    TRUE
);
INSERT INTO permissions (group_id, table_name, column_name, create_permission, read_permission, update_permission, delete_permission) VALUES (
    '1',
    'permissions',
    'table_name',
    TRUE,
    TRUE,
    TRUE,
    TRUE
);
INSERT INTO permissions (group_id, table_name, column_name, create_permission, read_permission, update_permission, delete_permission) VALUES (
    '1',
    'permissions',
    'column_name',
    TRUE,
    TRUE,
    TRUE,
    TRUE
);
INSERT INTO permissions (group_id, table_name, column_name, create_permission, read_permission, update_permission, delete_permission) VALUES (
    '1',
    'permissions',
    'create_permission',
    TRUE,
    TRUE,
    TRUE,
    TRUE
);
INSERT INTO permissions (group_id, table_name, column_name, create_permission, read_permission, update_permission, delete_permission) VALUES (
    '1',
    'permissions',
    'read_permission',
    TRUE,
    TRUE,
    TRUE,
    TRUE
);
INSERT INTO permissions (group_id, table_name, column_name, create_permission, read_permission, update_permission, delete_permission) VALUES (
    '1',
    'permissions',
    'update_permission',
    TRUE,
    TRUE,
    TRUE,
    TRUE
);
INSERT INTO permissions (group_id, table_name, column_name, create_permission, read_permission, update_permission, delete_permission) VALUES (
    '1',
    'permissions',
    'delete_permission',
    TRUE,
    TRUE,
    TRUE,
    TRUE
);



-- Grant complete permissions for each column of the 'groups' table to the 'admin' group
INSERT INTO permissions (group_id, table_name, column_name, create_permission, read_permission, update_permission, delete_permission) VALUES (
    '1',
    'user_groups',
    'id',
    TRUE,
    TRUE,
    TRUE,
    TRUE
);
INSERT INTO permissions (group_id, table_name, column_name, create_permission, read_permission, update_permission, delete_permission) VALUES (
    '1',
    'user_groups',
    'group_name',
    TRUE,
    TRUE,
    TRUE,
    TRUE
);



-- get columns from table
show columns  from users;


SELECT p.column_name, p.read_permission
FROM permissions p
JOIN users_user_groups ug ON p.group_id = ug.group_id
WHERE ug.user_id = 1 and table_name = 'users';

SELECT email, id FROM users;