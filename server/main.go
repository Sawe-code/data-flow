package main

import (
	"fmt"
	"os"
	"strings"

	"github.com/Sawe-code/data_flow/server/database"
	"github.com/Sawe-code/data_flow/server/routes"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()
	frontendURL := strings.TrimRight(os.Getenv("FRONTEND_URL"), "/")
	router.Use(cors.New(cors.Config{
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
		AllowOriginFunc: func(origin string) bool {
			if frontendURL != "" && strings.TrimRight(origin, "/") == frontendURL {
				return true
			}

			return strings.HasPrefix(origin, "http://localhost:") ||
				strings.HasPrefix(origin, "http://127.0.0.1:")
		},
	}))

	database.ConnectDB()

	// Routes
	routes.AuthRoutes(router)
	routes.UploadRoutes(router)
	routes.AnalysisRoutes(router)
	routes.DatabaseConnectionRoutes(router)

	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Server is running",
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	if err := router.Run(":" + port); err != nil {
		fmt.Printf("Failed to start server: %v\n", err)
	}
}
