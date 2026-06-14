package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/Sawe-code/data_flow/server/database"
	"github.com/Sawe-code/data_flow/server/models"

	"github.com/gin-gonic/gin"
)

func SaveAnalysis(c *gin.Context) {
	var analysis models.Analysis

	// Bind JSON input
	if err := c.BindJSON(&analysis); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid data",
		})
		return
	}

	// Get authenticated user email from middleware
	email, exists := c.Get("email")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	// Attach user info to document
	analysis.UserID = email.(string)
	analysis.CreatedAt = time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cleanedData, err := json.Marshal(analysis.CleanedData)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid cleaned data",
		})
		return
	}

	invalidData, err := json.Marshal(analysis.InvalidData)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid invalid data",
		})
		return
	}

	columnProfiles := rawJSONOrDefault(analysis.ColumnProfiles, "[]")
	chartData := rawJSONOrDefault(analysis.ChartData, "{}")
	insights := rawJSONOrDefault(analysis.Insights, "[]")

	_, err = database.DB.ExecContext(
		ctx,
		`
		INSERT INTO analyses (
			user_id,
			file_name,
			total_rows,
			clean_rows,
			invalid_rows,
			duplicates_removed,
			cleaned_data,
			invalid_data,
			column_profiles,
			chart_data,
			insights,
			created_at
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`,
		analysis.UserID,
		analysis.FileName,
		analysis.TotalRows,
		analysis.CleanRows,
		analysis.InvalidRows,
		analysis.DuplicatesRemoved,
		string(cleanedData),
		string(invalidData),
		string(columnProfiles),
		string(chartData),
		string(insights),
		analysis.CreatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to save analysis",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Analysis saved successfully",
	})
}

func GetAnalyses(c *gin.Context) {
	// Get authenticated user email
	email, exists := c.Get("email")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	userEmail := email.(string)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Query only user's analyses
	rows, err := database.DB.QueryContext(
		ctx,
		`
		SELECT
			id,
			user_id,
			file_name,
			total_rows,
			clean_rows,
			invalid_rows,
				duplicates_removed,
				cleaned_data,
				invalid_data,
				column_profiles,
				chart_data,
				insights,
				created_at
			FROM analyses
			WHERE user_id = ?
		ORDER BY created_at DESC
		`,
		userEmail,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch analyses",
		})
		return
	}
	defer rows.Close()

	var analyses []models.Analysis

	for rows.Next() {
		var analysis models.Analysis
		var cleanedData string
		var invalidData string
		var columnProfiles string
		var chartData string
		var insights string

		err := rows.Scan(
			&analysis.ID,
			&analysis.UserID,
			&analysis.FileName,
			&analysis.TotalRows,
			&analysis.CleanRows,
			&analysis.InvalidRows,
			&analysis.DuplicatesRemoved,
			&cleanedData,
			&invalidData,
			&columnProfiles,
			&chartData,
			&insights,
			&analysis.CreatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to decode analyses",
			})
			return
		}

		if err := json.Unmarshal([]byte(cleanedData), &analysis.CleanedData); err != nil {
			analysis.CleanedData = []map[string]string{}
		}

		if err := json.Unmarshal([]byte(invalidData), &analysis.InvalidData); err != nil {
			analysis.InvalidData = []map[string]string{}
		}

		analysis.ColumnProfiles = rawJSONOrDefault(json.RawMessage(columnProfiles), "[]")
		analysis.ChartData = rawJSONOrDefault(json.RawMessage(chartData), "{}")
		analysis.Insights = rawJSONOrDefault(json.RawMessage(insights), "[]")

		analyses = append(analyses, analysis)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to read analyses",
		})
		return
	}

	// DEBUG (safe and useful)
	fmt.Println("EMAIL:", userEmail)
	fmt.Println("RESULT COUNT:", len(analyses))

	// Return empty array instead of null (important for frontend)
	if len(analyses) == 0 {
		c.JSON(http.StatusOK, []models.Analysis{})
		return
	}

	c.JSON(http.StatusOK, analyses)
}

func rawJSONOrDefault(value json.RawMessage, fallback string) json.RawMessage {
	if len(value) == 0 || !json.Valid(value) {
		return json.RawMessage(fallback)
	}

	return value
}
