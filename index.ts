import express, { Request, Response, NextFunction } from "express";

import { Sequelize, QueryTypes } from "sequelize";
import { PermissionQueryResult } from "./types";

const router = express.Router();
let connection: Sequelize;

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
    permissions: PermissionQueryResult[];
  }
}

type User = {
  id: number;
  email: string;
};

function expressMethodToMySQLOperation(expressMethod: string): string | null {
  switch (expressMethod.toUpperCase()) {
    case "GET":
      return "read";
    case "POST":
      return "create";
    case "PUT":
      return "update";
    case "DELETE":
      return "delete";
    default:
      return null; // Return null for unsupported methods
  }
}

// Middleware for checking permissions
export async function checkPermission(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { user, params } = req;
    const { entityType, entityId } = params;
    const action = req.method; // Assuming HTTP verb matches the action

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    console.log({ user, params, action });

    const user_id = user.id;

    const operation = expressMethodToMySQLOperation(action);

    // Query the database for user access permissions
    const query = `
        SELECT p.column_name, p.${operation}_permission
        FROM permissions p
        JOIN users_user_groups ug ON p.group_id = ug.group_id
        WHERE ug.user_id = ? AND table_name = ?;
    `;

    const results: PermissionQueryResult[] = await connection.query(query, {
      replacements: [user_id, entityType],
      type: QueryTypes.SELECT,
    });

    // If no matching permission found, deny access
    if (results.length === 0) {
      return res.status(403).json({ message: "Permission denied." });
    }

    // Store the permissions in req.permissions
    req.permissions = results;

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Error checking permission:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function getAuth(req: Request, res: Response, next: Function) {
  try {
    req.user = {
      id: 1,
      email: "user@example.com",
    };
    next();
  } catch (error) {
    console.error(`Error checking user creds:`, error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Generic route to create a new record
router.post(
  "/:entityType",
  getAuth,
  checkPermission,
  async (req: Request, res: Response) => {
    const { entityType } = req.params;
    const userPermissions = req.permissions;

    // Check if the requested entity has corresponding permissions
    if (!userPermissions) {
      return res.status(403).json({
        error: "Access denied. User does not have permission for this entity.",
      });
    }

    console.log({ body: req.body });

    // Assuming the request body contains an object with fields to create
    const requestBody = req.body;

    // Filter out fields that the user doesn't have create permission for
    const allowedFields = Object.keys(requestBody).filter((field) => {
      const columnPermission = userPermissions.find(
        (col: any) => col.column_name === field
      );
      return columnPermission && columnPermission.create_permission;
    });

    if (allowedFields.length === 0) {
      return res.status(403).json({
        error: "Invalid post body.",
      });
    }

    // Generate the SQL statement for INSERT or UPDATE based on the HTTP method
    let query = `INSERT INTO ${entityType} (${allowedFields.join(
      ", "
    )}) VALUES (?)`;

    const values = allowedFields.map((field) => requestBody[field]);

    try {
      const [createdId, rowsCreated] = await connection.query(query, {
        replacements: values,
        type: QueryTypes.INSERT,
      });

      if (rowsCreated > 0) {
        res.json({ message: "Record created successfully.", data: createdId });
      } else {
        res.status(404).json({ error: "Record not found." });
      }
    } catch (error: any) {
      if (error.errors) {
        const errors = error.errors.map((err: any) => err.message);
        return res.status(400).json({ error: errors });
      }

      console.log({ ERROR: error });
      console.error(error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

// Generic route to retrieve all records of entity
router.get(
  "/:entityType",
  getAuth,
  checkPermission,
  async (req: Request, res: Response) => {
    const { entityType } = req.params;
    const userPermissions = req.permissions;

    // Check if the requested entity has corresponding permissions
    if (!userPermissions) {
      return res.status(403).json({
        error: "Access denied. User does not have permission for this entity.",
      });
    }

    // Filter columns based on read_permission
    const columnsToSelect = userPermissions
      .filter((col: any) => col.read_permission)
      .map((col: any) => col.column_name);

    if (columnsToSelect.length === 0) {
      return res.status(403).json({
        error:
          "Access denied. User does not have read permission for any column.",
      });
    }

    const selectQuery = `SELECT ${columnsToSelect.join(
      ", "
    )} FROM ${entityType}`;

    try {
      const results = await connection.query(selectQuery, {
        // replacements: [...columnsToSelect],
        type: QueryTypes.SELECT,
      });

      res.json({ data: results });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

// // Generic route to retrieve a record by ID
router.get(
  "/:entityType/:entityId",
  getAuth,
  checkPermission,
  async (req: Request, res: Response) => {
    const { entityType, entityId } = req.params;
    const userPermissions = req.permissions;

    // Check if the requested entity has corresponding permissions
    if (!userPermissions) {
      return res.status(403).json({
        error: "Access denied. User does not have permission for this entity.",
      });
    }

    // Filter columns based on read_permission
    const columnsToSelect = userPermissions
      .filter((col: any) => col.read_permission)
      .map((col: any) => col.column_name);

    if (columnsToSelect.length === 0) {
      return res.status(403).json({
        error:
          "Access denied. User does not have read permission for any column.",
      });
    }

    const selectQuery = `SELECT ${columnsToSelect.join(
      ", "
    )} FROM ${entityType} WHERE id = ?`;

    try {
      const replacements = [parseInt(entityId, 10)];
      console.log({ replacements });

      const results = await connection.query(selectQuery, {
        replacements,
        type: QueryTypes.SELECT,
      });

      res.json({ data: results[0] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

// Generic route to update a record by ID
router.put(
  "/:entityType/:entityId",
  getAuth,
  checkPermission,
  async (req: Request, res: Response) => {
    const { entityType, entityId } = req.params;

    const userPermissions = req.permissions;

    // Check if the requested entity has corresponding permissions
    if (!userPermissions) {
      return res.status(403).json({
        error: "Access denied. User does not have permission for this entity.",
      });
    }

    // Assuming the request body contains an object with fields to create or update
    const requestBody = req.body;

    // Filter out fields that the user doesn't have create or update permission for
    const allowedFields = Object.keys(requestBody).filter((field) => {
      const columnPermission = userPermissions.find(
        (col: any) => col.column_name === field
      );
      return columnPermission && columnPermission.update_permission;
    });

    if (allowedFields.length === 0) {
      return res.status(403).json({
        error:
          "Access denied. User does not have permission to update any of these fields.",
      });
    }

    const setClause = allowedFields.map((field) => `${field} = ?`).join(", ");
    const query = `UPDATE ${entityType} SET ${setClause} WHERE id = ?`;

    const values = allowedFields.map((field) => requestBody[field]);
    values.push(entityId);

    try {
      const [, updatedRows] = await connection.query(query, {
        replacements: values,
        type: QueryTypes.UPDATE,
      });

      if (updatedRows > 0) {
        res.json({ message: "Record updated successfully." });
      } else {
        res.status(400).json({ error: "Nothing to update" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

// Generic route to delete a record by ID
router.delete(
  "/:entityType/:entityId",
  getAuth,
  checkPermission,
  async (req: Request, res: Response) => {
    const { entityType, entityId } = req.params;
    const userPermissions = req.permissions;

    // Check if the requested entity has corresponding permissions
    if (!userPermissions) {
      return res.status(403).json({
        error: "Access denied. User does not have permission for this entity.",
      });
    }
    // Check if the user has delete permission for all columns
    const canDeleteAllColumns = userPermissions.every(
      (col: any) => col.delete_permission
    );

    if (!canDeleteAllColumns) {
      return res.status(403).json({
        error:
          "Access denied. User does not have delete permission for all columns.",
      });
    }

    const deleteQuery = `DELETE FROM ${entityType} WHERE id = ?`;

    try {
      // no result for DELETE query
      await connection.query(deleteQuery, {
        replacements: [entityId],
        type: QueryTypes.DELETE,
      });

      res.json({ message: "Record deleted successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

const app = express();
app.use(express.json());

app.use(router);

app.listen(3000, async () => {
  try {
    if (
      !process.env.MYSQL_DB ||
      !process.env.MYSQL_USER ||
      !process.env.MYSQL_PASS ||
      !process.env.MYSQL_HOST
    ) {
      throw new Error("MYSQL_DB not set");
    }

    connection = new Sequelize(
      process.env.MYSQL_DB,
      process.env.MYSQL_USER,
      process.env.MYSQL_PASS,
      {
        host: process.env.MYSQL_HOST,
        dialect: "mysql",
      }
    );

    console.log("Server started on port 3000");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
});
