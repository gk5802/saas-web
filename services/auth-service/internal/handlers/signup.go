package handlers

import (
	"encoding/json"
	"net/http"

	"wkt3.com/auth-service/internal/storage"
	"wkt3.com/auth-service/internal/utils"
)

func SignupHandler(store *storage.MemoryStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}

		// check if user exists
		if _, found := store.FindByField("users", "email", body.Email); found {
			http.Error(w, "user already exists", http.StatusConflict)
			return
		}

		hash, _ := utils.HashPassword(body.Password)
		user := map[string]any{
			"id":            utils.RandomToken(8),
			"email":         body.Email,
			"password_hash": hash,
			"verified":      false,
		}
		store.Insert("users", user)

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"message": "user registered, please verify email",
		})
	}
}
