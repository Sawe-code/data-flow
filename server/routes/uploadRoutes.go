package routes

import (
	"github.com/Sawe-code/data_flow/server/controllers"
	"github.com/gin-gonic/gin"
)

func UploadRoutes(router *gin.Engine) {
	router.POST("/upload", controllers.UploadFile)
	router.POST("/import/api", controllers.ImportFromAPI)
}
