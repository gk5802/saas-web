package handlers

import (
	"encoding/json"
	"net/http"

	"wkt3.com/auth-service/internal/storage"
)

func ProtectedHandler(store *storage.MemoryStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("Authorization")
		if token == "" {
			http.Error(w, "missing token", http.StatusUnauthorized)
			return
		}

		if _, found := store.FindByField("sessions", "token", token); !found {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"message": "you are authorized",
		})
	}
}
