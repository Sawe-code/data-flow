package controllers

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/Sawe-code/data_flow/server/database"
	"github.com/gin-gonic/gin"
	"github.com/go-sql-driver/mysql"
	_ "github.com/lib/pq"
	_ "modernc.org/sqlite"
)

type savedDatabaseConnection struct {
	ID           int64     `json:"id"`
	UserID       string    `json:"userId,omitempty"`
	Name         string    `json:"name"`
	Driver       string    `json:"driver"`
	Host         string    `json:"host,omitempty"`
	Port         string    `json:"port,omitempty"`
	DatabaseName string    `json:"databaseName"`
	Username     string    `json:"username,omitempty"`
	Password     string    `json:"password,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
}

type importSavedDatabaseRequest struct {
	Table string `json:"table"`
}

func SaveDatabaseConnection(c *gin.Context) {
	userEmail, ok := authenticatedEmail(c)
	if !ok {
		return
	}

	var input savedDatabaseConnection
	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid database setup"})
		return
	}

	input.Name = strings.TrimSpace(input.Name)
	input.Driver = strings.ToLower(strings.TrimSpace(input.Driver))
	input.Host = strings.TrimSpace(input.Host)
	input.Port = strings.TrimSpace(input.Port)
	input.DatabaseName = strings.TrimSpace(input.DatabaseName)
	input.Username = strings.TrimSpace(input.Username)

	if input.Name == "" || input.Driver == "" || input.DatabaseName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Connection name, database type, and database name are required"})
		return
	}

	if input.Driver != "sqlite" {
		if input.Host == "" || input.Port == "" || input.Username == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Host, port, and username are required for server databases"})
			return
		}
	}

	if !isSupportedDatabaseDriver(input.Driver) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Supported database types are SQLite, PostgreSQL, and MySQL"})
		return
	}

	encryptedPassword, err := encryptDatabasePassword(input.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to secure database password"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := database.DB.ExecContext(
		ctx,
		`
		INSERT INTO database_connections (
			user_id,
			name,
			driver,
			host,
			port,
			database_name,
			username,
			password
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`,
		userEmail,
		input.Name,
		input.Driver,
		input.Host,
		input.Port,
		input.DatabaseName,
		input.Username,
		encryptedPassword,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save database setup"})
		return
	}

	id, _ := result.LastInsertId()
	c.JSON(http.StatusOK, gin.H{
		"message": "Database setup saved successfully",
		"id":      id,
	})
}

func GetDatabaseConnections(c *gin.Context) {
	userEmail, ok := authenticatedEmail(c)
	if !ok {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := database.DB.QueryContext(
		ctx,
		`
		SELECT id, name, driver, host, port, database_name, username, created_at
		FROM database_connections
		WHERE user_id = ?
		ORDER BY created_at DESC
		`,
		userEmail,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load database setups"})
		return
	}
	defer rows.Close()

	connections := []savedDatabaseConnection{}
	for rows.Next() {
		var connection savedDatabaseConnection
		if err := rows.Scan(
			&connection.ID,
			&connection.Name,
			&connection.Driver,
			&connection.Host,
			&connection.Port,
			&connection.DatabaseName,
			&connection.Username,
			&connection.CreatedAt,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read database setup"})
			return
		}

		connections = append(connections, connection)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to finish loading database setups"})
		return
	}

	c.JSON(http.StatusOK, connections)
}

func GetSavedDatabaseTables(c *gin.Context) {
	connection, ok := loadUserDatabaseConnection(c)
	if !ok {
		return
	}

	externalDB, err := openSavedDatabase(connection)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to connect to saved database setup"})
		return
	}
	defer externalDB.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	tables, err := savedDatabaseTableNames(ctx, externalDB, connection.Driver)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to load tables from saved database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"tables": tables})
}

func ImportSavedDatabaseTable(c *gin.Context) {
	connection, ok := loadUserDatabaseConnection(c)
	if !ok {
		return
	}

	var input importSavedDatabaseRequest
	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid database import request"})
		return
	}

	tableName := strings.TrimSpace(input.Table)
	if tableName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Database table is required"})
		return
	}

	externalDB, err := openSavedDatabase(connection)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to connect to saved database setup"})
		return
	}
	defer externalDB.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	tables, err := savedDatabaseTableNames(ctx, externalDB, connection.Driver)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to validate database table"})
		return
	}

	if !containsString(tables, tableName) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Select a valid table from this database setup"})
		return
	}

	records, err := recordsFromSavedDatabaseTable(ctx, externalDB, connection.Driver, tableName)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := analyzeRecords(records, "database-"+connection.Name+"-"+tableName)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func authenticatedEmail(c *gin.Context) (string, bool) {
	email, exists := c.Get("email")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return "", false
	}

	userEmail, ok := email.(string)
	if !ok || userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authenticated user"})
		return "", false
	}

	return userEmail, true
}

func loadUserDatabaseConnection(c *gin.Context) (savedDatabaseConnection, bool) {
	userEmail, ok := authenticatedEmail(c)
	if !ok {
		return savedDatabaseConnection{}, false
	}

	connectionID := strings.TrimSpace(c.Param("id"))
	if connectionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Database setup id is required"})
		return savedDatabaseConnection{}, false
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var connection savedDatabaseConnection
	err := database.DB.QueryRowContext(
		ctx,
		`
		SELECT id, user_id, name, driver, host, port, database_name, username, password, created_at
		FROM database_connections
		WHERE id = ? AND user_id = ?
		`,
		connectionID,
		userEmail,
	).Scan(
		&connection.ID,
		&connection.UserID,
		&connection.Name,
		&connection.Driver,
		&connection.Host,
		&connection.Port,
		&connection.DatabaseName,
		&connection.Username,
		&connection.Password,
		&connection.CreatedAt,
	)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Database setup not found"})
		return savedDatabaseConnection{}, false
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load database setup"})
		return savedDatabaseConnection{}, false
	}

	password, err := decryptDatabasePassword(connection.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unlock database password"})
		return savedDatabaseConnection{}, false
	}
	connection.Password = password

	return connection, true
}

func openSavedDatabase(connection savedDatabaseConnection) (*sql.DB, error) {
	var (
		driverName string
		dsn        string
	)

	switch connection.Driver {
	case "sqlite":
		driverName = "sqlite"
		dsn = connection.DatabaseName
	case "postgres":
		driverName = "postgres"
		connectionURL := url.URL{
			Scheme: "postgres",
			User:   url.UserPassword(connection.Username, connection.Password),
			Host:   connection.Host + ":" + connection.Port,
			Path:   connection.DatabaseName,
		}
		values := connectionURL.Query()
		values.Set("sslmode", "disable")
		connectionURL.RawQuery = values.Encode()
		dsn = connectionURL.String()
	case "mysql":
		driverName = "mysql"
		config := mysql.NewConfig()
		config.User = connection.Username
		config.Passwd = connection.Password
		config.Net = "tcp"
		config.Addr = connection.Host + ":" + connection.Port
		config.DBName = connection.DatabaseName
		config.ParseTime = true
		dsn = config.FormatDSN()
	default:
		return nil, fmt.Errorf("unsupported database type")
	}

	externalDB, err := sql.Open(driverName, dsn)
	if err != nil {
		return nil, err
	}

	if err := externalDB.Ping(); err != nil {
		externalDB.Close()
		return nil, err
	}

	return externalDB, nil
}

func savedDatabaseTableNames(ctx context.Context, externalDB *sql.DB, driver string) ([]string, error) {
	query := tableListQuery(driver)

	rows, err := externalDB.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tables := []string{}
	for rows.Next() {
		var tableName string
		if err := rows.Scan(&tableName); err != nil {
			return nil, err
		}
		if isSafeSavedDatabaseTable(tableName) {
			tables = append(tables, tableName)
		}
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return tables, nil
}

func isSafeSavedDatabaseTable(tableName string) bool {
	switch strings.ToLower(strings.TrimSpace(tableName)) {
	case "", "users", "database_connections":
		return false
	default:
		return true
	}
}

func tableListQuery(driver string) string {
	switch driver {
	case "postgres":
		return `
			SELECT table_name
			FROM information_schema.tables
			WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
			ORDER BY table_name
		`
	case "mysql":
		return `
			SELECT table_name
			FROM information_schema.tables
			WHERE table_schema = DATABASE()
			ORDER BY table_name
		`
	default:
		return `
			SELECT name
			FROM sqlite_master
			WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
			ORDER BY name
		`
	}
}

func recordsFromSavedDatabaseTable(ctx context.Context, externalDB *sql.DB, driver string, tableName string) ([][]string, error) {
	rows, err := externalDB.QueryContext(ctx, fmt.Sprintf("SELECT * FROM %s LIMIT 1000", quoteDatabaseIdentifier(driver, tableName)))
	if err != nil {
		return nil, fmt.Errorf("unable to read database table")
	}
	defer rows.Close()

	columns, err := rows.Columns()
	if err != nil {
		return nil, fmt.Errorf("unable to read database columns")
	}

	if len(columns) == 0 {
		return nil, fmt.Errorf("database table has no columns")
	}

	records := [][]string{columns}
	for rows.Next() {
		values := make([]interface{}, len(columns))
		valuePointers := make([]interface{}, len(columns))
		for index := range values {
			valuePointers[index] = &values[index]
		}

		if err := rows.Scan(valuePointers...); err != nil {
			return nil, fmt.Errorf("unable to read database row")
		}

		record := make([]string, len(columns))
		for index, value := range values {
			record[index] = databaseValueToString(value)
		}

		records = append(records, record)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("unable to finish reading database table")
	}

	if len(records) < 2 {
		return nil, fmt.Errorf("database table has no rows")
	}

	return records, nil
}

func isSupportedDatabaseDriver(driver string) bool {
	return driver == "sqlite" || driver == "postgres" || driver == "mysql"
}

func quoteDatabaseIdentifier(driver string, identifier string) string {
	quote := `"`
	if driver == "mysql" {
		quote = "`"
	}

	return quote + strings.ReplaceAll(identifier, quote, quote+quote) + quote
}

func databaseValueToString(value interface{}) string {
	switch typedValue := value.(type) {
	case nil:
		return ""
	case []byte:
		return string(typedValue)
	case time.Time:
		return typedValue.Format("2006-01-02 15:04:05")
	default:
		return fmt.Sprint(typedValue)
	}
}

func containsString(values []string, target string) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}

	return false
}

func encryptDatabasePassword(password string) (string, error) {
	if password == "" {
		return "", nil
	}

	block, err := aes.NewCipher(databaseSecretKey())
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(password), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func decryptDatabasePassword(value string) (string, error) {
	if value == "" {
		return "", nil
	}

	data, err := base64.StdEncoding.DecodeString(value)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(databaseSecretKey())
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", fmt.Errorf("invalid encrypted password")
	}

	nonce := data[:nonceSize]
	ciphertext := data[nonceSize:]

	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

func databaseSecretKey() []byte {
	secret := os.Getenv("DB_CONNECTION_SECRET")
	if secret == "" {
		secret = os.Getenv("JWT_SECRET")
	}

	sum := sha256.Sum256([]byte(secret))
	return sum[:]
}
