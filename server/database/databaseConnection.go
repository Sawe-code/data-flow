package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	_ "modernc.org/sqlite"
)

var DB *sql.DB

func ConnectDB() {
	if err := godotenv.Load(".env"); err != nil {
		log.Println("Warning: .env file not found")
	}

	dbPath := os.Getenv("SQLITE_PATH")
	if dbPath == "" {
		dbPath = "data-pilot.db"
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatal("SQLite connection failed:", err)
	}

	if err := db.Ping(); err != nil {
		log.Fatal("SQLite ping failed:", err)
	}

	DB = db

	if err := createTables(); err != nil {
		log.Fatal("SQLite migration failed:", err)
	}

	fmt.Println("Connected to SQLite:", dbPath)
}

func createTables() error {
	queries := []string{
		`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			email TEXT NOT NULL UNIQUE,
			password TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
		`,
		`
		CREATE TABLE IF NOT EXISTS analyses (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id TEXT NOT NULL,
			file_name TEXT,
			total_rows INTEGER NOT NULL DEFAULT 0,
			clean_rows INTEGER NOT NULL DEFAULT 0,
			invalid_rows INTEGER NOT NULL DEFAULT 0,
			duplicates_removed INTEGER NOT NULL DEFAULT 0,
			cleaned_data TEXT NOT NULL DEFAULT '[]',
			invalid_data TEXT NOT NULL DEFAULT '[]',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
		`,
	}

	for _, query := range queries {
		if _, err := DB.Exec(query); err != nil {
			return err
		}
	}

	analysisColumns := map[string]string{
		"column_profiles": "TEXT NOT NULL DEFAULT '[]'",
		"chart_data":      "TEXT NOT NULL DEFAULT '{}'",
		"insights":        "TEXT NOT NULL DEFAULT '[]'",
	}

	for columnName, definition := range analysisColumns {
		exists, err := columnExists("analyses", columnName)
		if err != nil {
			return err
		}

		if !exists {
			if _, err := DB.Exec(fmt.Sprintf("ALTER TABLE analyses ADD COLUMN %s %s", columnName, definition)); err != nil {
				return err
			}
		}
	}

	return nil
}

func columnExists(tableName string, columnName string) (bool, error) {
	rows, err := DB.Query(fmt.Sprintf("PRAGMA table_info(%s)", tableName))
	if err != nil {
		return false, err
	}
	defer rows.Close()

	for rows.Next() {
		var cid int
		var name string
		var columnType string
		var notNull int
		var defaultValue sql.NullString
		var pk int

		if err := rows.Scan(&cid, &name, &columnType, &notNull, &defaultValue, &pk); err != nil {
			return false, err
		}

		if name == columnName {
			return true, nil
		}
	}

	if err := rows.Err(); err != nil {
		return false, err
	}

	return false, nil
}
