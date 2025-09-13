package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"wkt3.com/auth-service/internal/storage"
	"wkt3.com/auth-service/internal/utils"
)

func SignupHandler(store *storage.MemoryStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}

		hash, _ := utils.HashPassword(req.Password)
		user := map[string]any{
			"id":            uuid.NewString(),
			"email":         req.Email,
			"password_hash": hash,
			"verified":      false,
		}
		store.Insert("users", user)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"message": "User registered, please verify email",
		})
	}
}
