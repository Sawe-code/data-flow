package models

import (
	"encoding/json"
	"time"
)

type Analysis struct {
	ID                int64  `json:"id"`
	UserID            string `json:"userId"`
	FileName          string `json:"fileName"`
	TotalRows         int    `json:"totalRows"`
	CleanRows         int    `json:"cleanRows"`
	InvalidRows       int    `json:"invalidRows"`
	DuplicatesRemoved int    `json:"duplicatesRemoved"`

	CleanedData []map[string]string `json:"cleanedData"`
	InvalidData []map[string]string `json:"invalidData"`

	ColumnProfiles json.RawMessage `json:"columnProfiles,omitempty"`
	ChartData      json.RawMessage `json:"chartData,omitempty"`
	Insights       json.RawMessage `json:"insights,omitempty"`

	CreatedAt time.Time `json:"createdAt"`
}
