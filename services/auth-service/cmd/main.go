package main

import (
	"log"
	"net/http"

	"wkt3.com/auth-service/internal/handlers"
	"wkt3.com/auth-service/internal/middleware"
	"wkt3.com/auth-service/internal/storage"
)

func main() {
	store := storage.NewMemoryStore()

	mux := http.NewServeMux()

	// Public routes
	mux.HandleFunc("/api/signup", handlers.SignupHandler(store))
	mux.HandleFunc("/api/verify-email", handlers.VerifyEmailHandler(store))
	mux.HandleFunc("/api/login", handlers.LoginHandler(store))
	mux.HandleFunc("/api/logout", handlers.LogoutHandler(store))

	// Protected route (auth middleware)
	mux.Handle("/api/protected", middleware.AuthMiddleware(store, http.HandlerFunc(middleware.ProtectedHandler)))

	log.Println("✅ Auth service running on :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
