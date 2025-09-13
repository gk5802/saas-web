package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"wkt3.com/auth-service/internal/storage"
)

func LogoutHandler(store *storage.MemoryStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Try Authorization header first (Bearer ...)
		auth := r.Header.Get("Authorization")
		var token string
		if auth != "" {
			token = strings.TrimSpace(auth)
			if strings.HasPrefix(strings.ToLower(token), "bearer ") {
				token = strings.TrimSpace(token[7:])
			}
		}

		// If not in header, check query param "token"
		if token == "" {
			token = r.URL.Query().Get("token")
		}

		if token == "" {
			http.Error(w, "missing token", http.StatusBadRequest)
			return
		}

		removed := store.DeleteByField("sessions", "token", token)
		if removed == 0 {
			// token not found — still return success to avoid token probing info leak
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]any{
				"success": false,
				"message": "token not found or already revoked",
			})
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"message": "logout successful",
			"removed": removed,
		})
	}
}
