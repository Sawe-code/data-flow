package utils

import (
	"encoding/csv"
	"os"
	"strings"
)

// CleanCSV reads and cleans CSV data
func CleanCSV(filePath string) ([]map[string]string, error) {

	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}

	defer file.Close()

	reader := csv.NewReader(file)

	rows, err := reader.ReadAll()
	if err != nil {
		return nil, err
	}

	if len(rows) < 1 {
		return nil, nil
	}

	headers := rows[0]

	var cleanedData []map[string]string

	seen := make(map[string]bool)

	for _, row := range rows[1:] {

		item := make(map[string]string)

		var uniqueKey string

		for i, value := range row {

			cleanValue := strings.TrimSpace(value)

			// Empty values
			if cleanValue == "" {
				cleanValue = "N/A"
			}

			// Normalize names
			cleanValue = strings.Title(strings.ToLower(cleanValue))

			item[headers[i]] = cleanValue

			uniqueKey += cleanValue
		}

		// Remove duplicates
		if !seen[uniqueKey] {
			seen[uniqueKey] = true
			cleanedData = append(cleanedData, item)
		}
	}

	return cleanedData, nil
}