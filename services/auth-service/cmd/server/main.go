package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"

	"wkt3.com/auth-service/internal/handlers"
)

func main() {
	r := mux.NewRouter()

	// Routes
	r.HandleFunc("/signup", handlers.SignupHandler).Methods("POST")
	r.HandleFunc("/verify-email", handlers.VerifyEmailHandler).Methods("POST")
	r.HandleFunc("/login", handlers.LoginHandler).Methods("POST")

	// Health check
	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	}).Methods("GET")

	log.Println("✅ Auth service running on :8080")
	if err := http.ListenAndServe(":8080", r); err != nil {
		log.Fatal("server error:", err)
	}
}
