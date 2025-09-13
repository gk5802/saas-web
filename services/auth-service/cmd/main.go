package main

import (
	"fmt"
	"net/http"

	"wkt3.com/auth-service/internal/handlers"
	"wkt3.com/auth-service/internal/storage"
)

func main() {
	store := storage.NewMemoryStore()

	http.HandleFunc("/signup", handlers.SignupHandler(store))
	http.HandleFunc("/login", handlers.LoginHandler(store))
	http.HandleFunc("/logout", handlers.LogoutHandler(store))
	http.HandleFunc("/protected", handlers.ProtectedHandler(store))

	fmt.Println("🚀 Auth service running on :8080")
	http.ListenAndServe(":8080", nil)
}
