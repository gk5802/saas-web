package handlers

import (
	"encoding/json"
	"net/http"

	"wkt3.com/auth-service/internal/storage"
	"wkt3.com/auth-service/internal/utils"
)

func LoginHandler(store *storage.MemoryStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}

		user, found := store.FindByField("users", "email", body.Email)
		if !found {
			http.Error(w, "invalid credentials", http.StatusUnauthorized)
			return
		}

		hash, ok := user["password_hash"].(string)
		if !ok || !utils.CheckPassword(hash, body.Password) {
			http.Error(w, "invalid credentials", http.StatusUnauthorized)
			return
		}

		token := utils.RandomToken(32)
		session := map[string]any{
			"token":   token,
			"user_id": user["id"],
		}
		store.Insert("sessions", session)

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"token":   token,
		})
	}
}
