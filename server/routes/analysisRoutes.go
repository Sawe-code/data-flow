package routes

import (
	"github.com/Sawe-code/data_flow/server/controllers"
	"github.com/Sawe-code/data_flow/server/middlewares"

	"github.com/gin-gonic/gin"
)

func AnalysisRoutes(router *gin.Engine) {

	protected := router.Group("/analysis")

	protected.Use(
		middlewares.Authenticate(),
	)

	protected.POST(
		"/save",
		controllers.SaveAnalysis,
	)

	protected.GET(
		"/all",
		controllers.GetAnalyses,
	)
}