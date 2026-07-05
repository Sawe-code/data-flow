package routes

import (
	"github.com/Sawe-code/data_flow/server/controllers"
	"github.com/Sawe-code/data_flow/server/middlewares"
	"github.com/gin-gonic/gin"
)

func DatabaseConnectionRoutes(router *gin.Engine) {
	protected := router.Group("/database-connections")
	protected.Use(middlewares.Authenticate())

	protected.POST("", controllers.SaveDatabaseConnection)
	protected.GET("", controllers.GetDatabaseConnections)
	protected.GET("/:id/tables", controllers.GetSavedDatabaseTables)
	protected.POST("/:id/import", controllers.ImportSavedDatabaseTable)
}
