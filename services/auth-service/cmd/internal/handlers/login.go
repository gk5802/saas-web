package handlers

import (
	"encoding/json"
	"net/http"

	"wkt3.com/auth-service/internal/storage"
	"wkt3.com/auth-service/internal/utils"
)

func LoginHandler(store *storage.MemoryStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}

		user, err := store.GetUserByEmail(req.Email)
		if err != nil {
			http.Error(w, "invalid credentials", http.StatusUnauthorized)
			return
		}

		if verified, _ := user["verified"].(bool); !verified {
			http.Error(w, "email not verified", http.StatusForbidden)
			return
		}

		hash, ok := user["password_hash"].(string)
		if !ok || !utils.CheckPassword(req.Password, hash) {
			http.Error(w, "invalid credentials", http.StatusUnauthorized)
			return
		}

		token := utils.RandomToken(32)
		session := map[string]any{
			"token":   token,
			"user_id": user["id"],
		}
		store.Insert("sessions", session)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"message": "Login successful",
			"token":   token,
		})
	}
}
