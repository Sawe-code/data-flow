package controllers

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
)

type columnProfile struct {
	Name        string        `json:"name"`
	Type        string        `json:"type"`
	EmptyCount  int           `json:"emptyCount"`
	UniqueCount int           `json:"uniqueCount"`
	Numeric     *numericStats `json:"numeric,omitempty"`
	Text        *textStats    `json:"text,omitempty"`
	Dates       *dateStats    `json:"dates,omitempty"`
}

type numericStats struct {
	Min     float64 `json:"min"`
	Max     float64 `json:"max"`
	Average float64 `json:"average"`
	Total   float64 `json:"total"`
}

type textStats struct {
	MostCommon []nameValue `json:"mostCommon"`
}

type dateStats struct {
	Earliest string      `json:"earliest"`
	Latest   string      `json:"latest"`
	Trend    []nameValue `json:"trend"`
}

type nameValue struct {
	Name  string  `json:"name"`
	Value float64 `json:"value"`
}

type apiImportRequest struct {
	URL string `json:"url"`
}

func UploadFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file received"})
		return
	}

	fileName := filepath.Base(file.Filename)
	extension := strings.ToLower(filepath.Ext(fileName))
	if extension != ".csv" && extension != ".xlsx" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only CSV and XLSX files are supported"})
		return
	}

	if err := os.MkdirAll("./temp", 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to prepare upload folder"})
		return
	}

	tempFilePath := filepath.Join("./temp", fileName)

	if err := c.SaveUploadedFile(file, tempFilePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to save file"})
		return
	}

	records, err := readDataset(tempFilePath, extension)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	result, err := analyzeRecords(records, fileName)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func ImportFromAPI(c *gin.Context) {
	var input apiImportRequest
	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid API import request"})
		return
	}

	apiURL := strings.TrimSpace(input.URL)
	if apiURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "API URL is required"})
		return
	}

	parsedURL, err := url.ParseRequestURI(apiURL)
	if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Enter a valid HTTP or HTTPS API URL"})
		return
	}

	records, err := fetchAPIRecords(apiURL)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fileName := "api-" + strings.TrimPrefix(parsedURL.Hostname(), "www.")
	result, err := analyzeRecords(records, fileName)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func analyzeRecords(records [][]string, fileName string) (gin.H, error) {
	if len(records) < 2 {
		return nil, fmt.Errorf("file is empty")
	}

	headers := cleanHeaders(records[0])
	columnTypes := detectColumnTypes(headers, records[1:])

	cleanedData, invalidRows, duplicatesRemoved := cleanRows(headers, records[1:], columnTypes)
	profiles := buildColumnProfiles(headers, cleanedData, columnTypes)
	chartData := buildChartData(profiles, cleanedData)
	insights := buildInsights(profiles, len(records)-1, len(cleanedData), duplicatesRemoved)

	return gin.H{
		"message":           "File cleaned and analyzed successfully",
		"fileName":          fileName,
		"totalRows":         len(records) - 1,
		"cleanRows":         len(cleanedData),
		"invalidRows":       len(invalidRows),
		"duplicatesRemoved": duplicatesRemoved,
		"cleanedData":       cleanedData,
		"invalidData":       invalidRows,
		"columnProfiles":    profiles,
		"chartData":         chartData,
		"insights":          insights,
	}, nil
}

func readDataset(filePath string, extension string) ([][]string, error) {
	if extension == ".xlsx" {
		return readExcel(filePath)
	}

	f, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("unable to open CSV")
	}
	defer f.Close()

	reader := csv.NewReader(f)
	reader.FieldsPerRecord = -1
	reader.TrimLeadingSpace = true

	records, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("unable to read CSV")
	}

	return records, nil
}

func readExcel(filePath string) ([][]string, error) {
	workbook, err := excelize.OpenFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("unable to open Excel file")
	}
	defer workbook.Close()

	sheets := workbook.GetSheetList()
	if len(sheets) == 0 {
		return nil, fmt.Errorf("Excel file has no sheets")
	}

	rows, err := workbook.GetRows(sheets[0])
	if err != nil {
		return nil, fmt.Errorf("unable to read Excel sheet")
	}

	return rows, nil
}

func fetchAPIRecords(apiURL string) ([][]string, error) {
	client := http.Client{
		Timeout: 15 * time.Second,
	}

	request, err := http.NewRequest(http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, fmt.Errorf("unable to create API request")
	}

	request.Header.Set("Accept", "application/json, text/csv;q=0.9, */*;q=0.5")
	request.Header.Set("User-Agent", "DataFlow/1.0")

	response, err := client.Do(request)
	if err != nil {
		return nil, fmt.Errorf("unable to fetch API data")
	}
	defer response.Body.Close()

	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return nil, fmt.Errorf("API returned status %d", response.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(response.Body, 5*1024*1024))
	if err != nil {
		return nil, fmt.Errorf("unable to read API response")
	}

	contentType := strings.ToLower(response.Header.Get("Content-Type"))
	if strings.Contains(contentType, "csv") {
		return recordsFromCSVBytes(body)
	}

	records, err := recordsFromJSONBytes(body)
	if err == nil {
		return records, nil
	}

	records, csvErr := recordsFromCSVBytes(body)
	if csvErr == nil {
		return records, nil
	}

	return nil, err
}

func recordsFromCSVBytes(body []byte) ([][]string, error) {
	reader := csv.NewReader(bytes.NewReader(body))
	reader.FieldsPerRecord = -1
	reader.TrimLeadingSpace = true

	records, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("unable to parse API CSV data")
	}

	return records, nil
}

func recordsFromJSONBytes(body []byte) ([][]string, error) {
	decoder := json.NewDecoder(bytes.NewReader(body))
	decoder.UseNumber()

	var payload interface{}
	if err := decoder.Decode(&payload); err != nil {
		return nil, fmt.Errorf("API response must be JSON array/object data or CSV")
	}

	items, err := extractJSONItems(payload)
	if err != nil {
		return nil, err
	}

	headerSet := map[string]bool{}
	flattenedRows := make([]map[string]string, 0, len(items))

	for _, item := range items {
		rowMap, ok := item.(map[string]interface{})
		if !ok {
			rowMap = map[string]interface{}{
				"value": item,
			}
		}

		flattened := map[string]string{}
		flattenJSON("", rowMap, flattened)
		if len(flattened) == 0 {
			continue
		}

		for key := range flattened {
			headerSet[key] = true
		}

		flattenedRows = append(flattenedRows, flattened)
	}

	if len(flattenedRows) == 0 {
		return nil, fmt.Errorf("API JSON did not contain row data")
	}

	headers := make([]string, 0, len(headerSet))
	for header := range headerSet {
		headers = append(headers, header)
	}
	sort.Strings(headers)

	records := make([][]string, 0, len(flattenedRows)+1)
	records = append(records, headers)

	for _, rowMap := range flattenedRows {
		row := make([]string, len(headers))
		for index, header := range headers {
			row[index] = rowMap[header]
		}
		records = append(records, row)
	}

	return records, nil
}

func extractJSONItems(payload interface{}) ([]interface{}, error) {
	switch value := payload.(type) {
	case []interface{}:
		if len(value) == 0 {
			return nil, fmt.Errorf("API JSON array is empty")
		}
		return value, nil
	case map[string]interface{}:
		for _, key := range []string{"data", "results", "items", "records"} {
			if items, ok := value[key].([]interface{}); ok && len(items) > 0 {
				return items, nil
			}
		}
		return []interface{}{value}, nil
	default:
		return nil, fmt.Errorf("API JSON must be an object or array")
	}
}

func flattenJSON(prefix string, value interface{}, output map[string]string) {
	switch typedValue := value.(type) {
	case map[string]interface{}:
		for key, nestedValue := range typedValue {
			nextKey := key
			if prefix != "" {
				nextKey = prefix + "." + key
			}
			flattenJSON(nextKey, nestedValue, output)
		}
	case []interface{}:
		values := make([]string, 0, len(typedValue))
		for _, item := range typedValue {
			values = append(values, jsonScalarToString(item))
		}
		output[prefix] = strings.Join(values, ", ")
	default:
		output[prefix] = jsonScalarToString(typedValue)
	}
}

func jsonScalarToString(value interface{}) string {
	switch typedValue := value.(type) {
	case nil:
		return ""
	case string:
		return typedValue
	case json.Number:
		return typedValue.String()
	case bool:
		if typedValue {
			return "true"
		}
		return "false"
	case float64:
		return formatNumber(typedValue)
	default:
		encoded, err := json.Marshal(typedValue)
		if err != nil {
			return fmt.Sprint(typedValue)
		}
		return string(encoded)
	}
}

func cleanHeaders(headers []string) []string {
	cleaned := make([]string, len(headers))
	seen := map[string]int{}

	for i, header := range headers {
		value := strings.TrimSpace(header)
		if value == "" {
			value = fmt.Sprintf("Column %d", i+1)
		}

		if seen[value] > 0 {
			seen[value]++
			value = fmt.Sprintf("%s %d", value, seen[value])
		} else {
			seen[value] = 1
		}

		cleaned[i] = value
	}

	return cleaned
}

func detectColumnTypes(headers []string, rows [][]string) map[string]string {
	types := make(map[string]string)

	for columnIndex, header := range headers {
		nonEmpty := 0
		numericCount := 0
		dateCount := 0
		booleanCount := 0

		for _, row := range rows {
			if columnIndex >= len(row) {
				continue
			}

			value := strings.TrimSpace(row[columnIndex])
			if value == "" {
				continue
			}

			nonEmpty++

			if _, ok := parseNumber(value); ok {
				numericCount++
			}
			if _, ok := parseDate(value); ok {
				dateCount++
			}
			if _, ok := parseBoolean(value); ok {
				booleanCount++
			}
		}

		switch {
		case nonEmpty == 0:
			types[header] = "unknown"
		case ratio(booleanCount, nonEmpty) >= 0.85:
			types[header] = "boolean"
		case ratio(dateCount, nonEmpty) >= 0.85:
			types[header] = "date"
		case ratio(numericCount, nonEmpty) >= 0.85:
			types[header] = "number"
		default:
			types[header] = "text"
		}
	}

	return types
}

func cleanRows(headers []string, rows [][]string, columnTypes map[string]string) ([]map[string]string, []map[string]string, int) {
	cleanedData := []map[string]string{}
	invalidRows := []map[string]string{}
	seen := make(map[string]bool)
	duplicatesRemoved := 0

	for _, row := range rows {
		item := make(map[string]string)
		allEmpty := true
		keyParts := make([]string, 0, len(headers))

		for i, header := range headers {
			rawValue := ""
			if i < len(row) {
				rawValue = row[i]
			}

			cleanValue := cleanValueForType(rawValue, columnTypes[header])
			if cleanValue != "N/A" {
				allEmpty = false
			}

			item[header] = cleanValue
			keyParts = append(keyParts, cleanValue)
		}

		uniqueKey := strings.Join(keyParts, "\x1f")
		if seen[uniqueKey] {
			duplicatesRemoved++
			continue
		}
		seen[uniqueKey] = true

		if allEmpty {
			invalidRows = append(invalidRows, item)
			continue
		}

		cleanedData = append(cleanedData, item)
	}

	return cleanedData, invalidRows, duplicatesRemoved
}

func cleanValueForType(value string, columnType string) string {
	cleanValue := strings.TrimSpace(value)
	if cleanValue == "" {
		return "N/A"
	}

	switch columnType {
	case "number":
		if number, ok := parseNumber(cleanValue); ok {
			return formatNumber(number)
		}
	case "date":
		if date, ok := parseDate(cleanValue); ok {
			return date.Format("2006-01-02")
		}
	case "boolean":
		if boolean, ok := parseBoolean(cleanValue); ok {
			if boolean {
				return "True"
			}
			return "False"
		}
	case "text":
		return normalizeText(cleanValue)
	}

	return cleanValue
}

func buildColumnProfiles(headers []string, rows []map[string]string, columnTypes map[string]string) []columnProfile {
	profiles := make([]columnProfile, 0, len(headers))

	for _, header := range headers {
		profile := columnProfile{
			Name: header,
			Type: columnTypes[header],
		}

		uniqueValues := map[string]bool{}
		textCounts := map[string]int{}
		dateCounts := map[string]int{}
		var numbers []float64
		var dates []string

		for _, row := range rows {
			value := row[header]
			if value == "" || value == "N/A" {
				profile.EmptyCount++
				continue
			}

			uniqueValues[value] = true

			switch profile.Type {
			case "number":
				if number, ok := parseNumber(value); ok {
					numbers = append(numbers, number)
				}
			case "date":
				dates = append(dates, value)
				dateCounts[value]++
			case "text", "boolean":
				textCounts[value]++
			}
		}

		profile.UniqueCount = len(uniqueValues)

		switch profile.Type {
		case "number":
			profile.Numeric = summarizeNumbers(numbers)
		case "date":
			profile.Dates = summarizeDates(dates, dateCounts)
		case "text", "boolean":
			profile.Text = &textStats{MostCommon: topCounts(textCounts, 6)}
		}

		profiles = append(profiles, profile)
	}

	return profiles
}

func buildChartData(profiles []columnProfile, rows []map[string]string) gin.H {
	quality := []nameValue{}
	var trend []nameValue
	var comparison []nameValue
	var frequency []nameValue
	var dateColumn string
	var numericColumn string
	var categoryColumn string

	for _, profile := range profiles {
		quality = append(quality, nameValue{Name: profile.Name, Value: float64(profile.EmptyCount)})
		if dateColumn == "" && profile.Type == "date" {
			dateColumn = profile.Name
		}
		if numericColumn == "" && profile.Type == "number" {
			numericColumn = profile.Name
		}
		if categoryColumn == "" && profile.Type == "text" && profile.UniqueCount > 1 && profile.UniqueCount <= 25 {
			categoryColumn = profile.Name
		}
		if frequency == nil && profile.Text != nil && profile.UniqueCount > 1 {
			frequency = profile.Text.MostCommon
		}
	}

	if dateColumn != "" && numericColumn != "" {
		trend = aggregateByColumn(rows, dateColumn, numericColumn, 14, true)
	} else if dateColumn != "" {
		trend = aggregateCounts(rows, dateColumn, 14, true)
	}

	if categoryColumn != "" && numericColumn != "" {
		comparison = aggregateByColumn(rows, categoryColumn, numericColumn, 10, false)
	} else {
		for _, profile := range profiles {
			if profile.Numeric != nil {
				comparison = []nameValue{
					{Name: "Min", Value: profile.Numeric.Min},
					{Name: "Average", Value: profile.Numeric.Average},
					{Name: "Max", Value: profile.Numeric.Max},
				}
				break
			}
		}
	}

	return gin.H{
		"missingValues": quality,
		"trend":         trend,
		"comparison":    comparison,
		"frequency":     frequency,
	}
}

func aggregateByColumn(rows []map[string]string, groupColumn string, valueColumn string, limit int, chronological bool) []nameValue {
	totals := map[string]float64{}

	for _, row := range rows {
		group := row[groupColumn]
		if group == "" || group == "N/A" {
			continue
		}

		number, ok := parseNumber(row[valueColumn])
		if !ok {
			continue
		}

		totals[group] += number
	}

	return sortedNameValues(totals, limit, chronological)
}

func aggregateCounts(rows []map[string]string, groupColumn string, limit int, chronological bool) []nameValue {
	counts := map[string]float64{}

	for _, row := range rows {
		group := row[groupColumn]
		if group == "" || group == "N/A" {
			continue
		}

		counts[group]++
	}

	return sortedNameValues(counts, limit, chronological)
}

func sortedNameValues(values map[string]float64, limit int, chronological bool) []nameValue {
	result := make([]nameValue, 0, len(values))
	for name, value := range values {
		result = append(result, nameValue{Name: name, Value: roundTwo(value)})
	}

	sort.Slice(result, func(i, j int) bool {
		if chronological {
			return result[i].Name < result[j].Name
		}
		if result[i].Value == result[j].Value {
			return result[i].Name < result[j].Name
		}
		return result[i].Value > result[j].Value
	})

	if len(result) > limit {
		return result[:limit]
	}

	return result
}

func buildInsights(profiles []columnProfile, totalRows int, cleanRows int, duplicatesRemoved int) []string {
	insights := []string{
		fmt.Sprintf("%d of %d rows are usable after cleaning.", cleanRows, totalRows),
	}

	if duplicatesRemoved > 0 {
		insights = append(insights, fmt.Sprintf("%d duplicate rows were removed.", duplicatesRemoved))
	}

	for _, profile := range profiles {
		if profile.Type == "number" && profile.Numeric != nil {
			insights = append(insights, fmt.Sprintf("%s ranges from %s to %s with an average of %s.", profile.Name, formatNumber(profile.Numeric.Min), formatNumber(profile.Numeric.Max), formatNumber(profile.Numeric.Average)))
			break
		}
	}

	for _, profile := range profiles {
		if profile.Text != nil && len(profile.Text.MostCommon) > 0 {
			top := profile.Text.MostCommon[0]
			insights = append(insights, fmt.Sprintf("%s appears most often in %s.", top.Name, profile.Name))
			break
		}
	}

	return insights
}

func summarizeNumbers(numbers []float64) *numericStats {
	if len(numbers) == 0 {
		return nil
	}

	minValue := numbers[0]
	maxValue := numbers[0]
	total := 0.0

	for _, number := range numbers {
		minValue = math.Min(minValue, number)
		maxValue = math.Max(maxValue, number)
		total += number
	}

	return &numericStats{
		Min:     roundTwo(minValue),
		Max:     roundTwo(maxValue),
		Average: roundTwo(total / float64(len(numbers))),
		Total:   roundTwo(total),
	}
}

func summarizeDates(dates []string, dateCounts map[string]int) *dateStats {
	if len(dates) == 0 {
		return nil
	}

	sort.Strings(dates)

	return &dateStats{
		Earliest: dates[0],
		Latest:   dates[len(dates)-1],
		Trend:    sortedDateCounts(dateCounts, 12),
	}
}

func sortedDateCounts(counts map[string]int, limit int) []nameValue {
	values := make([]nameValue, 0, len(counts))
	for name, count := range counts {
		values = append(values, nameValue{Name: name, Value: float64(count)})
	}

	sort.Slice(values, func(i, j int) bool {
		return values[i].Name < values[j].Name
	})

	if len(values) > limit {
		return values[:limit]
	}

	return values
}

func topCounts(counts map[string]int, limit int) []nameValue {
	values := make([]nameValue, 0, len(counts))
	for name, count := range counts {
		values = append(values, nameValue{Name: name, Value: float64(count)})
	}

	sort.Slice(values, func(i, j int) bool {
		if values[i].Value == values[j].Value {
			return values[i].Name < values[j].Name
		}
		return values[i].Value > values[j].Value
	})

	if len(values) > limit {
		return values[:limit]
	}

	return values
}

func parseNumber(value string) (float64, bool) {
	cleanValue := strings.TrimSpace(value)
	cleanValue = strings.ReplaceAll(cleanValue, ",", "")
	cleanValue = strings.Trim(cleanValue, "$%")

	number, err := strconv.ParseFloat(cleanValue, 64)
	return number, err == nil
}

func parseDate(value string) (time.Time, bool) {
	cleanValue := strings.TrimSpace(value)
	layouts := []string{
		"2006-01-02",
		"2006/01/02",
		"01/02/2006",
		"02/01/2006",
		"Jan 2 2006",
		"January 2 2006",
		"2006-01-02 15:04:05",
		time.RFC3339,
	}

	for _, layout := range layouts {
		if date, err := time.Parse(layout, cleanValue); err == nil {
			return date, true
		}
	}

	return time.Time{}, false
}

func parseBoolean(value string) (bool, bool) {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "true", "yes", "y":
		return true, true
	case "false", "no", "n":
		return false, true
	default:
		return false, false
	}
}

func normalizeText(value string) string {
	if strings.Contains(value, "@") || strings.Contains(value, "://") {
		return strings.ToLower(value)
	}

	words := strings.Fields(strings.ToLower(value))
	for i, word := range words {
		runes := []rune(word)
		if len(runes) == 0 {
			continue
		}
		runes[0] = unicode.ToUpper(runes[0])
		words[i] = string(runes)
	}

	return strings.Join(words, " ")
}

func ratio(value int, total int) float64 {
	if total == 0 {
		return 0
	}
	return float64(value) / float64(total)
}

func roundTwo(value float64) float64 {
	return math.Round(value*100) / 100
}

func formatNumber(value float64) string {
	return strconv.FormatFloat(roundTwo(value), 'f', -1, 64)
}
